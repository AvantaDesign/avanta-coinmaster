// Accounts API - Manage bank accounts and credit cards

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestGet(context) {
  const { env } = context;
  
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

    const result = await env.DB.prepare(
      'SELECT * FROM accounts ORDER BY type, name'
    ).all();
    
    return new Response(JSON.stringify(result.results || []), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Accounts GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch accounts',
      message: error.message,
      code: 'QUERY_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
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
    const { balance } = data;
    
    if (balance === undefined) {
      return new Response(JSON.stringify({ 
        error: 'Balance is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate balance is a number
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance)) {
      return new Response(JSON.stringify({ 
        error: 'Balance must be a valid number',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Check if account exists
    const existingAccount = await env.DB.prepare(
      'SELECT id FROM accounts WHERE id = ?'
    ).bind(id).first();
    
    if (!existingAccount) {
      return new Response(JSON.stringify({ 
        error: 'Account not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    await env.DB.prepare(
      'UPDATE accounts SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(numBalance, id).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Account balance updated'
    }), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Accounts PUT error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update account',
      message: error.message,
      code: 'UPDATE_ERROR'
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
