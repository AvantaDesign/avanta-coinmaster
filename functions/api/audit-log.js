// Audit Log API - Track all important user actions for security and compliance
//
// This API handles:
// - Creating audit log entries
// - Listing audit logs with filtering
// - Getting specific audit log entries
// - Exporting audit logs
// - Getting audit statistics
//
// Supported features:
// - User-based filtering
// - Action type filtering
// - Date range filtering
// - Severity filtering
// - Entity filtering
// - Pagination
// - CSV export
// - Admin-only access for sensitive operations

import { getUserIdFromToken } from './auth.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';
import { buildSafeOrderBy } from '../utils/sql-security.js';

/**
 * GET /api/audit-log - List audit log entries with filtering
 * GET /api/audit-log/:id - Get specific audit log entry
 * GET /api/audit-log/stats - Get audit statistics
 * GET /api/audit-log/export - Export audit logs (CSV)
 * 
 * Query Parameters:
 *   - user_id: filter by user
 *   - action_type: filter by action type
 *   - entity_type: filter by entity type
 *   - entity_id: filter by entity ID
 *   - date_from: start date (ISO format)
 *   - date_to: end date (ISO format)
 *   - severity: filter by severity (low, medium, high, critical)
 *   - status: filter by status (success, failed, partial)
 *   - limit: number of results (default: 50, max: 500)
 *   - offset: pagination offset
 *   - sort_by: sort field (default: timestamp)
 *   - sort_order: asc or desc (default: desc)
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Get user ID from token
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

    // Check if this is a stats request
    if (url.pathname.endsWith('/stats')) {
      return handleStatsRequest(env, userId, corsHeaders);
    }

    // Check if this is an export request
    if (url.pathname.endsWith('/export')) {
      return handleExportRequest(env, userId, url, corsHeaders);
    }

    // Check if requesting specific audit log by ID
    const pathParts = url.pathname.split('/').filter(p => p);
    const possibleId = pathParts[pathParts.length - 1];
    
    if (possibleId && possibleId !== 'audit-log' && !possibleId.startsWith('audit_')) {
      return handleGetById(env, userId, possibleId, corsHeaders);
    }

    // List audit logs with filtering
    return handleList(env, userId, url, corsHeaders);

  } catch (error) {
    await logError(error, { endpoint: 'Audit log GET error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/audit-log - Create new audit log entry
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Get user ID from token
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

    const body = await request.json();
    
    // Validate required fields
    if (!body.action_type) {
      return new Response(JSON.stringify({ 
        error: 'action_type is required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Create audit log entry
    const auditEntry = {
      id: body.id || generateAuditId(),
      user_id: body.user_id || userId,
      action_type: body.action_type,
      entity_type: body.entity_type || null,
      entity_id: body.entity_id || null,
      action_details: body.action_details || '{}',
      ip_address: request.headers.get('CF-Connecting-IP') || null,
      user_agent: body.user_agent || request.headers.get('User-Agent') || null,
      session_id: body.session_id || null,
      timestamp: body.timestamp || new Date().toISOString(),
      severity: body.severity || 'low',
      status: body.status || 'success',
    };

    await env.DB.prepare(`
      INSERT INTO audit_log (
        id, user_id, action_type, entity_type, entity_id,
        action_details, ip_address, user_agent, session_id,
        timestamp, severity, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      auditEntry.id,
      auditEntry.user_id,
      auditEntry.action_type,
      auditEntry.entity_type,
      auditEntry.entity_id,
      auditEntry.action_details,
      auditEntry.ip_address,
      auditEntry.user_agent,
      auditEntry.session_id,
      auditEntry.timestamp,
      auditEntry.severity,
      auditEntry.status
    ).run();

    return new Response(JSON.stringify(auditEntry), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Audit log POST error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to create audit log',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// Helper functions

function generateAuditId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `audit_${timestamp}_${random}`;
}

async function handleList(env, userId, url, corsHeaders) {
  const params = url.searchParams;
  
  // Parse query parameters
  const filterUserId = params.get('user_id');
  const actionType = params.get('action_type');
  const entityType = params.get('entity_type');
  const entityId = params.get('entity_id');
  const dateFrom = params.get('date_from');
  const dateTo = params.get('date_to');
  const severity = params.get('severity');
  const status = params.get('status');
  const limit = Math.min(parseInt(params.get('limit')) || 50, 500);
  const offset = parseInt(params.get('offset')) || 0;
  const sortBy = params.get('sort_by') || 'timestamp';
  const sortOrder = params.get('sort_order') || 'desc';
  
  // Build query
  let query = 'SELECT * FROM audit_log WHERE 1=1';
  const bindings = [];
  
  // Only show user's own audit logs (or all if admin)
  // For now, show only user's logs
  query += ' AND user_id = ?';
  bindings.push(userId);
  
  if (filterUserId) {
    query += ' AND user_id = ?';
    bindings.push(filterUserId);
  }
  
  if (actionType) {
    query += ' AND action_type = ?';
    bindings.push(actionType);
  }
  
  if (entityType) {
    query += ' AND entity_type = ?';
    bindings.push(entityType);
  }
  
  if (entityId) {
    query += ' AND entity_id = ?';
    bindings.push(entityId);
  }
  
  if (dateFrom) {
    query += ' AND timestamp >= ?';
    bindings.push(dateFrom);
  }
  
  if (dateTo) {
    query += ' AND timestamp <= ?';
    bindings.push(dateTo);
  }
  
  if (severity) {
    query += ' AND severity = ?';
    bindings.push(severity);
  }
  
  if (status) {
    query += ' AND status = ?';
    bindings.push(status);
  }
  
  // Add sorting - Phase 43: Fixed SQL injection vulnerability
  // Use validated ORDER BY clause instead of string concatenation
  const orderByResult = buildSafeOrderBy('audit_log', sortBy || 'timestamp', sortOrder || 'desc');
  if (orderByResult.valid) {
    query += orderByResult.clause;
  } else {
    // Log validation error and use default sorting
    await logWarn('Invalid sort parameters', {
      endpoint: '/api/audit-log',
      error: orderByResult.error,
      sortBy,
      sortOrder
    }, env);
    query += ' ORDER BY timestamp DESC';
  }
  
  // Add pagination
  query += ' LIMIT ? OFFSET ?';
  bindings.push(limit, offset);
  
  // Execute query
  const result = await env.DB.prepare(query).bind(...bindings).all();
  
  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM audit_log WHERE user_id = ?';
  const countBindings = [userId];
  
  if (filterUserId) {
    countQuery += ' AND user_id = ?';
    countBindings.push(filterUserId);
  }
  
  const countResult = await env.DB.prepare(countQuery).bind(...countBindings).first();
  
  return new Response(JSON.stringify({
    logs: result.results || [],
    total: countResult?.total || 0,
    limit,
    offset,
  }), {
    status: 200,
    headers: corsHeaders
  });
}

async function handleGetById(env, userId, id, corsHeaders) {
  const result = await env.DB.prepare(
    'SELECT * FROM audit_log WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();
  
  if (!result) {
    return new Response(JSON.stringify({ 
      error: 'Audit log not found'
    }), {
      status: 404,
      headers: corsHeaders
    });
  }
  
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: corsHeaders
  });
}

async function handleStatsRequest(env, userId, corsHeaders) {
  // Get various statistics
  const stats = {};
  
  // Total logs
  const totalResult = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM audit_log WHERE user_id = ?'
  ).bind(userId).first();
  stats.total = totalResult?.total || 0;
  
  // By severity
  const severityResult = await env.DB.prepare(
    'SELECT severity, COUNT(*) as count FROM audit_log WHERE user_id = ? GROUP BY severity'
  ).bind(userId).all();
  stats.by_severity = {};
  for (const row of severityResult.results || []) {
    stats.by_severity[row.severity] = row.count;
  }
  
  // By action type (top 10)
  const actionResult = await env.DB.prepare(
    'SELECT action_type, COUNT(*) as count FROM audit_log WHERE user_id = ? GROUP BY action_type ORDER BY count DESC LIMIT 10'
  ).bind(userId).all();
  stats.top_actions = actionResult.results || [];
  
  // Recent activity (last 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentResult = await env.DB.prepare(
    'SELECT COUNT(*) as count FROM audit_log WHERE user_id = ? AND timestamp >= ?'
  ).bind(userId, yesterday).first();
  stats.recent_24h = recentResult?.count || 0;
  
  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: corsHeaders
  });
}

async function handleExportRequest(env, userId, url, corsHeaders) {
  // Similar to list, but return CSV format
  const params = url.searchParams;
  
  // Build query (similar to handleList)
  let query = 'SELECT * FROM audit_log WHERE user_id = ? ORDER BY timestamp DESC';
  const bindings = [userId];
  
  const result = await env.DB.prepare(query).bind(...bindings).all();
  const logs = result.results || [];
  
  // Convert to CSV
  const headers = ['ID', 'User ID', 'Action Type', 'Entity Type', 'Entity ID', 'Severity', 'Status', 'Timestamp'];
  const csvRows = [headers.join(',')];
  
  for (const log of logs) {
    const row = [
      log.id,
      log.user_id,
      log.action_type,
      log.entity_type || '',
      log.entity_id || '',
      log.severity,
      log.status,
      log.timestamp,
    ];
    csvRows.push(row.join(','));
  }
  
  const csv = csvRows.join('\n');
  
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="audit_log.csv"',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
