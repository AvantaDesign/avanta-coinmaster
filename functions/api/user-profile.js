// User Profile API - Manage user account settings, password changes, and profile updates
// SECURITY: Only authenticated users can access their own profile

import { getUserIdFromToken } from './auth.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Hash password using Web Crypto API with SHA-256
 * Generates a unique salt for each password
 */
async function hashPassword(password) {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  const saltedPassword = new Uint8Array(salt.length + passwordData.length);
  saltedPassword.set(salt);
  saltedPassword.set(passwordData, salt.length);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', saltedPassword);
  const hashArray = new Uint8Array(hashBuffer);
  
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

/**
 * Verify password using constant-time comparison
 */
async function verifyPassword(password, storedHash) {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    const saltedPassword = new Uint8Array(salt.length + passwordData.length);
    saltedPassword.set(salt);
    saltedPassword.set(passwordData, salt.length);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', saltedPassword);
    const hashArray = new Uint8Array(hashBuffer);
    const computedHashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (computedHashHex.length !== hashHex.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < computedHashHex.length; i++) {
      result |= computedHashHex.charCodeAt(i) ^ hashHex.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

/**
 * GET /api/user-profile
 * Get current user's full profile
 */
async function handleGetProfile(request, env) {
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
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const user = await env.DB.prepare(
      'SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ? AND is_active = 1'
    ).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Add default preferences since column might not exist
    user.preferences = {};
    user.avatar_url = null;

    return new Response(JSON.stringify({
      success: true,
      user: user
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get profile',
      message: error.message,
      code: 'GET_PROFILE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * PUT /api/user-profile
 * Update user profile (name, preferences)
 */
async function handleUpdateProfile(request, env) {
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

    const { name, preferences } = await request.json();

    if (!env.DB) {
      return new Response(JSON.stringify({
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (preferences !== undefined) {
      updates.push('preferences = ?');
      params.push(JSON.stringify(preferences));
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
    params.push(userId);

    await env.DB.prepare(`
      UPDATE users SET ${updates.join(', ')}
      WHERE id = ? AND is_active = 1
    `).bind(...params).run();

    // Fetch updated user
    const user = await env.DB.prepare(
      'SELECT id, email, name, role, created_at, last_login_at FROM users WHERE id = ?'
    ).bind(userId).first();

    // Add default values for columns that might not exist
    user.preferences = {};
    user.avatar_url = null;

    return new Response(JSON.stringify({
      success: true,
      message: 'Profile updated successfully',
      user: user
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to update profile',
      message: error.message,
      code: 'UPDATE_PROFILE_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/user-profile/change-password
 * Change user password
 */
async function handleChangePassword(request, env) {
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

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({
        error: 'Current password and new password are required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return new Response(JSON.stringify({
        error: 'New password must be at least 8 characters',
        code: 'WEAK_PASSWORD'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    // Get user with password
    const user = await env.DB.prepare(
      'SELECT id, email, password FROM users WHERE id = ? AND is_active = 1'
    ).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Verify current password
    let passwordMatch = false;
    if (user.password && user.password.includes(':')) {
      // Hashed password
      passwordMatch = await verifyPassword(currentPassword, user.password);
    } else if (user.password) {
      // Legacy plaintext password
      passwordMatch = user.password === currentPassword;
    }

    if (!passwordMatch) {
      return new Response(JSON.stringify({
        error: 'Current password is incorrect',
        code: 'INVALID_PASSWORD'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await env.DB.prepare(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(hashedPassword, userId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Password changed successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Change password error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to change password',
      message: error.message,
      code: 'CHANGE_PASSWORD_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Route requests to appropriate handlers
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (path.endsWith('/change-password') && request.method === 'POST') {
    return handleChangePassword(request, env);
  }

  if (request.method === 'GET') {
    return handleGetProfile(request, env);
  }

  if (request.method === 'PUT') {
    return handleUpdateProfile(request, env);
  }

  return new Response(JSON.stringify({
    error: 'Method not allowed',
    code: 'METHOD_NOT_ALLOWED'
  }), {
    status: 405,
    headers: corsHeaders
  });
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
