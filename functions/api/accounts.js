// Accounts API - Manage bank accounts and credit cards

import { getUserIdFromToken } from './auth.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Validate database connection
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    // Build query with optional type filter
    const url = new URL(request.url);
    const accountType = url.searchParams.get('account_type');
    
    let query = 'SELECT * FROM accounts WHERE user_id = ? AND is_active = 1';
    const params = [userId];
    
    // Support filtering by account_type (personal/business)
    if (accountType && ['personal', 'business'].includes(accountType)) {
      query += ' AND account_type = ?';
      params.push(accountType);
    }
    
    query += ' ORDER BY type, name';
    
    const result = await env.DB.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify(result.results || []), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Accounts GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch accounts',
      message: error.message,
      code: 'QUERY_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  try {
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Validate database connection
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    // Check account exists and belongs to user
    const existing = await env.DB.prepare(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();
    
    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Account not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    const { name, type, balance, metadata } = data;
    
    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (type !== undefined) {
      if (!['checking', 'savings', 'credit', 'cash'].includes(type)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid account type',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      updates.push('type = ?');
      params.push(type);
    }
    if (balance !== undefined) {
      const numBalance = parseFloat(balance);
      if (isNaN(numBalance)) {
        return new Response(JSON.stringify({ 
          error: 'Balance must be a valid number',
          code: 'VALIDATION_ERROR'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      updates.push('balance = ?');
      params.push(numBalance);
    }
    if (metadata !== undefined) {
      updates.push('metadata = ?');
      params.push(typeof metadata === 'string' ? metadata : JSON.stringify(metadata));
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
    params.push(id);
    params.push(userId);

    const query = `UPDATE accounts SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;
    await env.DB.prepare(query).bind(...params).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Account updated successfully'
    }), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Accounts PUT error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update account',
      message: error.message,
      code: 'UPDATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required',
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

    const data = await request.json();
    const { name, type, balance, metadata } = data;
    
    // Validate required fields
    if (!name || !type) {
      return new Response(JSON.stringify({ 
        error: 'Name and type are required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Validate account type
    if (!['checking', 'savings', 'credit', 'cash'].includes(type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid account type. Must be: checking, savings, credit, or cash',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    const numBalance = balance !== undefined ? parseFloat(balance) : 0;
    if (isNaN(numBalance)) {
      return new Response(JSON.stringify({ 
        error: 'Balance must be a valid number',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    const metadataStr = metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null;
    
    const result = await env.DB.prepare(
      'INSERT INTO accounts (user_id, name, type, balance, metadata, is_active) VALUES (?, ?, ?, ?, ?, 1)'
    ).bind(userId, name, type, numBalance, metadataStr).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      id: result.meta.last_row_id,
      message: 'Account created successfully'
    }), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Accounts POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create account',
      message: error.message,
      code: 'CREATE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const id = pathParts[pathParts.length - 1];
  
  try {
    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required',
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
    
    // Check if account exists and belongs to user
    const existingAccount = await env.DB.prepare(
      'SELECT id FROM accounts WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();
    
    if (!existingAccount) {
      return new Response(JSON.stringify({ 
        error: 'Account not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    
    // Soft delete: set is_active to 0
    await env.DB.prepare(
      'UPDATE accounts SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Account deleted successfully'
    }), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Accounts DELETE error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete account',
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
