// Fiscal Analytics API - Comprehensive fiscal analytics and insights
//
// This API handles all fiscal analytics operations including:
// - Generate monthly, quarterly, and annual summaries
// - Calculate fiscal trends and patterns
// - Monitor compliance status
// - Generate tax optimization suggestions
// - Provide fiscal insights and recommendations
//
// Endpoints:
// - GET /api/fiscal-analytics - List analytics with filters
// - GET /api/fiscal-analytics/:id - Get single analytics record
// - GET /api/fiscal-analytics/compliance/:year - Get compliance status
// - GET /api/fiscal-analytics/trends/:year - Get fiscal trends
// - GET /api/fiscal-analytics/optimization/:year - Get optimization suggestions
// - POST /api/fiscal-analytics - Generate analytics for period
// - DELETE /api/fiscal-analytics/:id - Delete analytics record
//
// Phase 30: Monetary values stored as INTEGER cents in database

import { getUserIdFromToken } from './auth.js';
import { fromCents } from '../utils/monetary.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
 * Generate monthly summary analytics
 */
async function generateMonthlySummary(env, userId, year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
  
  // Get transaction counts and totals
  // Phase 30: Amounts are stored as INTEGER cents, need conversion
  const transactionStats = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total_transactions,
      COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END), 0) as total_expenses,
      COALESCE(SUM(CASE WHEN type = 'ingreso' AND iva_rate = '16' THEN amount * 0.16 ELSE 0 END), 0) as iva_collected,
      COALESCE(SUM(CASE WHEN type = 'gasto' AND is_iva_deductible = 1 AND iva_rate = '16' THEN amount * 0.16 ELSE 0 END), 0) as iva_paid
    FROM transactions
    WHERE user_id = ?
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  // Get deductibility stats
  const deductibilityStats = await env.DB.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN is_isr_deductible = 1 THEN amount ELSE 0 END), 0) as isr_deductible,
      COALESCE(SUM(CASE WHEN is_iva_deductible = 1 THEN amount ELSE 0 END), 0) as iva_deductible,
      COUNT(CASE WHEN has_cfdi = 1 THEN 1 END) as transactions_with_cfdi,
      COUNT(CASE WHEN has_cfdi = 0 THEN 1 END) as transactions_without_cfdi
    FROM transactions
    WHERE user_id = ?
      AND type = 'gasto'
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  // Get tax calculation for this month (already in cents)
  const taxCalc = await env.DB.prepare(`
    SELECT 
      isr_calculated,
      isr_paid,
      isr_balance,
      iva_collected,
      iva_paid,
      iva_balance
    FROM tax_calculations
    WHERE user_id = ?
      AND period_year = ?
      AND period_month = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(userId, year, month).first();
  
  // Calculate compliance score (0-100)
  let complianceScore = 100;
  const totalExpenses = parseFloat(fromCents(transactionStats.total_expenses || 0));
  
  // Deduct points for missing CFDIs on expenses
  if (totalExpenses > 0) {
    const cfdiCompliance = (deductibilityStats.transactions_with_cfdi || 0) / 
                          ((deductibilityStats.transactions_with_cfdi || 0) + (deductibilityStats.transactions_without_cfdi || 0));
    complianceScore *= cfdiCompliance;
  }
  
  // Deduct points for unpaid taxes
  if (taxCalc && taxCalc.isr_balance > 0 && taxCalc.isr_paid === 0) {
    complianceScore -= 20;
  }
  
  if (taxCalc && taxCalc.iva_balance > 0 && taxCalc.iva_paid === 0) {
    complianceScore -= 20;
  }
  
  complianceScore = Math.max(0, Math.min(100, complianceScore));
  
  // Phase 30: Convert all monetary values from cents to decimal
  const analyticsData = {
    transactions: {
      total: transactionStats.total_transactions || 0,
      income: parseFloat(fromCents(transactionStats.total_income || 0)),
      expenses: parseFloat(fromCents(transactionStats.total_expenses || 0)),
      net: parseFloat(fromCents((transactionStats.total_income || 0) - (transactionStats.total_expenses || 0)))
    },
    deductibility: {
      isrDeductible: parseFloat(fromCents(deductibilityStats.isr_deductible || 0)),
      ivaDeductible: parseFloat(fromCents(deductibilityStats.iva_deductible || 0)),
      cfdiCompliance: {
        withCFDI: deductibilityStats.transactions_with_cfdi || 0,
        withoutCFDI: deductibilityStats.transactions_without_cfdi || 0,
        percentage: totalExpenses > 0 ? 
          ((deductibilityStats.transactions_with_cfdi || 0) / 
           ((deductibilityStats.transactions_with_cfdi || 0) + (deductibilityStats.transactions_without_cfdi || 0)) * 100) : 0
      }
    },
    taxes: taxCalc ? {
      isr: {
        calculated: parseFloat(fromCents(taxCalc.isr_calculated)),
        paid: parseFloat(fromCents(taxCalc.isr_paid)),
        balance: parseFloat(fromCents(taxCalc.isr_balance))
      },
      iva: {
        collected: parseFloat(fromCents(taxCalc.iva_collected)),
        paid: parseFloat(fromCents(taxCalc.iva_paid)),
        balance: parseFloat(fromCents(taxCalc.iva_balance))
      }
    } : null,
    compliance: {
      score: Math.round(complianceScore),
      issues: []
    }
  };
  
  // Add compliance issues
  if (deductibilityStats.transactions_without_cfdi > 0) {
    analyticsData.compliance.issues.push({
      type: 'missing_cfdi',
      severity: 'warning',
      count: deductibilityStats.transactions_without_cfdi,
      message: `${deductibilityStats.transactions_without_cfdi} transacciones sin CFDI`
    });
  }
  
  if (taxCalc && taxCalc.isr_balance > 0) {
    analyticsData.compliance.issues.push({
      type: 'unpaid_isr',
      severity: 'warning',
      amount: parseFloat(fromCents(taxCalc.isr_balance)),
      message: `ISR pendiente de pago: $${fromCents(taxCalc.isr_balance)}`
    });
  }
  
  return analyticsData;
}

/**
 * Generate annual summary analytics
 */
async function generateAnnualSummary(env, userId, year) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  // Get annual transaction stats (in cents)
  const annualStats = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total_transactions,
      COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END), 0) as total_expenses
    FROM transactions
    WHERE user_id = ?
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  // Get monthly breakdown (in cents)
  const monthlyBreakdown = await env.DB.prepare(`
    SELECT 
      strftime('%m', date) as month,
      COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END), 0) as expenses
    FROM transactions
    WHERE user_id = ?
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
    GROUP BY strftime('%m', date)
    ORDER BY month ASC
  `).bind(userId, startDate, endDate).all();
  
  // Get tax calculations summary (in cents)
  const taxSummary = await env.DB.prepare(`
    SELECT 
      COALESCE(SUM(isr_calculated), 0) as total_isr,
      COALESCE(SUM(isr_paid), 0) as total_isr_paid,
      COALESCE(SUM(iva_collected), 0) as total_iva_collected,
      COALESCE(SUM(iva_paid), 0) as total_iva_paid
    FROM tax_calculations
    WHERE user_id = ?
      AND period_year = ?
  `).bind(userId, year).first();
  
  // Phase 30: Convert monthly breakdown from cents to decimal
  const convertedMonthlyBreakdown = (monthlyBreakdown.results || []).map(m => ({
    month: m.month,
    income: parseFloat(fromCents(m.income)),
    expenses: parseFloat(fromCents(m.expenses))
  }));
  
  // Phase 30: Convert all monetary values from cents to decimal
  const analyticsData = {
    year,
    summary: {
      totalTransactions: annualStats.total_transactions || 0,
      totalIncome: parseFloat(fromCents(annualStats.total_income || 0)),
      totalExpenses: parseFloat(fromCents(annualStats.total_expenses || 0)),
      netIncome: parseFloat(fromCents((annualStats.total_income || 0) - (annualStats.total_expenses || 0)))
    },
    monthlyBreakdown: convertedMonthlyBreakdown,
    taxes: {
      isr: {
        calculated: parseFloat(fromCents(taxSummary.total_isr || 0)),
        paid: parseFloat(fromCents(taxSummary.total_isr_paid || 0)),
        balance: parseFloat(fromCents((taxSummary.total_isr || 0) - (taxSummary.total_isr_paid || 0)))
      },
      iva: {
        collected: parseFloat(fromCents(taxSummary.total_iva_collected || 0)),
        paid: parseFloat(fromCents(taxSummary.total_iva_paid || 0)),
        balance: parseFloat(fromCents((taxSummary.total_iva_collected || 0) - (taxSummary.total_iva_paid || 0)))
      }
    }
  };
  
  return analyticsData;
}

/**
 * Generate compliance status
 */
async function generateComplianceStatus(env, userId, year, month) {
  const startDate = month ? 
    `${year}-${String(month).padStart(2, '0')}-01` :
    `${year}-01-01`;
  const endDate = month ?
    `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}` :
    `${year}-12-31`;
  
  // Check for missing CFDIs
  const missingCFDIs = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM transactions
    WHERE user_id = ?
      AND type = 'gasto'
      AND has_cfdi = 0
      AND amount > 2000
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  // Check for unpaid taxes (amounts in cents)
  const unpaidTaxes = await env.DB.prepare(`
    SELECT 
      COUNT(*) as count,
      COALESCE(SUM(isr_balance), 0) as isr_balance,
      COALESCE(SUM(iva_balance), 0) as iva_balance
    FROM tax_calculations
    WHERE user_id = ?
      AND period_year = ?
      ${month ? 'AND period_month = ?' : ''}
      AND status != 'paid'
  `).bind(userId, year, ...(month ? [month] : [])).first();
  
  // Check for unreconciled transactions
  const unreconciled = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM transactions t
    WHERE t.user_id = ?
      AND t.date BETWEEN ? AND ?
      AND t.is_deleted = 0
      AND NOT EXISTS (
        SELECT 1 FROM reconciliation_matches rm
        WHERE rm.transaction_id = t.id
          AND rm.status = 'verified'
      )
  `).bind(userId, startDate, endDate).first();
  
  const issues = [];
  let complianceScore = 100;
  
  if (missingCFDIs.count > 0) {
    issues.push({
      type: 'missing_cfdi',
      severity: 'high',
      count: missingCFDIs.count,
      message: `${missingCFDIs.count} gastos mayores a $2,000 sin CFDI`,
      recommendation: 'Solicita facturas para todos los gastos mayores a $2,000 para poder deducirlos'
    });
    complianceScore -= 30;
  }
  
  // Phase 30: Convert monetary values from cents to decimal
  if (unpaidTaxes.count > 0) {
    issues.push({
      type: 'unpaid_taxes',
      severity: 'critical',
      count: unpaidTaxes.count,
      isrBalance: parseFloat(fromCents(unpaidTaxes.isr_balance)),
      ivaBalance: parseFloat(fromCents(unpaidTaxes.iva_balance)),
      message: `${unpaidTaxes.count} periodos con impuestos pendientes`,
      recommendation: 'Realiza el pago de impuestos para evitar recargos y multas'
    });
    complianceScore -= 40;
  }
  
  if (unreconciled.count > 0) {
    issues.push({
      type: 'unreconciled_transactions',
      severity: 'medium',
      count: unreconciled.count,
      message: `${unreconciled.count} transacciones sin conciliar`,
      recommendation: 'Concilia tus transacciones con el estado de cuenta bancario'
    });
    complianceScore -= 20;
  }
  
  complianceScore = Math.max(0, complianceScore);
  
  return {
    period: month ? `${year}-${String(month).padStart(2, '0')}` : year.toString(),
    complianceScore: Math.round(complianceScore),
    status: complianceScore >= 80 ? 'good' : complianceScore >= 60 ? 'warning' : 'critical',
    issues,
    summary: {
      missingCFDIs: missingCFDIs.count,
      unpaidTaxes: unpaidTaxes.count,
      unreconciledTransactions: unreconciled.count
    }
  };
}

