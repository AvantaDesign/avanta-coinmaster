/**
 * Search API - Phase 50: Advanced Search & Filtering
 * Provides comprehensive full-text search across all entities
 */

import { getUserIdFromToken } from './auth.js';
import { logInfo, logError } from '../utils/logging.js';
import { getCacheKey, getFromCache, setInCache } from '../utils/cache.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
 * GET /api/search - Full-text search across entities
 * Query params:
 *   - q: Search query (required)
 *   - type: Entity type filter (transactions, invoices, accounts, all)
 *   - limit: Max results per entity type (default: 10)
 *   - offset: Pagination offset (default: 0)
 */
async function search(request, env) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const entityType = url.searchParams.get('type') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const { userId } = request;

    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ 
        error: 'La consulta de búsqueda debe tener al menos 2 caracteres' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check cache first
    const cacheKey = getCacheKey('search', userId, `${query}-${entityType}-${limit}-${offset}`);
    const cached = await getFromCache(cacheKey, env);
    if (cached) {
      await logInfo('Search cache hit', { query, entityType, userId }, env);
      return new Response(JSON.stringify(cached), {
        status: 200,
        headers: { ...corsHeaders, 'X-Cache': 'HIT' }
      });
    }

    const results = {
      query,
      total: 0,
      transactions: [],
      invoices: [],
      accounts: [],
      categories: [],
    };

    // Search in transactions
    if (entityType === 'all' || entityType === 'transactions') {
      const transactionResults = await searchTransactions(env, userId, query, limit, offset);
      results.transactions = transactionResults;
      results.total += transactionResults.length;
    }

    // Search in invoices
    if (entityType === 'all' || entityType === 'invoices') {
      const invoiceResults = await searchInvoices(env, userId, query, limit, offset);
      results.invoices = invoiceResults;
      results.total += invoiceResults.length;
    }

    // Search in accounts
    if (entityType === 'all' || entityType === 'accounts') {
      const accountResults = await searchAccounts(env, userId, query, limit, offset);
      results.accounts = accountResults;
      results.total += accountResults.length;
    }

    // Search in categories
    if (entityType === 'all' || entityType === 'categories') {
      const categoryResults = await searchCategories(env, userId, query, limit, offset);
      results.categories = categoryResults;
      results.total += categoryResults.length;
    }

    // Save search to history
    await saveSearchHistory(env, userId, query, entityType, results.total);

    // Cache results for 5 minutes
    await setInCache(cacheKey, results, env, 300);

    await logInfo('Search completed', { 
      query, 
      entityType, 
      totalResults: results.total,
      userId 
    }, env);

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { ...corsHeaders, 'X-Cache': 'MISS' }
    });
  } catch (error) {
    await logError(error, { endpoint: 'search', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error en la búsqueda',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Search transactions using FTS5
 */
async function searchTransactions(env, userId, query, limit, offset) {
  try {
    const searchQuery = `
      SELECT 
        t.id,
        t.date,
        t.amount,
        t.description,
        t.notes,
        t.transaction_type,
        c.name as category_name,
        a.name as account_name,
        CAST(fts.rank AS REAL) as relevance
      FROM transactions_fts fts
      JOIN transactions t ON fts.transaction_id = t.id
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE fts MATCH ? AND t.user_id = ?
      ORDER BY fts.rank
      LIMIT ? OFFSET ?
    `;

    const result = await env.DB.prepare(searchQuery)
      .bind(query, userId, limit, offset)
      .all();

    return (result.results || []).map(row => ({
      ...row,
      entity_type: 'transaction'
    }));
  } catch (error) {
    await logError(error, { context: 'searchTransactions', query }, env);
    return [];
  }
}

/**
 * Search invoices using FTS5
 */
async function searchInvoices(env, userId, query, limit, offset) {
  try {
    const searchQuery = `
      SELECT 
        i.id,
        i.invoice_number,
        i.date,
        i.amount,
        i.description,
        i.notes,
        i.status,
        CAST(fts.rank AS REAL) as relevance
      FROM invoices_fts fts
      JOIN invoices i ON fts.invoice_id = i.id
      WHERE fts MATCH ? AND i.user_id = ?
      ORDER BY fts.rank
      LIMIT ? OFFSET ?
    `;

    const result = await env.DB.prepare(searchQuery)
      .bind(query, userId, limit, offset)
      .all();

    return (result.results || []).map(row => ({
      ...row,
      entity_type: 'invoice'
    }));
  } catch (error) {
    await logError(error, { context: 'searchInvoices', query }, env);
    return [];
  }
}

/**
 * Search accounts using FTS5
 */
async function searchAccounts(env, userId, query, limit, offset) {
  try {
    const searchQuery = `
      SELECT 
        a.id,
        a.name,
        a.description,
        a.account_type,
        a.balance,
        CAST(fts.rank AS REAL) as relevance
      FROM accounts_fts fts
      JOIN accounts a ON fts.account_id = a.id
      WHERE fts MATCH ? AND a.user_id = ?
      ORDER BY fts.rank
      LIMIT ? OFFSET ?
    `;

    const result = await env.DB.prepare(searchQuery)
      .bind(query, userId, limit, offset)
      .all();

    return (result.results || []).map(row => ({
      ...row,
      entity_type: 'account'
    }));
  } catch (error) {
    await logError(error, { context: 'searchAccounts', query }, env);
    return [];
  }
}

/**
 * Search categories (simple LIKE search)
 */
async function searchCategories(env, userId, query, limit, offset) {
  try {
    const searchQuery = `
      SELECT 
        id,
        name,
        description,
        category_type,
        is_deductible
      FROM categories
      WHERE user_id = ? AND (name LIKE ? OR description LIKE ?)
      ORDER BY name ASC
      LIMIT ? OFFSET ?
    `;

    const searchPattern = `%${query}%`;
    const result = await env.DB.prepare(searchQuery)
      .bind(userId, searchPattern, searchPattern, limit, offset)
      .all();

    return (result.results || []).map(row => ({
      ...row,
      entity_type: 'category',
      relevance: 1.0
    }));
  } catch (error) {
    await logError(error, { context: 'searchCategories', query }, env);
    return [];
  }
}

/**
 * Save search query to history
 */
async function saveSearchHistory(env, userId, query, entityType, resultsCount) {
  try {
    await env.DB.prepare(`
      INSERT INTO search_history (user_id, search_query, entity_type, results_count)
      VALUES (?, ?, ?, ?)
    `).bind(userId, query, entityType || null, resultsCount).run();
  } catch (error) {
    // Non-critical error, just log it
    await logError(error, { context: 'saveSearchHistory' }, env);
  }
}

/**
 * GET /api/search/suggestions - Get search suggestions
 */
async function getSearchSuggestions(request, env) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '5');
    const { userId } = request;

    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: corsHeaders
      });
    }

    // Get recent searches matching the query
    const searchPattern = `%${query}%`;
    const result = await env.DB.prepare(`
      SELECT DISTINCT search_query, COUNT(*) as frequency
      FROM search_history
      WHERE user_id = ? AND search_query LIKE ?
      GROUP BY search_query
      ORDER BY frequency DESC, MAX(created_at) DESC
      LIMIT ?
    `).bind(userId, searchPattern, limit).all();

    const suggestions = (result.results || []).map(row => ({
      query: row.search_query,
      frequency: row.frequency
    }));

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'search/suggestions', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener sugerencias',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * GET /api/search/history - Get search history
 */
