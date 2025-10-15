// Fiscal API - Calculate ISR and IVA

import { getUserIdFromToken } from './auth.js';

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
    const summary = await env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'ingreso' AND (category = 'avanta' OR transaction_type = 'business') THEN amount ELSE 0 END) as business_income,
        SUM(CASE WHEN type = 'gasto' AND (category = 'avanta' OR transaction_type = 'business') THEN amount ELSE 0 END) as business_expenses,
        SUM(CASE WHEN type = 'gasto' AND (category = 'avanta' OR transaction_type = 'business') AND is_deductible = 1 THEN amount ELSE 0 END) as deductible,
        SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END) as total_expenses,
        SUM(CASE WHEN type = 'gasto' AND (category = 'personal' OR transaction_type = 'personal') THEN amount ELSE 0 END) as personal_expenses
      FROM transactions
      WHERE user_id = ? AND date >= ? AND date <= ? AND is_deleted = 0
    `).bind(userId, firstDay, lastDay).first();
    
    const businessIncome = summary?.business_income || 0;
    const businessExpenses = summary?.business_expenses || 0;
    const deductible = summary?.deductible || 0;
    const totalIncome = summary?.total_income || 0;
    const totalExpenses = summary?.total_expenses || 0;
    const personalExpenses = summary?.personal_expenses || 0;
    
    const utilidad = businessIncome - deductible;
    
    // Calculate ISR using Mexican tax brackets
    const isr = calculateISR(utilidad);
    
    // Calculate IVA (16%)
    const ivaCobrado = businessIncome * 0.16;
    const ivaPagado = deductible * 0.16;
    const iva = Math.max(0, ivaCobrado - ivaPagado);
    const ivaAFavor = Math.max(0, ivaPagado - ivaCobrado);
    
    // Calculate deductible percentage
    const deductiblePercentage = businessExpenses > 0 ? (deductible / businessExpenses) * 100 : 0;
    
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
      deductibleExpenses: parseFloat(deductible.toFixed(2)),
      deductiblePercentage: parseFloat(deductiblePercentage.toFixed(2)),
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
      effectiveRate: utilidad > 0 ? parseFloat(((isr / utilidad) * 100).toFixed(2)) : 0,
      dueDate
    };
    
    return new Response(JSON.stringify(response), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Fiscal GET error:', error);
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
  if (taxableIncome <= 0) return 0;

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

  const bracket = brackets.find(b => taxableIncome >= b.min && taxableIncome <= b.max);
  
  if (!bracket) {
    const lastBracket = brackets[brackets.length - 1];
    return (taxableIncome - lastBracket.lowerLimit) * lastBracket.rate + lastBracket.fixedFee;
  }

  return bracket.fixedFee + (taxableIncome - bracket.lowerLimit) * bracket.rate;
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