/**
 * Generate fiscal trends
 */
async function generateFiscalTrends(env, userId, year) {
  // Get monthly trends (amounts in cents)
  const monthlyTrends = await env.DB.prepare(`
    SELECT 
      period_month,
      total_income,
      total_expenses,
      isr_calculated,
      iva_collected,
      iva_paid
    FROM tax_calculations
    WHERE user_id = ?
      AND period_year = ?
    ORDER BY period_month ASC
  `).bind(userId, year).all();
  
  const trends = monthlyTrends.results || [];
  
  // Calculate growth rates (working with cents values)
  const growthRates = [];
  for (let i = 1; i < trends.length; i++) {
    const prev = trends[i - 1];
    const curr = trends[i];
    
    growthRates.push({
      month: curr.period_month,
      incomeGrowth: prev.total_income > 0 ? 
        ((curr.total_income - prev.total_income) / prev.total_income * 100) : 0,
      expenseGrowth: prev.total_expenses > 0 ?
        ((curr.total_expenses - prev.total_expenses) / prev.total_expenses * 100) : 0
    });
  }
  
  // Calculate averages (in cents, then convert)
  const avgIncomeCents = trends.reduce((sum, t) => sum + (t.total_income || 0), 0) / trends.length;
  const avgExpensesCents = trends.reduce((sum, t) => sum + (t.total_expenses || 0), 0) / trends.length;
  const avgISRCents = trends.reduce((sum, t) => sum + (t.isr_calculated || 0), 0) / trends.length;
  
  // Phase 30: Convert trends to decimal
  const convertedTrends = trends.map(t => ({
    period_month: t.period_month,
    total_income: parseFloat(fromCents(t.total_income || 0)),
    total_expenses: parseFloat(fromCents(t.total_expenses || 0)),
    isr_calculated: parseFloat(fromCents(t.isr_calculated || 0)),
    iva_collected: parseFloat(fromCents(t.iva_collected || 0)),
    iva_paid: parseFloat(fromCents(t.iva_paid || 0))
  }));
  
  // Phase 30: Convert averages and projections
  const avgIncome = parseFloat(fromCents(avgIncomeCents || 0));
  const avgExpenses = parseFloat(fromCents(avgExpensesCents || 0));
  const avgISR = parseFloat(fromCents(avgISRCents || 0));
  
  return {
    year,
    monthlyTrends: convertedTrends,
    growthRates,
    averages: {
      income: avgIncome,
      expenses: avgExpenses,
      isr: avgISR
    },
    projections: {
      annualIncome: avgIncome * 12,
      annualExpenses: avgExpenses * 12,
      annualISR: avgISR * 12
    }
  };
}

