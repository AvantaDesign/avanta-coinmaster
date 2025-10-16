/**
 * Budgets API
 * Handles budget management for business and personal finances
 * 
 * Endpoints:
 * - GET    /api/budgets                 - List all budgets with optional filters
 * - GET    /api/budgets/:id             - Get budget by ID
 * - POST   /api/budgets                 - Create new budget
 * - PUT    /api/budgets/:id             - Update budget
 * - DELETE /api/budgets/:id             - Delete budget
 * - GET    /api/budgets/progress        - Get budget progress and comparisons
 * - GET    /api/budgets/summary         - Get budget summary by period
 */

import { getUserIdFromToken, authenticateRequest, validateRequired, generateId, getApiResponse } from './auth.js';
import Decimal from 'decimal.js';

/**
 * Main request handler
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/budgets', '');
  const method = request.method;

  try {
    // Authenticate user
    const userId = await authenticateRequest(request, env);

    // Route to appropriate handler
    if (path === '' || path === '/') {
      if (method === 'GET') return await listBudgets(env, userId, url);
      if (method === 'POST') return await createBudget(env, userId, request);
    }
    
    if (path === '/progress' && method === 'GET') {
      return await getBudgetProgress(env, userId, url);
    }

    if (path === '/summary' && method === 'GET') {
      return await getBudgetSummary(env, userId, url);
    }

    const idMatch = path.match(/^\/([^/]+)$/);
    if (idMatch) {
      const budgetId = idMatch[1];
      if (method === 'GET') return await getBudget(env, userId, budgetId);
      if (method === 'PUT') return await updateBudget(env, userId, budgetId, request);
      if (method === 'DELETE') return await deleteBudget(env, userId, budgetId);
    }

    return getApiResponse(null, 'Not found', 404);
  } catch (error) {
    console.error('Budgets API error:', error);
    return getApiResponse(null, error.message || 'Internal server error', error.status || 500);
  }
}

/**
 * List all budgets with optional filters
 */
async function listBudgets(env, userId, url) {
  const classification = url.searchParams.get('classification'); // 'business' or 'personal'
  const period = url.searchParams.get('period'); // 'monthly', 'quarterly', 'yearly'
  const categoryId = url.searchParams.get('category_id');
  const isActive = url.searchParams.get('is_active') !== 'false'; // Default true

  let query = `
    SELECT 
      b.*,
      c.name as category_name,
      c.color as category_color
    FROM budgets b
    LEFT JOIN categories c ON c.id = b.category_id
    WHERE b.user_id = ?
  `;
  const params = [userId];

  if (classification) {
    query += ' AND b.classification = ?';
    params.push(classification);
  }

  if (period) {
    query += ' AND b.period = ?';
    params.push(period);
  }

  if (categoryId) {
    query += ' AND b.category_id = ?';
    params.push(categoryId);
  }

  if (isActive) {
    query += ' AND b.is_active = 1';
  }

  query += ' ORDER BY b.classification, b.period, b.created_at DESC';

  const { results } = await env.DB.prepare(query).bind(...params).all();

  return getApiResponse({ budgets: results });
}

/**
 * Get budget by ID
 */
async function getBudget(env, userId, budgetId) {
  const query = `
    SELECT 
      b.*,
      c.name as category_name,
      c.color as category_color
    FROM budgets b
    LEFT JOIN categories c ON c.id = b.category_id
    WHERE b.id = ? AND b.user_id = ?
  `;

  const { results } = await env.DB.prepare(query).bind(budgetId, userId).all();

  if (!results || results.length === 0) {
    return getApiResponse(null, 'Budget not found', 404);
  }

  return getApiResponse({ budget: results[0] });
}

/**
 * Create new budget
 */
