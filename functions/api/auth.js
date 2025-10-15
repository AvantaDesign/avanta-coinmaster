// Authentication API for Avanta Finance
// Handles login, logout, token verification, and user management

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Extract user ID from JWT token
 * @param {Request} request - HTTP request
 * @returns {string|null} User ID or null if not authenticated
 */
function getUserIdFromToken(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Parse JWT token (base64 decode the payload)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token is expired
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null;
    }

    // Return user ID from token
    return payload.sub || payload.email || null;
  } catch (error) {
    console.error('Error extracting user ID from token:', error);
    return null;
  }
}

/**
 * Validate JWT token and extract user information
 * @param {Request} request - HTTP request
 * @returns {Object|null} User object or null if invalid
 */
function validateToken(request) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return null;
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader.substring(7);
    const payload = JSON.parse(atob(token.split('.')[1]));

    return {
      id: userId,
      email: payload.email || userId,
      name: payload.name || payload.email || userId,
    };
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
}

/**
 * POST /api/auth/login
 * Login endpoint (for demo - in production would use Cloudflare Access)
 */
async function handleLogin(request) {
  try {
    const data = await request.json();
    const { email, password } = data;

    // Validation
    if (!email) {
      return new Response(JSON.stringify({
        error: 'Email is required',
        code: 'VALIDATION_ERROR'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // For demo purposes, accept any email
    // In production, this would validate against Cloudflare Access or Auth0
    const user = {
      id: email,
      email: email,
      name: email.split('@')[0],
    };

    // Create a mock JWT token (not cryptographically signed - for demo only!)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000),
    }));
    const signature = 'mock-signature';
    const token = `${header}.${payload}.${signature}`;

    return new Response(JSON.stringify({
      success: true,
      token: token,
      user: user,
      message: 'Login successful'
    }), {
      status: 200,
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
 * POST /api/auth/logout
 * Logout endpoint
 */
async function handleLogout(request) {
  // For demo, just return success
  // In production, might invalidate token in a blacklist
  return new Response(JSON.stringify({
    success: true,
    message: 'Logout successful'
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * POST /api/auth/verify
 * Verify authentication token
 */
async function handleVerify(request) {
  try {
    const user = validateToken(request);
    
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      success: true,
      user: user
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Verify error:', error);
    return new Response(JSON.stringify({
      error: 'Token verification failed',
      message: error.message,
      code: 'VERIFY_ERROR'
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
async function handleRefresh(request) {
  try {
    const user = validateToken(request);
    
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Create new token with extended expiration
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: user.id,
      email: user.email,
      name: user.name,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000),
    }));
    const signature = 'mock-signature';
    const token = `${header}.${payload}.${signature}`;

    return new Response(JSON.stringify({
      success: true,
      token: token,
      user: user
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Refresh error:', error);
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
async function handleMe(request) {
  try {
    const user = validateToken(request);
    
    if (!user) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    return new Response(JSON.stringify({
      success: true,
      user: user
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Me error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to get user information',
      message: error.message,
      code: 'ME_ERROR'
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
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Handle different endpoints
  if (request.method === 'POST') {
    if (path.endsWith('/login')) {
      return handleLogin(request);
    } else if (path.endsWith('/logout')) {
      return handleLogout(request);
    } else if (path.endsWith('/verify')) {
      return handleVerify(request);
    } else if (path.endsWith('/refresh')) {
      return handleRefresh(request);
    }
  } else if (request.method === 'GET') {
    if (path.endsWith('/me')) {
      return handleMe(request);
    }
  }

  // Unknown endpoint
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
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    }
  });
}

// Export helper function for use in other API endpoints
export { getUserIdFromToken, validateToken };
