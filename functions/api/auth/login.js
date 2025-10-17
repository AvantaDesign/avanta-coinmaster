// Authentication API - Handle user login, token validation, and session management
// Supports multiple authentication methods: email/password, Google OAuth

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Hash password using Web Crypto API with SHA-256
 * Generates a unique salt for each password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password in format: salt:hash
 */
async function hashPassword(password) {
  // Generate a random salt (16 bytes = 128 bits)
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  
  // Convert password to bytes
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Combine salt and password
  const saltedPassword = new Uint8Array(salt.length + passwordData.length);
  saltedPassword.set(salt);
  saltedPassword.set(passwordData, salt.length);
  
  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', saltedPassword);
  const hashArray = new Uint8Array(hashBuffer);
  
  // Convert to hex strings
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `${saltHex}:${hashHex}`;
}

/**
 * Verify password using constant-time comparison
 * @param {string} password - Plain text password to verify
 * @param {string} storedHash - Stored hash in format: salt:hash
 * @returns {Promise<boolean>} - True if password matches
 */
async function verifyPassword(password, storedHash) {
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    
    // Convert hex salt back to bytes
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    
    // Convert password to bytes
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    // Combine salt and password
    const saltedPassword = new Uint8Array(salt.length + passwordData.length);
    saltedPassword.set(salt);
    saltedPassword.set(passwordData, salt.length);
    
    // Hash using SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', saltedPassword);
    const hashArray = new Uint8Array(hashBuffer);
    const computedHashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Constant-time comparison
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
 * Simple JWT encoding (for demo purposes)
 * In production, use a proper JWT library with signature verification
 */
function encodeJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`);
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Decode and validate JWT token
 */
function decodeJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const payload = JSON.parse(atob(encodedPayload));
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

/**
 * Extract user ID from JWT token in request
 */
export async function getUserIdFromToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  const secret = env.JWT_SECRET || 'avanta-coinmaster-secret-key-change-in-production';
  const payload = decodeJWT(token, secret);
  
  return payload?.sub || payload?.user_id || null;
}

/**
 * Validate authentication token
 */
export function validateAuthToken(request, env) {
  const userId = getUserIdFromToken(request, env);
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
  return null; // Validation passed
}

/**
 * POST /api/auth/login
 * Login with email and password
 */
async function handleLogin(request, env) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({
        error: 'Email and password required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Validate database connection
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }
    
    // Check if user exists
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND is_active = 1'
    ).bind(email).first();
    
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }
    
    // Verify password using secure hashing
    // Check if password is hashed (contains ':' separator)
    let passwordMatch = false;
    if (user.password && user.password.includes(':')) {
      // New format: verify with hashing
      passwordMatch = await verifyPassword(password, user.password);
    } else if (user.password) {
      // Legacy format: plain text (migrate to hashed)
      passwordMatch = user.password === password;
      if (passwordMatch) {
        // Migrate to hashed password
        const hashedPassword = await hashPassword(password);
        await env.DB.prepare(
          'UPDATE users SET password = ? WHERE id = ?'
        ).bind(hashedPassword, user.id).run();
      }
    }
    
    if (!passwordMatch) {
      return new Response(JSON.stringify({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }
    
    // Generate JWT token
    const secret = env.JWT_SECRET || 'avanta-coinmaster-secret-key-change-in-production';
    const payload = {
      sub: user.id,
      user_id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };
    
    const token = encodeJWT(payload, secret);
    
    // Update last login
    await env.DB.prepare(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(user.id).run();
    
    return new Response(JSON.stringify({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      }
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      error: 'Login failed',
      message: error.message,
      code: 'LOGIN_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/auth/google
 * Login with Google OAuth credential
 */
async function handleGoogleLogin(request, env) {
  try {
    const { credential } = await request.json();
    
    if (!credential) {
      return new Response(JSON.stringify({
        error: 'Google credential required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Decode Google JWT (without verification for demo)
    // In production, verify with Google's public keys
    const parts = credential.split('.');
    if (parts.length !== 3) {
      return new Response(JSON.stringify({
        error: 'Invalid Google credential',
        code: 'INVALID_CREDENTIAL'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const { sub: googleId, email, name, picture } = payload;
    
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: 'Database not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }
    
    // Check if user exists
    let user = await env.DB.prepare(
      'SELECT * FROM users WHERE email = ? OR google_id = ?'
    ).bind(email, googleId).first();
    
    // Create user if doesn't exist
    if (!user) {
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await env.DB.prepare(`
        INSERT INTO users (id, email, name, google_id, avatar_url, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
      `).bind(userId, email, name, googleId, picture).run();
      
      user = { id: userId, email, name, google_id: googleId, avatar_url: picture };
    } else {
      // Update user info
      await env.DB.prepare(`
        UPDATE users 
        SET google_id = ?, avatar_url = ?, last_login_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).bind(googleId, picture, user.id).run();
    }
    
    // Generate JWT token
    const secret = env.JWT_SECRET || 'avanta-coinmaster-secret-key-change-in-production';
    const tokenPayload = {
      sub: user.id,
      user_id: user.id,
      email: user.email,
      name: user.name,
      picture: user.avatar_url,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };
    
    const token = encodeJWT(tokenPayload, secret);
    
    return new Response(JSON.stringify({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.avatar_url,
        created_at: user.created_at,
      }
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Google login error:', error);
    return new Response(JSON.stringify({
      error: 'Google login failed',
      message: error.message,
      code: 'GOOGLE_LOGIN_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/auth/refresh
 * Refresh authentication token
 */
async function handleRefreshToken(request, env) {
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
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
    
    // Get user info
    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND is_active = 1'
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
    
    // Generate new JWT token
    const secret = env.JWT_SECRET || 'avanta-coinmaster-secret-key-change-in-production';
    const payload = {
      sub: user.id,
      user_id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    };
    
    const token = encodeJWT(payload, secret);
    
    return new Response(JSON.stringify({
      success: true,
      token,
    }), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    return new Response(JSON.stringify({
      error: 'Token refresh failed',
      message: error.message,
      code: 'REFRESH_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * GET /api/auth/me
 * Get current user information
 */
async function handleGetCurrentUser(request, env) {
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
      'SELECT id, email, name, avatar_url, created_at FROM users WHERE id = ? AND is_active = 1'
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
    
    return new Response(JSON.stringify(user), {
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get user',
      message: error.message,
      code: 'GET_USER_ERROR'
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
  
  // Handle different auth endpoints
  if (path.endsWith('/login') && request.method === 'POST') {
    return handleLogin(request, env);
  }
  
  if (path.endsWith('/google') && request.method === 'POST') {
    return handleGoogleLogin(request, env);
  }
  
  if (path.endsWith('/refresh') && request.method === 'POST') {
    return handleRefreshToken(request, env);
  }
  
  if (path.endsWith('/me') && request.method === 'GET') {
    return handleGetCurrentUser(request, env);
  }
  
  return new Response(JSON.stringify({
    error: 'Not found',
    code: 'NOT_FOUND'
  }), {
    status: 404,
    headers: corsHeaders
  });
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// Export for use in other API modules
// Note: Functions are already exported individually above

/**
 * Authenticate request and return user ID
 */
export async function authenticateRequest(request, env) {
  const userId = await getUserIdFromToken(request, env);
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}

/**
 * Validate required fields in data object
 */
export function validateRequired(data, fields) {
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(`Missing required field: ${field}`);
    }
  }
}

/**
 * Generate unique ID with prefix
 */
export function generateId(prefix) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Create standardized API response
 */
export function getApiResponse(data = null, message = 'Success', status = 200) {
  return new Response(JSON.stringify({
    success: status >= 200 && status < 300,
    data,
    message,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
