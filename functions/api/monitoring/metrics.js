/**
 * Monitoring Metrics API Endpoint
 * Phase 42: Structured Logging & Monitoring System
 * 
 * Provides system metrics and performance statistics
 * Admin-only endpoint for production monitoring
 * 
 * Routes:
 *   GET /api/monitoring/metrics - Retrieve system metrics
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
 * Handle OPTIONS requests (CORS preflight)
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Handle GET requests - retrieve metrics
 */
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    // Authentication check
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

    // Check if user is admin
    const user = await env.DB.prepare(
      'SELECT role FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user || user.role !== 'admin') {
      await logError('Unauthorized metrics access attempt', {
        userId,
        endpoint: '/api/monitoring/metrics',
        category: 'security'
      }, env);

      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      }), {
        status: 403,
        headers: corsHeaders
      });
    }

    // Collect metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      system: await getSystemMetrics(env),
      errors: await getErrorMetrics(env),
      api: await getApiMetrics(env),
      database: await getDatabaseMetrics(env)
    };

    logInfo('Metrics retrieved', {
      userId,
      endpoint: '/api/monitoring/metrics',
      category: 'monitoring'
    });

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, {
      endpoint: '/api/monitoring/metrics',
      category: 'monitoring'
    }, env);

    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Get system metrics
 */
async function getSystemMetrics(env) {
  try {
    // Get user count
    const userCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM users'
    ).first();

    // Get transaction count
    const transactionCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM transactions'
    ).first();

    return {
      totalUsers: userCount?.count || 0,
      totalTransactions: transactionCount?.count || 0,
      environment: env.ENVIRONMENT || 'unknown'
    };
  } catch (error) {
    return {
      error: 'Failed to fetch system metrics',
      details: error.message
    };
  }
}

/**
 * Get error metrics
 */
async function getErrorMetrics(env) {
  try {
    // Get error counts by level (last 24 hours)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const errorStats = await env.DB.prepare(`
      SELECT 
        level,
        COUNT(*) as count
      FROM error_logs
      WHERE timestamp >= ?
      GROUP BY level
    `).bind(last24h).all();

    // Get recent errors
    const recentErrors = await env.DB.prepare(`
      SELECT *
      FROM error_logs
      WHERE timestamp >= ?
      ORDER BY timestamp DESC
      LIMIT 10
    `).bind(last24h).all();

    return {
      last24Hours: errorStats.results || [],
      recent: recentErrors.results || []
    };
  } catch (error) {
    return {
      error: 'Failed to fetch error metrics',
      details: error.message
    };
  }
}

/**
 * Get API metrics
 */
async function getApiMetrics(env) {
  try {
    // Get audit log stats (last 24 hours)
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const apiStats = await env.DB.prepare(`
      SELECT 
        COUNT(*) as totalRequests
      FROM audit_logs
      WHERE timestamp >= ?
    `).bind(last24h).first();

    return {
      requestsLast24Hours: apiStats?.totalRequests || 0
    };
  } catch (error) {
    return {
      error: 'Failed to fetch API metrics',
      details: error.message
    };
  }
}

/**
 * Get database metrics
 */
async function getDatabaseMetrics(env) {
  try {
    // Get table sizes
    const tables = ['users', 'transactions', 'accounts', 'categories', 'error_logs', 'audit_logs'];
    const tableSizes = {};

    for (const table of tables) {
      try {
        const result = await env.DB.prepare(
          `SELECT COUNT(*) as count FROM ${table}`
        ).first();
        tableSizes[table] = result?.count || 0;
      } catch (e) {
        tableSizes[table] = 'N/A';
      }
    }

    return {
      tableSizes
    };
  } catch (error) {
    return {
      error: 'Failed to fetch database metrics',
      details: error.message
    };
  }
}
