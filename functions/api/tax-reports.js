// Tax Reports API - Generate and export tax reports
// Phase 30: Monetary values stored as INTEGER cents in database
//
// This API handles tax report generation including:
// - Monthly tax reports with detailed breakdowns
// - Annual tax summaries
// - Export to different formats (future: PDF, Excel)
// - Tax declaration summaries
//
// Endpoints:
// - GET /api/tax-reports/monthly/:year/:month - Get monthly tax report
// - GET /api/tax-reports/annual/:year - Get annual tax report
// - GET /api/tax-reports/declaration/:year/:month - Get declaration summary

import { getUserIdFromToken } from './auth.js';
import { 
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';
  fromCents, 
  convertArrayFromCents,
  MONETARY_FIELDS 
} from '../utils/monetary.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Generate monthly tax report with detailed breakdown
 */
async function generateMonthlyReport(env, userId, year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
  
  // Get tax calculations for the month
  const calculations = await env.DB.prepare(`
    SELECT * FROM tax_calculations
    WHERE user_id = ?
      AND period_year = ?
      AND period_month = ?
    ORDER BY calculation_type
  `).bind(userId, year, month).all();
  
  // Get income transactions
  const income = await env.DB.prepare(`
    SELECT 
      date,
      description,
      amount,
      iva_rate,
      isr_retention,
      iva_retention,
      client_rfc,
      cfdi_uuid
    FROM transactions
    WHERE user_id = ?
      AND type = 'ingreso'
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
    ORDER BY date DESC
  `).bind(userId, startDate, endDate).all();
  
  // Get deductible expenses
  const expenses = await env.DB.prepare(`
    SELECT 
      date,
      description,
      amount,
      is_isr_deductible,
      is_iva_deductible,
      iva_rate,
      account
    FROM transactions
    WHERE user_id = ?
      AND type = 'gasto'
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
    ORDER BY date DESC
  `).bind(userId, startDate, endDate).all();
  
  // Phase 30: Calculate summary totals, converting from cents to decimal
  const totalIncome = income.results?.reduce((sum, t) => sum + parseFloat(fromCents(t.amount)), 0) || 0;
  const totalExpenses = expenses.results?.reduce((sum, t) => sum + parseFloat(fromCents(t.amount)), 0) || 0;
  const deductibleExpenses = expenses.results?.reduce((sum, t) => 
    sum + (t.is_isr_deductible ? parseFloat(fromCents(t.amount)) : 0), 0) || 0;
  
  const ivaCollected = income.results?.reduce((sum, t) => 
    sum + (t.iva_rate === '16' ? parseFloat(fromCents(t.amount)) * 0.16 : 0), 0) || 0;
  const ivaPaid = expenses.results?.reduce((sum, t) => 
    sum + (t.is_iva_deductible && t.iva_rate === '16' ? parseFloat(fromCents(t.amount)) * 0.16 : 0), 0) || 0;
  
  // Phase 30: Convert transactions from cents to decimal
  return {
    period: {
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleString('es-MX', { month: 'long' })
    },
    calculations: calculations.results || [],
    income: {
      transactions: convertArrayFromCents(income.results || [], MONETARY_FIELDS.TRANSACTIONS),
      total: totalIncome,
      ivaCollected
    },
    expenses: {
      transactions: convertArrayFromCents(expenses.results || [], MONETARY_FIELDS.TRANSACTIONS),
      total: totalExpenses,
      deductible: deductibleExpenses,
      ivaPaid
    },
    summary: {
      totalIncome,
      totalExpenses,
      deductibleExpenses,
      netIncome: totalIncome - totalExpenses,
      taxableBase: totalIncome - deductibleExpenses,
      ivaCollected,
      ivaPaid,
      netIVA: ivaCollected - ivaPaid
    }
  };
}

/**
 * Generate annual tax report
 */
async function generateAnnualReport(env, userId, year) {
  // Get annual summary
  const summary = await env.DB.prepare(`
    SELECT * FROM v_annual_tax_summary
    WHERE user_id = ? AND period_year = ?
  `).bind(userId, year).first();
  
  // Get monthly breakdown
  const monthlyData = await env.DB.prepare(`
    SELECT * FROM v_monthly_tax_summary
    WHERE user_id = ? AND period_year = ?
    ORDER BY period_month
  `).bind(userId, year).all();
  
  // Get all calculations for the year
  const calculations = await env.DB.prepare(`
    SELECT * FROM tax_calculations
    WHERE user_id = ?
      AND period_year = ?
    ORDER BY period_month, calculation_type
  `).bind(userId, year).all();
  
  return {
    year,
    summary: summary || {
      annual_income: 0,
      annual_deductions: 0,
      annual_isr: 0,
      annual_isr_paid: 0,
      annual_iva_collected: 0,
      annual_iva_paid: 0,
      months_calculated: 0
    },
    monthlyBreakdown: monthlyData.results || [],
    calculations: calculations.results || []
  };
}