async function createBudget(env, userId, request) {
  const data = await request.json();

  // Validate required fields
  validateRequired(data, ['classification', 'amount', 'period', 'start_date']);

  // Validate values
  if (!['business', 'personal'].includes(data.classification)) {
    return getApiResponse(null, 'Invalid classification. Must be "business" or "personal"', 400);
  }

  if (!['monthly', 'quarterly', 'yearly'].includes(data.period)) {
    return getApiResponse(null, 'Invalid period. Must be "monthly", "quarterly", or "yearly"', 400);
  }

  if (data.amount <= 0) {
    return getApiResponse(null, 'Amount must be greater than 0', 400);
  }

  // Validate category if provided
  if (data.category_id) {
    const categoryCheck = await env.DB.prepare(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?'
    ).bind(data.category_id, userId).first();

    if (!categoryCheck) {
      return getApiResponse(null, 'Category not found', 404);
    }
  }

  const budgetId = generateId('budget');
  const now = new Date().toISOString();

  const query = `
    INSERT INTO budgets (
      id, user_id, category_id, classification, amount, period,
      start_date, end_date, is_active, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await env.DB.prepare(query).bind(
    budgetId,
    userId,
    data.category_id || null,
    data.classification,
    data.amount,
    data.period,
    data.start_date,
    data.end_date || null,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1,
    data.notes || null,
    now,
    now
  ).run();

  // Fetch the created budget with category info
  const { results } = await env.DB.prepare(`
    SELECT 
      b.*,
      c.name as category_name,
      c.color as category_color
    FROM budgets b
    LEFT JOIN categories c ON c.id = b.category_id
    WHERE b.id = ?
  `).bind(budgetId).all();

  return getApiResponse({ budget: results[0] }, 'Budget created successfully', 201);
}

/**
 * Update budget
 */
async function updateBudget(env, userId, budgetId, request) {
  const data = await request.json();

  // Check if budget exists and belongs to user
  const existing = await env.DB.prepare(
    'SELECT id FROM budgets WHERE id = ? AND user_id = ?'
  ).bind(budgetId, userId).first();

  if (!existing) {
    return getApiResponse(null, 'Budget not found', 404);
  }

  // Validate values if provided
  if (data.classification && !['business', 'personal'].includes(data.classification)) {
    return getApiResponse(null, 'Invalid classification', 400);
  }

  if (data.period && !['monthly', 'quarterly', 'yearly'].includes(data.period)) {
    return getApiResponse(null, 'Invalid period', 400);
  }

  if (data.amount !== undefined && data.amount <= 0) {
    return getApiResponse(null, 'Amount must be greater than 0', 400);
  }

  // Validate category if provided
  if (data.category_id) {
    const categoryCheck = await env.DB.prepare(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?'
    ).bind(data.category_id, userId).first();

    if (!categoryCheck) {
      return getApiResponse(null, 'Category not found', 404);
    }
  }

  // Build update query
  const updates = [];
  const params = [];

  if (data.category_id !== undefined) {
    updates.push('category_id = ?');
    params.push(data.category_id);
  }
  if (data.classification) {
    updates.push('classification = ?');
    params.push(data.classification);
  }
  if (data.amount !== undefined) {
    updates.push('amount = ?');
    params.push(data.amount);
  }
  if (data.period) {
    updates.push('period = ?');
    params.push(data.period);
  }
  if (data.start_date) {
    updates.push('start_date = ?');
    params.push(data.start_date);
  }
  if (data.end_date !== undefined) {
    updates.push('end_date = ?');
    params.push(data.end_date);
  }
  if (data.is_active !== undefined) {
    updates.push('is_active = ?');
    params.push(data.is_active ? 1 : 0);
  }
  if (data.notes !== undefined) {
    updates.push('notes = ?');
    params.push(data.notes);
  }

  if (updates.length === 0) {
    return getApiResponse(null, 'No fields to update', 400);
  }

  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(budgetId);
  params.push(userId);

  const query = `UPDATE budgets SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
  await env.DB.prepare(query).bind(...params).run();

  // Fetch updated budget
  const { results } = await env.DB.prepare(`
    SELECT 
      b.*,
      c.name as category_name,
      c.color as category_color
    FROM budgets b
    LEFT JOIN categories c ON c.id = b.category_id
    WHERE b.id = ?
  `).bind(budgetId).all();

  return getApiResponse({ budget: results[0] }, 'Budget updated successfully');
}

/**
 * Delete budget
 */
async function deleteBudget(env, userId, budgetId) {
  const result = await env.DB.prepare(
    'DELETE FROM budgets WHERE id = ? AND user_id = ?'
  ).bind(budgetId, userId).run();

  if (result.meta.changes === 0) {
    return getApiResponse(null, 'Budget not found', 404);
  }

  return getApiResponse({ id: budgetId }, 'Budget deleted successfully');
}

/**
 * Get budget progress - compare budgeted vs actual spending/income
 */
