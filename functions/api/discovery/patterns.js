/**
 * Pattern Discovery API - Phase 50: Advanced Search & Filtering
 * Detects patterns in financial data for insights and recommendations
 */

import { getUserIdFromToken } from '../auth.js';
import { logInfo, logError } from '../../utils/logging.js';
import { getCacheKey, getFromCache, setInCache } from '../../utils/cache.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
 * GET /api/discovery/patterns - Detect patterns in transactions
 * Query params:
 *   - type: Pattern type (spending, recurring, seasonal, anomaly)
 *   - period: Time period (month, quarter, year)
 */
async function detectPatterns(request, env) {
  try {
    const url = new URL(request.url);
    const patternType = url.searchParams.get('type') || 'all';
    const period = url.searchParams.get('period') || 'month';
    const { userId } = request;

    // Check cache
    const cacheKey = getCacheKey('patterns', userId, `${patternType}-${period}`);
    const cached = await getFromCache(cacheKey, env);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { ...corsHeaders, 'X-Cache': 'HIT' }
      });
    }

    const patterns = {};

    // Detect spending patterns
    if (patternType === 'all' || patternType === 'spending') {
      patterns.spending = await detectSpendingPatterns(env, userId, period);
    }

    // Detect recurring transactions
    if (patternType === 'all' || patternType === 'recurring') {
      patterns.recurring = await detectRecurringTransactions(env, userId);
    }

    // Detect seasonal patterns
    if (patternType === 'all' || patternType === 'seasonal') {
      patterns.seasonal = await detectSeasonalPatterns(env, userId);
    }

    // Detect anomalies
    if (patternType === 'all' || patternType === 'anomaly') {
      patterns.anomalies = await detectAnomalies(env, userId, period);
    }

    // Cache for 1 hour
    await setInCache(cacheKey, patterns, env, 3600);

    await logInfo('Pattern detection completed', { 
      patternType, 
      period, 
      userId 
    }, env);

    return new Response(JSON.stringify(patterns), {
      status: 200,
      headers: { ...corsHeaders, 'X-Cache': 'MISS' }
    });
  } catch (error) {
    await logError(error, { endpoint: 'discovery/patterns', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error al detectar patrones',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Detect spending patterns by category
 */
async function detectSpendingPatterns(env, userId, period) {
  try {
    const daysMap = {
      month: 30,
      quarter: 90,
      year: 365
    };
    const days = daysMap[period] || 30;

    const query = `
      SELECT 
        c.name as category,
        COUNT(*) as transaction_count,
        SUM(t.amount) as total_amount,
        AVG(t.amount) as avg_amount,
        MIN(t.amount) as min_amount,
        MAX(t.amount) as max_amount,
        strftime('%w', t.date) as day_of_week,
        COUNT(DISTINCT strftime('%Y-%m', t.date)) as months_present
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ? 
        AND t.date >= date('now', '-${days} days')
        AND t.transaction_type = 'gasto'
      GROUP BY c.id, c.name
      HAVING transaction_count >= 3
      ORDER BY total_amount DESC
      LIMIT 10
    `;

    const result = await env.DB.prepare(query).bind(userId).all();

    return (result.results || []).map(row => ({
      category: row.category || 'Sin categoría',
      frequency: row.transaction_count,
      total: parseFloat(row.total_amount),
      average: parseFloat(row.avg_amount),
      min: parseFloat(row.min_amount),
      max: parseFloat(row.max_amount),
      consistency: row.months_present,
      pattern_type: 'spending'
    }));
  } catch (error) {
    await logError(error, { context: 'detectSpendingPatterns' }, env);
    return [];
  }
}

/**
 * Detect recurring transactions
 */
async function detectRecurringTransactions(env, userId) {
  try {
    // Find transactions with similar amounts and descriptions that occur regularly
    const query = `
      SELECT 
        t.description,
        c.name as category,
        AVG(t.amount) as avg_amount,
        COUNT(*) as occurrence_count,
        MIN(t.date) as first_date,
        MAX(t.date) as last_date,
        AVG(julianday(t.date) - julianday(LAG(t.date) OVER (PARTITION BY t.description ORDER BY t.date))) as avg_days_between
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
        AND t.date >= date('now', '-180 days')
      GROUP BY t.description, c.id
      HAVING occurrence_count >= 3
        AND avg_days_between IS NOT NULL
        AND avg_days_between BETWEEN 20 AND 40
      ORDER BY occurrence_count DESC
      LIMIT 10
    `;

    const result = await env.DB.prepare(query).bind(userId).all();

    return (result.results || []).map(row => ({
      description: row.description,
      category: row.category || 'Sin categoría',
      amount: parseFloat(row.avg_amount),
      frequency: row.occurrence_count,
      interval_days: Math.round(row.avg_days_between),
      first_occurrence: row.first_date,
      last_occurrence: row.last_date,
      pattern_type: 'recurring'
    }));
  } catch (error) {
    await logError(error, { context: 'detectRecurringTransactions' }, env);
    return [];
  }
}

/**
 * Detect seasonal patterns
 */
async function detectSeasonalPatterns(env, userId) {
  try {
    const query = `
      SELECT 
        strftime('%m', date) as month,
        c.name as category,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
        AND t.date >= date('now', '-730 days')
        AND t.transaction_type = 'gasto'
      GROUP BY month, c.id
      HAVING transaction_count >= 2
      ORDER BY month, total_amount DESC
    `;

    const result = await env.DB.prepare(query).bind(userId).all();

    // Identify months with significantly higher spending
    const monthlyTotals = {};
    (result.results || []).forEach(row => {
      const month = parseInt(row.month);
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = 0;
      }
      monthlyTotals[month] += parseFloat(row.total_amount);
    });

    const avgMonthly = Object.values(monthlyTotals).reduce((a, b) => a + b, 0) / Object.keys(monthlyTotals).length;
    
    const patterns = [];
    Object.entries(monthlyTotals).forEach(([month, total]) => {
      if (total > avgMonthly * 1.3) {
        const monthName = new Date(2000, parseInt(month) - 1, 1).toLocaleString('es-MX', { month: 'long' });
        patterns.push({
          month: monthName,
          month_number: parseInt(month),
          total_spending: total,
          average_spending: avgMonthly,
          variance_percent: ((total / avgMonthly - 1) * 100).toFixed(1),
          pattern_type: 'seasonal'
        });
      }
    });

    return patterns;
  } catch (error) {
    await logError(error, { context: 'detectSeasonalPatterns' }, env);
    return [];
  }
}

/**
 * Detect anomalies (unusual transactions)
 */
async function detectAnomalies(env, userId, period) {
  try {
    const daysMap = {
      month: 30,
      quarter: 90,
      year: 365
    };
    const days = daysMap[period] || 30;

    // Get average transaction amounts by category
    const avgQuery = `
      SELECT 
        category_id,
        AVG(amount) as avg_amount,
        AVG(amount) + (2 * STDEV(amount)) as upper_threshold
      FROM transactions
      WHERE user_id = ?
        AND date >= date('now', '-${days * 2} days')
        AND date < date('now', '-${days} days')
      GROUP BY category_id
      HAVING COUNT(*) >= 5
    `;

    const avgResult = await env.DB.prepare(avgQuery).bind(userId).all();
    const thresholds = {};
    (avgResult.results || []).forEach(row => {
      thresholds[row.category_id] = {
        avg: parseFloat(row.avg_amount),
        threshold: parseFloat(row.upper_threshold)
      };
    });

    // Find recent transactions that exceed thresholds
    const anomalyQuery = `
      SELECT 
        t.id,
        t.date,
        t.amount,
        t.description,
        c.name as category,
        t.category_id
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
        AND t.date >= date('now', '-${days} days')
      ORDER BY t.date DESC
    `;

    const result = await env.DB.prepare(anomalyQuery).bind(userId).all();

    const anomalies = [];
    (result.results || []).forEach(row => {
      const threshold = thresholds[row.category_id];
      if (threshold && parseFloat(row.amount) > threshold.threshold) {
        anomalies.push({
          id: row.id,
          date: row.date,
          amount: parseFloat(row.amount),
          description: row.description,
          category: row.category || 'Sin categoría',
          expected_amount: threshold.avg,
          deviation_percent: ((parseFloat(row.amount) / threshold.avg - 1) * 100).toFixed(1),
          pattern_type: 'anomaly'
        });
      }
    });

    return anomalies.slice(0, 10);
  } catch (error) {
    await logError(error, { context: 'detectAnomalies' }, env);
    return [];
  }
}

/**
 * Main handler
 */
export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  // Verify authentication
  const userId = await getUserIdFromToken(request, env);
  if (!userId) {
    return new Response(JSON.stringify({ 
      error: 'No autenticado',
      message: 'Token de autenticación requerido',
      code: 'AUTH_REQUIRED'
    }), {
      status: 401,
      headers: corsHeaders
    });
  }

  // Attach userId to request
  request.userId = userId;

  try {
    if (method === 'GET') {
      return detectPatterns(request, env);
    }

    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'discovery/patterns', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
