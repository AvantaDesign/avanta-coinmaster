// Tax Calculations API - Comprehensive tax calculation operations
//
// This API handles all tax calculation operations including:
// - Calculate monthly provisional ISR
// - Calculate definitive IVA
// - List tax calculations with filtering
// - Update calculation status
// - Get monthly and annual summaries
//
// Endpoints:
// - GET /api/tax-calculations - List calculations with filters
// - GET /api/tax-calculations/:id - Get single calculation
// - GET /api/tax-calculations/monthly/:year/:month - Get monthly calculation
// - GET /api/tax-calculations/summary/:year - Get annual summary
// - POST /api/tax-calculations - Calculate taxes for a period
// - PUT /api/tax-calculations/:id - Update calculation status
// - DELETE /api/tax-calculations/:id - Delete calculation

import { getUserIdFromToken } from './auth.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * ISR Calculation Engine
 * Calculates provisional monthly ISR based on accumulated income and deductions
 */
async function calculateISR(env, userId, year, month) {
  // Get accumulated income and deductions up to this month
  const startDate = `${year}-01-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
  
  // Fetch all income transactions for the period (accumulated)
  const incomeResult = await env.DB.prepare(`
    SELECT 
      COALESCE(SUM(amount), 0) as total_income,
      COALESCE(SUM(CASE WHEN iva_rate = '16' THEN amount * 0.16 ELSE 0 END), 0) as iva_collected,
      COALESCE(SUM(isr_retention), 0) as isr_retention
    FROM transactions
    WHERE user_id = ?
      AND type = 'ingreso'
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  // Fetch all deductible expenses for the period (accumulated)
  const expenseResult = await env.DB.prepare(`
    SELECT 
      COALESCE(SUM(amount), 0) as total_expenses,
      COALESCE(SUM(CASE WHEN is_isr_deductible = 1 THEN amount ELSE 0 END), 0) as deductible_expenses,
      COALESCE(SUM(CASE WHEN is_iva_deductible = 1 AND iva_rate = '16' THEN amount * 0.16 ELSE 0 END), 0) as iva_paid
    FROM transactions
    WHERE user_id = ?
      AND type = 'gasto'
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  // Get ISR brackets for the year
  const fiscalParams = await env.DB.prepare(`
    SELECT value FROM fiscal_parameters
    WHERE parameter_type = 'isr_bracket'
      AND effective_from <= ?
      AND (effective_to IS NULL OR effective_to >= ?)
      AND is_active = 1
    ORDER BY effective_from DESC
    LIMIT 1
  `).bind(endDate, endDate).first();
  
  let brackets = [];
  if (fiscalParams && fiscalParams.value) {
    try {
      brackets = JSON.parse(fiscalParams.value);
    } catch (e) {
      console.error('Error parsing ISR brackets:', e);
    }
  }
  
  // Calculate accumulated values
  const accumulatedIncome = incomeResult.total_income || 0;
  const accumulatedDeductions = expenseResult.deductible_expenses || 0;
  const taxableIncome = Math.max(0, accumulatedIncome - accumulatedDeductions);
  
  // Apply ISR tariff table to calculate tax
  let isrCalculated = 0;
  if (brackets.length > 0 && taxableIncome > 0) {
    // Find the appropriate bracket
    for (const bracket of brackets) {
      if (taxableIncome > bracket.min && (bracket.max === null || taxableIncome <= bracket.max)) {
        const excess = taxableIncome - bracket.lowerLimit;
        isrCalculated = bracket.fixedFee + (excess * bracket.rate);
        break;
      }
    }
  }
  
  // Get previous ISR payments (from previous months)
  const previousMonthEnd = month > 1 
    ? `${year}-${String(month - 1).padStart(2, '0')}-${new Date(year, month - 1, 0).getDate()}`
    : null;
  
  let previousISRPaid = 0;
  if (previousMonthEnd) {
    const prevCalc = await env.DB.prepare(`
      SELECT COALESCE(SUM(isr_calculated), 0) as prev_isr
      FROM tax_calculations
      WHERE user_id = ?
        AND period_year = ?
        AND period_month < ?
        AND calculation_type = 'monthly_provisional_isr'
    `).bind(userId, year, month).first();
    
    previousISRPaid = prevCalc?.prev_isr || 0;
  }
  
  // Add ISR retentions
  const isrRetention = incomeResult.isr_retention || 0;
  
  // Calculate ISR balance (what needs to be paid this month)
  const isrBalance = Math.max(0, isrCalculated - previousISRPaid - isrRetention);
  
  // Build detailed calculation breakdown
  const calculationDetails = {
    period: `${year}-${String(month).padStart(2, '0')}`,
    accumulatedIncome,
    accumulatedDeductions,
    taxableIncome,
    bracketsApplied: brackets.find(b => 
      taxableIncome > b.min && (b.max === null || taxableIncome <= b.max)
    ),
    isrCalculated,
    previousISRPaid,
    isrRetention,
    isrBalance,
    monthlyIncome: incomeResult.total_income || 0,
    monthlyExpenses: expenseResult.total_expenses || 0
  };
  
  return {
    total_income: accumulatedIncome,
    total_expenses: expenseResult.total_expenses || 0,
    deductible_expenses: accumulatedDeductions,
    accumulated_income: accumulatedIncome,
    accumulated_deductions: accumulatedDeductions,
    taxable_income: taxableIncome,
    isr_calculated: isrCalculated,
    isr_paid: previousISRPaid + isrRetention,
    isr_balance: isrBalance,
    calculation_details: JSON.stringify(calculationDetails)
  };
}

/**
 * IVA Calculation Engine
 * Calculates definitive monthly IVA (collected vs paid)
 */
async function calculateIVA(env, userId, year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
  
  // Fetch IVA collected from income
  const ivaCollectedResult = await env.DB.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN iva_rate = '16' THEN amount * 0.16 ELSE 0 END), 0) as iva_collected,
      COALESCE(SUM(iva_retention), 0) as iva_retention
    FROM transactions
    WHERE user_id = ?
      AND type = 'ingreso'
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  // Fetch IVA paid on deductible expenses
  const ivaPaidResult = await env.DB.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN is_iva_deductible = 1 AND iva_rate = '16' THEN amount * 0.16 ELSE 0 END), 0) as iva_paid
    FROM transactions
    WHERE user_id = ?
      AND type = 'gasto'
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  const ivaCollected = ivaCollectedResult.iva_collected || 0;
  const ivaRetention = ivaCollectedResult.iva_retention || 0;
  const ivaPaid = ivaPaidResult.iva_paid || 0;
  
  // Get previous month's IVA balance (if negative, it's a credit to carry forward)
  let previousIVABalance = 0;
  if (month > 1) {
    const prevCalc = await env.DB.prepare(`
      SELECT iva_balance
      FROM tax_calculations
      WHERE user_id = ?
        AND period_year = ?
        AND period_month = ?
        AND calculation_type = 'definitive_iva'
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(userId, year, month - 1).first();
    
    previousIVABalance = prevCalc?.iva_balance || 0;
  }
  
  // Calculate IVA balance (positive = to pay, negative = in favor)
  const ivaBalance = ivaCollected - ivaPaid - ivaRetention + (previousIVABalance < 0 ? previousIVABalance : 0);
  
  // Build detailed calculation breakdown
  const calculationDetails = {
    period: `${year}-${String(month).padStart(2, '0')}`,
    ivaCollected,
    ivaPaid,
    ivaRetention,
    previousIVABalance: previousIVABalance < 0 ? previousIVABalance : 0,
    ivaBalance,
    netIVAToPay: Math.max(0, ivaBalance)
  };
  
  return {
    iva_collected: ivaCollected,
    iva_paid: ivaPaid,
    iva_balance: ivaBalance,
    previous_iva_balance: previousIVABalance,
    calculation_details: JSON.stringify(calculationDetails)
  };
}

