// Fiscal API - Calculate ISR and IVA
// Phase 30: Monetary values stored as INTEGER cents in database

import { getUserIdFromToken } from './auth.js';
import Decimal from 'decimal.js';
import { 
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';
  fromCents, 
  fromCentsToDecimal
} from '../utils/monetary.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const month = parseInt(url.searchParams.get('month')) || new Date().getMonth() + 1;
  const year = parseInt(url.searchParams.get('year')) || new Date().getFullYear();
  const period = url.searchParams.get('period') || 'monthly'; // monthly, quarterly, annual
  const quarter = parseInt(url.searchParams.get('quarter')) || Math.ceil(month / 3);
  
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

    // Validate year
    if (year < 2000 || year > 2100) {
      return new Response(JSON.stringify({ 
        error: 'Invalid year',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    let firstDay, lastDay, dueDate;

    if (period === 'annual') {
      // Annual calculation
      firstDay = `${year}-01-01`;
      lastDay = `${year}-12-31`;
      dueDate = new Date(year + 1, 3, 30).toISOString().split('T')[0]; // April 30th next year
    } else if (period === 'quarterly') {
      // Quarterly calculation
      const quarterMonths = {
        1: { start: 0, end: 2 },
        2: { start: 3, end: 5 },
        3: { start: 6, end: 8 },
        4: { start: 9, end: 11 }
      };
      
      if (!quarterMonths[quarter]) {
        return new Response(JSON.stringify({ 
          error: 'Invalid quarter (must be 1-4)',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      firstDay = new Date(year, quarterMonths[quarter].start, 1).toISOString().split('T')[0];
      lastDay = new Date(year, quarterMonths[quarter].end + 1, 0).toISOString().split('T')[0];
      const quarterEndMonth = quarterMonths[quarter].end + 1;
      dueDate = new Date(year, quarterEndMonth + 1, 17).toISOString().split('T')[0];
    } else {
      // Monthly calculation
      if (month < 1 || month > 12) {
        return new Response(JSON.stringify({ 
          error: 'Invalid month (must be 1-12)',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
      lastDay = new Date(year, month, 0).toISOString().split('T')[0];
      dueDate = new Date(year, month, 17).toISOString().split('T')[0];
    }
    
    // Get income and deductible expenses for the period
    // Phase 30: Amounts are stored as INTEGER cents in database
    const summary = await env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN t.type = 'ingreso' AND (t.category = 'avanta' OR t.transaction_type = 'business') THEN t.amount ELSE 0 END) as business_income,
        SUM(CASE WHEN t.type = 'gasto' AND (t.category = 'avanta' OR t.transaction_type = 'business') THEN t.amount ELSE 0 END) as business_expenses,
        SUM(CASE WHEN t.type = 'gasto' AND (t.category = 'avanta' OR t.transaction_type = 'business') AND t.is_isr_deductible = 1 THEN t.amount ELSE 0 END) as isr_deductible,
        SUM(CASE WHEN t.type = 'gasto' AND (t.category = 'avanta' OR t.transaction_type = 'business') AND t.is_iva_deductible = 1 THEN t.amount ELSE 0 END) as iva_deductible,
        SUM(CASE WHEN t.type = 'ingreso' THEN t.amount ELSE 0 END) as total_income,
        SUM(CASE WHEN t.type = 'gasto' THEN t.amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN t.type = 'gasto' AND (t.category = 'personal' OR t.transaction_type = 'personal') THEN t.amount ELSE 0 END) as personal_expenses
      FROM transactions t
      WHERE t.user_id = ? AND t.date >= ? AND t.date <= ? AND t.is_deleted = 0
    `).bind(userId, firstDay, lastDay).first();
    
    // Phase 30: Convert cents to Decimal for precise financial calculations
    const businessIncome = fromCentsToDecimal(summary?.business_income || 0);
    const businessExpenses = fromCentsToDecimal(summary?.business_expenses || 0);
    const isrDeductible = fromCentsToDecimal(summary?.isr_deductible || 0);
    const ivaDeductible = fromCentsToDecimal(summary?.iva_deductible || 0);
    const totalIncome = fromCentsToDecimal(summary?.total_income || 0);
    const totalExpenses = fromCentsToDecimal(summary?.total_expenses || 0);
    const personalExpenses = fromCentsToDecimal(summary?.personal_expenses || 0);
    
    const utilidad = businessIncome.minus(isrDeductible);
    
    // Calculate ISR using Mexican tax brackets
    const isr = calculateISR(utilidad);
    
    // Calculate IVA (16%)
    const ivaCobrado = businessIncome.times(new Decimal('0.16'));
    const ivaPagado = ivaDeductible.times(new Decimal('0.16'));
    const iva = Decimal.max(new Decimal(0), ivaCobrado.minus(ivaPagado));
    const ivaAFavor = Decimal.max(new Decimal(0), ivaPagado.minus(ivaCobrado));
    
    // Calculate deductible percentage for ISR
    const isrDeductiblePercentage = businessExpenses.gt(0) 
      ? isrDeductible.div(businessExpenses).times(new Decimal(100)) 
      : new Decimal(0);
      
    // Calculate deductible percentage for IVA
    const ivaDeductiblePercentage = businessExpenses.gt(0) 
      ? ivaDeductible.div(businessExpenses).times(new Decimal(100)) 
      : new Decimal(0);
    
    const response = {
      period,
      year,
      ...(period === 'monthly' && { month }),
      ...(period === 'quarterly' && { quarter }),
      totalIncome: parseFloat(totalIncome.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      businessIncome: parseFloat(businessIncome.toFixed(2)),
      businessExpenses: parseFloat(businessExpenses.toFixed(2)),
      personalExpenses: parseFloat(personalExpenses.toFixed(2)),
      isrDeductibleExpenses: parseFloat(isrDeductible.toFixed(2)),
      ivaDeductibleExpenses: parseFloat(ivaDeductible.toFixed(2)),
      isrDeductiblePercentage: parseFloat(isrDeductiblePercentage.toFixed(2)),
      ivaDeductiblePercentage: parseFloat(ivaDeductiblePercentage.toFixed(2)),
      utilidad: parseFloat(utilidad.toFixed(2)),
      isr: parseFloat(isr.toFixed(2)),
      iva: parseFloat(iva.toFixed(2)),
      ivaDetails: {
        ivaCobrado: parseFloat(ivaCobrado.toFixed(2)),
        ivaPagado: parseFloat(ivaPagado.toFixed(2)),
        ivaAPagar: parseFloat(iva.toFixed(2)),
        ivaAFavor: parseFloat(ivaAFavor.toFixed(2)),
        rate: 16
      },
      effectiveRate: utilidad.gt(0) ? parseFloat(isr.div(utilidad).times(new Decimal(100)).toFixed(2)) : 0,
      dueDate
    };
    
    return new Response(JSON.stringify(response), {
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Fiscal GET error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to calculate fiscal data',
      message: error.message,
      code: 'CALCULATION_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// ISR calculation using Mexican tax brackets
function calculateISR(taxableIncome) {
  // Convert to Decimal if not already
  const income = taxableIncome instanceof Decimal ? taxableIncome : new Decimal(taxableIncome);
  
  if (income.lte(0)) return new Decimal(0);

  const brackets = [
    { min: 0, max: 7735.00, rate: 0.0192, fixedFee: 0, lowerLimit: 0 },
    { min: 7735.01, max: 65651.07, rate: 0.0640, fixedFee: 148.51, lowerLimit: 7735.00 },
    { min: 65651.08, max: 115375.90, rate: 0.1088, fixedFee: 3855.14, lowerLimit: 65651.07 },
    { min: 115375.91, max: 134119.41, rate: 0.1600, fixedFee: 9265.20, lowerLimit: 115375.90 },
    { min: 134119.42, max: 160577.65, rate: 0.1792, fixedFee: 12264.16, lowerLimit: 134119.41 },
    { min: 160577.66, max: 323862.00, rate: 0.2136, fixedFee: 17005.47, lowerLimit: 160577.65 },
    { min: 323862.01, max: 510451.00, rate: 0.2352, fixedFee: 51883.01, lowerLimit: 323862.00 },
    { min: 510451.01, max: 974535.03, rate: 0.3000, fixedFee: 95768.74, lowerLimit: 510451.00 },
    { min: 974535.04, max: 1299380.04, rate: 0.3200, fixedFee: 234993.95, lowerLimit: 974535.03 },
    { min: 1299380.05, max: 3898140.12, rate: 0.3400, fixedFee: 338944.34, lowerLimit: 1299380.04 },
    { min: 3898140.13, max: Infinity, rate: 0.3500, fixedFee: 1222522.76, lowerLimit: 3898140.12 }
  ];

  const bracket = brackets.find(b => income.gte(b.min) && income.lte(b.max));
  
  if (!bracket) {
    const lastBracket = brackets[brackets.length - 1];
    return income.minus(new Decimal(lastBracket.lowerLimit))
      .times(new Decimal(lastBracket.rate))
      .plus(new Decimal(lastBracket.fixedFee));
  }

  return new Decimal(bracket.fixedFee)
    .plus(income.minus(new Decimal(bracket.lowerLimit)).times(new Decimal(bracket.rate)));
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
