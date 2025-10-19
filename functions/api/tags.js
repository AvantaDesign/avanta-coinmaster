/**
 * Tags API - Phase 27: Advanced Usability Enhancements
 * Handles CRUD operations for the flexible tagging system
 */

import { getUserIdFromToken } from './auth.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/tags - Get all tags for the current user
 * Query params:
 *   - category: Filter by tag category
 *   - search: Search in tag name/description
 *   - entity_type: Filter tags used for specific entity type
 *   - entity_id: Get tags for a specific entity
 *   - include_inactive: Include inactive tags (default: false)
 *   - popular: Return only popular tags sorted by usage
 *   - unused: Return only unused tags
 */
async function getTags(request, env) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const entityType = url.searchParams.get('entity_type');
    const entityId = url.searchParams.get('entity_id');
    const includeInactive = url.searchParams.get('include_inactive') === 'true';
    const popular = url.searchParams.get('popular') === 'true';
    const unused = url.searchParams.get('unused') === 'true';

    const { userId } = request;

    let query;
    let params = [userId];

    // Special case: Get tags for a specific entity
    if (entityType && entityId) {
      query = `
        SELECT DISTINCT
          t.id,
          t.user_id,
          t.name,
          t.description,
          t.color,
          t.category,
          t.is_active,
          t.usage_count,
          t.created_at,
          t.updated_at,
          et.created_at as tagged_at,
          et.created_by as tagged_by
        FROM tags t
        JOIN entity_tags et ON t.id = et.tag_id
        WHERE et.user_id = ?
          AND et.entity_type = ?
          AND et.entity_id = ?
        ORDER BY t.name ASC
      `;
      params = [userId, entityType, entityId];
    }
    // Get popular tags
    else if (popular) {
      query = `
        SELECT 
          id,
          user_id,
          name,
          description,
          color,
          category,
          usage_count,
          created_at,
          updated_at
        FROM tags
        WHERE user_id = ?
          AND is_active = 1
        ORDER BY usage_count DESC, name ASC
        LIMIT 20
      `;
    }
    // Get unused tags
    else if (unused) {
      query = `
        SELECT 
          t.id,
          t.user_id,
          t.name,
          t.description,
          t.color,
          t.category,
          t.usage_count,
          t.created_at,
          t.updated_at,
          CAST((julianday('now') - julianday(t.created_at)) AS INTEGER) as days_since_creation
        FROM tags t
        LEFT JOIN entity_tags et ON t.id = et.tag_id
        WHERE t.user_id = ?
          AND t.is_active = 1
          AND et.id IS NULL
        ORDER BY t.created_at DESC
      `;
    }
    // Get all tags with optional filters
    else {
      let conditions = ['user_id = ?'];
      
      if (!includeInactive) {
        conditions.push('is_active = 1');
      }
      
      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      
      if (search) {
        conditions.push('(name LIKE ? OR description LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern);
      }

      query = `
        SELECT 
          t.id,
          t.user_id,
          t.name,
          t.description,
          t.color,
          t.category,
          t.is_active,
          t.usage_count,
          t.created_at,
          t.updated_at,
          (SELECT COUNT(*) FROM entity_tags WHERE tag_id = t.id) as actual_usage_count
        FROM tags t
        WHERE ${conditions.join(' AND ')}
        ORDER BY t.name ASC
      `;
    }

    const result = await env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify(result.results || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener etiquetas',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * POST /api/tags - Create a new tag
 * Body: { name, description?, color?, category? }
 */
async function createTag(request, env) {
  try {
    const { userId } = request;
    const data = await request.json();
    
    // Validation
    if (!data.name || data.name.trim().length === 0) {
      return new Response(JSON.stringify({ 
        error: 'El nombre de la etiqueta es requerido' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for duplicate tag name for this user
    const existingTag = await env.DB.prepare(
      'SELECT id FROM tags WHERE user_id = ? AND name = ?'
    ).bind(userId, data.name.trim()).first();

    if (existingTag) {
      return new Response(JSON.stringify({ 
        error: 'Ya existe una etiqueta con ese nombre' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert new tag
    const result = await env.DB.prepare(`
      INSERT INTO tags (user_id, name, description, color, category)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      userId,
      data.name.trim(),
      data.description || null,
      data.color || '#3B82F6',
      data.category || null
    ).run();

    // Fetch the created tag
    const newTag = await env.DB.prepare(
      'SELECT * FROM tags WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify(newTag), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al crear etiqueta',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * PUT /api/tags/:id - Update a tag
 * Body: { name?, description?, color?, category?, is_active? }
 */
async function updateTag(request, env, tagId) {
  try {
    const { userId } = request;
    const data = await request.json();

    // Verify ownership
    const existingTag = await env.DB.prepare(
      'SELECT * FROM tags WHERE id = ? AND user_id = ?'
    ).bind(tagId, userId).first();

    if (!existingTag) {
      return new Response(JSON.stringify({ 
        error: 'Etiqueta no encontrada' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== existingTag.name) {
      const duplicate = await env.DB.prepare(
        'SELECT id FROM tags WHERE user_id = ? AND name = ? AND id != ?'
      ).bind(userId, data.name.trim(), tagId).first();

      if (duplicate) {
        return new Response(JSON.stringify({ 
          error: 'Ya existe una etiqueta con ese nombre' 
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name.trim());
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description || null);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      params.push(data.color);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      params.push(data.category || null);
    }
    if (data.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(data.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify(existingTag), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Add WHERE clause parameters
    params.push(tagId, userId);

    await env.DB.prepare(`
      UPDATE tags 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...params).run();

    // Fetch updated tag
    const updatedTag = await env.DB.prepare(
      'SELECT * FROM tags WHERE id = ?'
    ).bind(tagId).first();

    return new Response(JSON.stringify(updatedTag), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al actualizar etiqueta',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * DELETE /api/tags/:id - Delete a tag (also removes all associations)
 */
async function deleteTag(request, env, tagId) {
  try {
    const { userId } = request;

    // Verify ownership
    const existingTag = await env.DB.prepare(
      'SELECT * FROM tags WHERE id = ? AND user_id = ?'
    ).bind(tagId, userId).first();

    if (!existingTag) {
      return new Response(JSON.stringify({ 
        error: 'Etiqueta no encontrada' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Delete tag (cascade will handle entity_tags)
    await env.DB.prepare('DELETE FROM tags WHERE id = ?').bind(tagId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Etiqueta eliminada exitosamente' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al eliminar etiqueta',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * POST /api/tags/:id/apply - Apply a tag to an entity
 * Body: { entity_type, entity_id }
 */
async function applyTag(request, env, tagId) {
  try {
    const { userId } = request;
    const data = await request.json();

    // Validation
    if (!data.entity_type || !data.entity_id) {
      return new Response(JSON.stringify({ 
        error: 'entity_type y entity_id son requeridos' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify tag ownership
    const tag = await env.DB.prepare(
      'SELECT * FROM tags WHERE id = ? AND user_id = ?'
    ).bind(tagId, userId).first();

    if (!tag) {
      return new Response(JSON.stringify({ 
        error: 'Etiqueta no encontrada' 
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if already applied
    const existing = await env.DB.prepare(
      'SELECT id FROM entity_tags WHERE tag_id = ? AND entity_type = ? AND entity_id = ?'
    ).bind(tagId, data.entity_type, data.entity_id).first();

    if (existing) {
      return new Response(JSON.stringify({ 
        error: 'Esta etiqueta ya está aplicada a esta entidad' 
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Apply tag
    await env.DB.prepare(`
      INSERT INTO entity_tags (tag_id, entity_type, entity_id, user_id, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).bind(tagId, data.entity_type, data.entity_id, userId, userId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Etiqueta aplicada exitosamente' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error applying tag:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al aplicar etiqueta',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * DELETE /api/tags/:id/remove - Remove a tag from an entity
 * Body: { entity_type, entity_id }
 */
async function removeTag(request, env, tagId) {
  try {
    const { userId } = request;
    const data = await request.json();

    // Validation
    if (!data.entity_type || !data.entity_id) {
      return new Response(JSON.stringify({ 
        error: 'entity_type y entity_id son requeridos' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Remove tag association
    await env.DB.prepare(`
      DELETE FROM entity_tags 
      WHERE tag_id = ? 
        AND entity_type = ? 
        AND entity_id = ? 
        AND user_id = ?
    `).bind(tagId, data.entity_type, data.entity_id, userId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Etiqueta removida exitosamente' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error removing tag:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al remover etiqueta',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * POST /api/tags/bulk-apply - Apply multiple tags to one or more entities
 * Body: { tag_ids: [1,2,3], entities: [{entity_type, entity_id}, ...] }
 */
async function bulkApplyTags(request, env) {
  try {
    const { userId } = request;
    const data = await request.json();

    // Validation
    if (!data.tag_ids || !Array.isArray(data.tag_ids) || data.tag_ids.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'tag_ids es requerido y debe ser un array con al menos un elemento' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!data.entities || !Array.isArray(data.entities) || data.entities.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'entities es requerido y debe ser un array con al menos un elemento' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let appliedCount = 0;
    let skippedCount = 0;

    // Apply each tag to each entity
    for (const tagId of data.tag_ids) {
      for (const entity of data.entities) {
        if (!entity.entity_type || !entity.entity_id) {
          skippedCount++;
          continue;
        }

        // Check if already applied
        const existing = await env.DB.prepare(
          'SELECT id FROM entity_tags WHERE tag_id = ? AND entity_type = ? AND entity_id = ?'
        ).bind(tagId, entity.entity_type, entity.entity_id).first();

        if (existing) {
          skippedCount++;
          continue;
        }

        // Apply tag
        await env.DB.prepare(`
          INSERT INTO entity_tags (tag_id, entity_type, entity_id, user_id, created_by)
          VALUES (?, ?, ?, ?, ?)
        `).bind(tagId, entity.entity_type, entity.entity_id, userId, userId).run();

        appliedCount++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: `${appliedCount} etiquetas aplicadas exitosamente`,
      applied: appliedCount,
      skipped: skippedCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in bulk apply tags:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al aplicar etiquetas masivamente',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * GET /api/tags/search-suggestions - Get tag suggestions based on partial input
 * Query params:
 *   - query: Search term
 *   - entity_type: Filter by entity type context
 *   - limit: Max results (default: 10)
 */
async function getTagSuggestions(request, env) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    const entityType = url.searchParams.get('entity_type');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const { userId } = request;

    if (!query || query.length < 1) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const searchPattern = `%${query}%`;
    let sqlQuery = `
      SELECT 
        id,
        name,
        description,
        color,
        category,
        usage_count
      FROM tags
      WHERE user_id = ?
        AND is_active = 1
        AND name LIKE ?
    `;
    const params = [userId, searchPattern];

    if (entityType) {
      sqlQuery += ` AND (category = ? OR category IS NULL)`;
      params.push(entityType);
    }

    sqlQuery += ` ORDER BY usage_count DESC, name ASC LIMIT ?`;
    params.push(limit);

    const result = await env.DB.prepare(sqlQuery).bind(...params).all();

    return new Response(JSON.stringify(result.results || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error getting tag suggestions:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener sugerencias',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Main handler - Routes requests based on method and path
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

  // Route based on path and method
  const pathParts = url.pathname.split('/').filter(p => p);
  const hasId = pathParts.length >= 3 && !isNaN(pathParts[2]);
  const tagId = hasId ? parseInt(pathParts[2]) : null;
  const action = pathParts[3]; // For /api/tags/:id/action

  try {
    // GET /api/tags - List tags or search
    if (method === 'GET' && !hasId) {
      return getTags(request, env);
    }
    
    // GET /api/tags/search-suggestions
    if (method === 'GET' && pathParts[2] === 'search-suggestions') {
      return getTagSuggestions(request, env);
    }

    // POST /api/tags - Create new tag
    if (method === 'POST' && !hasId) {
      return createTag(request, env);
    }

    // POST /api/tags/bulk-apply - Bulk apply tags
    if (method === 'POST' && pathParts[2] === 'bulk-apply') {
      return bulkApplyTags(request, env);
    }

    // PUT /api/tags/:id - Update tag
    if (method === 'PUT' && hasId) {
      return updateTag(request, env, tagId);
    }

    // DELETE /api/tags/:id - Delete tag
    if (method === 'DELETE' && hasId && !action) {
      return deleteTag(request, env, tagId);
    }

    // POST /api/tags/:id/apply - Apply tag to entity
    if (method === 'POST' && hasId && action === 'apply') {
      return applyTag(request, env, tagId);
    }

    // DELETE /api/tags/:id/remove - Remove tag from entity
    if (method === 'DELETE' && hasId && action === 'remove') {
      return removeTag(request, env, tagId);
    }

    return new Response(JSON.stringify({ error: 'Ruta no encontrada' }), {
      status: 404,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in tags API:', error);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
