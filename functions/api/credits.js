// Credits API - Comprehensive credit management system
// 
// This API handles all credit operations including:
// - Credit CRUD operations (Create, Read, Update, Delete)
// - Credit movements management (charges, payments, interest)
// - Balance calculations
// - Payment due date tracking
// - Integration with transactions
//
// Supported credit types:
// - credit_card: Credit cards with revolving credit
// - loan: Personal or business loans
// - mortgage: Home mortgages
//
// Movement types:
// - payment: Reduces credit balance
// - charge: Increases credit balance
// - interest: Interest charges on balance

import { getUserIdFromToken } from './auth.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/credits
 * GET /api/credits/:id
 * GET /api/credits/:id/movements
 * 
 * List all credits or get specific credit with optional movements
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

    // Parse URL path to determine request type
    const pathParts = url.pathname.split('/').filter(p => p);
    const creditId = pathParts[2]; // /api/credits/:id
    const action = pathParts[3]; // movements, balance, etc.

    // Get movements for a specific credit
    if (creditId && action === 'movements') {
      // Verify credit belongs to user
      const credit = await env.DB.prepare(
        'SELECT * FROM credits WHERE id = ? AND user_id = ?'
      ).bind(creditId, userId).first();

      if (!credit) {
        return new Response(JSON.stringify({ 
          error: 'Credit not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Get query parameters for filtering
      const dateFrom = url.searchParams.get('date_from');
      const dateTo = url.searchParams.get('date_to');
      const type = url.searchParams.get('type');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '100'), 1000);
      const offset = parseInt(url.searchParams.get('offset') || '0');

      // Build query
      let query = 'SELECT * FROM credit_movements WHERE credit_id = ?';
      const params = [creditId];

      if (dateFrom) {
        query += ' AND date >= ?';
        params.push(dateFrom);
      }

      if (dateTo) {
        query += ' AND date <= ?';
        params.push(dateTo);
      }

      if (type && ['payment', 'charge', 'interest'].includes(type)) {
        query += ' AND type = ?';
        params.push(type);
      }

      query += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const result = await env.DB.prepare(query).bind(...params).all();

      // Calculate summary
      const summary = {
        total_payments: 0,
        total_charges: 0,
        total_interest: 0,
        count: result.results.length
      };

      result.results.forEach(movement => {
        if (movement.type === 'payment') {
          summary.total_payments += movement.amount;
        } else if (movement.type === 'charge') {
          summary.total_charges += movement.amount;
        } else if (movement.type === 'interest') {
          summary.total_interest += movement.amount;
        }
      });

      return new Response(JSON.stringify({
        movements: result.results,
        summary
      }), {
        headers: corsHeaders
      });
    }

    // Get single credit with current balance
    if (creditId) {
      const credit = await env.DB.prepare(
        'SELECT * FROM credits WHERE id = ? AND user_id = ?'
      ).bind(creditId, userId).first();

      if (!credit) {
        return new Response(JSON.stringify({ 
          error: 'Credit not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Calculate current balance from movements
      const movements = await env.DB.prepare(
        'SELECT type, SUM(amount) as total FROM credit_movements WHERE credit_id = ? GROUP BY type'
      ).bind(creditId).all();

      let currentBalance = 0;
      movements.results.forEach(row => {
        if (row.type === 'charge' || row.type === 'interest') {
          currentBalance += row.total;
        } else if (row.type === 'payment') {
          currentBalance -= row.total;
        }
      });

      // Calculate available credit
      const availableCredit = credit.credit_limit ? credit.credit_limit - currentBalance : null;

      return new Response(JSON.stringify({
        ...credit,
        current_balance: currentBalance,
        available_credit: availableCredit
      }), {
        headers: corsHeaders
      });
    }

    // List all credits for user
    const includeBalance = url.searchParams.get('include_balance') === 'true';
    const activeOnly = url.searchParams.get('active_only') !== 'false'; // Default true

    let query = 'SELECT * FROM credits WHERE user_id = ?';
    if (activeOnly) {
      query += ' AND is_active = 1';
    }
    query += ' ORDER BY type, name';

    const result = await env.DB.prepare(query).bind(userId).all();

    // If balance calculation is requested, fetch for each credit
    if (includeBalance && result.results.length > 0) {
      const creditsWithBalances = await Promise.all(
        result.results.map(async (credit) => {
          const movements = await env.DB.prepare(
            'SELECT type, SUM(amount) as total FROM credit_movements WHERE credit_id = ? GROUP BY type'
          ).bind(credit.id).all();

          let currentBalance = 0;
          movements.results.forEach(row => {
            if (row.type === 'charge' || row.type === 'interest') {
              currentBalance += row.total;
            } else if (row.type === 'payment') {
              currentBalance -= row.total;
            }
          });

          const availableCredit = credit.credit_limit ? credit.credit_limit - currentBalance : null;

          return {
            ...credit,
            current_balance: currentBalance,
            available_credit: availableCredit
          };
        })
      );

      return new Response(JSON.stringify(creditsWithBalances), {
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify(result.results || []), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Credits GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch credits',
      message: error.message,
      code: 'QUERY_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/credits
 * POST /api/credits/:id/movements
 * 
 * Create new credit or add movement to existing credit
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

    const pathParts = url.pathname.split('/').filter(p => p);
    const creditId = pathParts[2];
    const action = pathParts[3];

    // Add movement to credit
    if (creditId && action === 'movements') {
      // Verify credit belongs to user
      const credit = await env.DB.prepare(
        'SELECT * FROM credits WHERE id = ? AND user_id = ?'
      ).bind(creditId, userId).first();

      if (!credit) {
        return new Response(JSON.stringify({ 
          error: 'Credit not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      const data = await request.json();
      const { description, amount, type, date, transaction_id } = data;

      // Validation
      const errors = [];

      if (!description || description.trim().length === 0) {
        errors.push('description is required');
      } else if (description.length > 500) {
        errors.push('description must be 500 characters or less');
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        errors.push('amount must be a positive number');
      }

      if (!type || !['payment', 'charge', 'interest'].includes(type)) {
        errors.push('type must be payment, charge, or interest');
      }

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        errors.push('date must be in YYYY-MM-DD format');
      }

      if (transaction_id && (isNaN(parseInt(transaction_id)) || parseInt(transaction_id) < 0)) {
        errors.push('transaction_id must be a valid transaction ID');
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

      // Generate ID
      const id = `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Insert movement
      await env.DB.prepare(
        `INSERT INTO credit_movements (id, credit_id, transaction_id, description, amount, type, date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        creditId,
        transaction_id || null,
        description.trim(),
        parseFloat(amount),
        type,
        date
      ).run();

      // Fetch created movement
      const movement = await env.DB.prepare(
        'SELECT * FROM credit_movements WHERE id = ?'
      ).bind(id).first();

      return new Response(JSON.stringify(movement), {
        status: 201,
        headers: corsHeaders
      });
    }

    // Create new credit
    const data = await request.json();
    const { name, type, credit_limit, interest_rate, statement_day, payment_due_day } = data;

    // Validation
    const errors = [];

    if (!name || name.trim().length === 0) {
      errors.push('name is required');
    } else if (name.length > 100) {
      errors.push('name must be 100 characters or less');
    }

    if (!type || !['credit_card', 'loan', 'mortgage'].includes(type)) {
      errors.push('type must be credit_card, loan, or mortgage');
    }

    if (credit_limit !== undefined && credit_limit !== null) {
      const numLimit = parseFloat(credit_limit);
      if (isNaN(numLimit) || numLimit <= 0) {
        errors.push('credit_limit must be a positive number');
      }
    }

    if (interest_rate !== undefined && interest_rate !== null) {
      const numRate = parseFloat(interest_rate);
      if (isNaN(numRate) || numRate < 0 || numRate > 1) {
        errors.push('interest_rate must be between 0 and 1 (e.g., 0.24 for 24%)');
      }
    }

    if (statement_day !== undefined && statement_day !== null) {
      const numDay = parseInt(statement_day);
      if (isNaN(numDay) || numDay < 1 || numDay > 31) {
        errors.push('statement_day must be between 1 and 31');
      }
    }

    if (payment_due_day !== undefined && payment_due_day !== null) {
      const numDay = parseInt(payment_due_day);
      if (isNaN(numDay) || numDay < 1 || numDay > 31) {
        errors.push('payment_due_day must be between 1 and 31');
      }
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

    // Generate ID
    const id = `crd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert credit
    await env.DB.prepare(
      `INSERT INTO credits (id, user_id, name, type, credit_limit, interest_rate, statement_day, payment_due_day)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      userId,
      name.trim(),
      type,
      credit_limit ? parseFloat(credit_limit) : null,
      interest_rate ? parseFloat(interest_rate) : null,
      statement_day ? parseInt(statement_day) : null,
      payment_due_day ? parseInt(payment_due_day) : null
    ).run();

    // Fetch created credit
    const credit = await env.DB.prepare(
      'SELECT * FROM credits WHERE id = ?'
    ).bind(id).first();

    return new Response(JSON.stringify(credit), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Credits POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create credit or movement',
      message: error.message,
      code: 'CREATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * PUT /api/credits/:id
 * 
 * Update existing credit
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

    const pathParts = url.pathname.split('/').filter(p => p);
    const creditId = pathParts[2];

    if (!creditId) {
      return new Response(JSON.stringify({ 
        error: 'Credit ID is required',
        code: 'MISSING_ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify credit exists and belongs to user
    const existing = await env.DB.prepare(
      'SELECT * FROM credits WHERE id = ? AND user_id = ?'
    ).bind(creditId, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Credit not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    const { name, type, credit_limit, interest_rate, statement_day, payment_due_day, is_active } = data;

    // Validation
    const errors = [];

    if (name !== undefined) {
      if (name.trim().length === 0) {
        errors.push('name cannot be empty');
      } else if (name.length > 100) {
        errors.push('name must be 100 characters or less');
      }
    }

    if (type !== undefined && !['credit_card', 'loan', 'mortgage'].includes(type)) {
      errors.push('type must be credit_card, loan, or mortgage');
    }

    if (credit_limit !== undefined && credit_limit !== null) {
      const numLimit = parseFloat(credit_limit);
      if (isNaN(numLimit) || numLimit <= 0) {
        errors.push('credit_limit must be a positive number');
      }
    }

    if (interest_rate !== undefined && interest_rate !== null) {
      const numRate = parseFloat(interest_rate);
      if (isNaN(numRate) || numRate < 0 || numRate > 1) {
        errors.push('interest_rate must be between 0 and 1');
      }
    }

    if (statement_day !== undefined && statement_day !== null) {
      const numDay = parseInt(statement_day);
      if (isNaN(numDay) || numDay < 1 || numDay > 31) {
        errors.push('statement_day must be between 1 and 31');
      }
    }

    if (payment_due_day !== undefined && payment_due_day !== null) {
      const numDay = parseInt(payment_due_day);
      if (isNaN(numDay) || numDay < 1 || numDay > 31) {
        errors.push('payment_due_day must be between 1 and 31');
      }
    }

    if (is_active !== undefined && ![0, 1, true, false].includes(is_active)) {
      errors.push('is_active must be boolean or 0/1');
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

    // Build update query
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }

    if (type !== undefined) {
      updates.push('type = ?');
      params.push(type);
    }

    if (credit_limit !== undefined) {
      updates.push('credit_limit = ?');
      params.push(credit_limit ? parseFloat(credit_limit) : null);
    }

    if (interest_rate !== undefined) {
      updates.push('interest_rate = ?');
      params.push(interest_rate ? parseFloat(interest_rate) : null);
    }

    if (statement_day !== undefined) {
      updates.push('statement_day = ?');
      params.push(statement_day ? parseInt(statement_day) : null);
    }

    if (payment_due_day !== undefined) {
      updates.push('payment_due_day = ?');
      params.push(payment_due_day ? parseInt(payment_due_day) : null);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    // Always update updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length === 1) { // Only updated_at
      return new Response(JSON.stringify({ 
        error: 'No fields to update',
        code: 'NO_UPDATES'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Execute update
    params.push(creditId, userId);
    await env.DB.prepare(
      `UPDATE credits SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    ).bind(...params).run();

    // Fetch updated credit
    const updated = await env.DB.prepare(
      'SELECT * FROM credits WHERE id = ?'
    ).bind(creditId).first();

    return new Response(JSON.stringify(updated), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Credits PUT error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update credit',
      message: error.message,
      code: 'UPDATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * DELETE /api/credits/:id
 * 
 * Soft delete credit (set is_active to 0)
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

    const pathParts = url.pathname.split('/').filter(p => p);
    const creditId = pathParts[2];

    if (!creditId) {
      return new Response(JSON.stringify({ 
        error: 'Credit ID is required',
        code: 'MISSING_ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify credit exists and belongs to user
    const existing = await env.DB.prepare(
      'SELECT * FROM credits WHERE id = ? AND user_id = ?'
    ).bind(creditId, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Credit not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Soft delete
    await env.DB.prepare(
      'UPDATE credits SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    ).bind(creditId, userId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Credit deleted successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Credits DELETE error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete credit',
      message: error.message,
      code: 'DELETE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export default async function handleRequest(request, env, ctx) {
  const method = request.method;
  
  switch (method) {
    case 'GET':
      return onRequestGet({ env, request, ctx });
    case 'POST':
      return onRequestPost({ env, request, ctx });
    case 'PUT':
      return onRequestPut({ env, request, ctx });
    case 'DELETE':
      return onRequestDelete({ env, request, ctx });
    default:
      return new Response(JSON.stringify({ 
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED'
      }), {
        status: 405,
        headers: corsHeaders
      });
  }
}
