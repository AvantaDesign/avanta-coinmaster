// Annual Declarations API - Comprehensive annual tax declaration operations
// Phase 30: Monetary values stored as INTEGER cents in database
//
// This API handles all annual declaration operations including:
// - Generate annual ISR declaration with personal deductions
// - Calculate annual IVA balance
// - List annual declarations with filtering
// - Submit annual declarations
// - Track declaration status
//
// Endpoints:
// - GET /api/annual-declarations - List declarations with filters
// - GET /api/annual-declarations/:id - Get single declaration
// - GET /api/annual-declarations/summary/:year - Get annual summary
// - POST /api/annual-declarations - Generate annual declaration
// - POST /api/annual-declarations/submit/:id - Submit declaration
// - PUT /api/annual-declarations/:id - Update declaration status
// - DELETE /api/annual-declarations/:id - Delete declaration

import { getUserIdFromToken } from './auth.js';
import { 
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';
  fromCents, 
  fromCentsToDecimal,
  toCents
} from '../utils/monetary.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * OPTIONS handler for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Annual ISR Calculation Engine
 * Calculates annual ISR with personal deductions
 */
async function calculateAnnualISR(env, userId, year) {
  // Get annual income and expenses
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  // Fetch all income for the year
  const incomeResult = await env.DB.prepare(`
    SELECT 
      COALESCE(SUM(amount), 0) as total_income,
      COALESCE(SUM(isr_retention), 0) as isr_retention
    FROM transactions
    WHERE user_id = ?
      AND type = 'ingreso'
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  // Fetch all deductible expenses for the year
  const expenseResult = await env.DB.prepare(`
    SELECT 
      COALESCE(SUM(amount), 0) as total_expenses,
      COALESCE(SUM(CASE WHEN is_isr_deductible = 1 THEN amount ELSE 0 END), 0) as deductible_expenses
    FROM transactions
    WHERE user_id = ?
      AND type = 'gasto'
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  // Get annual ISR brackets
  const fiscalParams = await env.DB.prepare(`
    SELECT value FROM fiscal_parameters
    WHERE parameter_type = 'isr_bracket_annual'
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
      logError(e, {
        context: 'Error parsing annual ISR brackets',
        category: 'business',
        fiscalParamsId: fiscalParams?.id
      }, env);
      // Use default brackets if parsing fails
      brackets = getDefaultAnnualBrackets();
    }
  } else {
    brackets = getDefaultAnnualBrackets();
  }
  
  // Phase 30: Convert values from cents to decimal for calculations
  const totalIncome = parseFloat(fromCents(incomeResult.total_income || 0));
  const deductibleExpenses = parseFloat(fromCents(expenseResult.deductible_expenses || 0));
  const taxableIncome = Math.max(0, totalIncome - deductibleExpenses);
  
  // Apply annual ISR tariff table
  let isrCalculated = 0;
  if (brackets.length > 0 && taxableIncome > 0) {
    for (const bracket of brackets) {
      if (taxableIncome > bracket.lowerLimit && (bracket.upperLimit === null || taxableIncome <= bracket.upperLimit)) {
        const excess = taxableIncome - bracket.lowerLimit;
        isrCalculated = bracket.fixedFee + (excess * bracket.rate);
        break;
      }
    }
  }
  
  // Get ISR already paid (from monthly payments)
  const isrPaidResult = await env.DB.prepare(`
    SELECT COALESCE(SUM(isr_paid), 0) as isr_paid
    FROM tax_calculations
    WHERE user_id = ?
      AND period_year = ?
      AND calculation_type = 'monthly_provisional_isr'
      AND status IN ('calculated', 'paid')
  `).bind(userId, year).first();
  
  // Phase 30: Convert monetary values from cents to decimal
  const isrPaid = parseFloat(fromCents(isrPaidResult.isr_paid || 0));
  const isrRetention = parseFloat(fromCents(incomeResult.isr_retention || 0));
  const isrBalance = isrCalculated - isrPaid - isrRetention;
  
  return {
    totalIncome,
    totalExpenses: parseFloat(fromCents(expenseResult.total_expenses || 0)),
    deductibleExpenses,
    taxableIncome,
    isrCalculated,
    isrPaid,
    isrRetention,
    isrBalance,
    brackets: brackets.map(b => ({
      lowerLimit: b.lowerLimit,
      upperLimit: b.upperLimit,
      fixedFee: b.fixedFee,
      rate: b.rate
    }))
  };
}

/**
 * Annual IVA Calculation Engine
 * Calculates annual IVA balance
 */
async function calculateAnnualIVA(env, userId, year) {
  // Get annual IVA totals
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  // Phase 30: IVA calculation on amounts stored as cents
  // Fetch IVA collected from income
  const ivaCollectedResult = await env.DB.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN iva_rate = '16' THEN amount * 0.16 ELSE 0 END), 0) as iva_collected
    FROM transactions
    WHERE user_id = ?
      AND type = 'ingreso'
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  // Fetch IVA paid on expenses
  const ivaPaidResult = await env.DB.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN is_iva_deductible = 1 AND iva_rate = '16' THEN amount * 0.16 ELSE 0 END), 0) as iva_paid
    FROM transactions
    WHERE user_id = ?
      AND type = 'gasto'
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  // Phase 30: Convert IVA amounts from cents to decimal
  const ivaCollected = parseFloat(fromCents(ivaCollectedResult.iva_collected || 0));
  const ivaPaid = parseFloat(fromCents(ivaPaidResult.iva_paid || 0));
  const ivaBalance = ivaCollected - ivaPaid;
  
  return {
    ivaCollected,
    ivaPaid,
    ivaBalance,
    ivaAccreditable: ivaPaid
  };
}

/**
 * Default annual ISR brackets (2025)
 */
function getDefaultAnnualBrackets() {
  return [
    { lowerLimit: 0, upperLimit: 7735.00, fixedFee: 0, rate: 0.0192 },
    { lowerLimit: 7735.00, upperLimit: 65651.07, fixedFee: 148.51, rate: 0.064 },
    { lowerLimit: 65651.07, upperLimit: 115375.90, fixedFee: 3855.14, rate: 0.1088 },
    { lowerLimit: 115375.90, upperLimit: 134119.41, fixedFee: 9265.20, rate: 0.16 },
    { lowerLimit: 134119.41, upperLimit: 160577.65, fixedFee: 12264.16, rate: 0.1792 },
    { lowerLimit: 160577.65, upperLimit: 323862.00, fixedFee: 17005.47, rate: 0.2136 },
    { lowerLimit: 323862.00, upperLimit: 510451.00, fixedFee: 51883.01, rate: 0.2352 },
    { lowerLimit: 510451.00, upperLimit: 974535.03, fixedFee: 95768.74, rate: 0.30 },
    { lowerLimit: 974535.03, upperLimit: 1299380.04, fixedFee: 234993.95, rate: 0.32 },
    { lowerLimit: 1299380.04, upperLimit: 3898140.12, fixedFee: 338944.34, rate: 0.34 },
    { lowerLimit: 3898140.12, upperLimit: null, fixedFee: 1222522.76, rate: 0.35 }
  ];
}

/**
 * GET /api/annual-declarations
 * GET /api/annual-declarations/:id
 * GET /api/annual-declarations/summary/:year
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  try {
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
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const pathParts = url.pathname.split('/').filter(p => p);
    const lastPart = pathParts[pathParts.length - 1];
    const secondLastPart = pathParts[pathParts.length - 2];

    // Handle summary request: /api/annual-declarations/summary/:year
    if (secondLastPart === 'summary' && /^\d{4}$/.test(lastPart)) {
      const year = parseInt(lastPart);
      return await getAnnualSummary(env, userId, year);
    }

    // Handle single declaration: /api/annual-declarations/:id
    if (/^\d+$/.test(lastPart) && secondLastPart === 'annual-declarations') {
      return await getSingleDeclaration(env, userId, parseInt(lastPart));
    }

    // Handle list request
    return await listDeclarations(env, userId, url);

  } catch (error) {
    await logError(error, { endpoint: 'Error in annual-declarations GET', category: 'api' }, env);
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
 * List annual declarations with filters
 */
async function listDeclarations(env, userId, url) {
  const searchParams = url.searchParams;
  const year = searchParams.get('year');
  const type = searchParams.get('type');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = 'SELECT * FROM annual_declarations WHERE user_id = ?';
  const params = [userId];

  if (year) {
    query += ' AND fiscal_year = ?';
    params.push(parseInt(year));
  }

  if (type) {
    query += ' AND declaration_type = ?';
    params.push(type);
  }

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY fiscal_year DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const declarations = await env.DB.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({
    declarations: declarations.results || [],
    total: declarations.results?.length || 0,
    limit,
    offset
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Get single annual declaration
 */
async function getSingleDeclaration(env, userId, id) {
  const declaration = await env.DB.prepare(`
    SELECT * FROM annual_declarations
    WHERE id = ? AND user_id = ?
  `).bind(id, userId).first();

  if (!declaration) {
    return new Response(JSON.stringify({
      error: 'Not found',
      message: 'Annual declaration not found',
      code: 'NOT_FOUND'
    }), {
      status: 404,
      headers: corsHeaders
    });
  }

  return new Response(JSON.stringify({ declaration }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Get annual summary for a specific year
 */
async function getAnnualSummary(env, userId, year) {
  // Calculate ISR
  const isrData = await calculateAnnualISR(env, userId, year);
  
  // Calculate IVA
  const ivaData = await calculateAnnualIVA(env, userId, year);
  
  // Get existing declaration if any
  const existingDeclaration = await env.DB.prepare(`
    SELECT * FROM annual_declarations
    WHERE user_id = ? AND fiscal_year = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(userId, year).first();
  
  // Get monthly tax calculations summary
  const monthlyCalcs = await env.DB.prepare(`
    SELECT 
      period_month,
      total_income,
      total_expenses,
      isr_calculated,
      isr_paid,
      iva_collected,
      iva_paid
    FROM tax_calculations
    WHERE user_id = ? AND period_year = ?
    ORDER BY period_month ASC
  `).bind(userId, year).all();

  return new Response(JSON.stringify({
    year,
    isr: isrData,
    iva: ivaData,
    monthlyCalculations: monthlyCalcs.results || [],
    existingDeclaration
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * POST /api/annual-declarations
 * POST /api/annual-declarations/submit/:id
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);

  try {
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
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const pathParts = url.pathname.split('/').filter(p => p);
    const lastPart = pathParts[pathParts.length - 1];
    const secondLastPart = pathParts[pathParts.length - 2];

    // Handle submit request: /api/annual-declarations/submit/:id
    if (secondLastPart === 'submit' && /^\d+$/.test(lastPart)) {
      return await submitDeclaration(env, userId, parseInt(lastPart));
    }

    // Handle create request
    return await createDeclaration(env, userId, request);

  } catch (error) {
    await logError(error, { endpoint: 'Error in annual-declarations POST', category: 'api' }, env);
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
 * Create new annual declaration
 */
async function createDeclaration(env, userId, request) {
  const body = await request.json();
  const { fiscal_year, declaration_type, personal_deductions } = body;

  // Validate required fields
  if (!fiscal_year || !declaration_type) {
    return new Response(JSON.stringify({
      error: 'Validation error',
      message: 'fiscal_year and declaration_type are required',
      code: 'VALIDATION_ERROR'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Calculate ISR
  const isrData = await calculateAnnualISR(env, userId, fiscal_year);
  
  // Calculate IVA
  const ivaData = await calculateAnnualIVA(env, userId, fiscal_year);
  
  // Apply personal deductions if provided
  let finalTaxableIncome = isrData.taxableIncome;
  let personalDeductionsAmount = 0;
  
  if (personal_deductions && Array.isArray(personal_deductions)) {
    personalDeductionsAmount = personal_deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
    finalTaxableIncome = Math.max(0, isrData.taxableIncome - personalDeductionsAmount);
  }
  
  // Recalculate ISR with personal deductions
  const fiscalParams = await env.DB.prepare(`
    SELECT value FROM fiscal_parameters
    WHERE parameter_type = 'isr_bracket_annual'
      AND is_active = 1
    ORDER BY effective_from DESC
    LIMIT 1
  `).first();
  
  let brackets = [];
  if (fiscalParams && fiscalParams.value) {
    try {
      brackets = JSON.parse(fiscalParams.value);
    } catch (e) {
      brackets = getDefaultAnnualBrackets();
    }
  } else {
    brackets = getDefaultAnnualBrackets();
  }
  
  let finalISRCalculated = 0;
  if (brackets.length > 0 && finalTaxableIncome > 0) {
    for (const bracket of brackets) {
      if (finalTaxableIncome > bracket.lowerLimit && (bracket.upperLimit === null || finalTaxableIncome <= bracket.upperLimit)) {
        const excess = finalTaxableIncome - bracket.lowerLimit;
        finalISRCalculated = bracket.fixedFee + (excess * bracket.rate);
        break;
      }
    }
  }
  
  const finalISRBalance = finalISRCalculated - isrData.isrPaid - isrData.isrRetention;
  
  // Prepare calculation details
  const calculationDetails = {
    isr: {
      totalIncome: isrData.totalIncome,
      deductibleExpenses: isrData.deductibleExpenses,
      personalDeductions: personalDeductionsAmount,
      taxableIncome: finalTaxableIncome,
      calculated: finalISRCalculated,
      paid: isrData.isrPaid,
      retention: isrData.isrRetention,
      balance: finalISRBalance,
      brackets: isrData.brackets
    },
    iva: ivaData,
    personalDeductions: personal_deductions || []
  };
  
  // Insert declaration
  const result = await env.DB.prepare(`
    INSERT INTO annual_declarations (
      user_id, fiscal_year, declaration_type, status,
      total_income, total_expenses, deductible_expenses, personal_deductions,
      taxable_income, isr_calculated, isr_paid, isr_balance, isr_retention_applied,
      iva_collected, iva_paid, iva_balance, iva_accreditable,
      calculation_details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    userId, fiscal_year, declaration_type, 'calculated',
    isrData.totalIncome, isrData.totalExpenses, isrData.deductibleExpenses, personalDeductionsAmount,
    finalTaxableIncome, finalISRCalculated, isrData.isrPaid, finalISRBalance, isrData.isrRetention,
    ivaData.ivaCollected, ivaData.ivaPaid, ivaData.ivaBalance, ivaData.ivaAccreditable,
    JSON.stringify(calculationDetails)
  ).run();

  const declarationId = result.meta.last_row_id;
  
  // Fetch the created declaration
  const declaration = await env.DB.prepare(`
    SELECT * FROM annual_declarations WHERE id = ?
  `).bind(declarationId).first();

  return new Response(JSON.stringify({
    message: 'Annual declaration created successfully',
    declaration
  }), {
    status: 201,
    headers: corsHeaders
  });
}

/**
 * Submit annual declaration
 */
async function submitDeclaration(env, userId, id) {
  // Get the declaration
  const declaration = await env.DB.prepare(`
    SELECT * FROM annual_declarations
    WHERE id = ? AND user_id = ?
  `).bind(id, userId).first();

  if (!declaration) {
    return new Response(JSON.stringify({
      error: 'Not found',
      message: 'Annual declaration not found',
      code: 'NOT_FOUND'
    }), {
      status: 404,
      headers: corsHeaders
    });
  }

  if (declaration.status === 'submitted' || declaration.status === 'accepted') {
    return new Response(JSON.stringify({
      error: 'Invalid operation',
      message: 'Declaration already submitted',
      code: 'ALREADY_SUBMITTED'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Update status to submitted
  await env.DB.prepare(`
    UPDATE annual_declarations
    SET status = 'submitted', submission_date = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();

  return new Response(JSON.stringify({
    message: 'Declaration submitted successfully',
    id
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * PUT /api/annual-declarations/:id
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
    const id = parseInt(pathParts[pathParts.length - 1]);

    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({
        error: 'Invalid ID',
        code: 'INVALID_ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    const { status, sat_response } = body;

    // Build update query
    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (sat_response) {
      updates.push('sat_response = ?');
      params.push(typeof sat_response === 'string' ? sat_response : JSON.stringify(sat_response));
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({
        error: 'No updates provided',
        code: 'NO_UPDATES'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    params.push(id, userId);

    await env.DB.prepare(`
      UPDATE annual_declarations
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...params).run();

    return new Response(JSON.stringify({
      message: 'Declaration updated successfully',
      id
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Error in annual-declarations PUT', category: 'api' }, env);
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
 * DELETE /api/annual-declarations/:id
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
    const id = parseInt(pathParts[pathParts.length - 1]);

    if (!id || isNaN(id)) {
      return new Response(JSON.stringify({
        error: 'Invalid ID',
        code: 'INVALID_ID'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if declaration exists and belongs to user
    const declaration = await env.DB.prepare(`
      SELECT id, status FROM annual_declarations
      WHERE id = ? AND user_id = ?
    `).bind(id, userId).first();

    if (!declaration) {
      return new Response(JSON.stringify({
        error: 'Not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Don't allow deletion of submitted or accepted declarations
    if (declaration.status === 'submitted' || declaration.status === 'accepted') {
      return new Response(JSON.stringify({
        error: 'Cannot delete submitted or accepted declarations',
        code: 'INVALID_OPERATION'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Delete the declaration
    await env.DB.prepare(`
      DELETE FROM annual_declarations
      WHERE id = ? AND user_id = ?
    `).bind(id, userId).run();

    return new Response(JSON.stringify({
      message: 'Declaration deleted successfully',
      id
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Error in annual-declarations DELETE', category: 'api' }, env);
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