/**
 * Generate tax optimization suggestions
 */
async function generateOptimizationSuggestions(env, userId, year) {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  
  // Get deductibility analysis (amounts in cents)
  const deductibilityAnalysis = await env.DB.prepare(`
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END), 0) as total_expenses,
      COALESCE(SUM(CASE WHEN type = 'gasto' AND is_isr_deductible = 1 THEN amount ELSE 0 END), 0) as deductible_expenses,
      COALESCE(SUM(CASE WHEN type = 'gasto' AND is_isr_deductible = 0 AND has_cfdi = 0 THEN amount ELSE 0 END), 0) as non_deductible_no_cfdi
    FROM transactions
    WHERE user_id = ?
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  // Get annual declaration if exists (amounts in cents)
  const annualDeclaration = await env.DB.prepare(`
    SELECT 
      total_income,
      deductible_expenses,
      personal_deductions,
      isr_calculated
    FROM annual_declarations
    WHERE user_id = ?
      AND fiscal_year = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).bind(userId, year).first();
  
  const suggestions = [];
  
  // Suggestion: Improve CFDI compliance
  // Phase 30: Convert amounts from cents to decimal
  const nonDeductibleNoCFDI = parseFloat(fromCents(deductibilityAnalysis.non_deductible_no_cfdi || 0));
  if (nonDeductibleNoCFDI > 0) {
    const potentialSavings = nonDeductibleNoCFDI * 0.30; // Approximate 30% ISR rate
    suggestions.push({
      type: 'cfdi_compliance',
      priority: 'high',
      title: 'Solicita facturas para maximizar deducciones',
      description: `Tienes $${nonDeductibleNoCFDI.toFixed(2)} en gastos sin CFDI que no son deducibles`,
      potentialSavings: potentialSavings,
      action: 'Solicita facturas (CFDI) para todos tus gastos empresariales'
    });
  }
  
  // Suggestion: Personal deductions
  if (annualDeclaration && annualDeclaration.personal_deductions === 0) {
    suggestions.push({
      type: 'personal_deductions',
      priority: 'medium',
      title: 'Considera deducciones personales',
      description: 'No has aplicado deducciones personales en tu declaración anual',
      potentialSavings: 0, // Would need to calculate based on eligible expenses
      action: 'Revisa gastos deducibles personales: gastos médicos, colegiaturas, intereses hipotecarios, etc.'
    });
  }
  
  // Suggestion: Payment method optimization
  const cashPayments = await env.DB.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total
    FROM transactions
    WHERE user_id = ?
      AND type = 'gasto'
      AND payment_method = 'efectivo'
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();
  
  const cashPaymentsTotal = parseFloat(fromCents(cashPayments.total || 0));
  if (cashPayments.count > 0) {
    suggestions.push({
      type: 'payment_method',
      priority: 'low',
      title: 'Prefiere pagos con tarjeta o transferencia',
      description: `Tienes ${cashPayments.count} pagos en efectivo por $${cashPaymentsTotal.toFixed(2)}`,
      action: 'Los pagos electrónicos facilitan la conciliación y comprobación de gastos'
    });
  }
  
  // Suggestion: Tax planning
  if (annualDeclaration && annualDeclaration.isr_calculated > 0) {
    const isrCalculated = parseFloat(fromCents(annualDeclaration.isr_calculated));
    const monthlyPayment = isrCalculated / 12;
    suggestions.push({
      type: 'tax_planning',
      priority: 'high',
      title: 'Planifica tus pagos provisionales',
      description: 'Realiza pagos provisionales mensuales para evitar saldos grandes al final del año',
      recommendedMonthlyPayment: monthlyPayment,
      action: `Considera realizar pagos provisionales de aproximadamente $${monthlyPayment.toFixed(2)} mensuales`
    });
  }
  
  return {
    year,
    suggestions,
    summary: {
      totalSuggestions: suggestions.length,
      highPriority: suggestions.filter(s => s.priority === 'high').length,
      potentialTotalSavings: suggestions.reduce((sum, s) => sum + (s.potentialSavings || 0), 0)
    }
  };
}