async function getSearchHistory(request, env) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const { userId } = request;

    const result = await env.DB.prepare(`
      SELECT 
        search_query,
        entity_type,
        COUNT(*) as search_count,
        MAX(created_at) as last_searched,
        AVG(results_count) as avg_results
      FROM search_history
      WHERE user_id = ?
      GROUP BY search_query, entity_type
      ORDER BY last_searched DESC
      LIMIT ?
    `).bind(userId, limit).all();

    return new Response(JSON.stringify(result.results || []), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'search/history', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener historial de búsqueda',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * DELETE /api/search/history - Clear search history
 */
async function clearSearchHistory(request, env) {
  try {
    const { userId } = request;

    await env.DB.prepare(`
      DELETE FROM search_history WHERE user_id = ?
    `).bind(userId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Historial de búsqueda eliminado' 
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'search/history DELETE', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error al eliminar historial',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Main handler - Routes requests based on method and path
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
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

  // Route based on path
  const pathParts = url.pathname.split('/').filter(p => p);
  const subPath = pathParts[2]; // 'suggestions', 'history', etc.

  try {
    // GET /api/search/suggestions
    if (method === 'GET' && subPath === 'suggestions') {
      return getSearchSuggestions(request, env);
    }

    // GET /api/search/history
    if (method === 'GET' && subPath === 'history') {
      return getSearchHistory(request, env);
    }

    // DELETE /api/search/history
    if (method === 'DELETE' && subPath === 'history') {
      return clearSearchHistory(request, env);
    }

    // GET /api/search - Main search
    if (method === 'GET' && !subPath) {
      return search(request, env);
    }

    return new Response(JSON.stringify({ error: 'Ruta no encontrada' }), {
      status: 404,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'search API', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
