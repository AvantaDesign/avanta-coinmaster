// Digital Archive API - Document management and archival operations
//
// This API handles all digital archive operations including:
// - Upload and store documents securely
// - List and search archived documents
// - Update document metadata and status
// - Delete and archive documents
// - Export archive data
//
// Endpoints:
// - GET /api/digital-archive - List documents with filtering
// - GET /api/digital-archive/:id - Get single document
// - GET /api/digital-archive/search - Search documents
// - GET /api/digital-archive/export - Export archive data
// - POST /api/digital-archive - Upload and archive document
// - PUT /api/digital-archive/:id - Update document metadata
// - DELETE /api/digital-archive/:id - Delete/archive document

import { getUserIdFromToken } from './auth.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';
import { detectSqlInjection, sanitizeString } from '../utils/validation.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
 * GET handler - List documents with filtering, search, or export
 * Single document operations moved to /api/digital-archive/[id].js
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

    // Handle search endpoint
    if (pathname.includes('/search')) {
      return handleSearch(env, userId, url);
    }

    // Handle export endpoint
    if (pathname.includes('/export')) {
      return handleExport(env, userId, url);
    }

    // Handle list with filters
    return listDocuments(env, userId, url);
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
 * POST handler - Upload and archive document
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
      document_type,
      document_name,
      file_path,
      file_size,
      mime_type,
      hash_sha256,
      expiration_date,
      retention_period = 5,
      access_level = 'private',
      tags,
      metadata,
      related_transaction_id,
      related_declaration_id
    } = body;

    // Validate required fields
    if (!document_type || !document_name || !file_path) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: document_type, document_name, file_path' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate document type
    const validTypes = ['cfdi', 'receipt', 'invoice', 'declaration', 'statement', 'contract', 'report', 'other'];
    if (!validTypes.includes(document_type)) {
      return new Response(JSON.stringify({ 
        error: `Invalid document_type. Must be one of: ${validTypes.join(', ')}` 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate access level
    const validAccessLevels = ['public', 'private', 'confidential'];
    if (!validAccessLevels.includes(access_level)) {
      return new Response(JSON.stringify({ 
        error: `Invalid access_level. Must be one of: ${validAccessLevels.join(', ')}` 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check for duplicate hash (optional integrity check)
    if (hash_sha256) {
      const duplicate = await env.DB.prepare(`
        SELECT id, document_name FROM digital_archive
        WHERE user_id = ? AND hash_sha256 = ? AND status != 'deleted'
        LIMIT 1
      `).bind(userId, hash_sha256).first();

      if (duplicate) {
        return new Response(JSON.stringify({ 
          error: 'Document with same content already exists',
          duplicate_id: duplicate.id,
          duplicate_name: duplicate.document_name
        }), {
          status: 409,
          headers: corsHeaders
        });
      }
    }

    // Insert document into archive
    const result = await env.DB.prepare(`
      INSERT INTO digital_archive (
        user_id, document_type, document_name, file_path, file_size,
        mime_type, hash_sha256, expiration_date, retention_period,
        access_level, tags, metadata, related_transaction_id,
        related_declaration_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    `).bind(
      userId,
      document_type,
      document_name,
      file_path,
      file_size || 0,
      mime_type,
      hash_sha256,
      expiration_date,
      retention_period,
      access_level,
      tags ? JSON.stringify(tags) : null,
      metadata ? JSON.stringify(metadata) : null,
      related_transaction_id,
      related_declaration_id
    ).run();

    // Log audit trail
    await logAuditTrail(env, userId, 'create', 'document', result.meta.last_row_id, {
      document_name,
      document_type,
      file_path
    });

    return new Response(JSON.stringify({
      success: true,
      id: result.meta.last_row_id,
      message: 'Document archived successfully'
    }), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error in digital-archive POST', category: 'api' }, env);
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
 * Helper: List documents with filtering
 */
async function listDocuments(env, userId, url) {
  const documentType = url.searchParams.get('type');
  const status = url.searchParams.get('status') || 'active';
  const search = url.searchParams.get('search');
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
  const offset = (page - 1) * limit;

  // Build query
  let query = `
    SELECT * FROM digital_archive
    WHERE user_id = ?
  `;
  const params = [userId];

  if (documentType) {
    query += ` AND document_type = ?`;
    params.push(documentType);
  }

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  if (search) {
    query += ` AND (document_name LIKE ? OR tags LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  // Get total count
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const countResult = await env.DB.prepare(countQuery).bind(...params).first();
  const total = countResult.count;

  // Get paginated results
  query += ` ORDER BY upload_date DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const { results } = await env.DB.prepare(query).bind(...params).all();

  // Parse JSON fields
  const documents = results.map(doc => ({
    ...doc,
    tags: doc.tags ? JSON.parse(doc.tags) : [],
    metadata: doc.metadata ? JSON.parse(doc.metadata) : {}
  }));

  return new Response(JSON.stringify({
    documents,
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
 * Helper: Search documents
 * Phase 43: Added SQL injection detection and input sanitization
 */
async function handleSearch(env, userId, url) {
  const rawQuery = url.searchParams.get('q') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 50);

  if (!rawQuery) {
    return new Response(JSON.stringify({ error: 'Search query required' }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Phase 43: Detect SQL injection attempts
  const injectionCheck = detectSqlInjection(rawQuery);
  if (!injectionCheck.safe) {
    await logWarn('SQL injection attempt detected in search', {
      endpoint: '/api/digital-archive/search',
      query: rawQuery,
      reason: injectionCheck.reason,
      userId
    }, env);
    
    return new Response(JSON.stringify({ 
      error: 'Invalid search query',
      message: 'Search query contains potentially dangerous characters'
    }), {
      status: 400,
      headers: corsHeaders
    });
  }

  // Sanitize the search query for safe use
  const query = sanitizeString(rawQuery);

  const { results } = await env.DB.prepare(`
    SELECT * FROM digital_archive
    WHERE user_id = ?
      AND status = 'active'
      AND (
        document_name LIKE ?
        OR tags LIKE ?
        OR metadata LIKE ?
      )
    ORDER BY upload_date DESC
    LIMIT ?
  `).bind(userId, `%${query}%`, `%${query}%`, `%${query}%`, limit).all();

  const documents = results.map(doc => ({
    ...doc,
    tags: doc.tags ? JSON.parse(doc.tags) : [],
    metadata: doc.metadata ? JSON.parse(doc.metadata) : {}
  }));

  return new Response(JSON.stringify({
    query,
    results: documents,
    count: documents.length
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Helper: Export archive data
 */
async function handleExport(env, userId, url) {
  const format = url.searchParams.get('format') || 'json';
  const documentType = url.searchParams.get('type');

  let query = `SELECT * FROM digital_archive WHERE user_id = ?`;
  const params = [userId];

  if (documentType) {
    query += ` AND document_type = ?`;
    params.push(documentType);
  }

  query += ` ORDER BY upload_date DESC`;

  const { results } = await env.DB.prepare(query).bind(...params).all();

  const documents = results.map(doc => ({
    ...doc,
    tags: doc.tags ? JSON.parse(doc.tags) : [],
    metadata: doc.metadata ? JSON.parse(doc.metadata) : {}
  }));

  // Log export action
  await logAuditTrail(env, userId, 'export', 'document', null, {
    count: documents.length,
    format
  });

  if (format === 'csv') {
    // Convert to CSV
    const headers = ['ID', 'Type', 'Name', 'Upload Date', 'Status', 'Size', 'Expiration Date'];
    const rows = documents.map(doc => [
      doc.id,
      doc.document_type,
      doc.document_name,
      doc.upload_date,
      doc.status,
      doc.file_size,
      doc.expiration_date || ''
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
        'Content-Disposition': `attachment; filename="archive_export_${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  }

  return new Response(JSON.stringify({
    export_date: new Date().toISOString(),
    documents,
    count: documents.length
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Helper: Log audit trail
 */
async function logAuditTrail(env, userId, actionType, entityType, entityId, details) {
  try {
    await env.DB.prepare(`
      INSERT INTO audit_trail (
        user_id, action_type, entity_type, entity_id,
        action_details, compliance_relevant
      ) VALUES (?, ?, ?, ?, ?, 1)
    `).bind(
      userId,
      actionType,
      entityType,
      entityId,
      JSON.stringify(details)
    ).run();
  } catch (error) {
    await logError(error, { endpoint: 'Error logging audit trail', category: 'api' }, env);
    // Don't throw - audit logging failure shouldn't break the main operation
  }
}
