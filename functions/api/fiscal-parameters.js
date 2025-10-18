// Fiscal Parameters API - Manage dynamic tax rates and fiscal parameters
// Endpoints:
// GET /api/fiscal-parameters - List all parameters (with filters)
// GET /api/fiscal-parameters/:type/:date - Get parameters for specific date
// POST /api/fiscal-parameters - Create new parameter
// PUT /api/fiscal-parameters/:id - Update parameter
// DELETE /api/fiscal-parameters/:id - Delete parameter

import { getUserIdFromToken } from './auth.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// GET /api/fiscal-parameters - List or get specific parameter
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  try {
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    // Check if requesting specific parameter by type and date
    const pathParts = path.split('/').filter(p => p);
    if (pathParts.length >= 4) {
      const parameterType = pathParts[2];
      const date = pathParts[3];
      return handleGetParameterByDate(env, parameterType, date);
    }

    // List all parameters with filters
    const parameterType = url.searchParams.get('type');
    const periodType = url.searchParams.get('period');
    const isActive = url.searchParams.get('active');
    const page = parseInt(url.searchParams.get('page')) || 1;
    const perPage = Math.min(parseInt(url.searchParams.get('perPage')) || 50, 100);
    const offset = (page - 1) * perPage;

    // Build query
    const conditions = [];
    const bindings = [];

    if (parameterType) {
      conditions.push('parameter_type = ?');
      bindings.push(parameterType);
    }
    if (periodType) {
      conditions.push('period_type = ?');
      bindings.push(periodType);
    }
    if (isActive !== null && isActive !== undefined) {
      conditions.push('is_active = ?');
      bindings.push(isActive === 'true' ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const parameters = await env.DB.prepare(`
      SELECT *
      FROM fiscal_parameters
      ${whereClause}
      ORDER BY effective_from DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, perPage, offset).all();

    const total = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM fiscal_parameters
      ${whereClause}
    `).bind(...bindings).first();

    return new Response(JSON.stringify({ 
      parameters: parameters.results || [],
      pagination: {
        page,
        perPage,
        total: total?.count || 0,
        totalPages: Math.ceil((total?.count || 0) / perPage),
      }
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Fiscal Parameters GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch fiscal parameters',
      message: error.message,
      code: 'FETCH_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Get parameter by type and date
async function handleGetParameterByDate(env, parameterType, date) {
  try {
    // Find parameter that is effective for the given date
    const parameter = await env.DB.prepare(`
      SELECT *
      FROM fiscal_parameters
      WHERE parameter_type = ?
        AND effective_from <= ?
        AND (effective_to IS NULL OR effective_to >= ?)
        AND is_active = 1
      ORDER BY effective_from DESC
      LIMIT 1
    `).bind(parameterType, date, date).first();

    if (!parameter) {
      return new Response(JSON.stringify({ 
        error: 'Parameter not found for this date',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify(parameter), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Get parameter by date error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch parameter',
      message: error.message,
      code: 'FETCH_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// POST /api/fiscal-parameters - Create new parameter
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    const {
      parameter_type,
      period_type,
      effective_from,
      effective_to,
      value,
      description,
      source,
      is_active = 1,
    } = body;

    // Validation
    const validTypes = ['isr_bracket', 'iva_rate', 'iva_retention', 'diot_threshold', 'uma_value', 'minimum_wage', 'other'];
    if (!validTypes.includes(parameter_type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid parameter_type',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const validPeriods = ['monthly', 'annual', 'permanent'];
    if (!validPeriods.includes(period_type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid period_type',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!effective_from) {
      return new Response(JSON.stringify({ 
        error: 'effective_from is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!value) {
      return new Response(JSON.stringify({ 
        error: 'value is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate value format
    if (parameter_type === 'isr_bracket') {
      try {
        const brackets = JSON.parse(value);
        if (!Array.isArray(brackets)) {
          throw new Error('ISR brackets must be an array');
        }
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Invalid ISR bracket format',
          message: error.message,
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
    } else {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        return new Response(JSON.stringify({ 
          error: 'Value must be a positive number',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
    }

    const parameterId = `param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await env.DB.prepare(`
      INSERT INTO fiscal_parameters (
        id, parameter_type, period_type, effective_from, effective_to,
        value, description, source, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      parameterId,
      parameter_type,
      period_type,
      effective_from,
      effective_to || null,
      value,
      description || null,
      source || null,
      is_active
    ).run();

    return new Response(JSON.stringify({ 
      success: true,
      parameterId,
      message: 'Parameter created successfully'
    }), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Fiscal Parameters POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create parameter',
      message: error.message,
      code: 'CREATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// PUT /api/fiscal-parameters/:id - Update parameter
export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  try {
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const pathParts = path.split('/');
    const parameterId = pathParts[pathParts.length - 1];

    if (!parameterId) {
      return new Response(JSON.stringify({ 
        error: 'Parameter ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    const {
      effective_to,
      value,
      description,
      source,
      is_active,
    } = body;

    // Build update query
    const updates = [];
    const bindings = [];

    if (effective_to !== undefined) {
      updates.push('effective_to = ?');
      bindings.push(effective_to);
    }
    if (value !== undefined) {
      updates.push('value = ?');
      bindings.push(value);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      bindings.push(description);
    }
    if (source !== undefined) {
      updates.push('source = ?');
      bindings.push(source);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      bindings.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No fields to update',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    bindings.push(parameterId);

    await env.DB.prepare(`
      UPDATE fiscal_parameters
      SET ${updates.join(', ')}
      WHERE id = ?
    `).bind(...bindings).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Parameter updated successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Fiscal Parameters PUT error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update parameter',
      message: error.message,
      code: 'UPDATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// DELETE /api/fiscal-parameters/:id - Delete parameter (soft delete)
export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  try {
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const pathParts = path.split('/');
    const parameterId = pathParts[pathParts.length - 1];

    if (!parameterId) {
      return new Response(JSON.stringify({ 
        error: 'Parameter ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Soft delete by setting is_active to 0
    await env.DB.prepare(`
      UPDATE fiscal_parameters
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(parameterId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Parameter deleted successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Fiscal Parameters DELETE error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete parameter',
      message: error.message,
      code: 'DELETE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
