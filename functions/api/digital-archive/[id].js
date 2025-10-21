// Digital Archive API - Single document operations
// Phase 40: Fixed dynamic routing structure
// Handles: GET, PUT, DELETE /api/digital-archive/:id

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
 * GET /api/digital-archive/:id - Get single document
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

    const documentId = params.id;
    if (!documentId) {
      return new Response(JSON.stringify({ error: 'Document ID required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const document = await env.DB.prepare(`
      SELECT * FROM digital_archive
      WHERE id = ? AND user_id = ?
    `).bind(documentId, userId).first();

    if (!document) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Parse JSON fields
    document.tags = document.tags ? JSON.parse(document.tags) : [];
    document.metadata = document.metadata ? JSON.parse(document.metadata) : {};

    // Log read access
    await logAuditTrail(env, userId, 'read', 'document', documentId, {
      document_name: document.document_name
    });

    return new Response(JSON.stringify(document), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error in digital-archive GET', category: 'api' }, env);
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
 * PUT /api/digital-archive/:id - Update document metadata
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

    const documentId = params.id;
    if (!documentId) {
      return new Response(JSON.stringify({ error: 'Document ID required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    const {
      document_name,
      expiration_date,
      retention_period,
      access_level,
      tags,
      metadata,
      status
    } = body;

    // Get current document to verify ownership
    const currentDoc = await env.DB.prepare(`
      SELECT * FROM digital_archive
      WHERE id = ? AND user_id = ?
    `).bind(documentId, userId).first();

    if (!currentDoc) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (document_name !== undefined) {
      updates.push('document_name = ?');
      values.push(document_name);
    }
    if (expiration_date !== undefined) {
      updates.push('expiration_date = ?');
      values.push(expiration_date);
    }
    if (retention_period !== undefined) {
      updates.push('retention_period = ?');
      values.push(retention_period);
    }
    if (access_level !== undefined) {
      updates.push('access_level = ?');
      values.push(access_level);
    }
    if (tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(tags));
    }
    if (metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(JSON.stringify(metadata));
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    values.push(documentId);
    values.push(userId);

    await env.DB.prepare(`
      UPDATE digital_archive
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...values).run();

    // Log audit trail
    await logAuditTrail(env, userId, 'update', 'document', documentId, {
      updated_fields: Object.keys(body)
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Document updated successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error in digital-archive PUT', category: 'api' }, env);
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
 * DELETE /api/digital-archive/:id - Delete/archive document
 * Query parameter: ?permanent=true for permanent deletion
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

    const documentId = params.id;
    if (!documentId) {
      return new Response(JSON.stringify({ error: 'Document ID required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const permanent = url.searchParams.get('permanent') === 'true';

    // Verify document exists and belongs to user
    const document = await env.DB.prepare(`
      SELECT * FROM digital_archive
      WHERE id = ? AND user_id = ?
    `).bind(documentId, userId).first();

    if (!document) {
      return new Response(JSON.stringify({ error: 'Document not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    if (permanent) {
      // Permanent deletion
      await env.DB.prepare(`
        DELETE FROM digital_archive
        WHERE id = ? AND user_id = ?
      `).bind(documentId, userId).run();

      await logAuditTrail(env, userId, 'delete', 'document', documentId, {
        permanent: true,
        document_name: document.document_name
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Document permanently deleted'
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      // Soft delete (mark as deleted)
      await env.DB.prepare(`
        UPDATE digital_archive
        SET status = 'deleted'
        WHERE id = ? AND user_id = ?
      `).bind(documentId, userId).run();

      await logAuditTrail(env, userId, 'archive', 'document', documentId, {
        document_name: document.document_name
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Document archived'
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
  } catch (error) {
    await logError(error, { endpoint: 'Error in digital-archive DELETE', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
