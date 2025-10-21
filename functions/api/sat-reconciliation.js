// SAT Reconciliation API - Compare app data with SAT declarations
// Endpoints:
// GET /api/sat-reconciliation/:year/:month - Get reconciliation data
// POST /api/sat-reconciliation/declaration - Save SAT declaration
// PUT /api/sat-reconciliation/declaration/:id - Update declaration
// GET /api/sat-reconciliation/discrepancies - List all discrepancies

import { getUserIdFromToken } from './auth.js';
import Decimal from 'decimal.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// GET /api/sat-reconciliation/:year/:month - Get reconciliation data
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

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

    // Check if requesting discrepancies list
    if (path.includes('/discrepancies')) {
      return handleGetDiscrepancies(env, userId, url);
    }

    // Parse year and month from path
    const pathParts = path.split('/');
    const year = parseInt(pathParts[pathParts.length - 2]);
    const month = parseInt(pathParts[pathParts.length - 1]);

    if (!year || !month || month < 1 || month > 12) {
      return new Response(JSON.stringify({ 
        error: 'Invalid year or month',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Calculate date range
    const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0];

    // Get app calculated data
    const summary = await env.DB.prepare(`
      SELECT 
        SUM(CASE WHEN t.type = 'ingreso' AND (t.category = 'avanta' OR t.transaction_type = 'business') THEN t.amount ELSE 0 END) as business_income,
        SUM(CASE WHEN t.type = 'gasto' AND (t.category = 'avanta' OR t.transaction_type = 'business') THEN t.amount ELSE 0 END) as business_expenses,
        SUM(CASE WHEN t.type = 'gasto' AND (t.category = 'avanta' OR t.transaction_type = 'business') AND COALESCE(c.is_deductible, 0) = 1 THEN t.amount ELSE 0 END) as deductible
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? AND t.date >= ? AND t.date <= ? AND t.is_deleted = 0
    `).bind(userId, firstDay, lastDay).first();

    const businessIncome = new Decimal(summary?.business_income || 0);
    const deductible = new Decimal(summary?.deductible || 0);
    const utilidad = businessIncome.minus(deductible);

    // Calculate ISR (using hardcoded brackets for now, will be updated with dynamic parameters)
    const isr = calculateISR(utilidad);

    // Calculate IVA
    const ivaCobrado = businessIncome.times(new Decimal('0.16'));
    const ivaPagado = deductible.times(new Decimal('0.16'));
    const iva = Decimal.max(new Decimal(0), ivaCobrado.minus(ivaPagado));

    const appData = {
      businessIncome: parseFloat(businessIncome.toFixed(2)),
      businessExpenses: parseFloat((summary?.business_expenses || 0)),
      deductibleExpenses: parseFloat(deductible.toFixed(2)),
      utilidad: parseFloat(utilidad.toFixed(2)),
      isr: parseFloat(isr.toFixed(2)),
      iva: parseFloat(iva.toFixed(2)),
      ivaDetails: {
        ivaCobrado: parseFloat(ivaCobrado.toFixed(2)),
        ivaPagado: parseFloat(ivaPagado.toFixed(2)),
      }
    };

    // Get SAT declarations
    const declarations = await env.DB.prepare(`
      SELECT *
      FROM sat_declarations
      WHERE user_id = ? AND year = ? AND month = ?
      ORDER BY declaration_type
    `).bind(userId, year, month).all();

    // Compare data
    const comparisons = {};
    for (const declaration of declarations.results || []) {
      comparisons[declaration.declaration_type] = compareWithDeclaration(appData, declaration);
    }

    return new Response(JSON.stringify({ 
      period: { year, month },
      appData,
      declarations: declarations.results || [],
      comparisons,
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'SAT Reconciliation GET error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to get reconciliation data',
      message: error.message,
      code: 'FETCH_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// POST /api/sat-reconciliation/declaration - Save SAT declaration
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
    const {
      year,
      month,
      declaration_type,
      declared_income = 0,
      declared_expenses = 0,
      declared_isr = 0,
      declared_iva = 0,
      declaration_date,
      status = 'pending',
      sat_acknowledgment,
      notes,
    } = body;

    // Validation
    if (!year || !month || !declaration_type) {
      return new Response(JSON.stringify({ 
        error: 'Year, month, and declaration_type are required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (month < 1 || month > 12) {
      return new Response(JSON.stringify({ 
        error: 'Month must be between 1 and 12',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const validTypes = ['isr', 'iva', 'diot', 'annual'];
    if (!validTypes.includes(declaration_type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid declaration_type',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const declarationId = `decl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert or update declaration
    await env.DB.prepare(`
      INSERT INTO sat_declarations (
        id, user_id, year, month, declaration_type,
        declared_income, declared_expenses, declared_isr, declared_iva,
        declaration_date, status, sat_acknowledgment, notes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, year, month, declaration_type) DO UPDATE SET
        declared_income = excluded.declared_income,
        declared_expenses = excluded.declared_expenses,
        declared_isr = excluded.declared_isr,
        declared_iva = excluded.declared_iva,
        declaration_date = excluded.declaration_date,
        status = excluded.status,
        sat_acknowledgment = excluded.sat_acknowledgment,
        notes = excluded.notes,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      declarationId,
      userId,
      year,
      month,
      declaration_type,
      declared_income,
      declared_expenses,
      declared_isr,
      declared_iva,
      declaration_date,
      status,
      sat_acknowledgment,
      notes
    ).run();

    return new Response(JSON.stringify({ 
      success: true,
      declarationId,
      message: 'Declaration saved successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'SAT Declaration POST error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to save declaration',
      message: error.message,
      code: 'SAVE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// PUT /api/sat-reconciliation/declaration/:id - Update declaration
export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

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

    const pathParts = path.split('/');
    const declarationId = pathParts[pathParts.length - 1];

    if (!declarationId) {
      return new Response(JSON.stringify({ 
        error: 'Declaration ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    const {
      declared_income,
      declared_expenses,
      declared_isr,
      declared_iva,
      declaration_date,
      status,
      sat_acknowledgment,
      notes,
    } = body;

    // Build update query dynamically based on provided fields
    const updates = [];
    const bindings = [];

    if (declared_income !== undefined) {
      updates.push('declared_income = ?');
      bindings.push(declared_income);
    }
    if (declared_expenses !== undefined) {
      updates.push('declared_expenses = ?');
      bindings.push(declared_expenses);
    }
    if (declared_isr !== undefined) {
      updates.push('declared_isr = ?');
      bindings.push(declared_isr);
    }
    if (declared_iva !== undefined) {
      updates.push('declared_iva = ?');
      bindings.push(declared_iva);
    }
    if (declaration_date !== undefined) {
      updates.push('declaration_date = ?');
      bindings.push(declaration_date);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      bindings.push(status);
    }
    if (sat_acknowledgment !== undefined) {
      updates.push('sat_acknowledgment = ?');
      bindings.push(sat_acknowledgment);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      bindings.push(notes);
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
    bindings.push(declarationId, userId);

    await env.DB.prepare(`
      UPDATE sat_declarations
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...bindings).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Declaration updated successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'SAT Declaration PUT error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to update declaration',
      message: error.message,
      code: 'UPDATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Helper: Get all discrepancies
async function handleGetDiscrepancies(env, userId, url) {
  try {
    const year = parseInt(url.searchParams.get('year')) || new Date().getFullYear();
    const month = url.searchParams.get('month') ? parseInt(url.searchParams.get('month')) : null;

    let query = `
      SELECT *
      FROM sat_declarations
      WHERE user_id = ? AND year = ?
    `;
    const bindings = [userId, year];

    if (month) {
      query += ' AND month = ?';
      bindings.push(month);
    }

    query += ' ORDER BY year DESC, month DESC, declaration_type';

    const declarations = await env.DB.prepare(query).bind(...bindings).all();

    const discrepancies = [];

    // For each declaration, calculate app data and compare
    for (const declaration of declarations.results || []) {
      const firstDay = new Date(declaration.year, declaration.month - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(declaration.year, declaration.month, 0).toISOString().split('T')[0];

      const summary = await env.DB.prepare(`
        SELECT 
          SUM(CASE WHEN t.type = 'ingreso' AND (t.category = 'avanta' OR t.transaction_type = 'business') THEN t.amount ELSE 0 END) as business_income,
          SUM(CASE WHEN t.type = 'gasto' AND (t.category = 'avanta' OR t.transaction_type = 'business') AND COALESCE(c.is_deductible, 0) = 1 THEN t.amount ELSE 0 END) as deductible
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND t.date >= ? AND t.date <= ? AND t.is_deleted = 0
      `).bind(userId, firstDay, lastDay).first();

      const businessIncome = new Decimal(summary?.business_income || 0);
      const deductible = new Decimal(summary?.deductible || 0);
      const utilidad = businessIncome.minus(deductible);
      const isr = calculateISR(utilidad);
      const ivaCobrado = businessIncome.times(new Decimal('0.16'));
      const ivaPagado = deductible.times(new Decimal('0.16'));
      const iva = Decimal.max(new Decimal(0), ivaCobrado.minus(ivaPagado));

      const appData = {
        businessIncome: parseFloat(businessIncome.toFixed(2)),
        deductibleExpenses: parseFloat(deductible.toFixed(2)),
        isr: parseFloat(isr.toFixed(2)),
        iva: parseFloat(iva.toFixed(2)),
      };

      const comparison = compareWithDeclaration(appData, declaration);
      
      if (comparison.hasDiscrepancies) {
        discrepancies.push({
          period: `${declaration.month}/${declaration.year}`,
          declarationType: declaration.declaration_type,
          ...comparison,
        });
      }
    }

    return new Response(JSON.stringify({ 
      year,
      month,
      discrepancies,
      total: discrepancies.length,
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Get discrepancies error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to get discrepancies',
      message: error.message,
      code: 'FETCH_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Helper: Compare app data with declaration
function compareWithDeclaration(appData, declaration) {
  const fields = [
    { name: 'income', appValue: appData.businessIncome, satValue: declaration.declared_income },
    { name: 'expenses', appValue: appData.deductibleExpenses, satValue: declaration.declared_expenses },
    { name: 'isr', appValue: appData.isr, satValue: declaration.declared_isr },
    { name: 'iva', appValue: appData.iva, satValue: declaration.declared_iva },
  ];

  const discrepancies = [];
  let hasDiscrepancies = false;

  for (const field of fields) {
    const app = new Decimal(field.appValue || 0);
    const sat = new Decimal(field.satValue || 0);
    const difference = app.minus(sat);
    const absDifference = difference.abs();

    // Tolerance: 0.01 MXN
    if (absDifference.gt(0.01)) {
      hasDiscrepancies = true;
      
      let percentageDiff = new Decimal(0);
      if (!sat.isZero()) {
        percentageDiff = absDifference.div(sat).times(100);
      } else if (!app.isZero()) {
        percentageDiff = new Decimal(100);
      }

      let severity = 'minor';
      if (absDifference.gte(1000) || percentageDiff.gte(10)) {
        severity = 'critical';
      } else if (absDifference.gte(100) || percentageDiff.gte(5)) {
        severity = 'warning';
      }

      discrepancies.push({
        field: field.name,
        appValue: parseFloat(app.toFixed(2)),
        satValue: parseFloat(sat.toFixed(2)),
        difference: parseFloat(difference.toFixed(2)),
        percentageDiff: parseFloat(percentageDiff.toFixed(2)),
        severity,
      });
    }
  }

  return {
    hasDiscrepancies,
    discrepancies,
    criticalCount: discrepancies.filter(d => d.severity === 'critical').length,
    warningCount: discrepancies.filter(d => d.severity === 'warning').length,
  };
}

// Helper: Calculate ISR (using default brackets)
function calculateISR(taxableIncome) {
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
