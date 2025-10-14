// Receivables API - Manage accounts receivable and payments

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
    const customer = url.searchParams.get('customer');
    const overdue = url.searchParams.get('overdue');
    const id = url.searchParams.get('id');

    // Get specific receivable
    if (id) {
      const receivable = await env.DB.prepare(
        'SELECT * FROM receivables WHERE id = ?'
      ).bind(id).first();

      if (!receivable) {
        return new Response(JSON.stringify({ 
          error: 'Receivable not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Get payment history
      const payments = await env.DB.prepare(
        'SELECT * FROM receivable_payments WHERE receivable_id = ? ORDER BY payment_date DESC'
      ).bind(id).all();

      return new Response(JSON.stringify({
        receivable,
        payments: payments.results || []
      }), {
        headers: corsHeaders
      });
    }

    // Build query
    let query = 'SELECT * FROM receivables WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (customer) {
      query += ' AND customer_name LIKE ?';
      params.push(`%${customer}%`);
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
    const receivables = (result.results || []).map(r => {
      if (r.due_date < today && r.status !== 'paid' && r.status !== 'cancelled') {
        return { ...r, status: 'overdue' };
      }
      return r;
    });

    return new Response(JSON.stringify(receivables), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Receivables GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch receivables',
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
      invoice_id,
      customer_name,
      customer_rfc,
      invoice_number,
      invoice_date,
      due_date,
      amount,
      payment_terms,
      notes
    } = data;

    // Validate required fields
    if (!customer_name || !invoice_date || !due_date || !amount) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        required: ['customer_name', 'invoice_date', 'due_date', 'amount'],
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
      `INSERT INTO receivables (
        invoice_id, customer_name, customer_rfc, invoice_number,
        invoice_date, due_date, amount, payment_terms, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      invoice_id || null,
      customer_name,
      customer_rfc || null,
      invoice_number || null,
      invoice_date,
      due_date,
      amount,
      payment_terms || 30,
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
    console.error('Receivables POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create receivable',
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
        error: 'Receivable ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get current receivable
    const receivable = await env.DB.prepare(
      'SELECT * FROM receivables WHERE id = ?'
    ).bind(id).first();

    if (!receivable) {
      return new Response(JSON.stringify({ 
        error: 'Receivable not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // If recording a payment
    if (amount_paid !== undefined && amount_paid > 0) {
      // Record payment
      await env.DB.prepare(
        `INSERT INTO receivable_payments (
          receivable_id, payment_date, amount, payment_method, reference_number, notes
        ) VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(
        id,
        payment_date || new Date().toISOString().split('T')[0],
        amount_paid,
        payment_method || null,
        reference_number || null,
        notes || null
      ).run();

      // Update receivable amount paid
      const newAmountPaid = (receivable.amount_paid || 0) + amount_paid;
      const newStatus = newAmountPaid >= receivable.amount ? 'paid' : 'partial';

      await env.DB.prepare(
        'UPDATE receivables SET amount_paid = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(newAmountPaid, newStatus, id).run();
    } else if (status !== undefined) {
      // Just update status
      await env.DB.prepare(
        'UPDATE receivables SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(status, id).run();
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Receivable updated successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Receivables PUT error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update receivable',
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
        error: 'Receivable ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Delete receivable
    await env.DB.prepare(
      'DELETE FROM receivables WHERE id = ?'
    ).bind(id).run();

    // Delete associated payments
    await env.DB.prepare(
      'DELETE FROM receivable_payments WHERE receivable_id = ?'
    ).bind(id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Receivable deleted successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Receivables DELETE error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete receivable',
      message: error.message,
      code: 'DELETE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