/**
 * Generate tax declaration summary
 */
async function generateDeclarationSummary(env, userId, year, month) {
  // Get calculations
  const isrCalc = await env.DB.prepare(`
    SELECT * FROM tax_calculations
    WHERE user_id = ?
      AND period_year = ?
      AND period_month = ?
      AND calculation_type = 'monthly_provisional_isr'
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(userId, year, month).first();
  
  const ivaCalc = await env.DB.prepare(`
    SELECT * FROM tax_calculations
    WHERE user_id = ?
      AND period_year = ?
      AND period_month = ?
      AND calculation_type = 'definitive_iva'
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(userId, year, month).first();
  
  // Get user fiscal configuration
  const fiscalConfig = await env.DB.prepare(`
    SELECT 
      rfc,
      business_name,
      tax_regime
    FROM fiscal_config
    WHERE user_id = ?
    LIMIT 1
  `).bind(userId).first();
  
  // Calculate payment deadline (day 17 of following month)
  const declarationMonth = month === 12 ? 1 : month + 1;
  const declarationYear = month === 12 ? year + 1 : year;
  const paymentDeadline = `${declarationYear}-${String(declarationMonth).padStart(2, '0')}-17`;
  
  return {
    period: {
      year,
      month,
      monthName: new Date(year, month - 1).toLocaleString('es-MX', { month: 'long' })
    },
    taxpayer: {
      rfc: fiscalConfig?.rfc || '',
      businessName: fiscalConfig?.business_name || '',
      taxRegime: fiscalConfig?.tax_regime || 'persona_fisica_actividad_empresarial'
    },
    isr: isrCalc ? {
      accumulatedIncome: isrCalc.accumulated_income,
      accumulatedDeductions: isrCalc.accumulated_deductions,
      taxableIncome: isrCalc.taxable_income,
      isrCalculated: isrCalc.isr_calculated,
      isrPaid: isrCalc.isr_paid,
      isrToPay: isrCalc.isr_balance,
      details: isrCalc.calculation_details ? JSON.parse(isrCalc.calculation_details) : null
    } : null,
    iva: ivaCalc ? {
      ivaCollected: ivaCalc.iva_collected,
      ivaPaid: ivaCalc.iva_paid,
      previousBalance: ivaCalc.previous_iva_balance,
      ivaToPay: Math.max(0, ivaCalc.iva_balance),
      ivaInFavor: Math.min(0, ivaCalc.iva_balance),
      details: ivaCalc.calculation_details ? JSON.parse(ivaCalc.calculation_details) : null
    } : null,
    paymentDeadline,
    totalTaxes: (isrCalc?.isr_balance || 0) + Math.max(0, ivaCalc?.iva_balance || 0)
  };
}

/**
 * GET /api/tax-reports/monthly/:year/:month
 * GET /api/tax-reports/annual/:year
 * GET /api/tax-reports/declaration/:year/:month
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
    const apiIndex = pathParts.indexOf('tax-reports');
    const reportType = pathParts[apiIndex + 1];
    
    if (reportType === 'monthly' && pathParts[apiIndex + 2] && pathParts[apiIndex + 3]) {
      // GET /api/tax-reports/monthly/:year/:month
      const year = parseInt(pathParts[apiIndex + 2]);
      const month = parseInt(pathParts[apiIndex + 3]);
      
      const report = await generateMonthlyReport(env, userId, year, month);
      
      return new Response(JSON.stringify({
        success: true,
        report
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    
    if (reportType === 'annual' && pathParts[apiIndex + 2]) {
      // GET /api/tax-reports/annual/:year
      const year = parseInt(pathParts[apiIndex + 2]);
      
      const report = await generateAnnualReport(env, userId, year);
      
      return new Response(JSON.stringify({
        success: true,
        report
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    
    if (reportType === 'declaration' && pathParts[apiIndex + 2] && pathParts[apiIndex + 3]) {
      // GET /api/tax-reports/declaration/:year/:month
      const year = parseInt(pathParts[apiIndex + 2]);
      const month = parseInt(pathParts[apiIndex + 3]);
      
      const declaration = await generateDeclarationSummary(env, userId, year, month);
      
      return new Response(JSON.stringify({
        success: true,
        declaration
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
    
    return new Response(JSON.stringify({
      error: 'Invalid request',
      message: 'Invalid report type or parameters',
      code: 'VALIDATION_ERROR'
    }), {
      status: 400,
      headers: corsHeaders
    });
    
  } catch (error) {
    await logError(error, { endpoint: 'Error generating tax report', category: 'api' }, env);
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
