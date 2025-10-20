// Accounts API - Manage bank accounts and credit cards
// Phase 30: Monetary values stored as INTEGER cents in database
// Phase 31: Backend Hardening and Security - Integrated security utilities

import { getUserIdFromToken } from './auth.js';
import { toCents, fromCents, convertArrayFromCents, convertObjectFromCents, MONETARY_FIELDS } from '../utils/monetary.js';
import { getSecurityHeaders } from '../utils/security.js';
import { sanitizeString, validateAccountData } from '../utils/validation.js';
import { logRequest, logError, logAuditEvent } from '../utils/logging.js';
import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';
import { checkRateLimit, getRateLimitConfig } from '../utils/rate-limiter.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  
  // Phase 31: Security headers
  const corsHeaders = getSecurityHeaders();
  
  try {
    // Phase 31: Log request
    logRequest(request, { endpoint: 'accounts', method: 'GET' }, env);
    
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

    // Build query with optional type filter
    const url = new URL(request.url);
    const accountType = url.searchParams.get('account_type');
    
    let query = 'SELECT * FROM accounts WHERE user_id = ? AND is_active = 1';
    const params = [userId];
    
    // Support filtering by account_type (personal/business)
    if (accountType && ['personal', 'business'].includes(accountType)) {
      query += ' AND account_type = ?';
      params.push(accountType);
    }
    
    query += ' ORDER BY type, name';
    
    const result = await env.DB.prepare(query).bind(...params).all();
    
    // Phase 30: Convert balance from cents to decimal
    const convertedResults = convertArrayFromCents(result.results || [], MONETARY_FIELDS.ACCOUNTS);
    
    return new Response(JSON.stringify(convertedResults), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Accounts GET error:', error);
    
    // Phase 31: Log error
    await logError(error, { 
      endpoint: 'accounts',
      method: 'GET',
      userId
    }, env);
    
    return await createErrorResponse(error, request, env);
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  // Phase 31: Security headers
  const corsHeaders = getSecurityHeaders();
  
  try {
    // Phase 31: Log request
    logRequest(request, { endpoint: 'accounts', method: 'PUT', accountId: id }, env);
    
    // Phase 31: Rate limiting for update operations
    const rateLimitConfig = getRateLimitConfig('PUT', '/api/accounts');
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

    // Check account exists and belongs to user
    const existing = await env.DB.prepare(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();
    
    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Account not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    const { name, type, balance, metadata, opening_date } = data;
    
    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (type !== undefined) {
      if (!['checking', 'savings', 'credit', 'cash'].includes(type)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid account type',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      updates.push('type = ?');
      params.push(type);
    }
    if (balance !== undefined) {
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
      updates.push('balance = ?');
      params.push(toCents(numBalance));  // Phase 30: Convert to cents
    }
    if (metadata !== undefined) {
      updates.push('metadata = ?');
      params.push(typeof metadata === 'string' ? metadata : JSON.stringify(metadata));
    }
    // Phase 33: Support updating opening_date
    if (opening_date !== undefined) {
      if (opening_date !== null) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(opening_date)) {
          return new Response(JSON.stringify({ 
            error: 'Invalid opening_date format. Use YYYY-MM-DD',
            code: 'VALIDATION_ERROR'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }
      }
      updates.push('opening_date = ?');
      params.push(opening_date);
    }
    
    if (updates.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No fields to update',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);
    params.push(userId);

    const query = `UPDATE accounts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    await env.DB.prepare(query).bind(...params).run();
    
    // Phase 31: Log audit event
    await logAuditEvent('UPDATE', 'account', {
      userId,
      accountId: id,
      updatedFields: Object.keys(data).filter(key => data[key] !== undefined)
    }, env);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Account updated successfully'
    }), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Accounts PUT error:', error);
    
    // Phase 31: Log error
    await logError(error, { 
      endpoint: 'accounts',
      method: 'PUT',
      accountId: id,
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
    logRequest(request, { endpoint: 'accounts', method: 'POST' }, env);
    
    // Phase 31: Rate limiting for create operations
    const rateLimitConfig = getRateLimitConfig('POST', '/api/accounts');
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
    const { name, type, balance, metadata, opening_date } = data;
    
    // Phase 31: Sanitize name input
    if (name) {
      data.name = sanitizeString(name);
    }
    
    // Validate required fields
    if (!name || !type) {
      return new Response(JSON.stringify({ 
        error: 'Name and type are required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Validate account type
    if (!['checking', 'savings', 'credit', 'cash'].includes(type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid account type. Must be: checking, savings, credit, or cash',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Phase 33: Validate opening_date format if provided
    if (opening_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(opening_date)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid opening_date format. Use YYYY-MM-DD',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
    }
    
    const numBalance = balance !== undefined ? parseFloat(balance) : 0;
    if (isNaN(numBalance)) {
      return new Response(JSON.stringify({ 
        error: 'Balance must be a valid number',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    const metadataStr = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null;
    
    // Phase 33: Include opening_date in insert
    const result = await env.DB.prepare(
      'INSERT INTO accounts (user_id, name, type, balance, metadata, opening_date, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)'
    ).bind(userId, data.name, type, toCents(numBalance), metadataStr, opening_date || null).run();  // Phase 30: Convert to cents
    
    // Phase 31: Log audit event
    await logAuditEvent('CREATE', 'account', {
      userId,
      accountId: result.meta.last_row_id,
      name: data.name,
      type,
      balance: numBalance
    }, env);
    
    return new Response(JSON.stringify({ 
      success: true,
      id: result.meta.last_row_id,
      message: 'Account created successfully'
    }), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Accounts POST error:', error);
    
    // Phase 31: Log error
    await logError(error, { 
      endpoint: 'accounts',
      method: 'POST',
      userId
    }, env);
    
    return await createErrorResponse(error, request, env);
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  // Phase 31: Security headers
  const corsHeaders = getSecurityHeaders();
  
  try {
    // Phase 31: Log request
    logRequest(request, { endpoint: 'accounts', method: 'DELETE', accountId: id }, env);
    
    // Phase 31: Rate limiting
    const rateLimitConfig = getRateLimitConfig('DELETE', '/api/accounts');
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }
    
    // Check if account exists and belongs to user
    const existingAccount = await env.DB.prepare(
      'SELECT id, name FROM accounts WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();
    
    if (!existingAccount) {
      return new Response(JSON.stringify({ 
        error: 'Account not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    
    // Soft delete: set is_active to 0
    await env.DB.prepare(
      'UPDATE accounts SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();
    
    // Phase 31: Log audit event
    await logAuditEvent('DELETE_SOFT', 'account', {
      userId,
      accountId: id,
      accountName: existingAccount.name
    }, env);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Account deleted successfully'
    }), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Accounts DELETE error:', error);
    
    // Phase 31: Log error
    await logError(error, { 
      endpoint: 'accounts',
      method: 'DELETE',
      accountId: id,
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
