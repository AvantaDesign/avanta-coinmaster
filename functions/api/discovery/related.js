/**
 * Related Items Discovery API - Phase 50: Advanced Search & Filtering
 * Finds related items based on similarity
 */

import { getUserIdFromToken } from '../auth.js';
import { logInfo, logError } from '../../utils/logging.js';

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
 * GET /api/discovery/related - Find related items
 * Query params:
 *   - entity_type: Type of entity (transaction, invoice, account)
 *   - entity_id: ID of the entity
 *   - limit: Max results (default: 5)
 */
async function findRelatedItems(request, env) {
  try {
    const url = new URL(request.url);
    const entityType = url.searchParams.get('entity_type');
    const entityId = parseInt(url.searchParams.get('entity_id'));
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const { userId } = request;

    if (!entityType || !entityId) {
      return new Response(JSON.stringify({ 
        error: 'entity_type y entity_id son requeridos' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    let related = [];

    switch (entityType) {
      case 'transaction':
        related = await findRelatedTransactions(env, userId, entityId, limit);
        break;
      case 'invoice':
        related = await findRelatedInvoices(env, userId, entityId, limit);
        break;
      case 'account':
        related = await findRelatedAccounts(env, userId, entityId, limit);
        break;
      default:
        return new Response(JSON.stringify({ 
          error: 'Tipo de entidad no soportado' 
        }), {
          status: 400,
          headers: corsHeaders
        });
    }

    return new Response(JSON.stringify({ 
      entity_type: entityType,
      entity_id: entityId,
      related,
      count: related.length
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'discovery/related', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error al buscar elementos relacionados',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Find related transactions based on similarity
 */
async function findRelatedTransactions(env, userId, transactionId, limit) {
  try {
    // Get the source transaction
    const source = await env.DB.prepare(`
      SELECT * FROM transactions WHERE id = ? AND user_id = ?
    `).bind(transactionId, userId).first();

    if (!source) {
      return [];
    }

    // Find similar transactions based on:
    // 1. Same category
    // 2. Similar amount (within 20%)
    // 3. Similar description (fuzzy match)
    // 4. Same account
    const query = `
      SELECT 
        t.*,
        c.name as category_name,
        a.name as account_name,
        CASE
          WHEN t.category_id = ? THEN 3
          ELSE 0
        END +
        CASE
          WHEN ABS(t.amount - ?) / ? < 0.2 THEN 2
          ELSE 0
        END +
        CASE
          WHEN t.account_id = ? THEN 1
          ELSE 0
        END as similarity_score
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ?
        AND t.id != ?
        AND t.date >= date('now', '-180 days')
      HAVING similarity_score > 0
      ORDER BY similarity_score DESC, ABS(t.amount - ?) ASC
      LIMIT ?
    `;

    const result = await env.DB.prepare(query).bind(
      source.category_id,
      source.amount,
      source.amount || 1,
      source.account_id,
      userId,
      transactionId,
      source.amount,
      limit
    ).all();

    return (result.results || []).map(row => ({
      ...row,
      entity_type: 'transaction',
      similarity_score: row.similarity_score,
      similarity_reasons: getSimilarityReasons(source, row)
    }));
  } catch (error) {
    await logError(error, { context: 'findRelatedTransactions' }, env);
    return [];
  }
}

/**
 * Find related invoices
 */
async function findRelatedInvoices(env, userId, invoiceId, limit) {
  try {
    const source = await env.DB.prepare(`
      SELECT * FROM invoices WHERE id = ? AND user_id = ?
    `).bind(invoiceId, userId).first();

    if (!source) {
      return [];
    }

    // Find similar invoices
    const query = `
      SELECT 
        i.*,
        CASE
          WHEN ABS(i.amount - ?) / ? < 0.2 THEN 2
          ELSE 0
        END +
        CASE
          WHEN i.status = ? THEN 1
          ELSE 0
        END as similarity_score
      FROM invoices i
      WHERE i.user_id = ?
        AND i.id != ?
        AND i.date >= date('now', '-180 days')
      HAVING similarity_score > 0
      ORDER BY similarity_score DESC
      LIMIT ?
    `;

    const result = await env.DB.prepare(query).bind(
      source.amount,
      source.amount || 1,
      source.status,
      userId,
      invoiceId,
      limit
    ).all();

    return (result.results || []).map(row => ({
      ...row,
      entity_type: 'invoice',
      similarity_score: row.similarity_score
    }));
  } catch (error) {
    await logError(error, { context: 'findRelatedInvoices' }, env);
    return [];
  }
}

/**
 * Find related accounts
 */
async function findRelatedAccounts(env, userId, accountId, limit) {
  try {
    const source = await env.DB.prepare(`
      SELECT * FROM accounts WHERE id = ? AND user_id = ?
    `).bind(accountId, userId).first();

    if (!source) {
      return [];
    }

    // Find similar accounts
    const query = `
      SELECT 
        a.*,
        CASE
          WHEN a.account_type = ? THEN 2
          ELSE 0
        END as similarity_score
      FROM accounts a
      WHERE a.user_id = ?
        AND a.id != ?
      HAVING similarity_score > 0
      ORDER BY similarity_score DESC
      LIMIT ?
    `;

    const result = await env.DB.prepare(query).bind(
      source.account_type,
      userId,
      accountId,
      limit
    ).all();

    return (result.results || []).map(row => ({
      ...row,
      entity_type: 'account',
      similarity_score: row.similarity_score
    }));
  } catch (error) {
    await logError(error, { context: 'findRelatedAccounts' }, env);
    return [];
  }
}

/**
 * Get similarity reasons for display
 */
function getSimilarityReasons(source, target) {
  const reasons = [];
  
  if (source.category_id === target.category_id) {
    reasons.push('Misma categoría');
  }
  
  if (source.account_id === target.account_id) {
    reasons.push('Misma cuenta');
  }
  
  if (Math.abs(source.amount - target.amount) / source.amount < 0.2) {
    reasons.push('Monto similar');
  }
  
  return reasons;
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
      return findRelatedItems(request, env);
    }

    return new Response(JSON.stringify({ error: 'Método no permitido' }), {
      status: 405,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'discovery/related', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
