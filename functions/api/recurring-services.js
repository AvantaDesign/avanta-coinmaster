// Recurring Services API - Manage recurring payments for services and subscriptions
// Phase 30: Monetary values stored as INTEGER cents in database

import Decimal from 'decimal.js';
import { 
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
  'Access-Control-Allow-Headers': 'Content-Type',
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

    // Get specific recurring service
    if (id) {
      const service = await env.DB.prepare(
        'SELECT * FROM recurring_services WHERE id = ?'
      ).bind(id).first();

      if (!service) {
        return new Response(JSON.stringify({ 
          error: 'Recurring service not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Phase 30: Convert monetary fields from cents to decimal
      const convertedService = convertObjectFromCents(
        service, 
        MONETARY_FIELDS.RECURRING_SERVICES
      );

      return new Response(JSON.stringify(convertedService), {
        headers: corsHeaders
      });
    }

    // Build query
    let query = 'SELECT * FROM recurring_services WHERE 1=1';
    const params = [];

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

    query += ' ORDER BY next_payment_date ASC, service_name ASC';

    const stmt = params.length > 0 
      ? env.DB.prepare(query).bind(...params)
      : env.DB.prepare(query);

    const result = await stmt.all();

    // Phase 30: Convert monetary fields from cents to decimal
    const convertedResults = convertArrayFromCents(
      result.results || [], 
      MONETARY_FIELDS.RECURRING_SERVICES
    );

    return new Response(JSON.stringify(convertedResults), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Recurring Services GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch recurring services',
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
      service_name,
      provider,
      amount,
      frequency,
      payment_day,
      description,
      category,
      type = 'business' // Default to business for backward compatibility
    } = data;

    // Validate required fields
    if (!service_name || !provider || !amount || !frequency) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        required: ['service_name', 'provider', 'amount', 'frequency'],
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
      `INSERT INTO recurring_services (
        service_name, provider, amount, frequency, payment_day,
        description, category, next_payment_date, status, type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`
    ).bind(
      service_name,
      provider,
      amountResult.value,  // Phase 30: Store as cents
      frequency,
      payment_day || null,
      description || null,
      category || null,
      nextPaymentDate,
      type
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
    console.error('Recurring Services POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create recurring service',
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
        error: 'Recurring service ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get current record
    const service = await env.DB.prepare(
      'SELECT * FROM recurring_services WHERE id = ?'
    ).bind(id).first();

    if (!service) {
      return new Response(JSON.stringify({ 
        error: 'Recurring service not found',
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
      'service_name', 'provider', 'frequency', 
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
      const newFrequency = updateFields.frequency || service.frequency;
      const newPaymentDay = updateFields.payment_day !== undefined ? updateFields.payment_day : service.payment_day;
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

    await env.DB.prepare(
      `UPDATE recurring_services SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Recurring service updated successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Recurring Services PUT error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update recurring service',
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
        error: 'Recurring service ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Delete recurring service
    await env.DB.prepare(
      'DELETE FROM recurring_services WHERE id = ?'
    ).bind(id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Recurring service deleted successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Recurring Services DELETE error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete recurring service',
      message: error.message,
      code: 'DELETE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
