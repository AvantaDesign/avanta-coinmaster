// Recurring Freelancers API - Manage recurring payments to freelancers
// Phase 30: Monetary values stored as INTEGER cents in database
// Phase 41: Authentication hardening - Added getUserIdFromToken for all endpoints

import Decimal from 'decimal.js';
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

// Helper function to calculate next payment date based on frequency
function calculateNextPaymentDate(frequency, paymentDay, fromDate = null) {
  const baseDate = fromDate ? new Date(fromDate) : new Date();
  let nextDate = new Date(baseDate);
  
  switch (frequency) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      if (paymentDay) {
        nextDate.setDate(Math.min(paymentDay, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
      }
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      if (paymentDay) {
        nextDate.setDate(Math.min(paymentDay, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
      }
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      if (paymentDay) {
        nextDate.setDate(Math.min(paymentDay, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()));
      }
      break;
  }
  
  return nextDate.toISOString().split('T')[0];
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // Phase 41: Authentication check
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
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const id = url.searchParams.get('id');

    // Get specific recurring freelancer
    if (id) {
      const freelancer = await env.DB.prepare(
        'SELECT * FROM recurring_freelancers WHERE id = ? AND user_id = ?'
      ).bind(id, userId).first();

      if (!freelancer) {
        return new Response(JSON.stringify({ 
          error: 'Recurring freelancer not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Phase 30: Convert monetary fields from cents to decimal
      const convertedFreelancer = convertObjectFromCents(
        freelancer, 
        MONETARY_FIELDS.RECURRING_FREELANCERS
      );

      return new Response(JSON.stringify(convertedFreelancer), {
        headers: corsHeaders
      });
    }

    // Build query - Phase 41: Filter by user_id
    let query = 'SELECT * FROM recurring_freelancers WHERE user_id = ?';
    const params = [userId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    // Support filtering by type (personal/business)
    const type = url.searchParams.get('type');
    if (type && ['personal', 'business'].includes(type)) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY next_payment_date ASC, freelancer_name ASC';

    const stmt = env.DB.prepare(query).bind(...params);

    const result = await stmt.all();

    // Phase 30: Convert monetary fields from cents to decimal
    const convertedResults = convertArrayFromCents(
      result.results || [], 
      MONETARY_FIELDS.RECURRING_FREELANCERS
    );

    return new Response(JSON.stringify(convertedResults), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Recurring Freelancers GET error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch recurring freelancers',
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
    // Phase 41: Authentication check
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
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    const {
      freelancer_name,
      freelancer_rfc,
      amount,
      frequency,
      payment_day,
      description,
      category,
      type = 'business' // Default to business for backward compatibility
    } = data;

    // Validate required fields
    if (!freelancer_name || !amount || !frequency) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        required: ['freelancer_name', 'amount', 'frequency'],
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Phase 30: Parse and validate monetary input
    const amountResult = parseMonetaryInput(amount, 'amount', true);
    if (amountResult.error) {
      return new Response(JSON.stringify({ 
        error: amountResult.error,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Additional validation: amount must be positive
    if (amountResult.value <= 0) {
      return new Response(JSON.stringify({ 
        error: 'Amount must be positive',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate frequency
    const validFrequencies = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
    if (!validFrequencies.includes(frequency)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid frequency',
        valid: validFrequencies,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Calculate next payment date
    const nextPaymentDate = calculateNextPaymentDate(frequency, payment_day);

    const result = await env.DB.prepare(
      `INSERT INTO recurring_freelancers (
        freelancer_name, freelancer_rfc, amount, frequency, payment_day,
        description, category, next_payment_date, status, type, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
    ).bind(
      freelancer_name,
      freelancer_rfc || null,
      amountResult.value,  // Phase 30: Store as cents
      frequency,
      payment_day || null,
      description || null,
      category || null,
      nextPaymentDate,
      type,
      userId  // Phase 41: Use authenticated user_id
    ).run();

    return new Response(JSON.stringify({
      success: true,
      id: result.meta.last_row_id,
      next_payment_date: nextPaymentDate
    }), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Recurring Freelancers POST error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to create recurring freelancer',
      message: error.message,
      code: 'CREATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  
  try {
    // Phase 41: Authentication check
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
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    const { id, ...updateFields } = data;

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Recurring freelancer ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get current record - Phase 41: Verify ownership
    const freelancer = await env.DB.prepare(
      'SELECT * FROM recurring_freelancers WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!freelancer) {
      return new Response(JSON.stringify({ 
        error: 'Recurring freelancer not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    // List of allowed update fields (non-monetary)
    const allowedFields = [
      'freelancer_name', 'freelancer_rfc', 'frequency', 
      'payment_day', 'description', 'category', 'status', 'type'
    ];

    for (const field of allowedFields) {
      if (updateFields[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(updateFields[field]);
      }
    }

    // Phase 30: Handle monetary field with validation
    if (updateFields.amount !== undefined) {
      const amountResult = parseMonetaryInput(updateFields.amount, 'amount', false);
      if (amountResult.error) {
        return new Response(JSON.stringify({ 
          error: amountResult.error,
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      updates.push('amount = ?');
      values.push(amountResult.value);
    }

    // Recalculate next payment date if frequency or payment_day changed
    if (updateFields.frequency || updateFields.payment_day !== undefined) {
      const newFrequency = updateFields.frequency || freelancer.frequency;
      const newPaymentDay = updateFields.payment_day !== undefined ? updateFields.payment_day : freelancer.payment_day;
      const nextPaymentDate = calculateNextPaymentDate(newFrequency, newPaymentDay);
      updates.push('next_payment_date = ?');
      values.push(nextPaymentDate);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No valid fields to update',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    values.push(userId);  // Phase 41: Add user_id for ownership check

    await env.DB.prepare(
      `UPDATE recurring_freelancers SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`
    ).bind(...values).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Recurring freelancer updated successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Recurring Freelancers PUT error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to update recurring freelancer',
      message: error.message,
      code: 'UPDATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  
  try {
    // Phase 41: Authentication check
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
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Recurring freelancer ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Delete recurring freelancer - Phase 41: Delete with user_id check for ownership
    await env.DB.prepare(
      'DELETE FROM recurring_freelancers WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Recurring freelancer deleted successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Recurring Freelancers DELETE error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete recurring freelancer',
      message: error.message,
      code: 'DELETE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
