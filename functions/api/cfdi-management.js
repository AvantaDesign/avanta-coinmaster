// CFDI Management API - Comprehensive CRUD operations for CFDI metadata
//
// This API handles all CFDI management operations including:
// - Upload and parse CFDI XML files
// - List CFDIs with filtering and search
// - Update CFDI status and link to transactions
// - Delete CFDI records
// - Validate specific CFDIs
//
// Endpoints:
// - GET /api/cfdi-management - List CFDIs with filters
// - GET /api/cfdi-management/:id - Get single CFDI
// - GET /api/cfdi-management/validate/:uuid - Validate specific CFDI
// - POST /api/cfdi-management - Upload and parse CFDI XML
// - PUT /api/cfdi-management/:id - Update CFDI (status, link, etc.)
// - DELETE /api/cfdi-management/:id - Delete CFDI record

import { getUserIdFromToken } from './auth.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/cfdi-management
 * GET /api/cfdi-management/:id
 * GET /api/cfdi-management/validate/:uuid
 * 
 * Query Parameters for listing:
 *   - type: 'issued' | 'received'
 *   - status: 'Pending Validation' | 'Valid' | 'Invalid RFC' | 'Canceled' | 'Error'
 *   - date_from: YYYY-MM-DD
 *   - date_to: YYYY-MM-DD
 *   - search: string (search in emitter/receiver RFC, UUID)
 *   - linked: boolean (filter by linked/unlinked status)
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

    // Handle validation endpoint: /api/cfdi-management/validate/:uuid
    if (secondLastPart === 'validate' && lastPart) {
      return await validateCFDI(env, userId, lastPart);
    }

    // Handle single CFDI request: /api/cfdi-management/:id
    if (/^\d+$/.test(lastPart) && secondLastPart === 'cfdi-management') {
      return await getSingleCFDI(env, userId, parseInt(lastPart));
    }

    // Handle list request
    return await listCFDIs(env, userId, url);

  } catch (error) {
    console.error('Error in cfdi-management GET:', error);
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
 * POST /api/cfdi-management
 * Upload and parse CFDI XML file
 */
export async function onRequestPost(context) {
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

    // Parse request body
    const data = await request.json();
    const { xmlContent, xmlUrl, autoLink = true } = data;

    if (!xmlContent) {
      return new Response(JSON.stringify({ 
        error: 'XML content is required',
        code: 'MISSING_XML'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Parse CFDI XML (using browser-compatible parsing)
    let cfdiData;
    try {
      cfdiData = parseCFDIServerSide(xmlContent);
    } catch (parseError) {
      return new Response(JSON.stringify({ 
        error: 'Failed to parse CFDI XML',
        message: parseError.message,
        code: 'PARSE_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate CFDI data
    const validation = validateCFDIData(cfdiData);
    if (!validation.valid) {
      return new Response(JSON.stringify({ 
        error: 'Invalid CFDI data',
        errors: validation.errors,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get user's RFC for type determination
    const userProfile = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(userId).first();

    const userRFC = userProfile?.preferences ? 
      JSON.parse(userProfile.preferences)?.rfc : null;

    // Determine if issued or received
    const type = cfdiData.emisor?.rfc === userRFC ? 'issued' : 'received';

    // Check for duplicates
    const existing = await env.DB.prepare(
      'SELECT id FROM cfdi_metadata WHERE user_id = ? AND uuid = ?'
    ).bind(userId, cfdiData.uuid).first();

    if (existing) {
      return new Response(JSON.stringify({ 
        error: 'CFDI with this UUID already exists',
        code: 'DUPLICATE_UUID',
        existingId: existing.id
      }), {
        status: 409,
        headers: corsHeaders
      });
    }

    // Determine initial status
    let status = 'Pending Validation';
    let validationErrors = [];

    // Validate RFC against user's RFC for received invoices
    if (type === 'received' && userRFC) {
      if (cfdiData.receptor?.rfc !== userRFC) {
        status = 'Invalid RFC';
        validationErrors.push(`Receptor RFC (${cfdiData.receptor?.rfc}) does not match user RFC (${userRFC})`);
      } else {
        status = 'Valid';
      }
    } else if (type === 'issued' && userRFC) {
      if (cfdiData.emisor?.rfc !== userRFC) {
        status = 'Invalid RFC';
        validationErrors.push(`Emisor RFC (${cfdiData.emisor?.rfc}) does not match user RFC (${userRFC})`);
      } else {
        status = 'Valid';
      }
    }

    // Auto-match with existing transactions if enabled
    let linkedTransactionId = null;
    let autoMatched = 0;

    if (autoLink && cfdiData.uuid) {
      const matchingTransaction = await env.DB.prepare(
        'SELECT id FROM transactions WHERE user_id = ? AND cfdi_uuid = ? LIMIT 1'
      ).bind(userId, cfdiData.uuid).first();

      if (matchingTransaction) {
        linkedTransactionId = matchingTransaction.id;
        autoMatched = 1;
      }
    }

    // Insert CFDI metadata
    const result = await env.DB.prepare(`
      INSERT INTO cfdi_metadata (
        user_id, uuid, type, status,
        emitter_rfc, emitter_name, receiver_rfc, receiver_name,
        total_amount, subtotal, iva_amount, discount,
        isr_retention, iva_retention,
        issue_date, payment_date, stamp_date,
        payment_method, payment_form,
        currency, exchange_rate,
        serie, folio, cfdi_type, cfdi_version, uso_cfdi,
        xml_content, xml_url,
        linked_transaction_id, auto_matched,
        validation_errors, validation_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      cfdiData.uuid,
      type,
      status,
      cfdiData.emisor?.rfc || '',
      cfdiData.emisor?.nombre || '',
      cfdiData.receptor?.rfc || '',
      cfdiData.receptor?.nombre || '',
      cfdiData.total || 0,
      cfdiData.subtotal || 0,
      cfdiData.impuestos?.totalTraslados || 0,
      cfdiData.descuento || 0,
      cfdiData.impuestos?.totalRetenciones || 0,
      0, // iva_retention - would need specific extraction
      cfdiData.date || new Date().toISOString().split('T')[0],
      null, // payment_date - not in standard CFDI
      cfdiData.timbreFiscal?.fechaTimbrado || null,
      cfdiData.metodoPago || null,
      cfdiData.formaPago || null,
      cfdiData.moneda || 'MXN',
      parseFloat(cfdiData.tipoCambio) || 1.0,
      cfdiData.serie || null,
      cfdiData.folio || null,
      cfdiData.tipoDeComprobante || 'I',
      cfdiData.version || '3.3',
      cfdiData.receptor?.usoCFDI || null,
      xmlContent,
      xmlUrl || null,
      linkedTransactionId,
      autoMatched,
      validationErrors.length > 0 ? JSON.stringify(validationErrors) : null,
      new Date().toISOString()
    ).run();

    // Get the created record
    const created = await env.DB.prepare(
      'SELECT * FROM cfdi_metadata WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify({ 
      success: true,
      cfdi: created,
      autoMatched: autoMatched === 1,
      linkedTransactionId
    }), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in cfdi-management POST:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create CFDI record',
      message: error.message,
      code: 'CREATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * PUT /api/cfdi-management/:id
 * Update CFDI record (status, linked transaction, etc.)
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

    // Get CFDI ID from URL
    const pathParts = url.pathname.split('/').filter(p => p);
    const cfdiId = parseInt(pathParts[pathParts.length - 1]);

    if (!cfdiId || isNaN(cfdiId)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid CFDI ID',
        code: 'INVALID_ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Parse request body
    const data = await request.json();
    const { status, linked_transaction_id, validation_errors } = data;

    // Verify CFDI exists and belongs to user
    const existing = await env.DB.prepare(
      'SELECT * FROM cfdi_metadata WHERE id = ? AND user_id = ?'
    ).bind(cfdiId, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'CFDI not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (status !== undefined) {
      const validStatuses = ['Pending Validation', 'Valid', 'Invalid RFC', 'Canceled', 'Error'];
      if (!validStatuses.includes(status)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid status value',
          code: 'INVALID_STATUS'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      updates.push('status = ?');
      params.push(status);
      
      // Update validation date when status changes
      updates.push('validation_date = ?');
      params.push(new Date().toISOString());
    }

    if (linked_transaction_id !== undefined) {
      // Verify transaction exists and belongs to user
      if (linked_transaction_id !== null) {
        const transaction = await env.DB.prepare(
          'SELECT id FROM transactions WHERE id = ? AND user_id = ?'
        ).bind(linked_transaction_id, userId).first();

        if (!transaction) {
          return new Response(JSON.stringify({ 
            error: 'Transaction not found',
            code: 'TRANSACTION_NOT_FOUND'
          }), {
            status: 404,
            headers: corsHeaders
          });
        }
      }

      updates.push('linked_transaction_id = ?');
      params.push(linked_transaction_id);
      
      // Mark as not auto-matched if manually linking
      updates.push('auto_matched = ?');
      params.push(0);
    }

    if (validation_errors !== undefined) {
      updates.push('validation_errors = ?');
      params.push(validation_errors ? JSON.stringify(validation_errors) : null);
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

    // Execute update
    params.push(cfdiId);
    params.push(userId);
    
    await env.DB.prepare(`
      UPDATE cfdi_metadata 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...params).run();

    // Get updated record
    const updated = await env.DB.prepare(
      'SELECT * FROM cfdi_metadata WHERE id = ? AND user_id = ?'
    ).bind(cfdiId, userId).first();

    return new Response(JSON.stringify({ 
      success: true,
      cfdi: updated
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in cfdi-management PUT:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update CFDI',
      message: error.message,
      code: 'UPDATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * DELETE /api/cfdi-management/:id
 * Delete CFDI record
 */
export async function onRequestDelete(context) {
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

    // Get CFDI ID from URL
    const pathParts = url.pathname.split('/').filter(p => p);
    const cfdiId = parseInt(pathParts[pathParts.length - 1]);

    if (!cfdiId || isNaN(cfdiId)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid CFDI ID',
        code: 'INVALID_ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify CFDI exists and belongs to user
    const existing = await env.DB.prepare(
      'SELECT * FROM cfdi_metadata WHERE id = ? AND user_id = ?'
    ).bind(cfdiId, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'CFDI not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Delete CFDI
    await env.DB.prepare(
      'DELETE FROM cfdi_metadata WHERE id = ? AND user_id = ?'
    ).bind(cfdiId, userId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'CFDI deleted successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in cfdi-management DELETE:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete CFDI',
      message: error.message,
      code: 'DELETE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * List CFDIs with filtering
 */
async function listCFDIs(env, userId, url) {
  const searchParams = url.searchParams;

  // Parse query parameters
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const search = searchParams.get('search');
  const linked = searchParams.get('linked');
  const limit = Math.min(parseInt(searchParams.get('limit')) || 50, 100);
  const offset = parseInt(searchParams.get('offset')) || 0;

  // Build WHERE clause
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (dateFrom) {
    conditions.push('issue_date >= ?');
    params.push(dateFrom);
  }

  if (dateTo) {
    conditions.push('issue_date <= ?');
    params.push(dateTo);
  }

  if (search) {
    conditions.push('(uuid LIKE ? OR emitter_rfc LIKE ? OR receiver_rfc LIKE ?)');
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  if (linked === 'true') {
    conditions.push('linked_transaction_id IS NOT NULL');
  } else if (linked === 'false') {
    conditions.push('linked_transaction_id IS NULL');
  }

  // Build query
  const whereClause = conditions.join(' AND ');
  
  // Get total count
  const countResult = await env.DB.prepare(
    `SELECT COUNT(*) as total FROM cfdi_metadata WHERE ${whereClause}`
  ).bind(...params).first();

  const total = countResult.total;

  // Get records with pagination
  const records = await env.DB.prepare(`
    SELECT 
      id, uuid, type, status,
      emitter_rfc, emitter_name, receiver_rfc, receiver_name,
      total_amount, subtotal, iva_amount,
      issue_date, payment_date,
      payment_method, currency,
      serie, folio, cfdi_type,
      linked_transaction_id, auto_matched,
      created_at, updated_at
    FROM cfdi_metadata 
    WHERE ${whereClause}
    ORDER BY issue_date DESC, created_at DESC
    LIMIT ? OFFSET ?
  `).bind(...params, limit, offset).all();

  return new Response(JSON.stringify({ 
    cfdis: records.results || [],
    total,
    limit,
    offset,
    hasMore: offset + limit < total
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Get single CFDI by ID
 */
async function getSingleCFDI(env, userId, cfdiId) {
  const cfdi = await env.DB.prepare(
    'SELECT * FROM cfdi_metadata WHERE id = ? AND user_id = ?'
  ).bind(cfdiId, userId).first();

  if (!cfdi) {
    return new Response(JSON.stringify({ 
      error: 'CFDI not found',
      code: 'NOT_FOUND'
    }), {
      status: 404,
      headers: corsHeaders
    });
  }

  // If linked to transaction, fetch transaction details
  let linkedTransaction = null;
  if (cfdi.linked_transaction_id) {
    linkedTransaction = await env.DB.prepare(
      'SELECT id, date, description, amount, type FROM transactions WHERE id = ?'
    ).bind(cfdi.linked_transaction_id).first();
  }

  return new Response(JSON.stringify({ 
    cfdi,
    linkedTransaction
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Validate specific CFDI by UUID
 */
async function validateCFDI(env, userId, uuid) {
  const cfdi = await env.DB.prepare(
    'SELECT * FROM cfdi_metadata WHERE uuid = ? AND user_id = ?'
  ).bind(uuid, userId).first();

  if (!cfdi) {
    return new Response(JSON.stringify({ 
      error: 'CFDI not found',
      code: 'NOT_FOUND'
    }), {
      status: 404,
      headers: corsHeaders
    });
  }

  // Perform validation checks
  const validationErrors = [];

  // Check RFC format
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  if (!rfcRegex.test(cfdi.emitter_rfc)) {
    validationErrors.push('Emitter RFC format is invalid');
  }
  if (!rfcRegex.test(cfdi.receiver_rfc)) {
    validationErrors.push('Receiver RFC format is invalid');
  }

  // Check UUID format (36 characters)
  if (cfdi.uuid.length !== 36) {
    validationErrors.push('UUID must be 36 characters');
  }

  // Check amounts
  if (cfdi.total_amount <= 0) {
    validationErrors.push('Total amount must be greater than 0');
  }
  if (cfdi.subtotal <= 0) {
    validationErrors.push('Subtotal must be greater than 0');
  }

  // Determine new status
  const newStatus = validationErrors.length === 0 ? 'Valid' : 'Error';

  // Update status if changed
  if (newStatus !== cfdi.status) {
    await env.DB.prepare(`
      UPDATE cfdi_metadata 
      SET status = ?, validation_errors = ?, validation_date = ?
      WHERE id = ?
    `).bind(
      newStatus,
      validationErrors.length > 0 ? JSON.stringify(validationErrors) : null,
      new Date().toISOString(),
      cfdi.id
    ).run();
  }

  return new Response(JSON.stringify({ 
    valid: validationErrors.length === 0,
    status: newStatus,
    errors: validationErrors,
    cfdi: { ...cfdi, status: newStatus }
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Server-side CFDI parser (simplified for Cloudflare Workers)
 * Note: This is a basic implementation. For production, consider using a more robust XML parser
 */
function parseCFDIServerSide(xmlContent) {
  // For now, we'll extract data using regex patterns
  // In a real implementation, you'd use a proper XML parser
  
  const extractAttribute = (xml, tag, attr) => {
    const regex = new RegExp(`<[^>]*${tag}[^>]*${attr}="([^"]*)"`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : null;
  };

  const extractValue = (xml, pattern) => {
    const match = xml.match(pattern);
    return match ? match[1] : null;
  };

  // Extract UUID from TimbreFiscalDigital
  const uuid = extractValue(xmlContent, /UUID="([^"]+)"/i) ||
                extractValue(xmlContent, /uuid="([^"]+)"/i);

  // Extract basic attributes from Comprobante
  const version = extractAttribute(xmlContent, 'Comprobante', 'Version') ||
                  extractAttribute(xmlContent, 'Comprobante', 'version');
  
  const serie = extractAttribute(xmlContent, 'Comprobante', 'Serie') ||
                extractAttribute(xmlContent, 'Comprobante', 'serie');
  
  const folio = extractAttribute(xmlContent, 'Comprobante', 'Folio') ||
                extractAttribute(xmlContent, 'Comprobante', 'folio');
  
  const fecha = extractAttribute(xmlContent, 'Comprobante', 'Fecha') ||
                extractAttribute(xmlContent, 'Comprobante', 'fecha');
  
  const subtotal = extractAttribute(xmlContent, 'Comprobante', 'SubTotal') ||
                   extractAttribute(xmlContent, 'Comprobante', 'Subtotal') ||
                   extractAttribute(xmlContent, 'Comprobante', 'subtotal');
  
  const total = extractAttribute(xmlContent, 'Comprobante', 'Total') ||
                extractAttribute(xmlContent, 'Comprobante', 'total');
  
  const descuento = extractAttribute(xmlContent, 'Comprobante', 'Descuento') ||
                    extractAttribute(xmlContent, 'Comprobante', 'descuento');
  
  const metodoPago = extractAttribute(xmlContent, 'Comprobante', 'MetodoPago') ||
                     extractAttribute(xmlContent, 'Comprobante', 'metodoPago');
  
  const formaPago = extractAttribute(xmlContent, 'Comprobante', 'FormaPago') ||
                    extractAttribute(xmlContent, 'Comprobante', 'formaPago');
  
  const moneda = extractAttribute(xmlContent, 'Comprobante', 'Moneda') ||
                 extractAttribute(xmlContent, 'Comprobante', 'moneda');
  
  const tipoCambio = extractAttribute(xmlContent, 'Comprobante', 'TipoCambio') ||
                     extractAttribute(xmlContent, 'Comprobante', 'tipoCambio');
  
  const tipoDeComprobante = extractAttribute(xmlContent, 'Comprobante', 'TipoDeComprobante') ||
                            extractAttribute(xmlContent, 'Comprobante', 'tipoDeComprobante');

  // Extract Emisor
  const emisorRfc = extractAttribute(xmlContent, 'Emisor', 'Rfc') ||
                    extractAttribute(xmlContent, 'Emisor', 'rfc') ||
                    extractAttribute(xmlContent, 'Emisor', 'RFC');
  
  const emisorNombre = extractAttribute(xmlContent, 'Emisor', 'Nombre') ||
                       extractAttribute(xmlContent, 'Emisor', 'nombre');

  // Extract Receptor
  const receptorRfc = extractAttribute(xmlContent, 'Receptor', 'Rfc') ||
                      extractAttribute(xmlContent, 'Receptor', 'rfc') ||
                      extractAttribute(xmlContent, 'Receptor', 'RFC');
  
  const receptorNombre = extractAttribute(xmlContent, 'Receptor', 'Nombre') ||
                         extractAttribute(xmlContent, 'Receptor', 'nombre');
  
  const usoCFDI = extractAttribute(xmlContent, 'Receptor', 'UsoCFDI') ||
                  extractAttribute(xmlContent, 'Receptor', 'usoCFDI');

  // Extract Impuestos
  const totalTraslados = extractAttribute(xmlContent, 'Impuestos', 'TotalImpuestosTrasladados') ||
                         extractAttribute(xmlContent, 'Impuestos', 'totalImpuestosTrasladados');
  
  const totalRetenciones = extractAttribute(xmlContent, 'Impuestos', 'TotalImpuestosRetenidos') ||
                           extractAttribute(xmlContent, 'Impuestos', 'totalImpuestosRetenidos');

  // Extract TimbreFiscalDigital
  const fechaTimbrado = extractAttribute(xmlContent, 'TimbreFiscalDigital', 'FechaTimbrado') ||
                        extractAttribute(xmlContent, 'TimbreFiscalDigital', 'fechaTimbrado');

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return new Date().toISOString().split('T')[0];
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (e) {
      // Fallback
    }
    return new Date().toISOString().split('T')[0];
  };

  return {
    uuid,
    version,
    serie,
    folio,
    fecha,
    date: formatDate(fecha),
    subtotal: parseFloat(subtotal) || 0,
    total: parseFloat(total) || 0,
    descuento: parseFloat(descuento) || 0,
    metodoPago,
    formaPago,
    moneda: moneda || 'MXN',
    tipoCambio: tipoCambio || '1',
    tipoDeComprobante: tipoDeComprobante || 'I',
    emisor: {
      rfc: emisorRfc,
      nombre: emisorNombre
    },
    receptor: {
      rfc: receptorRfc,
      nombre: receptorNombre,
      usoCFDI
    },
    impuestos: {
      totalTraslados: parseFloat(totalTraslados) || 0,
      totalRetenciones: parseFloat(totalRetenciones) || 0
    },
    timbreFiscal: {
      fechaTimbrado
    }
  };
}

/**
 * Validate CFDI data structure
 */
function validateCFDIData(cfdiData) {
  const errors = [];

  // Required fields
  if (!cfdiData.uuid || cfdiData.uuid.length !== 36) {
    errors.push('Invalid UUID (must be 36 characters)');
  }

  if (!cfdiData.emisor || !cfdiData.emisor.rfc) {
    errors.push('Emitter RFC is required');
  }

  if (!cfdiData.receptor || !cfdiData.receptor.rfc) {
    errors.push('Receiver RFC is required');
  }

  if (!cfdiData.date) {
    errors.push('Date is required');
  }

  if (!cfdiData.total || cfdiData.total <= 0) {
    errors.push('Total must be greater than 0');
  }

  if (!cfdiData.subtotal || cfdiData.subtotal <= 0) {
    errors.push('Subtotal must be greater than 0');
  }

  // Validate RFC format
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  if (cfdiData.emisor?.rfc && !rfcRegex.test(cfdiData.emisor.rfc)) {
    errors.push('Emitter RFC format is invalid');
  }

  if (cfdiData.receptor?.rfc && !rfcRegex.test(cfdiData.receptor.rfc)) {
    errors.push('Receiver RFC format is invalid');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
