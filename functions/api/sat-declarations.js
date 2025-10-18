// SAT Declarations API - Comprehensive DIOT and Contabilidad Electrónica operations
//
// This API handles all SAT declaration operations including:
// - Generate DIOT (Declaración Informativa de Operaciones con Terceros)
// - Generate Contabilidad Electrónica (Catálogo, Balanza, Pólizas, Auxiliar)
// - List declarations with filtering
// - Submit declarations to SAT
// - Track declaration status
//
// Endpoints:
// - GET /api/sat-declarations - List declarations with filters
// - GET /api/sat-declarations/:id - Get single declaration
// - POST /api/sat-declarations/diot/:year/:month - Generate DIOT data
// - POST /api/sat-declarations/contabilidad/:year/:month - Generate Contabilidad Electrónica
// - POST /api/sat-declarations/submit/:id - Submit declaration
// - PUT /api/sat-declarations/:id - Update declaration status
// - DELETE /api/sat-declarations/:id - Delete declaration

import { getUserIdFromToken } from './auth.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * OPTIONS handler for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * GET /api/sat-declarations
 * GET /api/sat-declarations/:id
 * 
 * Query Parameters for listing:
 *   - type: 'diot' | 'contabilidad_electronica' | etc.
 *   - year: number
 *   - month: number (1-12)
 *   - status: 'draft' | 'generated' | 'submitted' | 'accepted' | 'rejected' | 'error'
 *   - limit: number (default: 50)
 *   - offset: number (default: 0)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  try {
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

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

    // Parse URL path
    const pathParts = url.pathname.split('/').filter(p => p);
    const lastPart = pathParts[pathParts.length - 1];
    const secondLastPart = pathParts[pathParts.length - 2];

    // Handle single declaration request: /api/sat-declarations/:id
    if (/^\d+$/.test(lastPart) && secondLastPart === 'sat-declarations') {
      return await getSingleDeclaration(env, userId, parseInt(lastPart));
    }

    // Handle list request
    return await listDeclarations(env, userId, url);

  } catch (error) {
    console.error('Error in sat-declarations GET:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/sat-declarations/diot/:year/:month
 * POST /api/sat-declarations/contabilidad/:year/:month
 * POST /api/sat-declarations/submit/:id
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  try {
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

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

    // Parse URL path
    const pathParts = url.pathname.split('/').filter(p => p);
    const action = pathParts[pathParts.length - 3]; // 'diot', 'contabilidad', 'submit'
    const param1 = pathParts[pathParts.length - 2]; // year or id
    const param2 = pathParts[pathParts.length - 1]; // month

    // Handle DIOT generation
    if (action === 'diot') {
      const year = parseInt(param1);
      const month = parseInt(param2);
      return await generateDIOT(env, userId, year, month);
    }

    // Handle Contabilidad Electrónica generation
    if (action === 'contabilidad') {
      const year = parseInt(param1);
      const month = parseInt(param2);
      return await generateContabilidadElectronica(env, userId, year, month);
    }

    // Handle submission
    if (action === 'submit') {
      const declarationId = parseInt(param1);
      return await submitDeclaration(env, userId, declarationId);
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid endpoint',
      code: 'INVALID_ENDPOINT'
    }), {
      status: 404,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in sat-declarations POST:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * PUT /api/sat-declarations/:id
 */
export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  try {
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

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

    // Parse URL path
    const pathParts = url.pathname.split('/').filter(p => p);
    const declarationId = parseInt(pathParts[pathParts.length - 1]);

    if (!declarationId || isNaN(declarationId)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid declaration ID',
        code: 'INVALID_ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Parse request body
    const body = await request.json();
    return await updateDeclaration(env, userId, declarationId, body);

  } catch (error) {
    console.error('Error in sat-declarations PUT:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * DELETE /api/sat-declarations/:id
 */
export async function onRequestDelete(context) {
  const { env, request } = context;

  try {
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

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

    // Parse URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const declarationId = parseInt(pathParts[pathParts.length - 1]);

    if (!declarationId || isNaN(declarationId)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid declaration ID',
        code: 'INVALID_ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    return await deleteDeclaration(env, userId, declarationId);

  } catch (error) {
    console.error('Error in sat-declarations DELETE:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * List declarations with filtering
 */
async function listDeclarations(env, userId, url) {
  const searchParams = url.searchParams;
  const type = searchParams.get('type');
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = `
    SELECT 
      sd.*,
      (SELECT COUNT(*) FROM diot_operations WHERE declaration_id = sd.id) as diot_count,
      (SELECT COUNT(*) FROM contabilidad_electronica_files WHERE declaration_id = sd.id) as file_count
    FROM sat_declarations sd
    WHERE sd.user_id = ?
  `;
  const params = [userId];

  if (type) {
    query += ' AND sd.declaration_type = ?';
    params.push(type);
  }

  if (year) {
    query += ' AND sd.period_year = ?';
    params.push(parseInt(year));
  }

  if (month) {
    query += ' AND sd.period_month = ?';
    params.push(parseInt(month));
  }

  if (status) {
    query += ' AND sd.status = ?';
    params.push(status);
  }

  query += ' ORDER BY sd.period_year DESC, sd.period_month DESC, sd.created_at DESC';
  query += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const result = await env.DB.prepare(query).bind(...params).all();

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM sat_declarations WHERE user_id = ?';
  const countParams = [userId];
  
  if (type) {
    countQuery += ' AND declaration_type = ?';
    countParams.push(type);
  }
  if (year) {
    countQuery += ' AND period_year = ?';
    countParams.push(parseInt(year));
  }
  if (month) {
    countQuery += ' AND period_month = ?';
    countParams.push(parseInt(month));
  }
  if (status) {
    countQuery += ' AND status = ?';
    countParams.push(status);
  }

  const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();

  return new Response(JSON.stringify({
    declarations: result.results || [],
    total: countResult?.total || 0,
    limit,
    offset
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Get single declaration
 */
async function getSingleDeclaration(env, userId, declarationId) {
  const declaration = await env.DB.prepare(`
    SELECT sd.* FROM sat_declarations sd
    WHERE sd.id = ? AND sd.user_id = ?
  `).bind(declarationId, userId).first();

  if (!declaration) {
    return new Response(JSON.stringify({ 
      error: 'Declaration not found',
      code: 'NOT_FOUND'
    }), {
      status: 404,
      headers: corsHeaders
    });
  }

  // Get related files for Contabilidad Electrónica
  if (declaration.declaration_type === 'contabilidad_electronica') {
    const files = await env.DB.prepare(`
      SELECT * FROM contabilidad_electronica_files
      WHERE declaration_id = ?
      ORDER BY file_type
    `).bind(declarationId).all();
    
    declaration.files = files.results || [];
  }

  // Get DIOT operations if applicable
  if (declaration.declaration_type === 'diot') {
    const operations = await env.DB.prepare(`
      SELECT * FROM diot_operations
      WHERE declaration_id = ?
      ORDER BY client_rfc, operation_date
    `).bind(declarationId).all();
    
    declaration.operations = operations.results || [];
  }

  return new Response(JSON.stringify({
    declaration
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Generate DIOT declaration
 */
async function generateDIOT(env, userId, year, month) {
  // Validate period
  if (!year || year < 2020 || year > 2100) {
    return new Response(JSON.stringify({ 
      error: 'Invalid year',
      code: 'INVALID_YEAR'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  if (!month || month < 1 || month > 12) {
    return new Response(JSON.stringify({ 
      error: 'Invalid month',
      code: 'INVALID_MONTH'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Check if declaration already exists
  const existing = await env.DB.prepare(`
    SELECT id FROM sat_declarations
    WHERE user_id = ? AND declaration_type = 'diot' 
      AND period_year = ? AND period_month = ?
  `).bind(userId, year, month).first();

  if (existing) {
    return new Response(JSON.stringify({ 
      error: 'DIOT declaration already exists for this period',
      code: 'DECLARATION_EXISTS',
      declarationId: existing.id
    }), {
      status: 409,
      headers: corsHeaders
    });
  }

  // Calculate date range for the period
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Extract operations with third parties from transactions
  // Group by client RFC and operation type
  const operations = await env.DB.prepare(`
    SELECT 
      t.client_rfc,
      t.client_name,
      t.client_type as nationality,
      CASE 
        WHEN t.type = 'gasto' THEN 'purchase'
        WHEN t.type = 'ingreso' THEN 'sale'
        ELSE 'other'
      END as operation_type,
      COUNT(*) as transaction_count,
      SUM(t.amount) as total_amount,
      SUM(CASE 
        WHEN t.iva_rate = '16' THEN t.amount 
        WHEN t.iva_rate = '0' THEN t.amount
        ELSE 0 
      END) as base_amount,
      SUM(CASE 
        WHEN t.iva_rate = '16' THEN t.amount * 0.16 
        ELSE 0 
      END) as iva_amount,
      t.iva_rate,
      t.currency,
      t.exchange_rate,
      t.payment_method,
      GROUP_CONCAT(t.cfdi_uuid) as cfdi_uuids
    FROM transactions t
    WHERE t.user_id = ?
      AND t.date BETWEEN ? AND ?
      AND t.is_deleted = 0
      AND t.client_rfc IS NOT NULL
      AND t.client_rfc != ''
    GROUP BY 
      t.client_rfc, 
      t.client_name, 
      t.client_type,
      t.type,
      t.iva_rate,
      t.currency,
      t.exchange_rate,
      t.payment_method
  `).bind(userId, startDate, endDate).all();

  // Create declaration record
  const declarationResult = await env.DB.prepare(`
    INSERT INTO sat_declarations 
    (user_id, declaration_type, period_year, period_month, status)
    VALUES (?, 'diot', ?, ?, 'draft')
  `).bind(userId, year, month).run();

  const declarationId = declarationResult.meta.last_row_id;

  // Insert DIOT operations
  let insertedCount = 0;
  if (operations.results && operations.results.length > 0) {
    for (const op of operations.results) {
      // Skip if RFC is invalid or empty
      if (!op.client_rfc || op.client_rfc.length < 12) continue;

      await env.DB.prepare(`
        INSERT INTO diot_operations (
          user_id, declaration_id, client_rfc, client_name, 
          operation_type, nationality, amount, base_amount, iva_amount,
          iva_rate, currency, exchange_rate, operation_date, 
          payment_method, has_cfdi
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        userId,
        declarationId,
        op.client_rfc,
        op.client_name || 'N/A',
        op.operation_type,
        op.nationality || 'nacional',
        op.total_amount || 0,
        op.base_amount || 0,
        op.iva_amount || 0,
        op.iva_rate || 'exento',
        op.currency || 'MXN',
        op.exchange_rate || 1.0,
        endDate, // Use end of period as operation date
        op.payment_method || 'PUE',
        op.cfdi_uuids ? 1 : 0
      ).run();

      insertedCount++;
    }
  }

  // Generate XML content
  const xmlContent = generateDIOTXML(operations.results || [], year, month);

  // Update declaration with XML content
  await env.DB.prepare(`
    UPDATE sat_declarations
    SET xml_content = ?,
        file_name = ?,
        status = 'generated',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    xmlContent,
    `DIOT_${year}_${String(month).padStart(2, '0')}.xml`,
    declarationId
  ).run();

  return new Response(JSON.stringify({
    success: true,
    declarationId,
    operationCount: insertedCount,
    message: `DIOT declaration generated successfully for ${month}/${year}`,
    xml: xmlContent
  }), {
    status: 201,
    headers: corsHeaders
  });
}

/**
 * Generate Contabilidad Electrónica files
 */
async function generateContabilidadElectronica(env, userId, year, month) {
  // Validate period
  if (!year || year < 2020 || year > 2100) {
    return new Response(JSON.stringify({ 
      error: 'Invalid year',
      code: 'INVALID_YEAR'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  if (month && (month < 1 || month > 12)) {
    return new Response(JSON.stringify({ 
      error: 'Invalid month',
      code: 'INVALID_MONTH'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Check if declaration already exists
  const existing = await env.DB.prepare(`
    SELECT id FROM sat_declarations
    WHERE user_id = ? AND declaration_type = 'contabilidad_electronica' 
      AND period_year = ? AND period_month ${month ? '= ?' : 'IS NULL'}
  `).bind(userId, year, ...(month ? [month] : [])).first();

  if (existing) {
    return new Response(JSON.stringify({ 
      error: 'Contabilidad Electrónica declaration already exists for this period',
      code: 'DECLARATION_EXISTS',
      declarationId: existing.id
    }), {
      status: 409,
      headers: corsHeaders
    });
  }

  // Create declaration record
  const declarationResult = await env.DB.prepare(`
    INSERT INTO sat_declarations 
    (user_id, declaration_type, period_year, period_month, status)
    VALUES (?, 'contabilidad_electronica', ?, ?, 'draft')
  `).bind(userId, year, month || null).run();

  const declarationId = declarationResult.meta.last_row_id;

  const files = [];

  // 1. Generate Catálogo de Cuentas XML
  const catalogoXML = await generateCatalogoCuentasXML(env, userId, year);
  const catalogoResult = await env.DB.prepare(`
    INSERT INTO contabilidad_electronica_files 
    (user_id, declaration_id, file_type, period_year, period_month, 
     xml_content, file_name, validation_status)
    VALUES (?, ?, 'catalogo_cuentas', ?, NULL, ?, ?, 'valid')
  `).bind(
    userId,
    declarationId,
    year,
    catalogoXML,
    `CatalogoCuentas_${year}.xml`
  ).run();
  files.push({ type: 'catalogo_cuentas', id: catalogoResult.meta.last_row_id });

  // 2. Generate Balanza de Comprobación XML (if month specified)
  if (month) {
    const balanzaXML = await generateBalanzaComprobacionXML(env, userId, year, month);
    const balanzaResult = await env.DB.prepare(`
      INSERT INTO contabilidad_electronica_files 
      (user_id, declaration_id, file_type, period_year, period_month, 
       xml_content, file_name, validation_status)
      VALUES (?, ?, 'balanza_comprobacion', ?, ?, ?, ?, 'valid')
    `).bind(
      userId,
      declarationId,
      year,
      month,
      balanzaXML,
      `BalanzaComprobacion_${year}_${String(month).padStart(2, '0')}.xml`
    ).run();
    files.push({ type: 'balanza_comprobacion', id: balanzaResult.meta.last_row_id });

    // 3. Generate Pólizas XML
    const polizasXML = await generatePolizasXML(env, userId, year, month);
    const polizasResult = await env.DB.prepare(`
      INSERT INTO contabilidad_electronica_files 
      (user_id, declaration_id, file_type, period_year, period_month, 
       xml_content, file_name, validation_status)
      VALUES (?, ?, 'polizas', ?, ?, ?, ?, 'valid')
    `).bind(
      userId,
      declarationId,
      year,
      month,
      polizasXML,
      `Polizas_${year}_${String(month).padStart(2, '0')}.xml`
    ).run();
    files.push({ type: 'polizas', id: polizasResult.meta.last_row_id });

    // 4. Generate Auxiliar de Folios XML
    const auxiliarXML = await generateAuxiliarFoliosXML(env, userId, year, month);
    const auxiliarResult = await env.DB.prepare(`
      INSERT INTO contabilidad_electronica_files 
      (user_id, declaration_id, file_type, period_year, period_month, 
       xml_content, file_name, validation_status)
      VALUES (?, ?, 'auxiliar_folios', ?, ?, ?, ?, 'valid')
    `).bind(
      userId,
      declarationId,
      year,
      month,
      auxiliarXML,
      `AuxiliarFolios_${year}_${String(month).padStart(2, '0')}.xml`
    ).run();
    files.push({ type: 'auxiliar_folios', id: auxiliarResult.meta.last_row_id });
  }

  // Update declaration status
  await env.DB.prepare(`
    UPDATE sat_declarations
    SET status = 'generated',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(declarationId).run();

  return new Response(JSON.stringify({
    success: true,
    declarationId,
    fileCount: files.length,
    files,
    message: `Contabilidad Electrónica generated successfully for ${month ? `${month}/` : ''}${year}`
  }), {
    status: 201,
    headers: corsHeaders
  });
}

/**
 * Update declaration
 */
async function updateDeclaration(env, userId, declarationId, data) {
  // Verify ownership
  const declaration = await env.DB.prepare(`
    SELECT id FROM sat_declarations
    WHERE id = ? AND user_id = ?
  `).bind(declarationId, userId).first();

  if (!declaration) {
    return new Response(JSON.stringify({ 
      error: 'Declaration not found',
      code: 'NOT_FOUND'
    }), {
      status: 404,
      headers: corsHeaders
    });
  }

  const updates = [];
  const params = [];

  if (data.status) {
    updates.push('status = ?');
    params.push(data.status);
  }

  if (data.sat_response !== undefined) {
    updates.push('sat_response = ?');
    params.push(data.sat_response);
  }

  if (data.submission_date) {
    updates.push('submission_date = ?');
    params.push(data.submission_date);
  }

  if (data.error_message !== undefined) {
    updates.push('error_message = ?');
    params.push(data.error_message);
  }

  if (updates.length === 0) {
    return new Response(JSON.stringify({ 
      error: 'No valid fields to update',
      code: 'NO_UPDATES'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  params.push(declarationId);

  await env.DB.prepare(`
    UPDATE sat_declarations
    SET ${updates.join(', ')},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(...params).run();

  return new Response(JSON.stringify({
    success: true,
    message: 'Declaration updated successfully'
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Delete declaration
 */
async function deleteDeclaration(env, userId, declarationId) {
  // Verify ownership
  const declaration = await env.DB.prepare(`
    SELECT id FROM sat_declarations
    WHERE id = ? AND user_id = ?
  `).bind(declarationId, userId).first();

  if (!declaration) {
    return new Response(JSON.stringify({ 
      error: 'Declaration not found',
      code: 'NOT_FOUND'
    }), {
      status: 404,
      headers: corsHeaders
    });
  }

  // Delete declaration (cascades to related tables)
  await env.DB.prepare(`
    DELETE FROM sat_declarations
    WHERE id = ?
  `).bind(declarationId).run();

  return new Response(JSON.stringify({
    success: true,
    message: 'Declaration deleted successfully'
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Submit declaration to SAT (placeholder)
 */
async function submitDeclaration(env, userId, declarationId) {
  // Verify ownership
  const declaration = await env.DB.prepare(`
    SELECT * FROM sat_declarations
    WHERE id = ? AND user_id = ?
  `).bind(declarationId, userId).first();

  if (!declaration) {
    return new Response(JSON.stringify({ 
      error: 'Declaration not found',
      code: 'NOT_FOUND'
    }), {
      status: 404,
      headers: corsHeaders
    });
  }

  if (declaration.status !== 'generated') {
    return new Response(JSON.stringify({ 
      error: 'Declaration must be in generated status to submit',
      code: 'INVALID_STATUS'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // TODO: Implement actual SAT submission logic
  // For now, just update the status

  await env.DB.prepare(`
    UPDATE sat_declarations
    SET status = 'submitted',
        submission_date = CURRENT_TIMESTAMP,
        sat_response = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    JSON.stringify({ status: 'pending', message: 'Awaiting SAT response' }),
    declarationId
  ).run();

  return new Response(JSON.stringify({
    success: true,
    message: 'Declaration submitted to SAT (simulation)',
    declarationId
  }), {
    status: 200,
    headers: corsHeaders
  });
}

// ============================================================
// XML GENERATION FUNCTIONS
// ============================================================

/**
 * Generate DIOT XML
 */
function generateDIOTXML(operations, year, month) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<DIOT xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
      Version="1.0" 
      Ejercicio="${year}" 
      Periodo="${month}">`;

  let operationsXML = '';
  operations.forEach((op, index) => {
    operationsXML += `
  <Operacion Numero="${index + 1}">
    <RFC>${escapeXML(op.client_rfc || '')}</RFC>
    <Nombre>${escapeXML(op.client_name || '')}</Nombre>
    <TipoTercero>${op.nationality === 'extranjero' ? '05' : '04'}</TipoTercero>
    <TipoOperacion>${getOperationTypeCode(op.operation_type)}</TipoOperacion>
    <MontoTotal>${(op.total_amount || 0).toFixed(2)}</MontoTotal>
    <BaseIVA>${(op.base_amount || 0).toFixed(2)}</BaseIVA>
    <IVA>${(op.iva_amount || 0).toFixed(2)}</IVA>
    <TasaIVA>${getTasaIVA(op.iva_rate)}</TasaIVA>
  </Operacion>`;
  });

  const footer = `
</DIOT>`;

  return header + operationsXML + footer;
}

/**
 * Generate Catálogo de Cuentas XML
 */
async function generateCatalogoCuentasXML(env, userId, year) {
  // Get accounts catalog from sat_accounts_catalog
  const accounts = await env.DB.prepare(`
    SELECT 
      codigo,
      nivel,
      descripcion,
      naturaleza
    FROM sat_accounts_catalog
    WHERE is_active = 1
    ORDER BY codigo
  `).all();

  const header = `<?xml version="1.0" encoding="UTF-8"?>
<catalogocuentas:Catalogo xmlns:catalogocuentas="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/CatalogoCuentas"
                          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                          xsi:schemaLocation="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/CatalogoCuentas http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/CatalogoCuentas/CatalogoCuentas_1_3.xsd"
                          Version="1.3"
                          RFC="XAXX010101000"
                          Mes="${String(new Date().getMonth() + 1).padStart(2, '0')}"
                          Anio="${year}">
  <catalogocuentas:Ctas>`;

  let accountsXML = '';
  if (accounts.results && accounts.results.length > 0) {
    accounts.results.forEach(account => {
      accountsXML += `
    <catalogocuentas:Cuenta CodAgrup="${account.codigo}" 
                            NumCta="${account.codigo}" 
                            Desc="${escapeXML(account.descripcion)}" 
                            Nivel="${account.nivel}" 
                            Natur="${account.naturaleza || 'D'}" />`;
    });
  }

  const footer = `
  </catalogocuentas:Ctas>
</catalogocuentas:Catalogo>`;

  return header + accountsXML + footer;
}

/**
 * Generate Balanza de Comprobación XML
 */
async function generateBalanzaComprobacionXML(env, userId, year, month) {
  // Calculate date range
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Get account balances from transactions
  const balances = await env.DB.prepare(`
    SELECT 
      t.account_id,
      a.name as account_name,
      a.sat_code,
      SUM(CASE WHEN t.type = 'ingreso' THEN t.amount ELSE 0 END) as credits,
      SUM(CASE WHEN t.type = 'gasto' THEN t.amount ELSE 0 END) as debits
    FROM transactions t
    LEFT JOIN accounts a ON t.account_id = a.id
    WHERE t.user_id = ?
      AND t.date BETWEEN ? AND ?
      AND t.is_deleted = 0
    GROUP BY t.account_id, a.name, a.sat_code
  `).bind(userId, startDate, endDate).all();

  const header = `<?xml version="1.0" encoding="UTF-8"?>
<BCE:Balanza xmlns:BCE="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/BalanzaComprobacion"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/BalanzaComprobacion http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/BalanzaComprobacion/BalanzaComprobacion_1_3.xsd"
             Version="1.3"
             RFC="XAXX010101000"
             Mes="${String(month).padStart(2, '0')}"
             Anio="${year}"
             TipoEnvio="N">
  <BCE:Ctas>`;

  let balancesXML = '';
  if (balances.results && balances.results.length > 0) {
    balances.results.forEach(balance => {
      const saldoFinal = (balance.credits || 0) - (balance.debits || 0);
      balancesXML += `
    <BCE:Cta NumCta="${balance.sat_code || balance.account_id}" 
             SaldoIni="0.00" 
             Debe="${(balance.debits || 0).toFixed(2)}" 
             Haber="${(balance.credits || 0).toFixed(2)}" 
             SaldoFin="${saldoFinal.toFixed(2)}" />`;
    });
  }

  const footer = `
  </BCE:Ctas>
</BCE:Balanza>`;

  return header + balancesXML + footer;
}

/**
 * Generate Pólizas XML
 */
async function generatePolizasXML(env, userId, year, month) {
  // Calculate date range
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Get transactions for the period
  const transactions = await env.DB.prepare(`
    SELECT 
      t.id,
      t.date,
      t.type,
      t.description,
      t.amount,
      t.account_id,
      a.sat_code,
      a.name as account_name
    FROM transactions t
    LEFT JOIN accounts a ON t.account_id = a.id
    WHERE t.user_id = ?
      AND t.date BETWEEN ? AND ?
      AND t.is_deleted = 0
    ORDER BY t.date, t.id
  `).bind(userId, startDate, endDate).all();

  const header = `<?xml version="1.0" encoding="UTF-8"?>
<PLZ:Polizas xmlns:PLZ="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/PolizasPeriodo"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             xsi:schemaLocation="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/PolizasPeriodo http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/PolizasPeriodo/PolizasPeriodo_1_3.xsd"
             Version="1.3"
             RFC="XAXX010101000"
             Mes="${String(month).padStart(2, '0')}"
             Anio="${year}">`;

  let polizasXML = '';
  if (transactions.results && transactions.results.length > 0) {
    transactions.results.forEach((trans, index) => {
      polizasXML += `
  <PLZ:Poliza NumUnIdenPol="${index + 1}" Fecha="${trans.date}" Concepto="${escapeXML(trans.description || 'Transacción')}">
    <PLZ:Transaccion NumCta="${trans.sat_code || trans.account_id}" 
                     DesCta="${escapeXML(trans.account_name || '')}" 
                     Concepto="${escapeXML(trans.description || '')}" 
                     Debe="${trans.type === 'gasto' ? trans.amount.toFixed(2) : '0.00'}" 
                     Haber="${trans.type === 'ingreso' ? trans.amount.toFixed(2) : '0.00'}" />
  </PLZ:Poliza>`;
    });
  }

  const footer = `
</PLZ:Polizas>`;

  return header + polizasXML + footer;
}

/**
 * Generate Auxiliar de Folios XML
 */
async function generateAuxiliarFoliosXML(env, userId, year, month) {
  // Calculate date range
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  // Get CFDI metadata for the period
  const cfdis = await env.DB.prepare(`
    SELECT 
      cfdi_uuid,
      issue_date,
      emitter_rfc,
      emitter_name,
      receiver_rfc,
      receiver_name,
      total_amount,
      cfdi_type
    FROM cfdi_metadata
    WHERE user_id = ?
      AND issue_date BETWEEN ? AND ?
    ORDER BY issue_date
  `).bind(userId, startDate, endDate).all();

  const header = `<?xml version="1.0" encoding="UTF-8"?>
<AuxiliarFolios xmlns="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/AuxiliarFolios"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xsi:schemaLocation="http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/AuxiliarFolios http://www.sat.gob.mx/esquemas/ContabilidadE/1_3/AuxiliarFolios/AuxiliarFolios_1_3.xsd"
                Version="1.3"
                RFC="XAXX010101000"
                Mes="${String(month).padStart(2, '0')}"
                Anio="${year}"
                TipoSolicitud="AF">`;

  let foliosXML = '';
  if (cfdis.results && cfdis.results.length > 0) {
    cfdis.results.forEach(cfdi => {
      foliosXML += `
  <DetAuxFol>
    <CompNal UUID_CFDI="${cfdi.cfdi_uuid}" 
             RFC="${cfdi.emitter_rfc}" 
             MontoTotal="${(cfdi.total_amount || 0).toFixed(2)}" 
             Fecha="${cfdi.issue_date}" />
  </DetAuxFol>`;
    });
  }

  const footer = `
</AuxiliarFolios>`;

  return header + foliosXML + footer;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function escapeXML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getOperationTypeCode(type) {
  const codes = {
    'purchase': '03',
    'sale': '85',
    'service': '03',
    'rent': '03',
    'other': '03'
  };
  return codes[type] || '03';
}

function getTasaIVA(rate) {
  if (rate === '16') return '16';
  if (rate === '8') return '8';
  if (rate === '0') return '0';
  return 'Exento';
}