async function getBudgetProgress(env, userId, url) {
  const classification = url.searchParams.get('classification');
  const period = url.searchParams.get('period') || 'monthly';
  const startDate = url.searchParams.get('start_date') || new Date().toISOString().split('T')[0].substring(0, 7) + '-01';

  // Calculate end date based on period
  let endDate;
  const start = new Date(startDate);
  if (period === 'monthly') {
    endDate = new Date(start.getFullYear(), start.getMonth() + 1, 0).toISOString().split('T')[0];
  } else if (period === 'quarterly') {
    endDate = new Date(start.getFullYear(), start.getMonth() + 3, 0).toISOString().split('T')[0];
  } else {
    endDate = new Date(start.getFullYear(), 11, 31).toISOString().split('T')[0];
  }

  // Get all active budgets for the period
  let budgetQuery = `
    SELECT 
      b.*,
      c.name as category_name,
      c.color as category_color
    FROM budgets b
    LEFT JOIN categories c ON c.id = b.category_id
    WHERE b.user_id = ? 
      AND b.is_active = 1
      AND b.period = ?
      AND b.start_date <= ?
  `;
  const budgetParams = [userId, period, endDate];

  if (classification) {
    budgetQuery += ' AND b.classification = ?';
    budgetParams.push(classification);
  }

  const { results: budgets } = await env.DB.prepare(budgetQuery).bind(...budgetParams).all();

  // For each budget, calculate actual spending
  const progress = await Promise.all(budgets.map(async (budget) => {
    let actualQuery = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END), 0) as total_expense,
        COUNT(*) as transaction_count
      FROM transactions
      WHERE user_id = ?
        AND date >= ?
        AND date <= ?
        AND is_deleted = 0
    `;
    const actualParams = [userId, startDate, endDate];

    if (budget.category_id) {
      actualQuery += ' AND category_id = ?';
      actualParams.push(budget.category_id);
    }

    if (budget.classification === 'business') {
      actualQuery += ' AND transaction_type = ?';
      actualParams.push('business');
    } else if (budget.classification === 'personal') {
      actualQuery += ' AND transaction_type = ?';
      actualParams.push('personal');
    }

    const actual = await env.DB.prepare(actualQuery).bind(...actualParams).first();

    const actualAmount = new Decimal(actual.total_expense || 0);
    const budgetAmount = new Decimal(budget.amount);
    const percentUsed = budgetAmount.gt(0) ? actualAmount.div(budgetAmount).times(new Decimal(100)) : new Decimal(0);
    const remaining = budgetAmount.minus(actualAmount);
    const percentUsedNum = parseFloat(percentUsed.toFixed(2));
    const status = percentUsedNum >= 100 ? 'exceeded' : percentUsedNum >= 90 ? 'warning' : percentUsedNum >= 75 ? 'caution' : 'good';

    return {
      ...budget,
      actual: parseFloat(actualAmount.toFixed(2)),
      income: parseFloat(new Decimal(actual.total_income || 0).toFixed(2)),
      percent_used: percentUsedNum,
      remaining: parseFloat(remaining.toFixed(2)),
      status: status,
      transaction_count: actual.transaction_count || 0,
      start_date: startDate,
      end_date: endDate
    };
  }));

  // Calculate totals
  const totals = progress.reduce((acc, p) => ({
    total_budgeted: parseFloat(new Decimal(acc.total_budgeted).plus(new Decimal(p.amount)).toFixed(2)),
    total_actual: parseFloat(new Decimal(acc.total_actual).plus(new Decimal(p.actual)).toFixed(2)),
    total_remaining: parseFloat(new Decimal(acc.total_remaining).plus(new Decimal(p.remaining)).toFixed(2))
  }), { total_budgeted: 0, total_actual: 0, total_remaining: 0 });

  return getApiResponse({
    progress,
    totals,
    period,
    start_date: startDate,
    end_date: endDate
  });
}

/**
 * Get budget summary by period
 */
async function getBudgetSummary(env, userId, url) {
  const year = url.searchParams.get('year') || new Date().getFullYear();

  // Get all budgets for the year
  const { results: budgets } = await env.DB.prepare(`
    SELECT 
      classification,
      period,
      COUNT(*) as count,
      SUM(amount) as total_amount
    FROM budgets
    WHERE user_id = ?
      AND is_active = 1
      AND strftime('%Y', start_date) = ?
    GROUP BY classification, period
  `).bind(userId, year.toString()).all();

  // Get actual spending for the year
  const actual = await env.DB.prepare(`
    SELECT 
      transaction_type as classification,
      COALESCE(SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END), 0) as total_expense,
      COALESCE(SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END), 0) as total_income,
      COUNT(*) as transaction_count
    FROM transactions
    WHERE user_id = ?
      AND strftime('%Y', date) = ?
      AND is_deleted = 0
    GROUP BY transaction_type
  `).bind(userId, year.toString()).all();

  return getApiResponse({
    year,
    budgets,
    actual: actual.results || [],
    summary: {
      total_budgets: budgets.length,
      business_budgets: budgets.filter(b => b.classification === 'business').length,
      personal_budgets: budgets.filter(b => b.classification === 'personal').length
    }
  });
}
