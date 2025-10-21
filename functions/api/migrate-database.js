/**
 * Database Migration API
 * Phase 41: ADMIN-ONLY endpoint for running database migrations
 * 
 * SECURITY: This endpoint requires admin role authentication
 * Only authorized administrators can execute database migrations
 */

import { getUserIdFromToken } from './auth.js';
import { getSecurityHeaders } from '../utils/security.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';

/**
 * Check if user has admin role
 */
async function isAdmin(userId, env) {
  if (!userId || !env.DB) {
    return false;
  }
  
  const user = await env.DB.prepare(
    'SELECT role FROM users WHERE id = ? AND is_active = 1'
  ).bind(userId).first();
  
  return user?.role === 'admin';
}

/**
 * POST /api/migrate-database
 * Run database migrations (Admin only)
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  const corsHeaders = getSecurityHeaders();

  try {
    // Phase 41: Authentication check
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

    // Phase 41: Admin authorization check
    const adminStatus = await isAdmin(userId, env);
    if (!adminStatus) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Administrator privileges required',
        code: 'ADMIN_REQUIRED'
      }), {
        status: 403,
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

    // Parse request body for migration options
    const data = await request.json();
    const { action } = data;

    if (!action) {
      return new Response(JSON.stringify({
        error: 'Migration action is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Execute migration based on action
    let result;
    switch (action) {
      case 'status':
        // Return current migration status
        result = {
          action: 'status',
          message: 'Migration status check (not implemented)',
          note: 'Migrations are managed through wrangler d1 migrations'
        };
        break;

      case 'apply':
        // Note: Actual migrations should be run through wrangler CLI
        result = {
          action: 'apply',
          message: 'Migrations should be applied using: wrangler d1 migrations apply DB_NAME',
          note: 'This endpoint is reserved for future automated migration support'
        };
        break;

      default:
        return new Response(JSON.stringify({
          error: 'Invalid migration action',
          valid_actions: ['status', 'apply'],
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
    }

    return new Response(JSON.stringify({
      success: true,
      result,
      executed_by: userId,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Migration error', category: 'api' }, env);
    return new Response(JSON.stringify({
      error: 'Migration failed',
      message: error.message,
      code: 'MIGRATION_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * GET /api/migrate-database
 * Get migration information (Admin only)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const corsHeaders = getSecurityHeaders();

  try {
    // Phase 41: Authentication check
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

    // Phase 41: Admin authorization check
    const adminStatus = await isAdmin(userId, env);
    if (!adminStatus) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Administrator privileges required',
        code: 'ADMIN_REQUIRED'
      }), {
        status: 403,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      info: 'Database Migration Endpoint',
      note: 'Migrations are managed through wrangler d1 migrations CLI',
      commands: {
        list: 'wrangler d1 migrations list DB_NAME',
        apply: 'wrangler d1 migrations apply DB_NAME',
        create: 'wrangler d1 migrations create DB_NAME migration_name'
      },
      endpoints: {
        status: 'POST /api/migrate-database with action=status',
        apply: 'POST /api/migrate-database with action=apply (reserved for future use)'
      }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Migration info error', category: 'api' }, env);
    return new Response(JSON.stringify({
      error: 'Failed to get migration info',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * OPTIONS /api/migrate-database
 * Handle CORS preflight
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
