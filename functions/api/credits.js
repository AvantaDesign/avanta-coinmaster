// Credits API - Comprehensive credit management system
// Phase 30: Monetary values stored as INTEGER cents in database
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
import { 
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';
  toCents, 
  fromCents, 
  convertArrayFromCents, 
  convertObjectFromCents, 
  parseMonetaryInput,
  MONETARY_FIELDS 
} from '../utils/monetary.js';

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

      // Phase 30: Convert movement amounts from cents to decimal
      const convertedMovements = convertArrayFromCents(result.results, MONETARY_FIELDS.CREDIT_MOVEMENTS);

      // Calculate summary (now using converted decimal values)
      const summary = {
        total_payments: 0,
        total_charges: 0,
        total_interest: 0,
        count: convertedMovements.length
      };

      convertedMovements.forEach(movement => {
        const amount = parseFloat(movement.amount);
        if (movement.type === 'payment') {
          summary.total_payments += amount;
        } else if (movement.type === 'charge') {
          summary.total_charges += amount;
        } else if (movement.type === 'interest') {
          summary.total_interest += amount;
        }
      });

      return new Response(JSON.stringify({
        movements: convertedMovements,  // Phase 30: return converted movements
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

      // Phase 30: Calculate balance in cents, then convert
      let currentBalanceCents = 0;
      movements.results.forEach(row => {
        if (row.type === 'charge' || row.type === 'interest') {
          currentBalanceCents += row.total;
        } else if (row.type === 'payment') {
          currentBalanceCents -= row.total;
        }
      });

      // Convert credit limit and balances from cents to decimal
      const creditLimitDecimal = credit.credit_limit ? parseFloat(fromCents(credit.credit_limit)) : null;
      const currentBalanceDecimal = parseFloat(fromCents(currentBalanceCents));
      const availableCredit = creditLimitDecimal ? creditLimitDecimal - currentBalanceDecimal : null;

      // Phase 30: Convert credit fields from cents to decimal
      const convertedCredit = convertObjectFromCents(credit, MONETARY_FIELDS.CREDITS);

      return new Response(JSON.stringify({
        ...convertedCredit,
        current_balance: currentBalanceDecimal.toFixed(2),
        available_credit: availableCredit !== null ? availableCredit.toFixed(2) : null
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

          // Phase 30: Calculate balance in cents, then convert
          let currentBalanceCents = 0;
          movements.results.forEach(row => {
            if (row.type === 'charge' || row.type === 'interest') {
              currentBalanceCents += row.total;
            } else if (row.type === 'payment') {
              currentBalanceCents -= row.total;
            }
          });

          // Convert credit limit and balances from cents to decimal
          const creditLimitDecimal = credit.credit_limit ? parseFloat(fromCents(credit.credit_limit)) : null;
          const currentBalanceDecimal = parseFloat(fromCents(currentBalanceCents));
          const availableCredit = creditLimitDecimal ? creditLimitDecimal - currentBalanceDecimal : null;

          // Phase 30: Convert credit fields from cents to decimal
          const convertedCredit = convertObjectFromCents(credit, MONETARY_FIELDS.CREDITS);

          return {
            ...convertedCredit,
            current_balance: currentBalanceDecimal.toFixed(2),
            available_credit: availableCredit !== null ? availableCredit.toFixed(2) : null
          };
        })
      );

      return new Response(JSON.stringify(creditsWithBalances), {
        headers: corsHeaders
      });
    }

    // Phase 30: Convert credit fields from cents to decimal
    const convertedCredits = convertArrayFromCents(result.results || [], MONETARY_FIELDS.CREDITS);

    return new Response(JSON.stringify(convertedCredits), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Credits GET error', category: 'api' }, env);
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

      // Phase 30: Parse and validate monetary input
      const amountResult = parseMonetaryInput(amount, 'amount', true);
      if (amountResult.error) {
        errors.push(amountResult.error);
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

      // Insert movement (Phase 30: use cents value)
      await env.DB.prepare(
        `INSERT INTO credit_movements (id, credit_id, transaction_id, description, amount, type, date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        creditId,
        transaction_id || null,
        description.trim(),
        amountResult.value,  // Phase 30: stored as cents
        type,
        date
      ).run();

      // Fetch created movement
      const movement = await env.DB.prepare(
        'SELECT * FROM credit_movements WHERE id = ?'
      ).bind(id).first();

      // Phase 30: Convert amount from cents to decimal
      const convertedMovement = convertObjectFromCents(movement, MONETARY_FIELDS.CREDIT_MOVEMENTS);

      return new Response(JSON.stringify(convertedMovement), {
        status: 201,
        headers: corsHeaders
      });
    }

    // Create new credit
    const data = await request.json();
    const { name, type, credit_limit, interest_rate, statement_day, payment_due_day, metadata } = data;

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

    // Phase 30: Parse and validate credit limit if provided
    let creditLimitCents = null;
    if (credit_limit !== undefined && credit_limit !== null) {
      const limitResult = parseMonetaryInput(credit_limit, 'credit_limit', false);
      if (limitResult.error) {
        errors.push(limitResult.error);
      } else {
        creditLimitCents = limitResult.value;
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

    const metadataStr = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null;

    // Insert credit (Phase 30: use cents value for credit_limit)
    await env.DB.prepare(
      `INSERT INTO credits (id, user_id, name, type, credit_limit, interest_rate, statement_day, payment_due_day, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      userId,
      name.trim(),
      type,
      creditLimitCents,  // Phase 30: stored as cents
      interest_rate ? parseFloat(interest_rate) : null,
      statement_day ? parseInt(statement_day) : null,
      payment_due_day ? parseInt(payment_due_day) : null,
      metadataStr
    ).run();

    // Fetch created credit
    const credit = await env.DB.prepare(
      'SELECT * FROM credits WHERE id = ?'
    ).bind(id).first();

    // Phase 30: Convert credit fields from cents to decimal
    const convertedCredit = convertObjectFromCents(credit, MONETARY_FIELDS.CREDITS);

    return new Response(JSON.stringify(convertedCredit), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Credits POST error', category: 'api' }, env);
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
    const { name, type, credit_limit, interest_rate, statement_day, payment_due_day, is_active, metadata } = data;

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

    // Phase 30: Parse and validate credit limit if provided
    let creditLimitCents = undefined;
    if (credit_limit !== undefined && credit_limit !== null) {
      const limitResult = parseMonetaryInput(credit_limit, 'credit_limit', false);
      if (limitResult.error) {
        errors.push(limitResult.error);
      } else {
        creditLimitCents = limitResult.value;
      }
    } else if (credit_limit === null) {
      creditLimitCents = null;  // Allow explicit null to clear credit limit
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

    if (creditLimitCents !== undefined) {
      updates.push('credit_limit = ?');
      params.push(creditLimitCents);  // Phase 30: stored as cents
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

    if (metadata !== undefined) {
      updates.push('metadata = ?');
      params.push(typeof metadata === 'string' ? metadata : JSON.stringify(metadata));
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

    // Phase 30: Convert credit fields from cents to decimal
    const convertedCredit = convertObjectFromCents(updated, MONETARY_FIELDS.CREDITS);

    return new Response(JSON.stringify(convertedCredit), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Credits PUT error', category: 'api' }, env);
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
    await logError(error, { endpoint: 'Credits DELETE error', category: 'api' }, env);
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
