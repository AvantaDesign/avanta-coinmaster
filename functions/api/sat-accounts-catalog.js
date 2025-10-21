// SAT Accounts Catalog API - Official SAT "Código Agrupador" (Anexo 24)
// Endpoints:
// GET /api/sat-accounts-catalog - List all accounts (with hierarchical structure)
// GET /api/sat-accounts-catalog/:codigo - Get specific account details
// GET /api/sat-accounts-catalog/search?q=term - Search accounts by description

import { getUserIdFromToken } from './auth.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// GET /api/sat-accounts-catalog - List or search accounts
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

    // Check if requesting specific account by codigo
    const pathParts = path.split('/').filter(p => p);
    const lastPart = pathParts[pathParts.length - 1];
    
    // If last part is not "sat-accounts-catalog" or "search", treat it as a codigo
    if (lastPart !== 'sat-accounts-catalog' && lastPart !== 'search') {
      return handleGetAccountByCodigo(env, lastPart);
    }

    // Check if searching
    const searchTerm = url.searchParams.get('q');
    if (searchTerm) {
      return handleSearchAccounts(env, searchTerm);
    }

    // List all accounts with filters
    const nivel = url.searchParams.get('nivel');
    const codigoPadre = url.searchParams.get('codigo_padre');
    const activo = url.searchParams.get('activo');
    const hierarchical = url.searchParams.get('hierarchical') === 'true';
    const page = parseInt(url.searchParams.get('page')) || 1;
    const perPage = Math.min(parseInt(url.searchParams.get('perPage')) || 100, 500);
    const offset = (page - 1) * perPage;

    // Build query
    const conditions = [];
    const bindings = [];

    if (nivel) {
      conditions.push('nivel = ?');
      bindings.push(parseInt(nivel));
    }
    if (codigoPadre !== null && codigoPadre !== undefined) {
      if (codigoPadre === 'null' || codigoPadre === '') {
        conditions.push('codigo_padre IS NULL');
      } else {
        conditions.push('codigo_padre = ?');
        bindings.push(codigoPadre);
      }
    }
    if (activo !== null && activo !== undefined) {
      conditions.push('activo = ?');
      bindings.push(activo === 'true' ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    if (hierarchical) {
      // Return hierarchical structure
      return handleGetHierarchicalAccounts(env);
    }

    // Get accounts with pagination
    const accounts = await env.DB.prepare(`
      SELECT *
      FROM sat_accounts_catalog
      ${whereClause}
      ORDER BY codigo_agrupador ASC
      LIMIT ? OFFSET ?
    `).bind(...bindings, perPage, offset).all();

    const total = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM sat_accounts_catalog
      ${whereClause}
    `).bind(...bindings).first();

    return new Response(JSON.stringify({ 
      accounts: accounts.results || [],
      pagination: {
        page,
        perPage,
        total: total?.count || 0,
        totalPages: Math.ceil((total?.count || 0) / perPage)
      }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'SAT Accounts Catalog API error', category: 'api' }, env);
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

// Handle OPTIONS request for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// Get specific account by codigo
async function handleGetAccountByCodigo(env, codigo) {
  try {
    const account = await env.DB.prepare(`
      SELECT *
      FROM sat_accounts_catalog
      WHERE codigo_agrupador = ?
    `).bind(codigo).first();

    if (!account) {
      return new Response(JSON.stringify({ 
        error: 'Account not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Get children accounts if any
    const children = await env.DB.prepare(`
      SELECT *
      FROM sat_accounts_catalog
      WHERE codigo_padre = ?
      ORDER BY codigo_agrupador ASC
    `).bind(codigo).all();

    // Get parent account if any
    let parent = null;
    if (account.codigo_padre) {
      parent = await env.DB.prepare(`
        SELECT *
        FROM sat_accounts_catalog
        WHERE codigo_agrupador = ?
      `).bind(account.codigo_padre).first();
    }

    return new Response(JSON.stringify({ 
      account,
      children: children.results || [],
      parent
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Get account by codigo error', category: 'api' }, env);
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

// Search accounts by description
async function handleSearchAccounts(env, searchTerm) {
  try {
    const accounts = await env.DB.prepare(`
      SELECT *
      FROM sat_accounts_catalog
      WHERE descripcion LIKE ?
         OR codigo_agrupador LIKE ?
      ORDER BY nivel ASC, codigo_agrupador ASC
      LIMIT 50
    `).bind(`%${searchTerm}%`, `%${searchTerm}%`).all();

    return new Response(JSON.stringify({ 
      accounts: accounts.results || [],
      searchTerm,
      count: accounts.results?.length || 0
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Search accounts error', category: 'api' }, env);
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

// Get hierarchical account structure
async function handleGetHierarchicalAccounts(env) {
  try {
    // Get all accounts ordered by nivel and codigo
    const allAccounts = await env.DB.prepare(`
      SELECT *
      FROM sat_accounts_catalog
      WHERE activo = 1
      ORDER BY codigo_agrupador ASC
    `).all();

    const accounts = allAccounts.results || [];
    
    // Build hierarchical structure
    const accountMap = new Map();
    const rootAccounts = [];

    // First pass: create map
    accounts.forEach(account => {
      accountMap.set(account.codigo_agrupador, {
        ...account,
        children: []
      });
    });

    // Second pass: build hierarchy
    accounts.forEach(account => {
      const accountNode = accountMap.get(account.codigo_agrupador);
      if (account.codigo_padre) {
        const parent = accountMap.get(account.codigo_padre);
        if (parent) {
          parent.children.push(accountNode);
        } else {
          rootAccounts.push(accountNode);
        }
      } else {
        rootAccounts.push(accountNode);
      }
    });

    return new Response(JSON.stringify({ 
      accounts: rootAccounts,
      totalAccounts: accounts.length
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Get hierarchical accounts error', category: 'api' }, env);
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
