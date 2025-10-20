// Admin Users API - Single user operations (dynamic route)
// Phase 34: Multi-User Architecture and Admin Panel Foundations
// Handles operations on individual users at /api/admin/users/:id

import { getUserIdFromToken } from '../../auth.js';
import { getSecurityHeaders } from '../../../utils/security.js';
import { sanitizeString } from '../../../utils/validation.js';
import { logRequest, logError, logAuditEvent } from '../../../utils/logging.js';
import { createErrorResponse, createSuccessResponse } from '../../../utils/errors.js';

/**
 * Check if user has admin role
 */
async function isAdmin(userId, env) {
  if (!userId || !env.DB) {
    return false;
  }
  
  const user = await env.DB.prepare(
    'SELECT role FROM users WHERE id = ? AND is_active = 1'
  ).bind(userId).first();
  
  return user?.role === 'admin';
}

/**
 * Verify admin authorization
 */
async function verifyAdmin(request, env) {
  const userId = await getUserIdFromToken(request, env);
  
  if (!userId) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: getSecurityHeaders()
      })
    };
  }
  
  const adminStatus = await isAdmin(userId, env);
  
  if (!adminStatus) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Administrator privileges required',
        code: 'ADMIN_REQUIRED'
      }), {
        status: 403,
        headers: getSecurityHeaders()
      })
    };
  }
  
  return { authorized: true, userId };
}

/**
 * GET /api/admin/users/[id]
 * Get specific user details (admin only)
 */
export async function onRequestGet(context) {
  const { env, request, params } = context;
  const corsHeaders = getSecurityHeaders();
  
  try {
    logRequest(request, { endpoint: 'admin/users/[id]', method: 'GET' }, env);
    
    // Verify admin authorization
    const auth = await verifyAdmin(request, env);
    if (!auth.authorized) {
      return auth.response;
    }
    
    const userId = params.id;
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'User ID required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Get user
    const user = await env.DB.prepare(
      `SELECT id, email, name, role, is_active, created_at, last_login_at, avatar_url
       FROM users WHERE id = ?`
    ).bind(userId).first();
    
    if (!user) {
      return new Response(JSON.stringify({
        error: 'User not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
    
    return new Response(JSON.stringify(user), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Admin users GET error:', error);
    await logError(error, {
      endpoint: 'admin/users/[id]',
      method: 'GET'
    }, env);
    
    return await createErrorResponse(error, request, env);
  }
}

/**
 * PUT /api/admin/users/[id]
 * Update user information (admin only)
 */
export async function onRequestPut(context) {
  const { env, request, params } = context;
  const corsHeaders = getSecurityHeaders();
  
  try {
    logRequest(request, { endpoint: 'admin/users/[id]', method: 'PUT' }, env);
    
    // Verify admin authorization
    const auth = await verifyAdmin(request, env);
    if (!auth.authorized) {
      return auth.response;
    }
    
    const userId = params.id;
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'User ID required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    const data = await request.json();
    const { name, role, is_active } = data;
    
    // Validate role if provided
    if (role && !['user', 'admin'].includes(role)) {
      return new Response(JSON.stringify({
        error: 'Invalid role. Must be "user" or "admin"',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Validate is_active if provided
    if (is_active !== undefined && ![0, 1].includes(is_active)) {
      return new Response(JSON.stringify({
        error: 'Invalid is_active value. Must be 0 or 1',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Build update query dynamically
    const updates = [];
    const params_array = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params_array.push(sanitizeString(name));
    }
    
    if (role !== undefined) {
      updates.push('role = ?');
      params_array.push(role);
    }
    
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params_array.push(is_active);
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
    
    // Add userId to params
    params_array.push(userId);
    
    // Update user
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(updateQuery).bind(...params_array).run();
    
    // Get updated user
    const updatedUser = await env.DB.prepare(
      `SELECT id, email, name, role, is_active, created_at, last_login_at, avatar_url
       FROM users WHERE id = ?`
    ).bind(userId).first();
    
    // Log audit event
    await logAuditEvent({
      action: 'admin.users.update',
      userId: auth.userId,
      targetId: userId,
      details: { updates: Object.keys(data) }
    }, env);
    
    return new Response(JSON.stringify(updatedUser), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Admin users PUT error:', error);
    await logError(error, {
      endpoint: 'admin/users/[id]',
      method: 'PUT'
    }, env);
    
    return await createErrorResponse(error, request, env);
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Deactivate user (admin only)
 */
export async function onRequestDelete(context) {
  const { env, request, params } = context;
  const corsHeaders = getSecurityHeaders();
  
  try {
    logRequest(request, { endpoint: 'admin/users/[id]', method: 'DELETE' }, env);
    
    // Verify admin authorization
    const auth = await verifyAdmin(request, env);
    if (!auth.authorized) {
      return auth.response;
    }
    
    const userId = params.id;
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'User ID required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Prevent admin from deleting themselves
    if (userId === auth.userId) {
      return new Response(JSON.stringify({
        error: 'Cannot deactivate your own account',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Soft delete: set is_active = 0
    await env.DB.prepare(
      'UPDATE users SET is_active = 0 WHERE id = ?'
    ).bind(userId).run();
    
    // Log audit event
    await logAuditEvent({
      action: 'admin.users.deactivate',
      userId: auth.userId,
      targetId: userId,
      details: { action: 'soft_delete' }
    }, env);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'User deactivated successfully'
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    await logError(error, {
      endpoint: 'admin/users/[id]',
      method: 'DELETE'
    }, env);
    
    return await createErrorResponse(error, request, env);
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    headers: getSecurityHeaders()
  });
}
