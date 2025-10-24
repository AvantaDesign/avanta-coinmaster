/**
 * Filter Presets API - Phase 50: Advanced Search & Filtering
 * Manages saved filter presets for quick access to common filters
 */

import { getUserIdFromToken } from '../auth.js';
import { logInfo, logError } from '../../utils/logging.js';
import { invalidateRelatedCaches } from '../../utils/cache.js';

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
 * GET /api/filters/presets - Get all filter presets for user
 * Query params:
 *   - favorites_only: Return only favorite presets (default: false)
 */
async function getFilterPresets(request, env) {
  try {
    const url = new URL(request.url);
    const favoritesOnly = url.searchParams.get('favorites_only') === 'true';
    const { userId } = request;

    let query = `
      SELECT 
        id,
        name,
        description,
        filter_config,
        is_shared,
        is_favorite,
        usage_count,
        created_at,
        updated_at
      FROM filter_presets
      WHERE user_id = ?
    `;

    const params = [userId];

    if (favoritesOnly) {
      query += ' AND is_favorite = 1';
    }

    query += ' ORDER BY is_favorite DESC, usage_count DESC, name ASC';

    const result = await env.DB.prepare(query).bind(...params).all();

    // Parse JSON config for each preset
    const presets = (result.results || []).map(row => ({
      ...row,
      filter_config: JSON.parse(row.filter_config)
    }));

    return new Response(JSON.stringify(presets), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'GET /api/filters/presets', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener presets de filtros',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/filters/presets - Create a new filter preset
 * Body: { name, description?, filter_config, is_favorite? }
 */
async function createFilterPreset(request, env) {
  try {
    const { userId } = request;
    const data = await request.json();

    // Validation
    if (!data.name || data.name.trim().length === 0) {
      return new Response(JSON.stringify({ 
        error: 'El nombre del preset es requerido' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!data.filter_config) {
      return new Response(JSON.stringify({ 
        error: 'La configuración del filtro es requerida' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check for duplicate name
    const existing = await env.DB.prepare(
      'SELECT id FROM filter_presets WHERE user_id = ? AND name = ?'
    ).bind(userId, data.name.trim()).first();

    if (existing) {
      return new Response(JSON.stringify({ 
        error: 'Ya existe un preset con ese nombre' 
      }), {
        status: 409,
        headers: corsHeaders
      });
    }

    // Insert new preset
    const result = await env.DB.prepare(`
      INSERT INTO filter_presets (
        user_id, 
        name, 
        description, 
        filter_config,
        is_favorite,
        is_shared
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      data.name.trim(),
      data.description || null,
      JSON.stringify(data.filter_config),
      data.is_favorite ? 1 : 0,
      data.is_shared ? 1 : 0
    ).run();

    // Fetch the created preset
    const newPreset = await env.DB.prepare(
      'SELECT * FROM filter_presets WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    // Parse filter_config
    const preset = {
      ...newPreset,
      filter_config: JSON.parse(newPreset.filter_config)
    };

    await logInfo('Filter preset created', { 
      presetId: preset.id, 
      name: preset.name,
      userId 
    }, env);

    return new Response(JSON.stringify(preset), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'POST /api/filters/presets', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error al crear preset de filtro',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * PUT /api/filters/presets/:id - Update a filter preset
 * Body: { name?, description?, filter_config?, is_favorite?, is_shared? }
 */
async function updateFilterPreset(request, env, presetId) {
  try {
    const { userId } = request;
    const data = await request.json();

    // Verify ownership
    const existing = await env.DB.prepare(
      'SELECT * FROM filter_presets WHERE id = ? AND user_id = ?'
    ).bind(presetId, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Preset no encontrado' 
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== existing.name) {
      const duplicate = await env.DB.prepare(
        'SELECT id FROM filter_presets WHERE user_id = ? AND name = ? AND id != ?'
      ).bind(userId, data.name.trim(), presetId).first();

      if (duplicate) {
        return new Response(JSON.stringify({ 
          error: 'Ya existe un preset con ese nombre' 
        }), {
          status: 409,
          headers: corsHeaders
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
    if (data.filter_config !== undefined) {
      updates.push('filter_config = ?');
      params.push(JSON.stringify(data.filter_config));
    }
    if (data.is_favorite !== undefined) {
      updates.push('is_favorite = ?');
      params.push(data.is_favorite ? 1 : 0);
    }
    if (data.is_shared !== undefined) {
      updates.push('is_shared = ?');
      params.push(data.is_shared ? 1 : 0);
    }

    // Always update updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP');

    if (updates.length === 0) {
      const preset = {
        ...existing,
        filter_config: JSON.parse(existing.filter_config)
      };
      return new Response(JSON.stringify(preset), {
        status: 200,
        headers: corsHeaders
      });
    }

    // Add WHERE clause parameters
    params.push(presetId, userId);

    await env.DB.prepare(`
      UPDATE filter_presets 
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...params).run();

    // Fetch updated preset
    const updated = await env.DB.prepare(
      'SELECT * FROM filter_presets WHERE id = ?'
    ).bind(presetId).first();

    const preset = {
      ...updated,
      filter_config: JSON.parse(updated.filter_config)
    };

    await logInfo('Filter preset updated', { 
      presetId: preset.id, 
      name: preset.name,
      userId 
    }, env);

    return new Response(JSON.stringify(preset), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'PUT /api/filters/presets/:id', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error al actualizar preset',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * DELETE /api/filters/presets/:id - Delete a filter preset
 */
async function deleteFilterPreset(request, env, presetId) {
  try {
    const { userId } = request;

    // Verify ownership
    const existing = await env.DB.prepare(
      'SELECT * FROM filter_presets WHERE id = ? AND user_id = ?'
    ).bind(presetId, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Preset no encontrado' 
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Delete preset
    await env.DB.prepare('DELETE FROM filter_presets WHERE id = ?')
      .bind(presetId)
      .run();

    await logInfo('Filter preset deleted', { 
      presetId, 
      name: existing.name,
      userId 
    }, env);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Preset eliminado exitosamente' 
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'DELETE /api/filters/presets/:id', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error al eliminar preset',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/filters/presets/:id/use - Track preset usage
 */
async function trackPresetUsage(request, env, presetId) {
  try {
    const { userId } = request;

    // Verify ownership
    const existing = await env.DB.prepare(
      'SELECT id FROM filter_presets WHERE id = ? AND user_id = ?'
    ).bind(presetId, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Preset no encontrado' 
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Increment usage count
    await env.DB.prepare(`
      UPDATE filter_presets 
      SET usage_count = usage_count + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(presetId).run();

    return new Response(JSON.stringify({ 
      success: true 
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'POST /api/filters/presets/:id/use', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error al registrar uso',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
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

  // Route based on path
  const pathParts = url.pathname.split('/').filter(p => p);
  const hasId = pathParts.length >= 4 && !isNaN(pathParts[3]);
  const presetId = hasId ? parseInt(pathParts[3]) : null;
  const action = pathParts[4]; // For /api/filters/presets/:id/action

  try {
    // GET /api/filters/presets
    if (method === 'GET' && !hasId) {
      return getFilterPresets(request, env);
    }

    // POST /api/filters/presets
    if (method === 'POST' && !hasId) {
      return createFilterPreset(request, env);
    }

    // PUT /api/filters/presets/:id
    if (method === 'PUT' && hasId) {
      return updateFilterPreset(request, env, presetId);
    }

    // DELETE /api/filters/presets/:id
    if (method === 'DELETE' && hasId && !action) {
      return deleteFilterPreset(request, env, presetId);
    }

    // POST /api/filters/presets/:id/use
    if (method === 'POST' && hasId && action === 'use') {
      return trackPresetUsage(request, env, presetId);
    }

    return new Response(JSON.stringify({ error: 'Ruta no encontrada' }), {
      status: 404,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'filter presets API', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Error interno del servidor',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
