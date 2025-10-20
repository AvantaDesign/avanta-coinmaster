// Audit Trail API - Comprehensive activity logging and monitoring
//
// This API handles all audit trail operations including:
// - Log user actions and system events
// - List audit trail entries with filtering
// - Generate audit reports
// - Export audit trail data
// - Track security events
//
// Endpoints:
// - GET /api/audit-trail - List audit entries with filtering
// - GET /api/audit-trail/:id - Get single audit entry
// - GET /api/audit-trail/summary - Get audit summary statistics
// - GET /api/audit-trail/export - Export audit trail data
// - POST /api/audit-trail - Create audit entry
// - DELETE /api/audit-trail/:id - Delete audit entry (admin only)

import { getUserIdFromToken } from './auth.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
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
 * GET handler - List audit entries with filtering, summary, or export
 * Single entry operations moved to /api/audit-trail/[id].js
 */
export async function onRequestGet({ request, env }) {
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle summary endpoint
    if (pathname.includes('/summary')) {
      return getAuditSummary(env, userId, url);
    }

    // Handle export endpoint
    if (pathname.includes('/export')) {
      return exportAuditTrail(env, userId, url);
    }

    // Handle list with filters
    return listAuditEntries(env, userId, url);
  } catch (error) {
    console.error('Error in audit-trail GET:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST handler - Create audit entry
 */
export async function onRequestPost({ request, env }) {
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    const {
      action_type,
      entity_type,
      entity_id,
      action_details,
      old_values,
      new_values,
      security_level = 'normal',
      compliance_relevant = 0,
      metadata
    } = body;

    // Validate required fields
    if (!action_type || !entity_type) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: action_type, entity_type' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get request context
    const ip_address = request.headers.get('CF-Connecting-IP') || 
                       request.headers.get('X-Forwarded-For') || 
                       'unknown';
    const user_agent = request.headers.get('User-Agent') || 'unknown';

    // Insert audit entry
    const result = await env.DB.prepare(`
      INSERT INTO audit_trail (
        user_id, action_type, entity_type, entity_id,
        action_details, old_values, new_values,
        ip_address, user_agent, security_level,
        compliance_relevant, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      action_type,
      entity_type,
      entity_id,
      action_details ? JSON.stringify(action_details) : null,
      old_values ? JSON.stringify(old_values) : null,
      new_values ? JSON.stringify(new_values) : null,
      ip_address,
      user_agent,
      security_level,
      compliance_relevant,
      metadata ? JSON.stringify(metadata) : null
    ).run();

    return new Response(JSON.stringify({
      success: true,
      id: result.meta.last_row_id,
      message: 'Audit entry created successfully'
    }), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in audit-trail POST:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Helper: List audit entries with filtering
 */
async function listAuditEntries(env, userId, url) {
  const actionType = url.searchParams.get('action_type');
  const entityType = url.searchParams.get('entity_type');
  const entityId = url.searchParams.get('entity_id');
  const securityLevel = url.searchParams.get('security_level');
  const complianceRelevant = url.searchParams.get('compliance_relevant');
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
  const offset = (page - 1) * limit;

  // Build query
  let query = `
    SELECT * FROM audit_trail
    WHERE user_id = ?
  `;
  const params = [userId];

  if (actionType) {
    query += ` AND action_type = ?`;
    params.push(actionType);
  }

  if (entityType) {
    query += ` AND entity_type = ?`;
    params.push(entityType);
  }

  if (entityId) {
    query += ` AND entity_id = ?`;
    params.push(parseInt(entityId));
  }

  if (securityLevel) {
    query += ` AND security_level = ?`;
    params.push(securityLevel);
  }

  if (complianceRelevant !== null && complianceRelevant !== undefined) {
    query += ` AND compliance_relevant = ?`;
    params.push(complianceRelevant === 'true' ? 1 : 0);
  }

  if (startDate) {
    query += ` AND timestamp >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND timestamp <= ?`;
    params.push(endDate);
  }

  // Get total count
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const countResult = await env.DB.prepare(countQuery).bind(...params).first();
  const total = countResult.count;

  // Get paginated results
  query += ` ORDER BY timestamp DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const { results } = await env.DB.prepare(query).bind(...params).all();

  // Parse JSON fields
  const entries = results.map(entry => ({
    ...entry,
    action_details: entry.action_details ? JSON.parse(entry.action_details) : null,
    old_values: entry.old_values ? JSON.parse(entry.old_values) : null,
    new_values: entry.new_values ? JSON.parse(entry.new_values) : null,
    metadata: entry.metadata ? JSON.parse(entry.metadata) : {}
  }));

  return new Response(JSON.stringify({
    entries,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Helper: Get audit summary statistics
 */
async function getAuditSummary(env, userId, url) {
  const startDate = url.searchParams.get('start_date') || 
                    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = url.searchParams.get('end_date') || new Date().toISOString();

  // Get total activities
  const totalResult = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM audit_trail
    WHERE user_id = ?
      AND timestamp BETWEEN ? AND ?
  `).bind(userId, startDate, endDate).first();

  // Get activities by action type
  const byActionType = await env.DB.prepare(`
    SELECT 
      action_type,
      COUNT(*) as count
    FROM audit_trail
    WHERE user_id = ?
      AND timestamp BETWEEN ? AND ?
    GROUP BY action_type
    ORDER BY count DESC
  `).bind(userId, startDate, endDate).all();

  // Get activities by entity type
  const byEntityType = await env.DB.prepare(`
    SELECT 
      entity_type,
      COUNT(*) as count
    FROM audit_trail
    WHERE user_id = ?
      AND timestamp BETWEEN ? AND ?
    GROUP BY entity_type
    ORDER BY count DESC
  `).bind(userId, startDate, endDate).all();

  // Get security events
  const securityEvents = await env.DB.prepare(`
    SELECT 
      security_level,
      COUNT(*) as count
    FROM audit_trail
    WHERE user_id = ?
      AND timestamp BETWEEN ? AND ?
      AND security_level IN ('elevated', 'critical')
    GROUP BY security_level
  `).bind(userId, startDate, endDate).all();

  // Get compliance-relevant activities
  const complianceResult = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM audit_trail
    WHERE user_id = ?
      AND timestamp BETWEEN ? AND ?
      AND compliance_relevant = 1
  `).bind(userId, startDate, endDate).first();

  // Get recent activity timeline (last 7 days)
  const timeline = await env.DB.prepare(`
    SELECT 
      DATE(timestamp) as date,
      COUNT(*) as count
    FROM audit_trail
    WHERE user_id = ?
      AND timestamp >= datetime('now', '-7 days')
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
  `).bind(userId).all();

  // Get most active entities
  const topEntities = await env.DB.prepare(`
    SELECT 
      entity_type,
      entity_id,
      COUNT(*) as activity_count
    FROM audit_trail
    WHERE user_id = ?
      AND timestamp BETWEEN ? AND ?
      AND entity_id IS NOT NULL
    GROUP BY entity_type, entity_id
    ORDER BY activity_count DESC
    LIMIT 10
  `).bind(userId, startDate, endDate).all();

  return new Response(JSON.stringify({
    period: {
      start_date: startDate,
      end_date: endDate
    },
    summary: {
      total_activities: totalResult.count,
      compliance_relevant: complianceResult.count,
      security_events: securityEvents.results.reduce((sum, e) => sum + e.count, 0)
    },
    by_action_type: byActionType.results,
    by_entity_type: byEntityType.results,
    security_events: securityEvents.results,
    activity_timeline: timeline.results,
    top_entities: topEntities.results
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Helper: Export audit trail data
 */
async function exportAuditTrail(env, userId, url) {
  const format = url.searchParams.get('format') || 'json';
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');
  const complianceOnly = url.searchParams.get('compliance_only') === 'true';

  let query = `SELECT * FROM audit_trail WHERE user_id = ?`;
  const params = [userId];

  if (startDate) {
    query += ` AND timestamp >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND timestamp <= ?`;
    params.push(endDate);
  }

  if (complianceOnly) {
    query += ` AND compliance_relevant = 1`;
  }

  query += ` ORDER BY timestamp DESC`;

  const { results } = await env.DB.prepare(query).bind(...params).all();

  const entries = results.map(entry => ({
    ...entry,
    action_details: entry.action_details ? JSON.parse(entry.action_details) : null,
    old_values: entry.old_values ? JSON.parse(entry.old_values) : null,
    new_values: entry.new_values ? JSON.parse(entry.new_values) : null,
    metadata: entry.metadata ? JSON.parse(entry.metadata) : {}
  }));

  if (format === 'csv') {
    // Convert to CSV
    const headers = [
      'ID', 'Timestamp', 'Action Type', 'Entity Type', 'Entity ID',
      'Security Level', 'Compliance Relevant', 'IP Address'
    ];
    const rows = entries.map(entry => [
      entry.id,
      entry.timestamp,
      entry.action_type,
      entry.entity_type,
      entry.entity_id || '',
      entry.security_level,
      entry.compliance_relevant ? 'Yes' : 'No',
      entry.ip_address
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="audit_trail_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  }

  return new Response(JSON.stringify({
    export_date: new Date().toISOString(),
    entries,
    count: entries.length,
    filters: {
      start_date: startDate,
      end_date: endDate,
      compliance_only: complianceOnly
    }
  }), {
    status: 200,
    headers: corsHeaders
  });
}
