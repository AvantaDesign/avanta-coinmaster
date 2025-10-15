/**
 * Fiscal Configuration API
 * Manages fiscal settings including ISR brackets, IVA rates, and tax simulations
 * 
 * Endpoints:
 * - GET    /api/fiscal-config              - Get fiscal configuration for current/specified year
 * - PUT    /api/fiscal-config              - Update fiscal configuration
 * - POST   /api/fiscal-config/simulate     - Run fiscal simulation/projection
 * - GET    /api/fiscal-config/years        - Get available fiscal configuration years
 */

import { authenticateRequest, validateRequired, generateId, getApiResponse } from './errors';

/**
 * Default ISR brackets for 2025 (can be updated annually)
 */
const DEFAULT_ISR_BRACKETS_2025 = [
  { limit: 7735.00, rate: 0.0192, fixedFee: 0, lowerLimit: 0 },
  { limit: 65651.07, rate: 0.0640, fixedFee: 148.51, lowerLimit: 7735.00 },
  { limit: 115375.90, rate: 0.1088, fixedFee: 3855.14, lowerLimit: 65651.07 },
  { limit: 134119.41, rate: 0.1600, fixedFee: 9265.20, lowerLimit: 115375.90 },
  { limit: 160577.65, rate: 0.1792, fixedFee: 12264.16, lowerLimit: 134119.41 },
  { limit: 323862.00, rate: 0.2136, fixedFee: 17005.47, lowerLimit: 160577.65 },
  { limit: 510451.00, rate: 0.2352, fixedFee: 51883.01, lowerLimit: 323862.00 },
  { limit: 974535.03, rate: 0.3000, fixedFee: 95768.74, lowerLimit: 510451.00 },
  { limit: 1299380.04, rate: 0.3200, fixedFee: 234993.95, lowerLimit: 974535.03 },
  { limit: 3898140.12, rate: 0.3400, fixedFee: 338944.34, lowerLimit: 1299380.04 },
  { limit: 999999999, rate: 0.3500, fixedFee: 1222522.76, lowerLimit: 3898140.12 }
];

/**
 * Main request handler
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/fiscal-config', '');
  const method = request.method;

  try {
    // Authenticate user
    const userId = await authenticateRequest(request, env);

    // Route to appropriate handler
    if (path === '' || path === '/') {
      if (method === 'GET') return await getFiscalConfig(env, userId, url);
      if (method === 'PUT') return await updateFiscalConfig(env, userId, request);
    }

    if (path === '/simulate' && method === 'POST') {
      return await simulateFiscalProjection(env, userId, request);
    }

    if (path === '/years' && method === 'GET') {
      return await getAvailableYears(env, userId);
    }

    return getApiResponse(null, 'Not found', 404);
  } catch (error) {
    console.error('Fiscal Config API error:', error);
    return getApiResponse(null, error.message || 'Internal server error', error.status || 500);
  }
}

/**
 * Get fiscal configuration for specified year
 */
async function getFiscalConfig(env, userId, url) {
  const year = parseInt(url.searchParams.get('year') || new Date().getFullYear());

  const config = await env.DB.prepare(`
    SELECT * FROM fiscal_config
    WHERE user_id = ? AND year = ?
    ORDER BY is_active DESC, created_at DESC
    LIMIT 1
  `).bind(userId, year).first();

  if (!config) {
    // Create default configuration for the year
    const configId = generateId('fiscal_config');
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO fiscal_config (
        id, user_id, year, isr_brackets, iva_rate, iva_retention_rate, 
        diot_threshold, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      configId,
      userId,
      year,
      JSON.stringify(DEFAULT_ISR_BRACKETS_2025),
      0.16,
      0.1067,
      50000,
      1,
      now,
      now
    ).run();

    const newConfig = await env.DB.prepare(`
      SELECT * FROM fiscal_config WHERE id = ?
    `).bind(configId).first();

    return getApiResponse({
      config: {
        ...newConfig,
        isr_brackets: JSON.parse(newConfig.isr_brackets)
      },
      is_default: true
    });
  }

  return getApiResponse({
    config: {
      ...config,
      isr_brackets: JSON.parse(config.isr_brackets),
      settings: config.settings ? JSON.parse(config.settings) : {}
    }
  });
}

/**
 * Update fiscal configuration
 */
