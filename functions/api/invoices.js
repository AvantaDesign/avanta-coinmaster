// Invoices API - Manage CFDI invoices
// Phase 30: Monetary values stored as INTEGER cents in database
// Phase 31: Backend Hardening and Security - Integrated security utilities

import { getUserIdFromToken } from './auth.js';
import { 
  toCents, 
  convertArrayFromCents, 
  parseMonetaryInput, 
  MONETARY_FIELDS 
} from '../utils/monetary.js';
import { getSecurityHeaders } from '../utils/security.js';
import { sanitizeString } from '../utils/validation.js';
import { logRequest, logError, logAuditEvent } from '../utils/logging.js';
import { createErrorResponse } from '../utils/errors.js';
import { checkRateLimit, getRateLimitConfig } from '../utils/rate-limiter.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const type = url.searchParams.get('type'); // recibido or emitido
  const status = url.searchParams.get('status') || 'active';
  
  // Phase 31: Security headers
  const corsHeaders = getSecurityHeaders();
  
  try {
    // Phase 31: Log request
    logRequest(request, { endpoint: 'invoices', method: 'GET' }, env);
    
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

    let query = 'SELECT * FROM invoices WHERE user_id = ?';
    const params = [userId];
    
    // Add status filter
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY date DESC LIMIT 100';
    
    const stmt = env.DB.prepare(query);
    const result = await stmt.bind(...params).all();
    
    // Phase 30: Convert monetary fields from cents to decimal
    const convertedResults = convertArrayFromCents(
      result.results || [], 
      MONETARY_FIELDS.INVOICES
    );
    
    return new Response(JSON.stringify(convertedResults), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Invoices GET error:', error);
    
    // Phase 31: Log error
    await logError(error, { 
      endpoint: 'invoices',
      method: 'GET',
      userId
    }, env);
    
    return await createErrorResponse(error, request, env);
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  // Phase 31: Security headers
  const corsHeaders = getSecurityHeaders();
  
  try {
    // Phase 31: Log request
    logRequest(request, { endpoint: 'invoices', method: 'POST' }, env);
    
    // Phase 31: Rate limiting for create operations
    const rateLimitConfig = getRateLimitConfig('POST', '/api/invoices');
    const rateLimitResult = await checkRateLimit(request, rateLimitConfig, null, env);
    
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: true,
        type: 'RATE_LIMIT_ERROR',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
        timestamp: new Date().toISOString()
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          'Retry-After': rateLimitResult.retryAfter.toString()
        }
      });
    }
    
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

    // Phase 30: Parse and validate monetary inputs
    const subtotalResult = parseMonetaryInput(subtotal, 'subtotal', true);
    const ivaResult = parseMonetaryInput(iva, 'iva', true);
    const totalResult = parseMonetaryInput(total, 'total', true);

    if (subtotalResult.error || ivaResult.error || totalResult.error) {
      return new Response(JSON.stringify({ 
        error: 'Invalid monetary values',
        details: {
          subtotal: subtotalResult.error,
          iva: ivaResult.error,
          total: totalResult.error
        },
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
      // Phase 30: Use converted cents values for database insertion
      const result = await env.DB.prepare(
        `INSERT INTO invoices (user_id, uuid, rfc_emisor, rfc_receptor, date, subtotal, iva, total, xml_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        userId, uuid, rfc_emisor, rfc_receptor, date, 
        subtotalResult.value,  // stored as cents
        ivaResult.value,       // stored as cents
        totalResult.value,     // stored as cents
        xml_url || null
      ).run();
      
      // Phase 31: Log audit event
      await logAuditEvent('CREATE', 'invoice', {
        userId,
        invoiceId: result.meta.last_row_id,
        uuid,
        rfc_emisor,
        rfc_receptor,
        total: totalResult.decimal
      }, env);
      
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
    
    // Phase 31: Log error
    await logError(error, { 
      endpoint: 'invoices',
      method: 'POST',
      userId
    }, env);
    
    return await createErrorResponse(error, request, env);
  }
}

export async function onRequestOptions(context) {
  // Phase 31: Use security headers
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
