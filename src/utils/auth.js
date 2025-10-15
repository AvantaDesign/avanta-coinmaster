// Authentication utilities for Avanta Finance
// Handles JWT token management, validation, and user context

/**
 * Get authentication token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export function getAuthToken() {
  try {
    return localStorage.getItem('avanta_auth_token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

/**
 * Set authentication token in localStorage
 * @param {string} token - JWT token to store
 */
export function setAuthToken(token) {
  try {
    localStorage.setItem('avanta_auth_token', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken() {
  try {
    localStorage.removeItem('avanta_auth_token');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
}

/**
 * Get current user information from localStorage
 * @returns {Object|null} User object or null if not found
 */
export function getCurrentUser() {
  try {
    const userJson = localStorage.getItem('avanta_current_user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Set current user information in localStorage
 * @param {Object} user - User object to store
 */
export function setCurrentUser(user) {
  try {
    localStorage.setItem('avanta_current_user', JSON.stringify(user));
  } catch (error) {
    console.error('Error setting current user:', error);
  }
}

/**
 * Remove current user information from localStorage
 */
export function removeCurrentUser() {
  try {
    localStorage.removeItem('avanta_current_user');
  } catch (error) {
    console.error('Error removing current user:', error);
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export function isAuthenticated() {
  const token = getAuthToken();
  const user = getCurrentUser();
  return !!(token && user);
}

/**
 * Parse JWT token to extract payload
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded token payload or null if invalid
 */
export function parseJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export function isTokenExpired(token) {
  try {
    const payload = parseJWT(token);
    if (!payload || !payload.exp) {
      return true;
    }
    // exp is in seconds, Date.now() is in milliseconds
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * Login user with credentials
 * For Cloudflare Access, this redirects to the identity provider
 * @param {Object} credentials - Login credentials
 * @returns {Promise<Object>} Login response with user and token
 */
export async function login(credentials) {
  try {
    // For demo purposes, we'll use a mock authentication
    // In production, this would integrate with Cloudflare Access or Auth0
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    
    // Store token and user information
    setAuthToken(data.token);
    setCurrentUser(data.user);
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Logout user
 * Clears authentication state and redirects to login
 */
export async function logout() {
  try {
    // Call logout endpoint if needed
    const token = getAuthToken();
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }).catch(err => console.error('Logout API error:', err));
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Always clear local state
    removeAuthToken();
    removeCurrentUser();
  }
}

/**
 * Get authorization headers for API requests
 * @returns {Object} Headers object with Authorization header
 */
export function getAuthHeaders() {
  const token = getAuthToken();
  if (!token) {
    return {};
  }
  return {
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Verify authentication token with server
 * @returns {Promise<boolean>} True if token is valid
 */
export async function verifyToken() {
  try {
    const token = getAuthToken();
    if (!token) {
      return false;
    }

    // Check if token is expired locally first
    if (isTokenExpired(token)) {
      removeAuthToken();
      removeCurrentUser();
      return false;
    }

    // Verify with server
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      removeAuthToken();
      removeCurrentUser();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Token verification error:', error);
    removeAuthToken();
    removeCurrentUser();
    return false;
  }
}

/**
 * Refresh authentication token
 * @returns {Promise<string>} New JWT token
 */
export async function refreshToken() {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No token to refresh');
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    setAuthToken(data.token);
    
    return data.token;
  } catch (error) {
    console.error('Token refresh error:', error);
    removeAuthToken();
    removeCurrentUser();
    throw error;
  }
}

/**
 * Demo login for development/testing
 * This simulates authentication without a real identity provider
 * @param {string} email - User email
 * @returns {Promise<Object>} Mock authentication response
 */
export async function demoLogin(email) {
  // Create a mock JWT token
  const user = {
    id: email,
    email: email,
    name: email.split('@')[0],
  };

  // Create a simple mock JWT (not cryptographically signed - for demo only!)
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

  // Store token and user
  setAuthToken(token);
  setCurrentUser(user);

  return { user, token };
}
