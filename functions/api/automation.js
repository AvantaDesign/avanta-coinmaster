// Automation API - Manage automation rules and schedules

import { getUserIdFromToken } from './auth.js';
import { getSecurityHeaders } from '../utils/security.js';
import { logRequest, logError } from '../utils/logging.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // Authenticate user
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: getSecurityHeaders()
      });
    }

    // Log request
    logRequest(request, { endpoint: 'automation', method: 'GET' }, env);

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: getSecurityHeaders()
      });
    }

    const url = new URL(request.url);
    const ruleType = url.searchParams.get('rule_type');
    const isActive = url.searchParams.get('is_active');
    const id = url.searchParams.get('id');

    // Get specific rule
    if (id) {
      const rule = await env.DB.prepare(
        'SELECT * FROM automation_rules WHERE id = ? AND user_id = ?'
      ).bind(id, userId).first();

      if (!rule) {
        return new Response(JSON.stringify({ 
          error: 'Automation rule not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      return new Response(JSON.stringify(rule), {
        headers: getSecurityHeaders()
      });
    }

    // Build query
    let query = 'SELECT * FROM automation_rules WHERE user_id = ?';
    const params = [userId];

    if (ruleType) {
      query += ' AND rule_type = ?';
      params.push(ruleType);
    }

    if (isActive !== null && isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = params.length > 0 
      ? env.DB.prepare(query).bind(...params)
      : env.DB.prepare(query);

    const result = await stmt.all();

    return new Response(JSON.stringify(result.results || []), {
      headers: getSecurityHeaders()
    });

  } catch (error) {
    await logError(error, { endpoint: 'Automation GET error', category: 'api' }, env);
    logError(error, { endpoint: 'automation', method: 'GET' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch automation rules',
      message: error.message,
      code: 'QUERY_ERROR'
    }), {
      status: 500,
      headers: getSecurityHeaders()
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    // Authenticate user
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: getSecurityHeaders()
      });
    }

    // Log request
    logRequest(request, { endpoint: 'automation', method: 'POST' }, env);

    if (!env.DB) {
      return new Response(JSON.stringify({
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: getSecurityHeaders()
      });
    }

    const data = await request.json();
    const {
      rule_type,
      name,
      description,
      is_active,
      customer_name,
      customer_rfc,
      amount,
      frequency,
      start_date,
      end_date,
      days_before_due,
      reminder_type,
      config_json
    } = data;

    // Validate required fields
    if (!rule_type || !name) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        required: ['rule_type', 'name'],
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate rule type
    const validRuleTypes = ['recurring_invoice', 'payment_reminder', 'overdue_alert'];
    if (!validRuleTypes.includes(rule_type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid rule type',
        validTypes: validRuleTypes,
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Calculate next generation date for recurring invoices
    let next_generation_date = null;
    if (rule_type === 'recurring_invoice' && start_date) {
      next_generation_date = start_date;
    }

    const result = await env.DB.prepare(
      `INSERT INTO automation_rules (
        user_id, rule_type, name, description, is_active,
        customer_name, customer_rfc, amount, frequency,
        start_date, end_date, next_generation_date,
        days_before_due, reminder_type, config_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      userId,
      rule_type,
      name,
      description || null,
      is_active !== undefined ? is_active : 1,
      customer_name || null,
      customer_rfc || null,
      amount || null,
      frequency || null,
      start_date || null,
      end_date || null,
      next_generation_date,
      days_before_due !== undefined ? days_before_due : null,
      reminder_type || null,
      config_json ? JSON.stringify(config_json) : null
    ).run();

    return new Response(JSON.stringify({
      success: true,
      id: result.meta.last_row_id
    }), {
      status: 201,
      headers: getSecurityHeaders()
    });

  } catch (error) {
    await logError(error, { endpoint: 'Automation POST error', category: 'api' }, env);
    logError(error, { endpoint: 'automation', method: 'POST' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to create automation rule',
      message: error.message,
      code: 'CREATE_ERROR'
    }), {
      status: 500,
      headers: getSecurityHeaders()
    });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    const { id, is_active, next_generation_date, last_generated_date, ...updateData } = data;

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Rule ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get current rule
    const rule = await env.DB.prepare(
      'SELECT * FROM automation_rules WHERE id = ?'
    ).bind(id).first();

    if (!rule) {
      return new Response(JSON.stringify({ 
        error: 'Automation rule not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (next_generation_date !== undefined) {
      updates.push('next_generation_date = ?');
      params.push(next_generation_date);
    }

    if (last_generated_date !== undefined) {
      updates.push('last_generated_date = ?');
      params.push(last_generated_date);
    }

    if (updateData.name) {
      updates.push('name = ?');
      params.push(updateData.name);
    }

    if (updateData.description !== undefined) {
      updates.push('description = ?');
      params.push(updateData.description);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    if (updates.length === 1) { // Only timestamp update
      return new Response(JSON.stringify({
        success: true,
        message: 'No updates provided'
      }), {
        headers: corsHeaders
      });
    }

    await env.DB.prepare(
      `UPDATE automation_rules SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...params).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Automation rule updated successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Automation PUT error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to update automation rule',
      message: error.message,
      code: 'UPDATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ 
        error: 'Rule ID is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Delete automation rule
    await env.DB.prepare(
      'DELETE FROM automation_rules WHERE id = ?'
    ).bind(id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Automation rule deleted successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Automation DELETE error', category: 'api' }, env);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete automation rule',
      message: error.message,
      code: 'DELETE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
