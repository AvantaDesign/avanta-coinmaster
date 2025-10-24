/**
 * Duplicate Detection API - Phase 50: Advanced Search & Filtering
 * Detects potential duplicate transactions for data quality
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
 * GET /api/discovery/duplicates - Detect potential duplicate transactions
 * Query params:
 *   - entity_type: Type of entity (transaction, invoice) - default: transaction
 *   - threshold: Similarity threshold 0-1 (default: 0.8)
 *   - days: Look back days (default: 30)
 */
async function detectDuplicates(request, env) {
  try {
    const url = new URL(request.url);
    const entityType = url.searchParams.get('entity_type') || 'transaction';
    const threshold = parseFloat(url.searchParams.get('threshold') || '0.8');
    const days = parseInt(url.searchParams.get('days') || '30');
    const { userId } = request;

    // Check cache
    const cacheKey = getCacheKey('duplicates', userId, `${entityType}-${threshold}-${days}`);
    const cached = await getFromCache(cacheKey, env);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { ...corsHeaders, 'X-Cache': 'HIT' }
      });
    }

    let duplicates = [];

    switch (entityType) {
      case 'transaction':
        duplicates = await detectDuplicateTransactions(env, userId, threshold, days);
        break;
      case 'invoice':
        duplicates = await detectDuplicateInvoices(env, userId, threshold, days);
        break;
      default:
        return new Response(JSON.stringify({ 
          error: 'Tipo de entidad no soportado' 
        }), {
          status: 400,
          headers: corsHeaders
        });
    }

    const result = {
      entity_type: entityType,
      threshold,
      days,
      duplicate_groups: duplicates,
      total_duplicates: duplicates.reduce((sum, group) => sum + group.items.length, 0),
      groups_count: duplicates.length
    };

    // Cache for 30 minutes
    await setInCache(cacheKey, result, env, 1800);

    await logInfo('Duplicate detection completed', { 
      entityType, 
      groupsCount: duplicates.length,
      userId 
    }, env);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'X-Cache': 'MISS' }
    });
  } catch (error) {
    await logError(error, { endpoint: 'discovery/duplicates', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error al detectar duplicados',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Detect duplicate transactions
 */
async function detectDuplicateTransactions(env, userId, threshold, days) {
  try {
    // Find transactions with same/similar:
    // 1. Amount (exact match within 1 cent)
    // 2. Date (within 3 days)
    // 3. Description (exact or very similar)
    // 4. Category (same)
    const query = `
      SELECT 
        t1.id as id1,
        t1.date as date1,
        t1.amount as amount1,
        t1.description as desc1,
        t1.transaction_type as type1,
        c1.name as category1,
        t2.id as id2,
        t2.date as date2,
        t2.amount as amount2,
        t2.description as desc2,
        t2.transaction_type as type2,
        c2.name as category2,
        ABS(julianday(t1.date) - julianday(t2.date)) as days_apart,
        ABS(t1.amount - t2.amount) as amount_diff
      FROM transactions t1
      INNER JOIN transactions t2 ON t1.id < t2.id
      LEFT JOIN categories c1 ON t1.category_id = c1.id
      LEFT JOIN categories c2 ON t2.category_id = c2.id
      WHERE t1.user_id = ?
        AND t2.user_id = ?
        AND t1.date >= date('now', '-${days} days')
        AND t2.date >= date('now', '-${days} days')
        AND ABS(t1.amount - t2.amount) < 0.01
        AND ABS(julianday(t1.date) - julianday(t2.date)) <= 3
        AND (
          t1.description = t2.description
          OR (
            LENGTH(t1.description) > 10 
            AND LENGTH(t2.description) > 10
            AND LOWER(t1.description) LIKE '%' || LOWER(SUBSTR(t2.description, 1, 10)) || '%'
          )
        )
      ORDER BY t1.date DESC, t1.amount DESC
    `;

    const result = await env.DB.prepare(query).bind(userId, userId).all();

    // Group duplicates
    const groups = {};
    (result.results || []).forEach(row => {
      const groupKey = `${row.amount1}_${row.desc1}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          group_id: groupKey,
          items: [],
          confidence: 0,
          reasons: []
        };
      }

      // Calculate confidence
      let confidence = 0;
      const reasons = [];

      // Exact amount match
      if (row.amount_diff < 0.01) {
        confidence += 0.4;
        reasons.push('Mismo monto');
      }

      // Close date match
      if (row.days_apart <= 1) {
        confidence += 0.3;
        reasons.push('Fechas muy cercanas');
      } else if (row.days_apart <= 3) {
        confidence += 0.2;
        reasons.push('Fechas cercanas');
      }

      // Same description
      if (row.desc1 === row.desc2) {
        confidence += 0.3;
        reasons.push('Misma descripción');
      } else {
        confidence += 0.15;
        reasons.push('Descripción similar');
      }

      // Same category
      if (row.category1 === row.category2) {
        confidence += 0.1;
        reasons.push('Misma categoría');
      }

      if (confidence >= threshold) {
        groups[groupKey].confidence = Math.max(groups[groupKey].confidence, confidence);
        groups[groupKey].reasons = reasons;

        // Add both transactions if not already in group
        const existing1 = groups[groupKey].items.find(item => item.id === row.id1);
        if (!existing1) {
          groups[groupKey].items.push({
            id: row.id1,
            date: row.date1,
            amount: parseFloat(row.amount1),
            description: row.desc1,
            category: row.category1,
            transaction_type: row.type1
          });
        }

        const existing2 = groups[groupKey].items.find(item => item.id === row.id2);
        if (!existing2) {
          groups[groupKey].items.push({
            id: row.id2,
            date: row.date2,
            amount: parseFloat(row.amount2),
            description: row.desc2,
            category: row.category2,
            transaction_type: row.type2
          });
        }
      }
    });

    // Filter groups with at least 2 items
    return Object.values(groups)
      .filter(group => group.items.length >= 2)
      .sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    await logError(error, { context: 'detectDuplicateTransactions' }, env);
    return [];
  }
}

/**
 * Detect duplicate invoices
 */
async function detectDuplicateInvoices(env, userId, threshold, days) {
  try {
    const query = `
      SELECT 
        i1.id as id1,
        i1.invoice_number as num1,
        i1.date as date1,
        i1.amount as amount1,
        i1.description as desc1,
        i2.id as id2,
        i2.invoice_number as num2,
        i2.date as date2,
        i2.amount as amount2,
        i2.description as desc2,
        ABS(julianday(i1.date) - julianday(i2.date)) as days_apart
      FROM invoices i1
      INNER JOIN invoices i2 ON i1.id < i2.id
      WHERE i1.user_id = ?
        AND i2.user_id = ?
        AND i1.date >= date('now', '-${days} days')
        AND i2.date >= date('now', '-${days} days')
        AND (
          i1.invoice_number = i2.invoice_number
          OR (
            ABS(i1.amount - i2.amount) < 0.01
            AND ABS(julianday(i1.date) - julianday(i2.date)) <= 7
          )
        )
      ORDER BY i1.date DESC
    `;

    const result = await env.DB.prepare(query).bind(userId, userId).all();

    const groups = {};
    (result.results || []).forEach(row => {
      const groupKey = `${row.num1}_${row.amount1}`;
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          group_id: groupKey,
          items: [],
          confidence: 0,
          reasons: []
        };
      }

      let confidence = 0;
      const reasons = [];

      // Same invoice number
      if (row.num1 === row.num2) {
        confidence += 0.6;
        reasons.push('Mismo número de factura');
      }

      // Same amount
      if (Math.abs(row.amount1 - row.amount2) < 0.01) {
        confidence += 0.4;
        reasons.push('Mismo monto');
      }

      if (confidence >= threshold) {
        groups[groupKey].confidence = Math.max(groups[groupKey].confidence, confidence);
        groups[groupKey].reasons = reasons;

        const existing1 = groups[groupKey].items.find(item => item.id === row.id1);
        if (!existing1) {
          groups[groupKey].items.push({
            id: row.id1,
            invoice_number: row.num1,
            date: row.date1,
            amount: parseFloat(row.amount1),
            description: row.desc1
          });
        }

        const existing2 = groups[groupKey].items.find(item => item.id === row.id2);
        if (!existing2) {
          groups[groupKey].items.push({
            id: row.id2,
            invoice_number: row.num2,
            date: row.date2,
            amount: parseFloat(row.amount2),
            description: row.desc2
          });
        }
      }
    });

    return Object.values(groups)
      .filter(group => group.items.length >= 2)
      .sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    await logError(error, { context: 'detectDuplicateInvoices' }, env);
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
      return detectDuplicates(request, env);
    }

    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'discovery/duplicates', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
