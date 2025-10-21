/**
 * Monitoring Logs API Endpoint
 * Phase 42: Structured Logging & Monitoring System
 * 
 * Provides access to system logs with filtering and pagination
 * Admin-only endpoint for production debugging and monitoring
 * 
 * Routes:
 *   GET /api/monitoring/logs - Retrieve logs with filters
 */

import { getUserIdFromToken } from '../auth.js';
import { logInfo, logError, LogLevel } from '../../utils/logging.js';

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
 * Handle GET requests - retrieve logs
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

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
      await logError('Unauthorized logs access attempt', {
        userId,
        endpoint: '/api/monitoring/logs',
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

    // Parse query parameters
    const level = url.searchParams.get('level') || null;
    const category = url.searchParams.get('category') || null;
    const startDate = url.searchParams.get('startDate') || null;
    const endDate = url.searchParams.get('endDate') || null;
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Build query
    let query = 'SELECT * FROM error_logs WHERE 1=1';
    const params = [];

    if (level) {
      query += ' AND level = ?';
      params.push(level);
    }

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // Execute query
    const logs = await env.DB.prepare(query)
      .bind(...params)
      .all();

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM error_logs WHERE 1=1';
    const countParams = [];

    if (level) {
      countQuery += ' AND level = ?';
      countParams.push(level);
    }

    if (startDate) {
      countQuery += ' AND timestamp >= ?';
      countParams.push(startDate);
    }

    if (endDate) {
      countQuery += ' AND timestamp <= ?';
      countParams.push(endDate);
    }

    const countResult = await env.DB.prepare(countQuery)
      .bind(...countParams)
      .first();

    logInfo('Logs retrieved', {
      userId,
      endpoint: '/api/monitoring/logs',
      category: 'monitoring',
      count: logs.results?.length || 0
    });

    return new Response(JSON.stringify({
      logs: logs.results || [],
      pagination: {
        total: countResult?.total || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (countResult?.total || 0)
      }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, {
      endpoint: '/api/monitoring/logs',
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
