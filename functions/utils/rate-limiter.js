/**
 * Rate Limiting Utilities
 * 
 * Phase 31: Backend Hardening and Security
 * 
 * Provides:
 * - Per-user rate limiting
 * - Per-IP rate limiting
 * - Endpoint-specific limits
 * - Abuse detection
 */

import { getClientIp } from './security.js';
import { logSecurityEvent } from './logging.js';

/**
 * Rate limit configurations for different endpoints
 */
export const RateLimitConfig = {
  // Authentication endpoints - strict limits
  AUTH: {
    maxRequests: 5,
    windowSeconds: 60,
    namespace: 'auth'
  },
  
  // API endpoints - moderate limits
  API: {
    maxRequests: 100,
    windowSeconds: 60,
    namespace: 'api'
  },
  
  // Read-only endpoints - generous limits
  READ: {
    maxRequests: 200,
    windowSeconds: 60,
    namespace: 'read'
  },
  
  // Write endpoints - moderate limits
  WRITE: {
    maxRequests: 50,
    windowSeconds: 60,
    namespace: 'write'
  },
  
  // Upload endpoints - strict limits
  UPLOAD: {
    maxRequests: 10,
    windowSeconds: 60,
    namespace: 'upload'
  },
  
  // Report generation - strict limits (resource intensive)
  REPORTS: {
    maxRequests: 20,
    windowSeconds: 60,
    namespace: 'reports'
  }
};

/**
 * In-memory rate limit store (for Cloudflare Workers without KV)
 * In production, use Cloudflare KV or Durable Objects
 */
class InMemoryRateLimitStore {
  constructor() {
    this.store = new Map();
    this.maxSize = 10000;
  }
  
  getKey(namespace, identifier) {
    return `${namespace}:${identifier}`;
  }
  
  async get(namespace, identifier) {
    const key = this.getKey(namespace, identifier);
    const data = this.store.get(key);
    
    if (!data) return null;
    
    // Check if expired
    if (data.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return data;
  }
  
  async set(namespace, identifier, data, ttlSeconds) {
    const key = this.getKey(namespace, identifier);
    
    // Prevent memory overflow
    if (this.store.size > this.maxSize) {
      this.cleanup();
    }
    
    this.store.set(key, {
      ...data,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.store.entries()) {
      if (data.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }
}

// Global store instance
const rateLimitStore = new InMemoryRateLimitStore();

/**
 * Check rate limit for a request
 * @param {Request} request - Request object
 * @param {Object} config - Rate limit configuration
 * @param {string} identifier - Custom identifier (defaults to IP)
 * @param {Object} env - Environment bindings
 * @returns {Promise<{ allowed: boolean, remaining: number, resetAt: number, retryAfter: number }>}
 */
export async function checkRateLimit(request, config = RateLimitConfig.API, identifier = null, env = null) {
  // Skip rate limiting if disabled
  if (env?.ENABLE_RATE_LIMITING === 'false') {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + (config.windowSeconds * 1000),
      retryAfter: 0
    };
  }
  
  // Get identifier (user ID, IP, or custom)
  const requestId = identifier || getClientIp(request);
  
  try {
    // Get current rate limit data
    const data = await rateLimitStore.get(config.namespace, requestId);
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    
    if (!data) {
      // First request in window
      await rateLimitStore.set(config.namespace, requestId, {
        count: 1,
        windowStart: now
      }, config.windowSeconds);
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now + windowMs,
        retryAfter: 0
      };
    }
    
    // Check if we're still in the same window
    const windowStart = data.windowStart;
    const windowEnd = windowStart + windowMs;
    
    if (now > windowEnd) {
      // New window - reset counter
      await rateLimitStore.set(config.namespace, requestId, {
        count: 1,
        windowStart: now
      }, config.windowSeconds);
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: now + windowMs,
        retryAfter: 0
      };
    }
    
    // Same window - increment counter
    const newCount = data.count + 1;
    
    if (newCount > config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((windowEnd - now) / 1000);
      
      // Log security event for excessive requests
      if (newCount > config.maxRequests * 2) {
        await logSecurityEvent('rate_limit_abuse', {
          identifier: requestId,
          namespace: config.namespace,
          count: newCount,
          limit: config.maxRequests,
          severity: 'medium'
        }, env);
      }
      
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowEnd,
        retryAfter
      };
    }
    
    // Update counter
    await rateLimitStore.set(config.namespace, requestId, {
      count: newCount,
      windowStart
    }, config.windowSeconds);
    
    return {
      allowed: true,
      remaining: config.maxRequests - newCount,
      resetAt: windowEnd,
      retryAfter: 0
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    
    // Fail open - allow request if rate limiting fails
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + (config.windowSeconds * 1000),
      retryAfter: 0
    };
  }
}

