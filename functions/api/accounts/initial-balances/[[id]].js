// Account Initial Balances API - Manage historical initial balances
// Phase 33: Data Foundations and Initial Improvements
// Endpoints for managing initial balance snapshots per account

import { getUserIdFromToken } from '../../auth.js';
import { toCents, fromCents } from '../../../utils/monetary.js';
import { getSecurityHeaders } from '../../../utils/security.js';
import { sanitizeString } from '../../../utils/validation.js';
import { logRequest, logError, logAuditEvent } from '../../../utils/logging.js';
import { createErrorResponse, createSuccessResponse } from '../../../utils/errors.js';
import { checkRateLimit, getRateLimitConfig } from '../../../utils/rate-limiter.js';

/**
 * GET /api/accounts/:id/initial-balances
 * Retrieve all initial balances for a specific account
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const corsHeaders = getSecurityHeaders();
  
  try {
    logRequest(request, { endpoint: 'account-initial-balances', method: 'GET' }, env);
    
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

    // Extract account ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const accountId = pathParts[pathParts.indexOf('accounts') + 1];
    
    if (!accountId || isNaN(accountId)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid account ID',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify account belongs to user
    const account = await env.DB.prepare(
      'SELECT id FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1'
    ).bind(accountId, userId).first();
    
    if (!account) {
      return new Response(JSON.stringify({ 
        error: 'Account not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Fetch all initial balances for this account
    const result = await env.DB.prepare(
      'SELECT * FROM account_initial_balances WHERE account_id = ? ORDER BY balance_date DESC'
    ).bind(accountId).all();
    
    // Convert balances from cents to decimal
    const balances = (result.results || []).map(balance => ({
      ...balance,
      initial_balance: fromCents(balance.initial_balance)
    }));
    
    return new Response(JSON.stringify(balances), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Initial Balances GET error:', error);
    await logError(error, { 
      endpoint: 'account-initial-balances',
      method: 'GET',
      userId
    }, env);
    return await createErrorResponse(error, request, env);
  }
}

/**
 * POST /api/accounts/:id/initial-balances
 * Create a new initial balance for an account
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  const corsHeaders = getSecurityHeaders();
  
  try {
    logRequest(request, { endpoint: 'account-initial-balances', method: 'POST' }, env);
    
    // Rate limiting
    const rateLimitConfig = getRateLimitConfig('POST', '/api/accounts/*/initial-balances');
    const rateLimitResult = await checkRateLimit(request, rateLimitConfig, null, env);
    
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: true,
        type: 'RATE_LIMIT_ERROR',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.retryAfter
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
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

    // Extract account ID from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const accountId = pathParts[pathParts.indexOf('accounts') + 1];
    
    if (!accountId || isNaN(accountId)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid account ID',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify account belongs to user
    const account = await env.DB.prepare(
      'SELECT id FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1'
    ).bind(accountId, userId).first();
    
    if (!account) {
      return new Response(JSON.stringify({ 
        error: 'Account not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.balance_date) {
      return new Response(JSON.stringify({ 
        error: 'balance_date is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    if (data.initial_balance === undefined || data.initial_balance === null) {
      return new Response(JSON.stringify({ 
        error: 'initial_balance is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Validate date format (ISO 8601)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.balance_date)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid date format. Use YYYY-MM-DD',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Convert balance to cents
    const balanceInCents = toCents(data.initial_balance);
    const notes = data.notes ? sanitizeString(data.notes) : null;
    
    // Check if initial balance already exists for this date
    const existing = await env.DB.prepare(
      'SELECT id FROM account_initial_balances WHERE account_id = ? AND balance_date = ?'
    ).bind(accountId, data.balance_date).first();
    
    if (existing) {
      return new Response(JSON.stringify({ 
        error: 'Initial balance already exists for this date',
        code: 'DUPLICATE_ERROR'
      }), {
        status: 409,
        headers: corsHeaders
      });
    }
    
    // Insert initial balance
    const result = await env.DB.prepare(
      'INSERT INTO account_initial_balances (account_id, balance_date, initial_balance, notes) VALUES (?, ?, ?, ?)'
    ).bind(accountId, data.balance_date, balanceInCents, notes).run();
    
    // Log audit event
    await logAuditEvent('CREATE', 'account_initial_balance', {
      userId,
      accountId,
      balanceId: result.meta.last_row_id,
      balanceDate: data.balance_date
    }, env);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Initial balance created successfully',
      id: result.meta.last_row_id
    }), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Initial Balances POST error:', error);
    await logError(error, { 
      endpoint: 'account-initial-balances',
      method: 'POST',
      userId
    }, env);
    return await createErrorResponse(error, request, env);
  }
}

/**
 * PUT /api/accounts/:accountId/initial-balances/:id
 * Update an existing initial balance
 */
export async function onRequestPut(context) {
  const { env, request, params } = context;
  const corsHeaders = getSecurityHeaders();
  
  try {
    logRequest(request, { endpoint: 'account-initial-balances', method: 'PUT' }, env);
    
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

    // Extract IDs from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const accountId = pathParts[pathParts.indexOf('accounts') + 1];
    const balanceId = pathParts[pathParts.length - 1];
    
    if (!accountId || isNaN(accountId) || !balanceId || isNaN(balanceId)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid account or balance ID',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify account belongs to user
    const account = await env.DB.prepare(
      'SELECT id FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1'
    ).bind(accountId, userId).first();
    
    if (!account) {
      return new Response(JSON.stringify({ 
        error: 'Account not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Verify initial balance exists for this account
    const existingBalance = await env.DB.prepare(
      'SELECT id FROM account_initial_balances WHERE id = ? AND account_id = ?'
    ).bind(balanceId, accountId).first();
    
    if (!existingBalance) {
      return new Response(JSON.stringify({ 
        error: 'Initial balance not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Parse request body
    const data = await request.json();
    
    // Build update query dynamically
    const updates = [];
    const params_list = [];
    
    if (data.balance_date !== undefined) {
      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(data.balance_date)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid date format. Use YYYY-MM-DD',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      updates.push('balance_date = ?');
      params_list.push(data.balance_date);
    }
    
    if (data.initial_balance !== undefined && data.initial_balance !== null) {
      updates.push('initial_balance = ?');
      params_list.push(toCents(data.initial_balance));
    }
    
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      params_list.push(data.notes ? sanitizeString(data.notes) : null);
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
    params_list.push(balanceId);
    params_list.push(accountId);

    const query = `UPDATE account_initial_balances SET ${updates.join(', ')} WHERE id = ? AND account_id = ?`;
    await env.DB.prepare(query).bind(...params_list).run();
    
    // Log audit event
    await logAuditEvent('UPDATE', 'account_initial_balance', {
      userId,
      accountId,
      balanceId,
      updatedFields: Object.keys(data)
    }, env);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Initial balance updated successfully'
    }), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Initial Balances PUT error:', error);
    await logError(error, { 
      endpoint: 'account-initial-balances',
      method: 'PUT',
      userId
    }, env);
    return await createErrorResponse(error, request, env);
  }
}

/**
 * DELETE /api/accounts/:accountId/initial-balances/:id
 * Delete an initial balance
 */
export async function onRequestDelete(context) {
  const { env, request } = context;
  const corsHeaders = getSecurityHeaders();
  
  try {
    logRequest(request, { endpoint: 'account-initial-balances', method: 'DELETE' }, env);
    
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

    // Extract IDs from URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const accountId = pathParts[pathParts.indexOf('accounts') + 1];
    const balanceId = pathParts[pathParts.length - 1];
    
    if (!accountId || isNaN(accountId) || !balanceId || isNaN(balanceId)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid account or balance ID',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify account belongs to user
    const account = await env.DB.prepare(
      'SELECT id FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1'
    ).bind(accountId, userId).first();
    
    if (!account) {
      return new Response(JSON.stringify({ 
        error: 'Account not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Verify initial balance exists for this account
    const existingBalance = await env.DB.prepare(
      'SELECT id FROM account_initial_balances WHERE id = ? AND account_id = ?'
    ).bind(balanceId, accountId).first();
    
    if (!existingBalance) {
      return new Response(JSON.stringify({ 
        error: 'Initial balance not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Delete initial balance (hard delete as this is reference data)
    await env.DB.prepare(
      'DELETE FROM account_initial_balances WHERE id = ? AND account_id = ?'
    ).bind(balanceId, accountId).run();
    
    // Log audit event
    await logAuditEvent('DELETE', 'account_initial_balance', {
      userId,
      accountId,
      balanceId
    }, env);
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Initial balance deleted successfully'
    }), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Initial Balances DELETE error:', error);
    await logError(error, { 
      endpoint: 'account-initial-balances',
      method: 'DELETE',
      userId
    }, env);
    return await createErrorResponse(error, request, env);
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
