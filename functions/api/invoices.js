// Invoices API - Manage CFDI invoices

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type'); // recibido or emitido
  const status = url.searchParams.get('status') || 'active';
  
  try {
    // Validate database connection
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    let query = 'SELECT * FROM invoices WHERE 1=1';
    const params = [];
    
    // Add status filter
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY date DESC LIMIT 100';
    
    const stmt = env.DB.prepare(query);
    const result = await (params.length > 0 ? stmt.bind(...params) : stmt).all();
    
    return new Response(JSON.stringify(result.results || []), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Invoices GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch invoices',
      message: error.message,
      code: 'QUERY_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    // Validate database connection
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    const { uuid, rfc_emisor, rfc_receptor, date, subtotal, iva, total, xml_url } = data;
    
    // Validate required fields
    if (!uuid || !rfc_emisor || !rfc_receptor || !date || subtotal === undefined || iva === undefined || total === undefined) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        required: ['uuid', 'rfc_emisor', 'rfc_receptor', 'date', 'subtotal', 'iva', 'total'],
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid UUID format',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate RFC format (basic check - 12 or 13 characters)
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{2,3}$/;
    if (!rfcRegex.test(rfc_emisor) || !rfcRegex.test(rfc_receptor)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid RFC format',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate amounts are positive
    if (subtotal < 0 || iva < 0 || total < 0) {
      return new Response(JSON.stringify({ 
        error: 'Amounts must be positive',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid date format (use YYYY-MM-DD)',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    try {
      const result = await env.DB.prepare(
        `INSERT INTO invoices (uuid, rfc_emisor, rfc_receptor, date, subtotal, iva, total, xml_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(uuid, rfc_emisor, rfc_receptor, date, subtotal, iva, total, xml_url || null).run();
      
      return new Response(JSON.stringify({ 
        id: result.meta.last_row_id, 
        success: true,
        message: 'Invoice created successfully'
      }), {
        status: 201,
        headers: corsHeaders
      });
    } catch (dbError) {
      // Check for unique constraint violation
      if (dbError.message.includes('UNIQUE constraint failed')) {
        return new Response(JSON.stringify({ 
          error: 'Invoice with this UUID already exists',
          code: 'DUPLICATE_UUID'
        }), {
          status: 409,
          headers: corsHeaders
        });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Invoices POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create invoice',
      message: error.message,
      code: 'CREATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
