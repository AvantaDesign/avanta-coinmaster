// Authentication middleware helpers for API endpoints
// Provides reusable functions to validate JWT tokens and extract user context

/**
 * Extract user ID from JWT token in request
 * @param {Request} request - HTTP request with Authorization header
 * @returns {string|null} User ID or null if not authenticated
 */
export function getUserIdFromRequest(request) {
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

    // Return user ID from token (sub, email, or id field)
    return payload.sub || payload.email || payload.id || null;
  } catch (error) {
    console.error('Error extracting user ID from request:', error);
    return null;
  }
}

/**
 * Validate authentication and return user ID
 * Throws error if not authenticated
 * @param {Request} request - HTTP request
 * @returns {string} User ID
 * @throws {Error} If not authenticated
 */
export function requireAuth(request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    throw new Error('UNAUTHORIZED');
  }
  return userId;
}

/**
 * Create unauthorized response
 * @param {string} message - Error message
 * @returns {Response} 401 response
 */
export function unauthorizedResponse(message = 'Unauthorized') {
  return new Response(JSON.stringify({
    error: message,
    code: 'UNAUTHORIZED'
  }), {
    status: 401,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}

/**
 * Wrap query with user filter
 * Adds WHERE user_id = ? clause to SQL query
 * @param {string} query - SQL query
 * @param {boolean} hasWhere - Whether query already has WHERE clause
 * @returns {string} Modified query with user filter
 */
export function addUserFilter(query, hasWhere = true) {
  if (hasWhere) {
    return query + ' AND user_id = ?';
  } else {
    return query + ' WHERE user_id = ?';
  }
}

/**
 * Get CORS headers with Authorization support
 * @returns {Object} CORS headers
 */
export function getCorsHeaders() {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
