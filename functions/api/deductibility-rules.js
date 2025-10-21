// Deductibility Rules API - Manage custom rules for automatic deductibility classification
// 
// This API handles all deductibility rule operations including:
// - List rules with filtering and sorting
// - Create new rules
// - Update existing rules
// - Delete rules
// - Apply rules to transactions
//
// Supported features:
// - Rule priority management
// - Pattern matching on categories, keywords, amounts, and transaction types
// - Automatic rule application
// - CORS support
// - Multi-tenancy with user isolation

import { getUserIdFromToken } from './auth.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/deductibility-rules
 * List all deductibility rules for the authenticated user
 * 
 * Query Parameters:
 *   - is_active: boolean (filter by active status)
 *   - sort_by: 'priority' | 'name' | 'created_at' (default: 'priority')
 *   - sort_order: 'asc' | 'desc' (default: 'desc' for priority)
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

    // Check if this is a request for a single rule by ID
    const pathParts = url.pathname.split('/').filter(p => p);
    const possibleId = pathParts[pathParts.length - 1];
    
    if (/^\d+$/.test(possibleId)) {
      const rule = await env.DB.prepare(
        'SELECT * FROM deductibility_rules WHERE id = ? AND user_id = ?'
      ).bind(possibleId, userId).first();
      
      if (!rule) {
        return new Response(JSON.stringify({ 
          error: 'Rule not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }
      
      return new Response(JSON.stringify(rule), {
        status: 200,
        headers: corsHeaders
      });
    }

    // Parse query parameters
    const isActive = url.searchParams.get('is_active');
    const sortBy = url.searchParams.get('sort_by') || 'priority';
    const sortOrder = url.searchParams.get('sort_order') || 'desc';

    // Build query
    let query = 'SELECT * FROM deductibility_rules WHERE user_id = ?';
    const params = [userId];
    
    if (isActive !== null && isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }
    
    // Add sorting
    const validSortFields = ['priority', 'name', 'created_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'priority';
    query += ` ORDER BY ${sortField} ${sortOrder.toUpperCase()}`;
    
    // Execute query
    const result = await env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({
      data: result.results || [],
      count: result.results?.length || 0
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Deductibility Rules GET Error', category: 'api' }, env);
    
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
 * POST /api/deductibility-rules
 * Create a new deductibility rule
 * 
 * Request body:
 * {
 *   name: string (required),
 *   description: string (optional),
 *   priority: number (optional, default: 0),
 *   is_active: boolean (optional, default: true),
 *   match_category_id: integer (optional),
 *   match_keywords: string[] (optional, JSON array),
 *   match_amount_min: number (optional),
 *   match_amount_max: number (optional),
 *   match_transaction_type: string (optional),
 *   match_expense_type: string (optional),
 *   set_is_iva_deductible: boolean (optional),
 *   set_is_isr_deductible: boolean (optional),
 *   set_expense_type: string (optional),
 *   notes: string (optional)
 * }
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  
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

    // Parse and validate request body
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const { 
      name, description, priority, is_active,
      match_category_id, match_keywords, match_amount_min, match_amount_max,
      match_transaction_type, match_expense_type,
      set_is_iva_deductible, set_is_isr_deductible, set_expense_type,
      notes
    } = data;
    
    // Validate required fields
    const errors = [];
    if (!name || name.trim().length === 0) {
      errors.push('name is required');
    }
    
    // Validate at least one action is specified
    if (set_is_iva_deductible === undefined && 
        set_is_isr_deductible === undefined && 
        set_expense_type === undefined) {
      errors.push('at least one action (set_is_iva_deductible, set_is_isr_deductible, or set_expense_type) must be specified');
    }

    if (errors.length > 0) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Prepare data
    const sanitizedName = name.trim();
    const sanitizedDescription = description?.trim() || null;
    const numPriority = priority !== undefined ? parseInt(priority) : 0;
    const isActiveValue = is_active !== undefined ? (is_active ? 1 : 0) : 1;
    const numCategoryId = match_category_id ? parseInt(match_category_id) : null;
    const sanitizedKeywords = match_keywords ? JSON.stringify(match_keywords) : null;
    const numAmountMin = match_amount_min !== undefined ? parseFloat(match_amount_min) : null;
    const numAmountMax = match_amount_max !== undefined ? parseFloat(match_amount_max) : null;
    const setIvaDeductible = set_is_iva_deductible !== undefined ? (set_is_iva_deductible ? 1 : 0) : null;
    const setIsrDeductible = set_is_isr_deductible !== undefined ? (set_is_isr_deductible ? 1 : 0) : null;
    const sanitizedNotes = notes?.trim() || null;

    // Insert rule
    try {
      const result = await env.DB.prepare(
        `INSERT INTO deductibility_rules (
          user_id, name, description, priority, is_active,
          match_category_id, match_keywords, match_amount_min, match_amount_max,
          match_transaction_type, match_expense_type,
          set_is_iva_deductible, set_is_isr_deductible, set_expense_type,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        userId, sanitizedName, sanitizedDescription, numPriority, isActiveValue,
        numCategoryId, sanitizedKeywords, numAmountMin, numAmountMax,
        match_transaction_type, match_expense_type,
        setIvaDeductible, setIsrDeductible, set_expense_type,
        sanitizedNotes
      ).run();

      // Fetch the created rule
      const createdRule = await env.DB.prepare(
        'SELECT * FROM deductibility_rules WHERE id = ? AND user_id = ?'
      ).bind(result.meta.last_row_id, userId).first();

      return new Response(JSON.stringify({
        success: true,
        data: createdRule,
        message: 'Rule created successfully'
      }), {
        status: 201,
        headers: corsHeaders
      });

    } catch (dbError) {
      await logError(dbError, {
        context: 'Database error creating deductibility rule',
        category: 'database'
      }, env);
      throw dbError;
    }

  } catch (error) {
    await logError(error, { endpoint: 'Deductibility Rules POST Error', category: 'api' }, env);
    
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
 * PUT /api/deductibility-rules/:id
 * Update an existing rule
 */
export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const id = pathParts[pathParts.length - 1];
  
  try {
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    if (!id || !/^\d+$/.test(id)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid rule ID',
        code: 'INVALID_ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if rule exists and belongs to user
    const existingRule = await env.DB.prepare(
      'SELECT * FROM deductibility_rules WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existingRule) {
      return new Response(JSON.stringify({ 
        error: 'Rule not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Parse request body
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const { 
      name, description, priority, is_active,
      match_category_id, match_keywords, match_amount_min, match_amount_max,
      match_transaction_type, match_expense_type,
      set_is_iva_deductible, set_is_isr_deductible, set_expense_type,
      notes
    } = data;

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description?.trim() || null);
    }
    if (priority !== undefined) {
      updates.push('priority = ?');
      params.push(parseInt(priority));
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }
    if (match_category_id !== undefined) {
      updates.push('match_category_id = ?');
      params.push(match_category_id ? parseInt(match_category_id) : null);
    }
    if (match_keywords !== undefined) {
      updates.push('match_keywords = ?');
      params.push(match_keywords ? JSON.stringify(match_keywords) : null);
    }
    if (match_amount_min !== undefined) {
      updates.push('match_amount_min = ?');
      params.push(match_amount_min !== null ? parseFloat(match_amount_min) : null);
    }
    if (match_amount_max !== undefined) {
      updates.push('match_amount_max = ?');
      params.push(match_amount_max !== null ? parseFloat(match_amount_max) : null);
    }
    if (match_transaction_type !== undefined) {
      updates.push('match_transaction_type = ?');
      params.push(match_transaction_type);
    }
    if (match_expense_type !== undefined) {
      updates.push('match_expense_type = ?');
      params.push(match_expense_type);
    }
    if (set_is_iva_deductible !== undefined) {
      updates.push('set_is_iva_deductible = ?');
      params.push(set_is_iva_deductible !== null ? (set_is_iva_deductible ? 1 : 0) : null);
    }
    if (set_is_isr_deductible !== undefined) {
      updates.push('set_is_isr_deductible = ?');
      params.push(set_is_isr_deductible !== null ? (set_is_isr_deductible ? 1 : 0) : null);
    }
    if (set_expense_type !== undefined) {
      updates.push('set_expense_type = ?');
      params.push(set_expense_type);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes?.trim() || null);
    }

    // Always update updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length === 1) { // Only updated_at
      return new Response(JSON.stringify({ 
        error: 'No fields to update',
        code: 'NO_UPDATE_FIELDS'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    params.push(id, userId);

    // Execute update
    const updateQuery = `UPDATE deductibility_rules SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    await env.DB.prepare(updateQuery).bind(...params).run();

    // Fetch updated rule
    const updatedRule = await env.DB.prepare(
      'SELECT * FROM deductibility_rules WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    return new Response(JSON.stringify({
      success: true,
      data: updatedRule,
      message: 'Rule updated successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Deductibility Rules PUT Error', category: 'api' }, env);
    
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
 * PATCH /api/deductibility-rules/:id
 * Partially update a rule (same as PUT)
 */
export async function onRequestPatch(context) {
  return onRequestPut(context);
}

/**
 * DELETE /api/deductibility-rules/:id
 * Delete a rule
 */
export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const id = pathParts[pathParts.length - 1];
  
  try {
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    if (!id || !/^\d+$/.test(id)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid rule ID',
        code: 'INVALID_ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if rule exists and belongs to user
    const existingRule = await env.DB.prepare(
      'SELECT * FROM deductibility_rules WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existingRule) {
      return new Response(JSON.stringify({ 
        error: 'Rule not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Delete rule
    await env.DB.prepare(
      'DELETE FROM deductibility_rules WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Rule deleted successfully',
      deleted: existingRule
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Deductibility Rules DELETE Error', category: 'api' }, env);
    
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
 * OPTIONS /api/deductibility-rules
 * Handle CORS preflight requests
 */
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