/**
 * GET /api/tax-calculations
 * GET /api/tax-calculations/:id
 * GET /api/tax-calculations/monthly/:year/:month
 * GET /api/tax-calculations/summary/:year
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

    // Parse URL path
    const pathParts = url.pathname.split('/').filter(p => p);
    const apiIndex = pathParts.indexOf('tax-calculations');
    
    // Handle specific routes
    if (pathParts[apiIndex + 1] === 'monthly' && pathParts[apiIndex + 2] && pathParts[apiIndex + 3]) {
      // GET /api/tax-calculations/monthly/:year/:month
      const year = parseInt(pathParts[apiIndex + 2]);
      const month = parseInt(pathParts[apiIndex + 3]);
      
      const calculations = await env.DB.prepare(`
        SELECT * FROM tax_calculations
        WHERE user_id = ?
          AND period_year = ?
          AND period_month = ?
        ORDER BY calculation_type, created_at DESC
      `).bind(userId, year, month).all();
      
      return new Response(JSON.stringify({
        success: true,
        calculations: calculations.results || []
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    
    if (pathParts[apiIndex + 1] === 'summary' && pathParts[apiIndex + 2]) {
      // GET /api/tax-calculations/summary/:year
      const year = parseInt(pathParts[apiIndex + 2]);
      
      const summary = await env.DB.prepare(`
        SELECT * FROM v_annual_tax_summary
        WHERE user_id = ? AND period_year = ?
      `).bind(userId, year).first();
      
      return new Response(JSON.stringify({
        success: true,
        summary: summary || {
          user_id: userId,
          period_year: year,
          annual_income: 0,
          annual_deductions: 0,
          annual_isr: 0,
          annual_isr_paid: 0,
          annual_iva_collected: 0,
          annual_iva_paid: 0,
          months_calculated: 0
        }
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    
    // Check if this is a request for a single calculation by ID
    if (/^\d+$/.test(pathParts[apiIndex + 1])) {
      const id = parseInt(pathParts[apiIndex + 1]);
      
      const calculation = await env.DB.prepare(
        'SELECT * FROM tax_calculations WHERE id = ? AND user_id = ?'
      ).bind(id, userId).first();
      
      if (!calculation) {
        return new Response(JSON.stringify({ 
          error: 'Calculation not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        calculation
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    
    // List calculations with filters
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const offset = parseInt(url.searchParams.get('offset')) || 0;
    const year = url.searchParams.get('year');
    const month = url.searchParams.get('month');
    const calculationType = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    
    let query = 'SELECT * FROM tax_calculations WHERE user_id = ?';
    const params = [userId];
    
    if (year) {
      query += ' AND period_year = ?';
      params.push(parseInt(year));
    }
    
    if (month) {
      query += ' AND period_month = ?';
      params.push(parseInt(month));
    }
    
    if (calculationType) {
      query += ' AND calculation_type = ?';
      params.push(calculationType);
    }
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY period_year DESC, period_month DESC, created_at DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const calculations = await env.DB.prepare(query).bind(...params).all();
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM tax_calculations WHERE user_id = ?';
    const countParams = [userId];
    
    if (year) {
      countQuery += ' AND period_year = ?';
      countParams.push(parseInt(year));
    }
    if (month) {
      countQuery += ' AND period_month = ?';
      countParams.push(parseInt(month));
    }
    if (calculationType) {
      countQuery += ' AND calculation_type = ?';
      countParams.push(calculationType);
    }
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const countResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    
    return new Response(JSON.stringify({
      success: true,
      calculations: calculations.results || [],
      pagination: {
        total: countResult.total,
        limit,
        offset,
        hasMore: offset + limit < countResult.total
      }
    }), {
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Error fetching tax calculations:', error);
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
 * POST /api/tax-calculations
 * Calculate taxes for a specific period
 */
