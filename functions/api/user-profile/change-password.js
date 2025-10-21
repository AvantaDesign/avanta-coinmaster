// Change Password API - Handle password changes for authenticated users
// SECURITY: Only authenticated users can change their own password

import { getUserIdFromToken } from '../auth.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../../utils/logging.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    if (!saltHex || !hashHex) return false;
    
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    const saltedPassword = new Uint8Array(salt.length + passwordData.length);
    saltedPassword.set(salt);
    saltedPassword.set(passwordData, salt.length);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', saltedPassword);
    const hashArray = new Uint8Array(hashBuffer);
    const hashHex2 = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Constant-time comparison
    if (hashHex.length !== hashHex2.length) return false;
    
    let result = 0;
    for (let i = 0; i < hashHex.length; i++) {
      result |= hashHex.charCodeAt(i) ^ hashHex2.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    await logError(error, { endpoint: 'Password verification error', category: 'api' }, env);
    return false;
  }
}

/**
 * POST /api/user-profile/change-password
 * Change user password
 */
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const userId = await getUserIdFromToken(request, env);
    
    if (!userId) {
      logInfo('No userId found, returning 401', { category: 'api' });
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
      'UPDATE users SET password = ? WHERE id = ?'
    ).bind(hashedPassword, userId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Password changed successfully'
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    await logError(error, { endpoint: 'Change password error', category: 'api' }, env);
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

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}
