// Audit Trail API - Single entry operations
// Phase 40: Fixed dynamic routing structure
// Handles: GET /api/audit-trail/:id and DELETE /api/audit-trail/:id

import { getUserIdFromToken } from '../auth.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
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
 * GET /api/audit-trail/:id - Get single audit entry
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

    const entryId = params.id;
    if (!entryId) {
      return new Response(JSON.stringify({ error: 'Audit entry ID required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const entry = await env.DB.prepare(`
      SELECT * FROM audit_trail
      WHERE id = ? AND user_id = ?
    `).bind(entryId, userId).first();

    if (!entry) {
      return new Response(JSON.stringify({ error: 'Audit entry not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Parse JSON fields
    entry.action_details = entry.action_details ? JSON.parse(entry.action_details) : null;
    entry.old_values = entry.old_values ? JSON.parse(entry.old_values) : null;
    entry.new_values = entry.new_values ? JSON.parse(entry.new_values) : null;
    entry.metadata = entry.metadata ? JSON.parse(entry.metadata) : {};

    return new Response(JSON.stringify(entry), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error in audit-trail GET', category: 'api' }, env);
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
 * DELETE /api/audit-trail/:id - Delete audit entry
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

    const entryId = params.id;
    if (!entryId) {
      return new Response(JSON.stringify({ error: 'Audit entry ID required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if user is admin (for now, users can only delete their own entries)
    const entry = await env.DB.prepare(`
      SELECT * FROM audit_trail
      WHERE id = ? AND user_id = ?
    `).bind(entryId, userId).first();

    if (!entry) {
      return new Response(JSON.stringify({ error: 'Audit entry not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Note: In production, audit entries should rarely be deleted
    // Consider marking as deleted instead of actual deletion
    await env.DB.prepare(`
      DELETE FROM audit_trail
      WHERE id = ? AND user_id = ?
    `).bind(entryId, userId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Audit entry deleted'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error in audit-trail DELETE', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
