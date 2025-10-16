// Payables API - Manage accounts payable and vendor payments

import Decimal from 'decimal.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

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
    const vendor = url.searchParams.get('vendor');
    const overdue = url.searchParams.get('overdue');
    const id = url.searchParams.get('id');

    // Get specific payable
    if (id) {
      const payable = await env.DB.prepare(
        'SELECT * FROM payables WHERE id = ?'
      ).bind(id).first();

      if (!payable) {
        return new Response(JSON.stringify({ 
          error: 'Payable not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Get payment history
      const payments = await env.DB.prepare(
        'SELECT * FROM payable_payments WHERE payable_id = ? ORDER BY payment_date DESC'
      ).bind(id).all();

      return new Response(JSON.stringify({
        payable,
        payments: payments.results || []
      }), {
        headers: corsHeaders
      });
    }

    // Build query
    let query = 'SELECT * FROM payables WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (vendor) {
      query += ' AND vendor_name LIKE ?';
      params.push(`%${vendor}%`);
    }

    if (overdue === 'true') {
      const today = new Date().toISOString().split('T')[0];
      query += ' AND due_date < ? AND status NOT IN ("paid", "cancelled")';
      params.push(today);
    }

    query += ' ORDER BY due_date ASC';

    const stmt = params.length > 0 
      ? env.DB.prepare(query).bind(...params)
      : env.DB.prepare(query);

    const result = await stmt.all();

    // Update overdue status
    const today = new Date().toISOString().split('T')[0];
    const payables = (result.results || []).map(p => {
      if (p.due_date < today && p.status !== 'paid' && p.status !== 'cancelled') {
        return { ...p, status: 'overdue' };
      }
      return p;
    });

    return new Response(JSON.stringify(payables), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Payables GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch payables',
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
      vendor_name,
      vendor_rfc,
      bill_number,
      bill_date,
      due_date,
      amount,
      payment_terms,
      category,
      notes
    } = data;

    // Validate required fields
    if (!vendor_name || !bill_date || !due_date || !amount) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        required: ['vendor_name', 'bill_date', 'due_date', 'amount'],
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate amount
    if (amount <= 0) {
      return new Response(JSON.stringify({ 
        error: 'Amount must be positive',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const result = await env.DB.prepare(
      `INSERT INTO payables (
        vendor_name, vendor_rfc, bill_number, bill_date,
        due_date, amount, payment_terms, category, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      vendor_name,
      vendor_rfc || null,
      bill_number || null,
      bill_date,
      due_date,
      amount,
      payment_terms || 30,
      category || null,
      notes || null
    ).run();

    return new Response(JSON.stringify({
      success: true,
      id: result.meta.last_row_id
    }), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Payables POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create payable',
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
    const { id, status, amount_paid, payment_date, payment_method, reference_number, notes } = data;

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Payable ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get current payable
    const payable = await env.DB.prepare(
      'SELECT * FROM payables WHERE id = ?'
    ).bind(id).first();

    if (!payable) {
      return new Response(JSON.stringify({ 
        error: 'Payable not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // If recording a payment
    if (amount_paid !== undefined && amount_paid > 0) {
      // Update payable amount paid using Decimal for precision
      const currentAmountPaid = new Decimal(payable.amount_paid || 0);
      const paymentAmount = new Decimal(amount_paid);
      const newAmountPaid = currentAmountPaid.plus(paymentAmount);
      const payableAmount = new Decimal(payable.amount);
      const newStatus = newAmountPaid.gte(payableAmount) ? 'paid' : 'partial';

      // Use batch() for atomic operation - both statements succeed or fail together
      const insertPayment = env.DB.prepare(
        `INSERT INTO payable_payments (
          payable_id, payment_date, amount, payment_method, reference_number, notes
        ) VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        payment_date || new Date().toISOString().split('T')[0],
        amount_paid,
        payment_method || null,
        reference_number || null,
        notes || null
      );

      const updatePayable = env.DB.prepare(
        'UPDATE payables SET amount_paid = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(parseFloat(newAmountPaid.toFixed(2)), newStatus, id);

      // Execute both operations atomically
      await env.DB.batch([insertPayment, updatePayable]);
    } else if (status !== undefined) {
      // Just update status
      await env.DB.prepare(
        'UPDATE payables SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(status, id).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Payable updated successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Payables PUT error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update payable',
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
        error: 'Payable ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Delete payable
    await env.DB.prepare(
      'DELETE FROM payables WHERE id = ?'
    ).bind(id).run();

    // Delete associated payments
    await env.DB.prepare(
      'DELETE FROM payable_payments WHERE payable_id = ?'
    ).bind(id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Payable deleted successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Payables DELETE error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete payable',
      message: error.message,
      code: 'DELETE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
