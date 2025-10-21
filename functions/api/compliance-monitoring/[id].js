// Compliance Monitoring API - Single check operations
// Phase 40: Fixed dynamic routing structure
// Handles: GET, PUT, DELETE /api/compliance-monitoring/:id

import { getUserIdFromToken } from '../auth.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../../utils/logging.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Helper: Log audit trail event
 */
async function logAuditTrail(env, userId, action, entityType, entityId, details) {
  try {
    await env.DB.prepare(`
      INSERT INTO audit_trail (user_id, action_type, entity_type, entity_id, action_details, timestamp)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      userId,
      action,
      entityType,
      entityId,
      JSON.stringify(details)
    ).run();
  } catch (error) {
    await logError(error, { endpoint: 'Failed to log audit trail', category: 'api' }, env);
  }
}

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
 * GET /api/compliance-monitoring/:id - Get single compliance check
 */
export async function onRequestGet({ request, env, params }) {
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const checkId = params.id;
    if (!checkId) {
      return new Response(JSON.stringify({ error: 'Compliance check ID required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const check = await env.DB.prepare(`
      SELECT * FROM compliance_monitoring
      WHERE id = ? AND user_id = ?
    `).bind(checkId, userId).first();

    if (!check) {
      return new Response(JSON.stringify({ error: 'Compliance check not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Parse JSON fields
    check.issues_found = check.issues_found ? JSON.parse(check.issues_found) : [];
    check.recommendations = check.recommendations ? JSON.parse(check.recommendations) : [];
    check.metadata = check.metadata ? JSON.parse(check.metadata) : {};

    return new Response(JSON.stringify(check), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error in compliance-monitoring GET', category: 'api' }, env);
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
 * PUT /api/compliance-monitoring/:id - Update compliance status
 */
export async function onRequestPut({ request, env, params }) {
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const checkId = params.id;
    if (!checkId) {
      return new Response(JSON.stringify({ error: 'Compliance check ID required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    const {
      status,
      resolution_notes
    } = body;

    // Verify compliance check exists and belongs to user
    const check = await env.DB.prepare(`
      SELECT * FROM compliance_monitoring
      WHERE id = ? AND user_id = ?
    `).bind(checkId, userId).first();

    if (!check) {
      return new Response(JSON.stringify({ error: 'Compliance check not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
      
      if (status === 'resolved') {
        updates.push('resolved_date = CURRENT_TIMESTAMP');
        updates.push('resolved_by = ?');
        values.push(userId);
      }
    }

    if (resolution_notes !== undefined) {
      updates.push('resolution_notes = ?');
      values.push(resolution_notes);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    values.push(checkId);
    values.push(userId);

    await env.DB.prepare(`
      UPDATE compliance_monitoring
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...values).run();

    // Log audit trail
    await logAuditTrail(env, userId, 'update', 'compliance', checkId, {
      updated_fields: Object.keys(body),
      new_status: status
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Compliance check updated successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error in compliance-monitoring PUT', category: 'api' }, env);
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
 * DELETE /api/compliance-monitoring/:id - Delete compliance check
 */
export async function onRequestDelete({ request, env, params }) {
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const checkId = params.id;
    if (!checkId) {
      return new Response(JSON.stringify({ error: 'Compliance check ID required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify compliance check exists and belongs to user
    const check = await env.DB.prepare(`
      SELECT * FROM compliance_monitoring
      WHERE id = ? AND user_id = ?
    `).bind(checkId, userId).first();

    if (!check) {
      return new Response(JSON.stringify({ error: 'Compliance check not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    await env.DB.prepare(`
      DELETE FROM compliance_monitoring
      WHERE id = ? AND user_id = ?
    `).bind(checkId, userId).run();

    // Log audit trail
    await logAuditTrail(env, userId, 'delete', 'compliance', checkId, {
      compliance_type: check.compliance_type,
      period: `${check.period_year}-${check.period_month || 'annual'}`
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Compliance check deleted'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error in compliance-monitoring DELETE', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