async function updateFiscalConfig(env, userId, request) {
  const data = await request.json();
  const year = data.year || new Date().getFullYear();

  // Check if config exists
  const existing = await env.DB.prepare(`
    SELECT id FROM fiscal_config
    WHERE user_id = ? AND year = ?
  `).bind(userId, year).first();

  if (!existing) {
    return getApiResponse(null, 'Fiscal configuration not found for this year', 404);
  }

  // Build update query
  const updates = [];
  const params = [];

  if (data.isr_brackets) {
    // Validate ISR brackets structure
    if (!Array.isArray(data.isr_brackets)) {
      return getApiResponse(null, 'ISR brackets must be an array', 400);
    }
    updates.push('isr_brackets = ?');
    params.push(JSON.stringify(data.isr_brackets));
  }

  if (data.iva_rate !== undefined) {
    if (data.iva_rate < 0 || data.iva_rate > 1) {
      return getApiResponse(null, 'IVA rate must be between 0 and 1', 400);
    }
    updates.push('iva_rate = ?');
    params.push(data.iva_rate);
  }

  if (data.iva_retention_rate !== undefined) {
    if (data.iva_retention_rate < 0 || data.iva_retention_rate > 1) {
      return getApiResponse(null, 'IVA retention rate must be between 0 and 1', 400);
    }
    updates.push('iva_retention_rate = ?');
    params.push(data.iva_retention_rate);
  }

  if (data.diot_threshold !== undefined) {
    updates.push('diot_threshold = ?');
    params.push(data.diot_threshold);
  }

  if (data.settings) {
    updates.push('settings = ?');
    params.push(JSON.stringify(data.settings));
  }

  if (data.is_active !== undefined) {
    updates.push('is_active = ?');
    params.push(data.is_active ? 1 : 0);
  }

  if (updates.length === 0) {
    return getApiResponse(null, 'No fields to update', 400);
  }

  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(existing.id);

  const query = `UPDATE fiscal_config SET ${updates.join(', ')} WHERE id = ?`;
  await env.DB.prepare(query).bind(...params).run();

  // Fetch updated config
  const updated = await env.DB.prepare(`
    SELECT * FROM fiscal_config WHERE id = ?
  `).bind(existing.id).first();

  return getApiResponse({
    config: {
      ...updated,
      isr_brackets: JSON.parse(updated.isr_brackets),
      settings: updated.settings ? JSON.parse(updated.settings) : {}
    }
  }, 'Fiscal configuration updated successfully');
}

/**
 * Simulate fiscal projection based on current data and projections
 */
