// Debts API - Manage loans and financial obligations
// Phase 30: Monetary values stored as INTEGER cents in database

import Decimal from 'decimal.js';
import { 
  toCents, 
  fromCents, 
  fromCentsToDecimal,
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

// Helper function to calculate monthly payment using loan amortization formula
function calculateMonthlyPayment(principal, annualRate, termMonths) {
  if (annualRate === 0) {
    return principal / termMonths;
  }
  
  const monthlyRate = annualRate / 100 / 12;
  const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                  (Math.pow(1 + monthlyRate, termMonths) - 1);
  return payment;
}

// Calculate next payment date based on frequency
function calculateNextPaymentDate(startDate, frequency, paymentDay = null) {
  const baseDate = new Date(startDate);
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
  }
  
  return nextDate.toISOString().split('T')[0];
}

// Generate amortization schedule
function generateAmortizationSchedule(principal, annualRate, termMonths, startDate, monthlyPayment = null) {
  if (!monthlyPayment) {
    monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  }
  
  const schedule = [];
  let balance = new Decimal(principal);
  const monthlyRate = new Decimal(annualRate).div(100).div(12);
  let paymentDate = new Date(startDate);
  
  for (let i = 1; i <= termMonths && balance.gt(0); i++) {
    const interestPayment = balance.times(monthlyRate);
    const principalPayment = new Decimal(monthlyPayment).minus(interestPayment);
    balance = balance.minus(principalPayment);
    
    if (balance.lt(0)) {
      balance = new Decimal(0);
    }
    
    paymentDate.setMonth(paymentDate.getMonth() + 1);
    
    schedule.push({
      payment_number: i,
      payment_date: paymentDate.toISOString().split('T')[0],
      payment_amount: parseFloat(monthlyPayment.toFixed(2)),
      principal_paid: parseFloat(principalPayment.toFixed(2)),
      interest_paid: parseFloat(interestPayment.toFixed(2)),
      remaining_balance: parseFloat(balance.toFixed(2))
    });
  }
  
  return schedule;
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
    const id = url.searchParams.get('id');
    const status = url.searchParams.get('status');
    const getAmortization = url.searchParams.get('amortization');

    // Get specific debt
    if (id) {
      const debt = await env.DB.prepare(
        'SELECT * FROM debts WHERE id = ?'
      ).bind(id).first();

      if (!debt) {
        return new Response(JSON.stringify({ 
          error: 'Debt not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Phase 30: Convert debt fields from cents to decimal
      const convertedDebt = convertObjectFromCents(debt, MONETARY_FIELDS.DEBTS);

      // Include amortization schedule if requested
      if (getAmortization === 'true') {
        // Convert amounts from cents to decimal for calculation
        const principalDecimal = parseFloat(fromCents(debt.principal_amount));
        const monthlyPaymentDecimal = debt.monthly_payment ? parseFloat(fromCents(debt.monthly_payment)) : null;
        
        const schedule = generateAmortizationSchedule(
          principalDecimal,
          debt.interest_rate,
          debt.loan_term_months,
          debt.start_date,
          monthlyPaymentDecimal
        );
        
        // Get payment history
        const payments = await env.DB.prepare(
          'SELECT * FROM debt_payments WHERE debt_id = ? ORDER BY payment_date ASC'
        ).bind(id).all();
        
        // Phase 30: Convert payment amounts from cents
        const convertedPayments = convertArrayFromCents(payments.results || [], MONETARY_FIELDS.PAYMENTS);
        
        convertedDebt.amortization_schedule = schedule;
        convertedDebt.payment_history = convertedPayments;
      }

      return new Response(JSON.stringify(convertedDebt), {
        headers: corsHeaders
      });
    }

    // Build query for list
    let query = 'SELECT * FROM debts WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY next_payment_date ASC, debt_name ASC';

    const result = await env.DB.prepare(query).bind(...params).all();

    // Phase 30: Convert debt fields from cents to decimal
    const convertedDebts = convertArrayFromCents(result.results || [], MONETARY_FIELDS.DEBTS);

    return new Response(JSON.stringify(convertedDebts), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error fetching debts:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      code: 'FETCH_ERROR'
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
    
    // Validate required fields
    if (!data.debt_name || !data.lender || !data.principal_amount || 
        !data.interest_rate || !data.loan_term_months || !data.start_date) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Phase 30: Parse and validate monetary inputs
    const principalResult = parseMonetaryInput(data.principal_amount, 'principal_amount', true);
    if (principalResult.error) {
      return new Response(JSON.stringify({ 
        error: principalResult.error,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    let monthlyPaymentResult = null;
    if (data.monthly_payment) {
      monthlyPaymentResult = parseMonetaryInput(data.monthly_payment, 'monthly_payment', false);
      if (monthlyPaymentResult.error) {
        return new Response(JSON.stringify({ 
          error: monthlyPaymentResult.error,
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
    }

    let currentBalanceResult = null;
    if (data.current_balance) {
      currentBalanceResult = parseMonetaryInput(data.current_balance, 'current_balance', false);
      if (currentBalanceResult.error) {
        return new Response(JSON.stringify({ 
          error: currentBalanceResult.error,
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
    }

    // Calculate monthly payment if not provided (use decimal for calculation)
    const principalDecimal = parseFloat(fromCents(principalResult.value));
    const monthlyPaymentDecimal = monthlyPaymentResult 
      ? parseFloat(fromCents(monthlyPaymentResult.value))
      : calculateMonthlyPayment(principalDecimal, data.interest_rate, data.loan_term_months);
    const monthlyPaymentCents = toCents(monthlyPaymentDecimal);

    // Calculate next payment date
    const nextPaymentDate = calculateNextPaymentDate(
      data.start_date,
      data.payment_frequency || 'monthly',
      data.payment_day
    );

    // Calculate end date
    const endDate = new Date(data.start_date);
    endDate.setMonth(endDate.getMonth() + data.loan_term_months);

    const metadataStr = data.metadata ? (typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata)) : null;

    const result = await env.DB.prepare(`
      INSERT INTO debts (
        debt_name, lender, principal_amount, current_balance, interest_rate,
        interest_type, loan_term_months, payment_frequency, monthly_payment,
        start_date, end_date, next_payment_date, status, category, description,
        collateral, payment_day, user_id, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      data.debt_name,
      data.lender,
      principalResult.value,  // Phase 30: stored as cents
      currentBalanceResult ? currentBalanceResult.value : principalResult.value,  // Phase 30: stored as cents
      data.interest_rate,
      data.interest_type || 'fixed',
      data.loan_term_months,
      data.payment_frequency || 'monthly',
      monthlyPaymentCents,  // Phase 30: stored as cents
      data.start_date,
      endDate.toISOString().split('T')[0],
      nextPaymentDate,
      data.status || 'active',
      data.category || null,
      data.description || null,
      data.collateral || null,
      data.payment_day || null,
      data.user_id || null,
      metadataStr
    ).run();

    return new Response(JSON.stringify({ 
      id: result.meta.last_row_id,
      message: 'Debt created successfully'
    }), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error creating debt:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
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
    
    if (!data.id) {
      return new Response(JSON.stringify({ 
        error: 'Missing debt ID',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Phase 30: Validate and convert monetary fields before update
    if (data.current_balance !== undefined) {
      const balanceResult = parseMonetaryInput(data.current_balance, 'current_balance', false);
      if (balanceResult.error) {
        return new Response(JSON.stringify({ 
          error: balanceResult.error,
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      data.current_balance = balanceResult.value;  // Replace with cents value
    }

    if (data.monthly_payment !== undefined) {
      const paymentResult = parseMonetaryInput(data.monthly_payment, 'monthly_payment', false);
      if (paymentResult.error) {
        return new Response(JSON.stringify({ 
          error: paymentResult.error,
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      data.monthly_payment = paymentResult.value;  // Replace with cents value
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    
    const allowedFields = [
      'debt_name', 'lender', 'current_balance', 'interest_rate',
      'interest_type', 'payment_frequency', 'monthly_payment',
      'next_payment_date', 'status', 'category', 'description',
      'collateral', 'payment_day'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (data.metadata !== undefined) {
      updates.push('metadata = ?');
      params.push(typeof data.metadata === 'string' ? data.metadata : JSON.stringify(data.metadata));
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
    params.push(data.id);

    const query = `UPDATE debts SET ${updates.join(', ')} WHERE id = ?`;
    const result = await env.DB.prepare(query).bind(...params).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ 
        error: 'Debt not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Debt updated successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error updating debt:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
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
        error: 'Missing debt ID',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const result = await env.DB.prepare(
      'DELETE FROM debts WHERE id = ?'
    ).bind(id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ 
        error: 'Debt not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Debt deleted successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error deleting debt:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      code: 'DELETE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