export async function onRequestPost(context) {
  const { env, request } = context;

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

    const data = await request.json();
    const { year, month, calculation_type } = data;
    
    // Validate inputs
    if (!year || !month) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        message: 'Year and month are required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    
    if (yearNum < 2020 || yearNum > 2100 || monthNum < 1 || monthNum > 12) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        message: 'Invalid year or month',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    const validTypes = ['monthly_provisional_isr', 'definitive_iva', 'both'];
    const calcType = calculation_type || 'both';
    
    if (!validTypes.includes(calcType)) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        message: 'Invalid calculation type',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    const results = [];
    
    // Calculate ISR
    if (calcType === 'monthly_provisional_isr' || calcType === 'both') {
      const isrData = await calculateISR(env, userId, yearNum, monthNum);
      
      const isrResult = await env.DB.prepare(`
        INSERT INTO tax_calculations (
          user_id, calculation_type, period_year, period_month,
          total_income, total_expenses, deductible_expenses,
          accumulated_income, accumulated_deductions, taxable_income,
          isr_calculated, isr_paid, isr_balance,
          iva_collected, iva_paid, iva_balance,
          calculation_details, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, 'calculated')
      `).bind(
        userId,
        'monthly_provisional_isr',
        yearNum,
        monthNum,
        isrData.total_income,
        isrData.total_expenses,
        isrData.deductible_expenses,
        isrData.accumulated_income,
        isrData.accumulated_deductions,
        isrData.taxable_income,
        isrData.isr_calculated,
        isrData.isr_paid,
        isrData.isr_balance,
        isrData.calculation_details
      ).run();
      
      results.push({
        type: 'monthly_provisional_isr',
        id: isrResult.meta.last_row_id,
        ...isrData
      });
    }
    
    // Calculate IVA
    if (calcType === 'definitive_iva' || calcType === 'both') {
      const ivaData = await calculateIVA(env, userId, yearNum, monthNum);
      
      const ivaResult = await env.DB.prepare(`
        INSERT INTO tax_calculations (
          user_id, calculation_type, period_year, period_month,
          total_income, total_expenses, deductible_expenses,
          accumulated_income, accumulated_deductions, taxable_income,
          isr_calculated, isr_paid, isr_balance,
          iva_collected, iva_paid, iva_balance, previous_iva_balance,
          calculation_details, status
        ) VALUES (?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?, ?, ?, 'calculated')
      `).bind(
        userId,
        'definitive_iva',
        yearNum,
        monthNum,
        ivaData.iva_collected,
        ivaData.iva_paid,
        ivaData.iva_balance,
        ivaData.previous_iva_balance,
        ivaData.calculation_details
      ).run();
      
      results.push({
        type: 'definitive_iva',
        id: ivaResult.meta.last_row_id,
        ...ivaData
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Tax calculations completed successfully',
      calculations: results
    }), {
      status: 201,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Error calculating taxes:', error);
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
 * PUT /api/tax-calculations/:id
 * Update calculation status
 */
export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);

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

    const pathParts = url.pathname.split('/').filter(p => p);
    const apiIndex = pathParts.indexOf('tax-calculations');
    const id = parseInt(pathParts[apiIndex + 1]);
    
    if (!id) {
      return new Response(JSON.stringify({
        error: 'Invalid request',
        message: 'Calculation ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    const data = await request.json();
    const { status } = data;
    
    const validStatuses = ['calculated', 'paid', 'pending', 'overdue'];
    if (!status || !validStatuses.includes(status)) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        message: 'Valid status is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Verify ownership
    const existing = await env.DB.prepare(
      'SELECT id FROM tax_calculations WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();
    
    if (!existing) {
      return new Response(JSON.stringify({
        error: 'Calculation not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    
    // Update status
    await env.DB.prepare(
      'UPDATE tax_calculations SET status = ? WHERE id = ?'
    ).bind(status, id).run();
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Calculation status updated successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Error updating calculation:', error);
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
 * DELETE /api/tax-calculations/:id
 */
export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);

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

    const pathParts = url.pathname.split('/').filter(p => p);
    const apiIndex = pathParts.indexOf('tax-calculations');
    const id = parseInt(pathParts[apiIndex + 1]);
    
    if (!id) {
      return new Response(JSON.stringify({
        error: 'Invalid request',
        message: 'Calculation ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Delete (with ownership check)
    const result = await env.DB.prepare(
      'DELETE FROM tax_calculations WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();
    
    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({
        error: 'Calculation not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Calculation deleted successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Error deleting calculation:', error);
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
 * OPTIONS handler for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