/**
 * GET /api/fiscal-analytics
 * GET /api/fiscal-analytics/:id
 * GET /api/fiscal-analytics/compliance/:year
 * GET /api/fiscal-analytics/trends/:year
 * GET /api/fiscal-analytics/optimization/:year
 */
export async function onRequestGet(context) {
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
    const lastPart = pathParts[pathParts.length - 1];
    const secondLastPart = pathParts[pathParts.length - 2];

    // Handle compliance status: /api/fiscal-analytics/compliance/:year
    if (secondLastPart === 'compliance' && /^\d{4}$/.test(lastPart)) {
      const year = parseInt(lastPart);
      const month = url.searchParams.get('month') ? parseInt(url.searchParams.get('month')) : null;
      const complianceData = await generateComplianceStatus(env, userId, year, month);
      
      return new Response(JSON.stringify({ compliance: complianceData }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // Handle trends: /api/fiscal-analytics/trends/:year
    if (secondLastPart === 'trends' && /^\d{4}$/.test(lastPart)) {
      const year = parseInt(lastPart);
      const trendsData = await generateFiscalTrends(env, userId, year);
      
      return new Response(JSON.stringify({ trends: trendsData }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // Handle optimization: /api/fiscal-analytics/optimization/:year
    if (secondLastPart === 'optimization' && /^\d{4}$/.test(lastPart)) {
      const year = parseInt(lastPart);
      const optimizationData = await generateOptimizationSuggestions(env, userId, year);
      
      return new Response(JSON.stringify({ optimization: optimizationData }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // Handle single analytics: /api/fiscal-analytics/:id
    if (/^\d+$/.test(lastPart) && secondLastPart === 'fiscal-analytics') {
      const id = parseInt(lastPart);
      const analytics = await env.DB.prepare(`
        SELECT * FROM fiscal_analytics
        WHERE id = ? AND user_id = ?
      `).bind(id, userId).first();

      if (!analytics) {
        return new Response(JSON.stringify({
          error: 'Not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      return new Response(JSON.stringify({ analytics }), {
        status: 200,
        headers: corsHeaders
      });
    }

    // Handle list request
    return await listAnalytics(env, userId, url);

  } catch (error) {
    await logError(error, { endpoint: 'Error in fiscal-analytics GET', category: 'api' }, env);
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
 * List fiscal analytics with filters
 */
async function listAnalytics(env, userId, url) {
  const searchParams = url.searchParams;
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = 'SELECT * FROM fiscal_analytics WHERE user_id = ?';
  const params = [userId];

  if (year) {
    query += ' AND period_year = ?';
    params.push(parseInt(year));
  }

  if (month) {
    query += ' AND period_month = ?';
    params.push(parseInt(month));
  }

  if (type) {
    query += ' AND analytics_type = ?';
    params.push(type);
  }

  query += ' ORDER BY period_year DESC, period_month DESC, generated_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const analytics = await env.DB.prepare(query).bind(...params).all();

  return new Response(JSON.stringify({
    analytics: analytics.results || [],
    total: analytics.results?.length || 0,
    limit,
    offset
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * POST /api/fiscal-analytics
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

    const body = await request.json();
    const { analytics_type, period_year, period_month } = body;

    if (!analytics_type || !period_year) {
      return new Response(JSON.stringify({
        error: 'Validation error',
        message: 'analytics_type and period_year are required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    let analyticsData;
    let totalTransactions = 0;
    let totalIncome = 0;
    let totalExpenses = 0;
    let taxLiability = 0;
    let complianceScore = 0;

    // Generate analytics based on type
    switch (analytics_type) {
      case 'monthly_summary':
        if (!period_month) {
          return new Response(JSON.stringify({
            error: 'Validation error',
            message: 'period_month is required for monthly_summary',
            code: 'VALIDATION_ERROR'
          }), {
            status: 400,
            headers: corsHeaders
          });
        }
        analyticsData = await generateMonthlySummary(env, userId, period_year, period_month);
        totalTransactions = analyticsData.transactions.total;
        totalIncome = analyticsData.transactions.income;
        totalExpenses = analyticsData.transactions.expenses;
        taxLiability = analyticsData.taxes ? 
          (analyticsData.taxes.isr.calculated + analyticsData.taxes.iva.balance) : 0;
        complianceScore = analyticsData.compliance.score;
        break;

      case 'annual_summary':
        analyticsData = await generateAnnualSummary(env, userId, period_year);
        totalTransactions = analyticsData.summary.totalTransactions;
        totalIncome = analyticsData.summary.totalIncome;
        totalExpenses = analyticsData.summary.totalExpenses;
        taxLiability = analyticsData.taxes.isr.calculated + analyticsData.taxes.iva.balance;
        break;

      case 'compliance_status':
        analyticsData = await generateComplianceStatus(env, userId, period_year, period_month);
        complianceScore = analyticsData.complianceScore;
        break;

      case 'trend_analysis':
        analyticsData = await generateFiscalTrends(env, userId, period_year);
        break;

      case 'optimization_suggestions':
        analyticsData = await generateOptimizationSuggestions(env, userId, period_year);
        break;

      default:
        return new Response(JSON.stringify({
          error: 'Invalid analytics type',
          code: 'INVALID_TYPE'
        }), {
          status: 400,
          headers: corsHeaders
        });
    }

    // Insert analytics record
    const result = await env.DB.prepare(`
      INSERT INTO fiscal_analytics (
        user_id, analytics_type, period_year, period_month,
        analytics_data, total_transactions, total_income, 
        total_expenses, tax_liability, compliance_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId, analytics_type, period_year, period_month || null,
      JSON.stringify(analyticsData), totalTransactions, totalIncome,
      totalExpenses, taxLiability, complianceScore
    ).run();

    const analyticsId = result.meta.last_row_id;

    return new Response(JSON.stringify({
      message: 'Analytics generated successfully',
      id: analyticsId,
      data: analyticsData
    }), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Error in fiscal-analytics POST', category: 'api' }, env);
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
 * DELETE /api/fiscal-analytics/:id
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

    await env.DB.prepare(`
      DELETE FROM fiscal_analytics
      WHERE id = ? AND user_id = ?
    `).bind(id, userId).run();

    return new Response(JSON.stringify({
      message: 'Analytics deleted successfully',
      id
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Error in fiscal-analytics DELETE', category: 'api' }, env);
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