async function simulateFiscalProjection(env, userId, request) {
  const data = await request.json();
  
  // Get parameters
  const year = data.year || new Date().getFullYear();
  const projectedIncome = data.projected_income || 0;
  const projectedExpenses = data.projected_expenses || 0;
  const includeCurrentData = data.include_current_data !== false;

  // Get fiscal configuration
  const config = await env.DB.prepare(`
    SELECT * FROM fiscal_config
    WHERE user_id = ? AND year = ? AND is_active = 1
    LIMIT 1
  `).bind(userId, year).first();

  if (!config) {
    return getApiResponse(null, 'Fiscal configuration not found', 404);
  }

  const isrBrackets = JSON.parse(config.isr_brackets);
  const ivaRate = config.iva_rate;

  // Get current year data if requested
  let currentIncome = 0;
  let currentExpenses = 0;
  let currentDeductibleExpenses = 0;

  if (includeCurrentData) {
    const currentData = await env.DB.prepare(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'ingreso' AND transaction_type = 'business' THEN amount ELSE 0 END), 0) as business_income,
        COALESCE(SUM(CASE WHEN type = 'gasto' AND transaction_type = 'business' THEN amount ELSE 0 END), 0) as business_expenses
      FROM transactions
      WHERE user_id = ?
        AND strftime('%Y', date) = ?
        AND is_deleted = 0
    `).bind(userId, year.toString()).first();

    currentIncome = currentData.business_income || 0;
    currentExpenses = currentData.business_expenses || 0;

    // Get deductible expenses
    const deductibleData = await env.DB.prepare(`
      SELECT COALESCE(SUM(t.amount), 0) as deductible_expenses
      FROM transactions t
      JOIN categories c ON c.id = t.category_id
      WHERE t.user_id = ?
        AND t.type = 'gasto'
        AND t.transaction_type = 'business'
        AND c.is_deductible = 1
        AND strftime('%Y', t.date) = ?
        AND t.is_deleted = 0
    `).bind(userId, year.toString()).first();

    currentDeductibleExpenses = deductibleData.deductible_expenses || 0;
  }

  // Calculate totals
  const totalIncome = currentIncome + projectedIncome;
  const totalExpenses = currentExpenses + projectedExpenses;
  const totalDeductibleExpenses = currentDeductibleExpenses + (projectedExpenses * 0.8); // Assume 80% of projected expenses are deductible

  // Calculate taxable base
  const taxableBase = Math.max(0, totalIncome - totalDeductibleExpenses);

  // Calculate ISR
  const isr = calculateISR(taxableBase, isrBrackets);

  // Calculate IVA
  const ivaCharged = totalIncome * ivaRate; // IVA on income
  const ivaCreditable = totalDeductibleExpenses * ivaRate; // IVA creditable on expenses
  const ivaPayable = Math.max(0, ivaCharged - ivaCreditable);

  // Calculate monthly provisional payments
  const monthlyISR = isr / 12;
  const monthlyIVA = ivaPayable / 12;
  const monthlyTotal = monthlyISR + monthlyIVA;

  // Calculate effective tax rate
  const effectiveTaxRate = totalIncome > 0 ? (isr / totalIncome) * 100 : 0;

  // Generate monthly breakdown
  const monthlyBreakdown = [];
  const currentMonth = new Date().getMonth() + 1;
  
  for (let month = 1; month <= 12; month++) {
    const isPast = month < currentMonth;
    const monthIncome = isPast ? currentIncome / currentMonth : totalIncome / 12;
    const monthExpenses = isPast ? currentExpenses / currentMonth : totalExpenses / 12;
    
    monthlyBreakdown.push({
      month,
      month_name: getMonthName(month),
      income: Math.round(monthIncome * 100) / 100,
      expenses: Math.round(monthExpenses * 100) / 100,
      isr: Math.round(monthlyISR * 100) / 100,
      iva: Math.round(monthlyIVA * 100) / 100,
      total_tax: Math.round(monthlyTotal * 100) / 100,
      is_past: isPast
    });
  }

  // Calculate savings vs no deductions
  const isrWithoutDeductions = calculateISR(totalIncome, isrBrackets);
  const taxSavings = isrWithoutDeductions - isr;

  return getApiResponse({
    simulation: {
      year,
      current_data: {
        income: Math.round(currentIncome * 100) / 100,
        expenses: Math.round(currentExpenses * 100) / 100,
        deductible_expenses: Math.round(currentDeductibleExpenses * 100) / 100
      },
      projected_data: {
        income: projectedIncome,
        expenses: projectedExpenses
      },
      totals: {
        total_income: Math.round(totalIncome * 100) / 100,
        total_expenses: Math.round(totalExpenses * 100) / 100,
        total_deductible: Math.round(totalDeductibleExpenses * 100) / 100,
        taxable_base: Math.round(taxableBase * 100) / 100
      },
      taxes: {
        annual_isr: Math.round(isr * 100) / 100,
        annual_iva: Math.round(ivaPayable * 100) / 100,
        total_annual_tax: Math.round((isr + ivaPayable) * 100) / 100,
        effective_rate: Math.round(effectiveTaxRate * 100) / 100,
        monthly_isr: Math.round(monthlyISR * 100) / 100,
        monthly_iva: Math.round(monthlyIVA * 100) / 100,
        monthly_total: Math.round(monthlyTotal * 100) / 100
      },
      savings: {
        isr_without_deductions: Math.round(isrWithoutDeductions * 100) / 100,
        tax_savings: Math.round(taxSavings * 100) / 100,
        savings_percentage: totalIncome > 0 ? Math.round((taxSavings / totalIncome) * 10000) / 100 : 0
      },
      monthly_breakdown: monthlyBreakdown,
      config: {
        iva_rate: ivaRate,
        isr_brackets: isrBrackets
      }
    }
  });
}

/**
 * Get available fiscal configuration years
 */
async function getAvailableYears(env, userId) {
  const { results } = await env.DB.prepare(`
    SELECT DISTINCT year, is_active
    FROM fiscal_config
    WHERE user_id = ?
    ORDER BY year DESC
  `).bind(userId).all();

  return getApiResponse({ years: results });
}

/**
 * Calculate ISR based on income and brackets
 */
function calculateISR(income, brackets) {
  if (income <= 0) return 0;

  // Find applicable bracket
  let applicableBracket = brackets[0];
  for (const bracket of brackets) {
    if (income > bracket.lowerLimit) {
      applicableBracket = bracket;
    } else {
      break;
    }
  }

  // Calculate ISR
  const excess = income - applicableBracket.lowerLimit;
  const tax = applicableBracket.fixedFee + (excess * applicableBracket.rate);

  return Math.max(0, tax);
}

/**
 * Get month name in Spanish
 */
function getMonthName(month) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1];
}
