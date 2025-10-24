/**
 * Bulk Operations API - Phase 50: Advanced Search & Filtering
 * Handles bulk editing, categorization, tagging, and export operations
 */

import { getUserIdFromToken } from '../auth.js';
import { logInfo, logError } from '../../utils/logging.js';
import { invalidateRelatedCaches } from '../../utils/cache.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
 * POST /api/bulk/operations/edit - Bulk edit transactions
 * Body: {
 *   transaction_ids: [1, 2, 3],
 *   updates: { category_id?, account_id?, is_deductible?, notes?, ... }
 * }
 */
async function bulkEdit(request, env) {
  try {
    const { userId } = request;
    const data = await request.json();

    // Validation
    if (!data.transaction_ids || !Array.isArray(data.transaction_ids) || data.transaction_ids.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'transaction_ids es requerido y debe contener al menos un ID' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!data.updates || Object.keys(data.updates).length === 0) {
      return new Response(JSON.stringify({ 
        error: 'updates es requerido y debe contener al menos un campo' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify ownership of all transactions
    const placeholders = data.transaction_ids.map(() => '?').join(',');
    const verifyQuery = `
      SELECT id FROM transactions 
      WHERE id IN (${placeholders}) AND user_id = ?
    `;
    const verifyResult = await env.DB.prepare(verifyQuery)
      .bind(...data.transaction_ids, userId)
      .all();

    if (verifyResult.results.length !== data.transaction_ids.length) {
      return new Response(JSON.stringify({ 
        error: 'Algunas transacciones no existen o no te pertenecen' 
      }), {
        status: 403,
        headers: corsHeaders
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    const allowedFields = [
      'transaction_type', 'category_id', 'account_id', 'amount', 
      'description', 'notes', 'is_deductible', 'date'
    ];

    for (const [key, value] of Object.entries(data.updates)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No hay campos válidos para actualizar' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Add updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');

    // Add WHERE clause parameters
    params.push(...data.transaction_ids);

    // Execute bulk update
    const updateQuery = `
      UPDATE transactions 
      SET ${updates.join(', ')}
      WHERE id IN (${placeholders})
    `;

    await env.DB.prepare(updateQuery).bind(...params).run();

    // Invalidate caches
    await invalidateRelatedCaches('transaction', null, userId, env);

    await logInfo('Bulk edit completed', { 
      count: data.transaction_ids.length,
      updates: Object.keys(data.updates),
      userId 
    }, env);

    return new Response(JSON.stringify({ 
      success: true,
      updated_count: data.transaction_ids.length,
      message: `${data.transaction_ids.length} transacciones actualizadas exitosamente`
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'POST /api/bulk/operations/edit', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error en edición masiva',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/bulk/operations/tag - Bulk tag operations
 * Body: {
 *   entity_type: 'transaction',
 *   entity_ids: [1, 2, 3],
 *   tag_ids: [1, 2],
 *   action: 'add' | 'remove' | 'replace'
 * }
 */
async function bulkTag(request, env) {
  try {
    const { userId } = request;
    const data = await request.json();

    // Validation
    if (!data.entity_type || !data.entity_ids || !Array.isArray(data.entity_ids)) {
      return new Response(JSON.stringify({ 
        error: 'entity_type y entity_ids son requeridos' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!data.tag_ids || !Array.isArray(data.tag_ids)) {
      return new Response(JSON.stringify({ 
        error: 'tag_ids es requerido' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const action = data.action || 'add';
    if (!['add', 'remove', 'replace'].includes(action)) {
      return new Response(JSON.stringify({ 
        error: 'action debe ser add, remove o replace' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    let added = 0;
    let removed = 0;
    let skipped = 0;

    // If replace, remove all existing tags first
    if (action === 'replace') {
      for (const entityId of data.entity_ids) {
        await env.DB.prepare(`
          DELETE FROM entity_tags 
          WHERE entity_type = ? AND entity_id = ? AND user_id = ?
        `).bind(data.entity_type, entityId, userId).run();
      }
      removed += data.entity_ids.length;
    }

    // Add or remove tags
    for (const entityId of data.entity_ids) {
      for (const tagId of data.tag_ids) {
        if (action === 'remove') {
          // Remove tag
          await env.DB.prepare(`
            DELETE FROM entity_tags 
            WHERE tag_id = ? AND entity_type = ? AND entity_id = ? AND user_id = ?
          `).bind(tagId, data.entity_type, entityId, userId).run();
          removed++;
        } else {
          // Check if already exists
          const existing = await env.DB.prepare(
            'SELECT id FROM entity_tags WHERE tag_id = ? AND entity_type = ? AND entity_id = ?'
          ).bind(tagId, data.entity_type, entityId).first();

          if (existing) {
            skipped++;
            continue;
          }

          // Add tag
          await env.DB.prepare(`
            INSERT INTO entity_tags (tag_id, entity_type, entity_id, user_id, created_by)
            VALUES (?, ?, ?, ?, ?)
          `).bind(tagId, data.entity_type, entityId, userId, userId).run();
          added++;
        }
      }
    }

    await logInfo('Bulk tag operation completed', { 
      action,
      entityType: data.entity_type,
      entityCount: data.entity_ids.length,
      tagCount: data.tag_ids.length,
      added,
      removed,
      skipped,
      userId 
    }, env);

    return new Response(JSON.stringify({ 
      success: true,
      added,
      removed,
      skipped,
      message: `Operación completada: ${added} agregados, ${removed} removidos, ${skipped} omitidos`
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'POST /api/bulk/operations/tag', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error en operación de etiquetado masivo',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/bulk/operations/categorize - Bulk categorize transactions
 * Body: {
 *   transaction_ids: [1, 2, 3],
 *   category_id: 5
 * }
 */
async function bulkCategorize(request, env) {
  try {
    const { userId } = request;
    const data = await request.json();

    // Validation
    if (!data.transaction_ids || !Array.isArray(data.transaction_ids) || data.transaction_ids.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'transaction_ids es requerido' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!data.category_id) {
      return new Response(JSON.stringify({ 
        error: 'category_id es requerido' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify category belongs to user
    const category = await env.DB.prepare(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?'
    ).bind(data.category_id, userId).first();

    if (!category) {
      return new Response(JSON.stringify({ 
        error: 'Categoría no encontrada' 
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Verify ownership of transactions
    const placeholders = data.transaction_ids.map(() => '?').join(',');
    const verifyQuery = `
      SELECT id FROM transactions 
      WHERE id IN (${placeholders}) AND user_id = ?
    `;
    const verifyResult = await env.DB.prepare(verifyQuery)
      .bind(...data.transaction_ids, userId)
      .all();

    if (verifyResult.results.length !== data.transaction_ids.length) {
      return new Response(JSON.stringify({ 
        error: 'Algunas transacciones no existen o no te pertenecen' 
      }), {
        status: 403,
        headers: corsHeaders
      });
    }

    // Execute bulk categorization
    const updateQuery = `
      UPDATE transactions 
      SET category_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id IN (${placeholders})
    `;

    await env.DB.prepare(updateQuery)
      .bind(data.category_id, ...data.transaction_ids)
      .run();

    // Invalidate caches
    await invalidateRelatedCaches('transaction', null, userId, env);

    await logInfo('Bulk categorize completed', { 
      count: data.transaction_ids.length,
      categoryId: data.category_id,
      userId 
    }, env);

    return new Response(JSON.stringify({ 
      success: true,
      updated_count: data.transaction_ids.length,
      message: `${data.transaction_ids.length} transacciones categorizadas exitosamente`
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'POST /api/bulk/operations/categorize', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error en categorización masiva',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/bulk/operations/export - Bulk export data
 * Body: {
 *   entity_type: 'transactions',
 *   entity_ids: [1, 2, 3],
 *   format: 'csv' | 'json'
 * }
 */
async function bulkExport(request, env) {
  try {
    const { userId } = request;
    const data = await request.json();

    // Validation
    if (!data.entity_type || !data.entity_ids || !Array.isArray(data.entity_ids)) {
      return new Response(JSON.stringify({ 
        error: 'entity_type y entity_ids son requeridos' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const format = data.format || 'json';
    if (!['csv', 'json'].includes(format)) {
      return new Response(JSON.stringify({ 
        error: 'format debe ser csv o json' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // For now, only support transactions
    if (data.entity_type !== 'transactions') {
      return new Response(JSON.stringify({ 
        error: 'Solo se soporta entity_type = transactions por ahora' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Fetch transactions
    const placeholders = data.entity_ids.map(() => '?').join(',');
    const query = `
      SELECT 
        t.*,
        c.name as category_name,
        a.name as account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.id IN (${placeholders}) AND t.user_id = ?
      ORDER BY t.date DESC
    `;

    const result = await env.DB.prepare(query)
      .bind(...data.entity_ids, userId)
      .all();

    const transactions = result.results || [];

    if (format === 'json') {
      return new Response(JSON.stringify(transactions, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="transactions_export_${Date.now()}.json"`
        }
      });
    } else {
      // CSV format
      const headers = ['id', 'date', 'amount', 'description', 'category_name', 'account_name', 'transaction_type'];
      const csvRows = [headers.join(',')];

      for (const row of transactions) {
        const values = headers.map(header => {
          const value = row[header] || '';
          // Escape commas and quotes
          return `"${String(value).replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
      }

      return new Response(csvRows.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transactions_export_${Date.now()}.csv"`
        }
      });
    }
  } catch (error) {
    await logError(error, { endpoint: 'POST /api/bulk/operations/export', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error en exportación masiva',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Main handler - Routes requests based on path
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  // Verify authentication
  const userId = await getUserIdFromToken(request, env);
  if (!userId) {
    return new Response(JSON.stringify({ 
      error: 'No autenticado',
      message: 'Token de autenticación requerido',
      code: 'AUTH_REQUIRED'
    }), {
      status: 401,
      headers: corsHeaders
    });
  }

  // Attach userId to request
  request.userId = userId;

  // Route based on path
  const pathParts = url.pathname.split('/').filter(p => p);
  const operation = pathParts[3]; // 'edit', 'tag', 'categorize', 'export'

  try {
    if (method !== 'POST') {
      return new Response(JSON.stringify({ 
        error: 'Solo se permite el método POST' 
      }), {
        status: 405,
        headers: corsHeaders
      });
    }

    // POST /api/bulk/operations/edit
    if (operation === 'edit') {
      return bulkEdit(request, env);
    }

    // POST /api/bulk/operations/tag
    if (operation === 'tag') {
      return bulkTag(request, env);
    }

    // POST /api/bulk/operations/categorize
    if (operation === 'categorize') {
      return bulkCategorize(request, env);
    }

    // POST /api/bulk/operations/export
    if (operation === 'export') {
      return bulkExport(request, env);
    }

    return new Response(JSON.stringify({ error: 'Operación no encontrada' }), {
      status: 404,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'bulk operations API', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
