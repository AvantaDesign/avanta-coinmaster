// Accounts API - Manage bank accounts and credit cards

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestGet(context) {
  const { env } = context;
  
  try {
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

    // Get only active accounts by default
    const result = await env.DB.prepare(
      'SELECT * FROM accounts WHERE is_active = 1 ORDER BY type, name'
    ).all();
    
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

    const data = await request.json();
    const { name, type, balance } = data;
    
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
    
    // Check if account exists
    const existingAccount = await env.DB.prepare(
      'SELECT id FROM accounts WHERE id = ?'
    ).bind(id).first();
    
    if (!existingAccount) {
      return new Response(JSON.stringify({ 
        error: 'Account not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const query = `UPDATE accounts SET ${updates.join(', ')} WHERE id = ?`;
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
    const { name, type, balance } = data;
    
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
    
    const result = await env.DB.prepare(
      'INSERT INTO accounts (name, type, balance, is_active) VALUES (?, ?, ?, 1)'
    ).bind(name, type, numBalance).run();
    
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
    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }
    
    // Check if account exists
    const existingAccount = await env.DB.prepare(
      'SELECT id FROM accounts WHERE id = ?'
    ).bind(id).first();
    
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
      'UPDATE accounts SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(id).run();
    
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
