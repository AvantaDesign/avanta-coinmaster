// Categories API - Manage custom transaction categories

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestGet(context) {
  const { env } = context;
  
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

    // Get only active categories by default
    const result = await env.DB.prepare(
      'SELECT * FROM categories WHERE is_active = 1 ORDER BY name'
    ).all();
    
    return new Response(JSON.stringify(result.results || []), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Categories GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch categories',
      message: error.message,
      code: 'QUERY_ERROR'
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
    const { name, description, color } = data;
    
    // Validate required fields
    if (!name) {
      return new Response(JSON.stringify({ 
        error: 'Name is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Check if category name already exists
    const existing = await env.DB.prepare(
      'SELECT id FROM categories WHERE name = ?'
    ).bind(name).first();
    
    if (existing) {
      return new Response(JSON.stringify({ 
        error: 'Category with this name already exists',
        code: 'DUPLICATE_ERROR'
      }), {
        status: 409,
        headers: corsHeaders
      });
    }
    
    const categoryColor = color || '#3B82F6';
    const result = await env.DB.prepare(
      'INSERT INTO categories (name, description, color, is_active) VALUES (?, ?, ?, 1)'
    ).bind(name, description || '', categoryColor).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      id: result.meta.last_row_id,
      message: 'Category created successfully'
    }), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Categories POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create category',
      message: error.message,
      code: 'CREATE_ERROR'
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
    const { name, description, color } = data;
    
    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      // Check if new name conflicts with existing category
      const existing = await env.DB.prepare(
        'SELECT id FROM categories WHERE name = ? AND id != ?'
      ).bind(name, id).first();
      
      if (existing) {
        return new Response(JSON.stringify({ 
          error: 'Category with this name already exists',
          code: 'DUPLICATE_ERROR'
        }), {
          status: 409,
          headers: corsHeaders
        });
      }
      
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
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
    
    // Check if category exists
    const existingCategory = await env.DB.prepare(
      'SELECT id FROM categories WHERE id = ?'
    ).bind(id).first();
    
    if (!existingCategory) {
      return new Response(JSON.stringify({ 
        error: 'Category not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(query).bind(...params).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Category updated successfully'
    }), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Categories PUT error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update category',
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
    
    // Check if category exists
    const existingCategory = await env.DB.prepare(
      'SELECT id FROM categories WHERE id = ?'
    ).bind(id).first();
    
    if (!existingCategory) {
      return new Response(JSON.stringify({ 
        error: 'Category not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    
    // Soft delete: set is_active to 0
    await env.DB.prepare(
      'UPDATE categories SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(id).run();
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Category deleted successfully'
    }), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete category',
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
