// Authentication utilities for Avanta Finance
// Handles JWT token management, validation, and user session

/**
 * Token storage keys
 */
const TOKEN_KEY = 'avanta_auth_token';
const USER_KEY = 'avanta_user_info';

/**
 * Store authentication token in localStorage
 * @param {string} token - JWT token
 */
export function setAuthToken(token) {
  console.log('setAuthToken called with:', token ? token.substring(0, 50) + '...' : 'null');
  
  if (!token) {
    console.log('Removing token from localStorage');
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  
  try {
    localStorage.setItem(TOKEN_KEY, token);
    console.log('Token stored in localStorage successfully');
    
    // Verify it was stored
    const stored = localStorage.getItem(TOKEN_KEY);
    console.log('Verification - token exists:', !!stored);
    console.log('Verification - token matches:', stored === token);
  } catch (error) {
    console.error('Error storing token:', error);
    localStorage.setItem('auth_debug', JSON.stringify({
      timestamp: new Date().toISOString(),
      issue: 'Error storing token',
      error: error.message
    }));
  }
}

/**
 * Retrieve authentication token from localStorage
 * @returns {string|null} JWT token or null if not found
 */
export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Store user information in localStorage
 * @param {object} user - User information
 */
export function setUserInfo(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Retrieve user information from localStorage
 * @returns {object|null} User information or null if not found
 */
export function getUserInfo() {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error parsing user info:', error);
    return null;
  }
}

/**
 * Decode JWT token (without verification - for client-side display only)
 * @param {string} token - JWT token
 * @returns {object|null} Decoded token payload
 */
export function decodeToken(token) {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    // Add padding if needed for base64 decoding
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(atob(paddedPayload));
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if token is expired
 */
export function isTokenExpired(token) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    console.log('Token decode failed or no exp field');
    localStorage.setItem('auth_debug', JSON.stringify({
      timestamp: new Date().toISOString(),
      issue: 'Token decode failed',
      token: token.substring(0, 50) + '...',
      decoded: decoded,
      action: 'Token validation'
    }));
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  const isExpired = decoded.exp < currentTime;
  
  console.log('Token exp:', decoded.exp);
  console.log('Current time:', currentTime);
  console.log('Time until expiry:', decoded.exp - currentTime);
  console.log('Is expired:', isExpired);
  
  // Store detailed debug info
  localStorage.setItem('auth_debug', JSON.stringify({
    timestamp: new Date().toISOString(),
    tokenExp: decoded.exp,
    currentTime: currentTime,
    timeUntilExpiry: decoded.exp - currentTime,
    isExpired: isExpired,
    token: token.substring(0, 50) + '...',
    action: 'Token expiration check'
  }));
  
  return isExpired;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export function isAuthenticated() {
  const token = getAuthToken();
  if (!token) {
    console.log('No token found');
    // Store in localStorage for debugging
    localStorage.setItem('auth_debug', JSON.stringify({
      timestamp: new Date().toISOString(),
      issue: 'No token found',
      action: 'isAuthenticated check'
    }));
    return false;
  }
  
  const isExpired = isTokenExpired(token);
  console.log('Token expired:', isExpired);
  
  if (isExpired) {
    console.log('Token is expired, removing it');
    // Store debug info before removing token
    localStorage.setItem('auth_debug', JSON.stringify({
      timestamp: new Date().toISOString(),
      issue: 'Token expired',
      token: token.substring(0, 50) + '...',
      action: 'Token removal'
    }));
    removeAuthToken();
    return false;
  }
  
  console.log('User is authenticated');
  // Clear any previous debug info on successful auth
  localStorage.removeItem('auth_debug');
  return true;
}

/**
 * Get user ID from stored token
 * @returns {string|null} User ID or null if not authenticated
 */
export function getUserId() {
  const token = getAuthToken();
  if (!token || isTokenExpired(token)) return null;
  
  const decoded = decodeToken(token);
  return decoded?.sub || decoded?.user_id || null;
}

/**
 * Login with credentials
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} Authentication response
 */
export async function login(email, password) {
  console.log('Starting login process...');
  
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  
  console.log('Login response status:', response.status);
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Login failed:', error);
    throw new Error(error.message || 'Login failed');
  }
  
  const data = await response.json();
  console.log('Login response data:', data);
  
  // Store token and user info
  if (data.token) {
    console.log('Storing token:', data.token.substring(0, 50) + '...');
    setAuthToken(data.token);
    
    // Verify token was stored
    const storedToken = getAuthToken();
    console.log('Token stored successfully:', !!storedToken);
    
    // Store debug info
    localStorage.setItem('auth_debug', JSON.stringify({
      timestamp: new Date().toISOString(),
      action: 'Login successful',
      tokenStored: !!storedToken,
      tokenLength: storedToken ? storedToken.length : 0
    }));
  } else {
    console.error('No token in response');
    localStorage.setItem('auth_debug', JSON.stringify({
      timestamp: new Date().toISOString(),
      issue: 'No token in login response',
      response: data
    }));
  }
  
  if (data.user) {
    console.log('Storing user info:', data.user);
    setUserInfo(data.user);
  }
  
  return data;
}

/**
 * Login with Google OAuth
 * @param {string} credential - Google credential JWT
 * @returns {Promise<object>} Authentication response
 */
export async function loginWithGoogle(credential) {
  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credential }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Google login failed');
  }
  
  const data = await response.json();
  
  // Store token and user info
  if (data.token) {
    setAuthToken(data.token);
  }
  if (data.user) {
    setUserInfo(data.user);
  }
  
  return data;
}

/**
 * Logout user
 */
export function logout() {
  removeAuthToken();
  window.location.href = '/login';
}

/**
 * Refresh authentication token
 * @returns {Promise<object>} New authentication data
 */
export async function refreshToken() {
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
    // Token refresh failed, logout user
    logout();
    throw new Error('Token refresh failed');
  }
  
  const data = await response.json();
  
  if (data.token) {
    setAuthToken(data.token);
  }
  
  return data;
}

/**
 * Get authorization header for API requests
 * @returns {object} Headers object with Authorization
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
 * Make authenticated API request
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function authFetch(url, options = {}) {
  const token = getAuthToken();
  
  // Check if token is expired and try to refresh
  if (token && isTokenExpired(token)) {
    try {
      await refreshToken();
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      throw error;
    }
  }
  
  const headers = {
    ...options.headers,
    ...getAuthHeaders(),
  };
  
  const response = await fetch(url, {
    ...options,
    headers,
  });
  
  // If unauthorized, logout
  if (response.status === 401) {
    logout();
    throw new Error('Unauthorized');
  }
  
  return response;
}

/**
 * Verify email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with isValid and message
 */
export function validatePassword(password) {
  if (!password || password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long',
    };
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      isValid: false,
      message: 'Password must contain uppercase, lowercase, and numbers',
    };
  }
  
  return {
    isValid: true,
    message: 'Password is strong',
  };
}

export default {
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  setUserInfo,
  getUserInfo,
  decodeToken,
  isTokenExpired,
  isAuthenticated,
  getUserId,
  login,
  loginWithGoogle,
  logout,
  refreshToken,
  getAuthHeaders,
  authFetch,
  isValidEmail,
  validatePassword,
};