/**
 * Get rate limit configuration for endpoint
 * @param {string} method - HTTP method
 * @param {string} path - Request path
 * @returns {Object} Rate limit configuration
 */
export function getRateLimitConfig(method, path) {
  // Authentication endpoints
  if (path.includes('/api/auth')) {
    return RateLimitConfig.AUTH;
  }
  
  // Upload endpoints
  if (path.includes('/api/upload')) {
    return RateLimitConfig.UPLOAD;
  }
  
  // Report endpoints
  if (path.includes('/api/reports') || path.includes('/api/analytics')) {
    return RateLimitConfig.REPORTS;
  }
  
  // Write operations
  if (['POST', 'PUT', 'DELETE'].includes(method)) {
    return RateLimitConfig.WRITE;
  }
  
  // Read operations
  if (method === 'GET') {
    return RateLimitConfig.READ;
  }
  
  // Default
  return RateLimitConfig.API;
}

/**
 * Create rate limit middleware
 * @param {Object} config - Rate limit configuration
 * @returns {Function} Middleware function
 */
export function createRateLimitMiddleware(config = null) {
  return async (context, next) => {
    const { request, env } = context;
    
    // Determine config based on endpoint if not provided
    const rateLimitConfig = config || getRateLimitConfig(
      request.method,
      new URL(request.url).pathname
    );
    
    // Check rate limit
    const rateLimitResult = await checkRateLimit(request, rateLimitConfig, null, env);
    
    // Add rate limit headers to context for later use
    context.rateLimitInfo = {
      limit: rateLimitConfig.maxRequests,
      remaining: rateLimitResult.remaining,
      resetAt: rateLimitResult.resetAt
    };
    
    if (!rateLimitResult.allowed) {
      // Return rate limit error
      return new Response(JSON.stringify({
        error: true,
        type: 'RATE_LIMIT_ERROR',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimitResult.retryAfter,
        timestamp: new Date().toISOString()
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimitResult.resetAt.toString(),
          'Retry-After': rateLimitResult.retryAfter.toString()
        }
      });
    }
    
    // Continue to next middleware/handler
    return next();
  };
}

/**
 * Check if identifier is rate limited
 * @param {string} identifier - Identifier (IP, user ID)
 * @param {Object} config - Rate limit configuration
 * @returns {Promise<boolean>} True if rate limited
 */
export async function isRateLimited(identifier, config = RateLimitConfig.API) {
  const data = await rateLimitStore.get(config.namespace, identifier);
  
  if (!data) return false;
  
  const now = Date.now();
  const windowEnd = data.windowStart + (config.windowSeconds * 1000);
  
  if (now > windowEnd) return false;
  
  return data.count >= config.maxRequests;
}

/**
 * Reset rate limit for identifier (admin function)
 * @param {string} identifier - Identifier to reset
 * @param {Object} config - Rate limit configuration
 */
export async function resetRateLimit(identifier, config = RateLimitConfig.API) {
  const key = `${config.namespace}:${identifier}`;
  rateLimitStore.store.delete(key);
}

/**
 * Get rate limit stats for identifier
 * @param {string} identifier - Identifier
 * @param {Object} config - Rate limit configuration
 * @returns {Promise<Object>} Rate limit stats
 */
export async function getRateLimitStats(identifier, config = RateLimitConfig.API) {
  const data = await rateLimitStore.get(config.namespace, identifier);
  
  if (!data) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetAt: Date.now() + (config.windowSeconds * 1000)
    };
  }
  
  const now = Date.now();
  const windowEnd = data.windowStart + (config.windowSeconds * 1000);
  
  if (now > windowEnd) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetAt: now + (config.windowSeconds * 1000)
    };
  }
  
  return {
    count: data.count,
    remaining: Math.max(0, config.maxRequests - data.count),
    resetAt: windowEnd
  };
}

/**
 * Detect potential abuse patterns
 * @param {Request} request - Request object
 * @param {Object} env - Environment bindings
 * @returns {Promise<{ isAbuse: boolean, reason: string|null }>}
 */
export async function detectAbuse(request, env) {
  const ip = getClientIp(request);
  const userAgent = request.headers.get('User-Agent') || '';
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    { pattern: /bot/i, reason: 'Bot user agent' },
    { pattern: /crawler/i, reason: 'Crawler user agent' },
    { pattern: /scraper/i, reason: 'Scraper user agent' },
    { pattern: /scanner/i, reason: 'Scanner user agent' }
  ];
  
  for (const { pattern, reason } of suspiciousPatterns) {
    if (pattern.test(userAgent)) {
      await logSecurityEvent('suspicious_user_agent', {
        ip,
        userAgent,
        reason,
        severity: 'low'
      }, env);
      
      return { isAbuse: true, reason };
    }
  }
  
  // Check if IP is making requests to multiple endpoints rapidly
  // (This would require more sophisticated tracking in production)
  
  return { isAbuse: false, reason: null };
}
