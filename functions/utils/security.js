/**
 * Security Utilities
 * 
 * Phase 31: Backend Hardening and Security
 * 
 * Security functions for:
 * - Security headers
 * - CORS configuration
 * - Request validation
 * - IP tracking
 * - Content Security Policy
 */

/**
 * Get comprehensive security headers
 * @param {Object} options - Configuration options
 * @returns {Object} Headers object
 */
export function getSecurityHeaders(options = {}) {
  const {
    allowOrigin = '*',
    allowMethods = 'GET, POST, PUT, DELETE, OPTIONS',
    allowHeaders = 'Content-Type, Authorization',
    contentType = 'application/json',
    cacheControl = 'no-cache, no-store, must-revalidate'
  } = options;
  
  return {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': allowMethods,
    'Access-Control-Allow-Headers': allowHeaders,
    'Access-Control-Max-Age': '86400', // 24 hours
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
}

/**
 * Get CORS headers only (for simpler endpoints)
 * @param {string} allowOrigin - Allowed origin
 * @returns {Object} Headers object
 */
export function getCorsHeaders(allowOrigin = '*') {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

/**
 * Create standardized OPTIONS response for CORS
 * @param {Object} options - Configuration options
 * @returns {Response} OPTIONS response
 */
export function createOptionsResponse(options = {}) {
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders(options)
  });
}

/**
 * Validate request origin (for CSRF protection)
 * @param {Request} request - Request object
 * @param {Array<string>} allowedOrigins - List of allowed origins
 * @returns {boolean} True if origin is allowed
 */
export function isValidOrigin(request, allowedOrigins = ['*']) {
  if (allowedOrigins.includes('*')) return true;
  
  const origin = request.headers.get('Origin');
  if (!origin) return true; // Allow requests without Origin header
  
  return allowedOrigins.some(allowed => {
    if (allowed.includes('*')) {
      const pattern = allowed.replace('*', '.*');
      return new RegExp(`^${pattern}$`).test(origin);
    }
    return allowed === origin;
  });
}

/**
 * Extract client IP address from request
 * @param {Request} request - Request object
 * @returns {string} IP address
 */
export function getClientIp(request) {
  // Cloudflare provides the client IP in CF-Connecting-IP header
  return request.headers.get('CF-Connecting-IP') ||
         request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
         request.headers.get('X-Real-IP') ||
         'unknown';
}

/**
 * Get request metadata for logging/security
 * @param {Request} request - Request object
 * @returns {Object} Request metadata
 */
export function getRequestMetadata(request) {
  return {
    ip: getClientIp(request),
    userAgent: request.headers.get('User-Agent'),
    origin: request.headers.get('Origin'),
    referer: request.headers.get('Referer'),
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url
  };
}

/**
 * Check if request is from a bot/crawler
 * @param {Request} request - Request object
 * @returns {boolean} True if bot detected
 */
export function isBotRequest(request) {
  const userAgent = request.headers.get('User-Agent') || '';
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i
  ];
  
  return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Generate nonce for CSP
 * @returns {string} Random nonce
 */
export function generateNonce() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create Content Security Policy header
 * @param {Object} options - CSP configuration
 * @returns {string} CSP header value
 */
export function createCspHeader(options = {}) {
  const {
    scriptSrc = ["'self'"],
    styleSrc = ["'self'", "'unsafe-inline'"],
    imgSrc = ["'self'", 'data:', 'https:'],
    connectSrc = ["'self'"],
    fontSrc = ["'self'"],
    objectSrc = ["'none'"],
    mediaSrc = ["'self'"],
    frameSrc = ["'none'"]
  } = options;
  
  const directives = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    'style-src': styleSrc,
    'img-src': imgSrc,
    'connect-src': connectSrc,
    'font-src': fontSrc,
    'object-src': objectSrc,
    'media-src': mediaSrc,
    'frame-src': frameSrc,
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  };
  
  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Validate API key
 * @param {Request} request - Request object
 * @param {string} expectedKey - Expected API key
 * @returns {boolean} True if valid
 */
export function validateApiKey(request, expectedKey) {
  if (!expectedKey) return true; // No key configured
  
  const providedKey = request.headers.get('X-API-Key') ||
                      request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!providedKey) return false;
  
  // Constant-time comparison to prevent timing attacks
  return constantTimeCompare(providedKey, expectedKey);
}

/**
 * Constant-time string comparison
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings match
 */
export function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }
  
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Check if request should be rate limited
 * @param {string} identifier - Request identifier (IP, user ID, etc.)
 * @param {Object} env - Environment bindings
 * @param {Object} limits - Rate limit configuration
 * @returns {Promise<{ allowed: boolean, remaining: number, resetAt: number }>}
 */
export async function checkRateLimit(identifier, env, limits = {}) {
  const {
    maxRequests = 100,
    windowSeconds = 60,
    namespace = 'rate-limit'
  } = limits;
  
  // For Cloudflare Workers, we'd use KV or Durable Objects
  // This is a simplified version for D1
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  const key = `${namespace}:${identifier}`;
  
  try {
    // Get request count in current window
    // In production, use KV: await env.RATE_LIMIT.get(key)
    // For now, we'll return allowed=true
    
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: now + (windowSeconds * 1000)
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: maxRequests,
      resetAt: now + (windowSeconds * 1000)
    };
  }
}

/**
 * Sanitize database input to prevent SQL injection
 * Note: D1 uses prepared statements which prevent SQL injection,
 * but this provides an additional layer of validation
 * @param {any} value - Value to sanitize
 * @returns {any} Sanitized value
 */
export function sanitizeSqlInput(value) {
  if (typeof value === 'string') {
    // Remove SQL control characters
    return value.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, char => {
      switch (char) {
        case '\0': return '\\0';
        case '\x08': return '\\b';
        case '\x09': return '\\t';
        case '\x1a': return '\\z';
        case '\n': return '\\n';
        case '\r': return '\\r';
        case '"':
        case "'":
        case '\\':
        case '%':
          return '\\' + char;
        default:
          return char;
      }
    });
  }
  
  return value;
}

/**
 * Generate secure random token
 * @param {number} length - Token length
 * @returns {string} Random token
 */
export function generateSecureToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash sensitive data (for logging/tracking without exposing actual values)
 * @param {string} data - Data to hash
 * @returns {Promise<string>} Hashed data
 */
export async function hashData(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Mask sensitive data for logging
 * @param {string} data - Data to mask
 * @param {number} visibleChars - Number of characters to show
 * @returns {string} Masked data
 */
export function maskSensitiveData(data, visibleChars = 4) {
  if (!data || typeof data !== 'string') return '';
  
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  
  const visible = data.slice(-visibleChars);
  const masked = '*'.repeat(data.length - visibleChars);
  return masked + visible;
}

/**
 * Check if user has required role/permission
 * @param {Object} user - User object with roles
 * @param {string|Array<string>} requiredRoles - Required role(s)
 * @returns {boolean} True if authorized
 */
export function hasRole(user, requiredRoles) {
  if (!user || !user.roles) return false;
  
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
  
  return roles.some(role => userRoles.includes(role));
}

/**
 * Create rate limit headers
 * @param {Object} rateLimitInfo - Rate limit information
 * @returns {Object} Headers object
 */
export function getRateLimitHeaders(rateLimitInfo) {
  return {
    'X-RateLimit-Limit': rateLimitInfo.limit?.toString() || '100',
    'X-RateLimit-Remaining': rateLimitInfo.remaining?.toString() || '100',
    'X-RateLimit-Reset': rateLimitInfo.resetAt?.toString() || Date.now().toString()
  };
}
