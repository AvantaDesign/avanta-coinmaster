/**
 * Middleware Utilities
 * 
 * Phase 31: Backend Hardening and Security
 * 
 * Provides middleware functions for:
 * - Authentication
 * - Authorization
 * - Validation
 * - Rate limiting
 * - Logging
 * - Error handling
 */

import { getUserIdFromToken } from '../api/auth.js';
import { createUnauthorizedResponse, createForbiddenResponse, createValidationErrorResponse, createRateLimitResponse, createErrorResponse } from './errors.js';
import { checkRateLimit, getRateLimitConfig } from './rate-limiter.js';
import { logRequest, logResponse } from './logging.js';
import { getSecurityHeaders, getClientIp } from './security.js';
import { validatePagination } from './validation.js';

/**
 * Compose multiple middleware functions
 * @param {...Function} middlewares - Middleware functions
 * @returns {Function} Composed middleware
 */
export function compose(...middlewares) {
  return async (context) => {
    let index = 0;
    
    const next = async () => {
      if (index >= middlewares.length) {
        throw new Error('next() called too many times');
      }
      
      const middleware = middlewares[index++];
      return await middleware(context, next);
    };
    
    return await next();
  };
}

/**
 * Authentication middleware
 * Verifies JWT token and adds userId to context
 * @returns {Function} Middleware function
 */
export function requireAuth() {
  return async (context, next) => {
    const { request, env } = context;
    
    const userId = await getUserIdFromToken(request, env);
    
    if (!userId) {
      return createUnauthorizedResponse('Valid authentication token required');
    }
    
    // Add userId to context for use in handlers
    context.userId = userId;
    
    return next();
  };
}

/**
 * Optional authentication middleware
 * Adds userId to context if token is present, but doesn't require it
 * @returns {Function} Middleware function
 */
export function optionalAuth() {
  return async (context, next) => {
    const { request, env } = context;
    
    try {
      const userId = await getUserIdFromToken(request, env);
      if (userId) {
        context.userId = userId;
      }
    } catch (error) {
      // Ignore auth errors for optional auth
    }
    
    return next();
  };
}

/**
 * Database connection check middleware
 * @returns {Function} Middleware function
 */
export function requireDatabase() {
  return async (context, next) => {
    const { env } = context;
    
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: true,
        type: 'DATABASE_ERROR',
        message: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED',
        timestamp: new Date().toISOString()
      }), {
        status: 503,
        headers: getSecurityHeaders()
      });
    }
    
    return next();
  };
}

/**
 * Rate limiting middleware
 * @param {Object} config - Rate limit configuration (optional)
 * @returns {Function} Middleware function
 */
export function rateLimit(config = null) {
  return async (context, next) => {
    const { request, env } = context;
    
    // Skip rate limiting if disabled
    if (env.ENABLE_RATE_LIMITING === 'false') {
      return next();
    }
    
    // Get configuration for this endpoint
    const url = new URL(request.url);
    const rateLimitConfig = config || getRateLimitConfig(request.method, url.pathname);
    
    // Use userId if authenticated, otherwise use IP
    const identifier = context.userId || getClientIp(request);
    
    // Check rate limit
    const result = await checkRateLimit(request, rateLimitConfig, identifier, env);
    
    // Add rate limit info to context
    context.rateLimitInfo = {
      limit: rateLimitConfig.maxRequests,
      remaining: result.remaining,
      resetAt: result.resetAt
    };
    
    if (!result.allowed) {
      return createRateLimitResponse({
        ...result,
        limit: rateLimitConfig.maxRequests
      });
    }
    
    return next();
  };
}

/**
 * Request logging middleware
 * @returns {Function} Middleware function
 */
export function requestLogger() {
  return async (context, next) => {
    const { request, env } = context;
    const startTime = Date.now();
    
    logRequest(request, {}, env);
    
    const response = await next();
    
    const duration = Date.now() - startTime;
    logResponse(request, response, duration, env);
    
    return response;
  };
}

/**
 * Error handling middleware
 * Catches all errors and returns standardized error responses
 * @returns {Function} Middleware function
 */
export function errorHandler() {
  return async (context, next) => {
    try {
      return await next();
    } catch (error) {
      console.error('Middleware error:', error);
      return await createErrorResponse(error, context.request, context.env);
    }
  };
}

/**
 * Add security headers to response
 * @returns {Function} Middleware function
 */
export function securityHeaders() {
  return async (context, next) => {
    const response = await next();
    
    // Clone response to modify headers
    const newResponse = new Response(response.body, response);
    
    // Add security headers
    const headers = getSecurityHeaders();
    for (const [key, value] of Object.entries(headers)) {
      if (!newResponse.headers.has(key)) {
        newResponse.headers.set(key, value);
      }
    }
    
    // Add rate limit headers if available
    if (context.rateLimitInfo) {
      newResponse.headers.set('X-RateLimit-Limit', context.rateLimitInfo.limit.toString());
      newResponse.headers.set('X-RateLimit-Remaining', context.rateLimitInfo.remaining.toString());
      newResponse.headers.set('X-RateLimit-Reset', context.rateLimitInfo.resetAt.toString());
    }
    
    return newResponse;
  };
}

/**
 * Validate pagination parameters middleware
 * @returns {Function} Middleware function
 */
export function validatePaginationMiddleware() {
  return async (context, next) => {
    const { request } = context;
    const url = new URL(request.url);
    
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    
    const validation = validatePagination(limit, offset);
    
    if (!validation.valid) {
      return createValidationErrorResponse(validation.error);
    }
    
    // Add validated pagination to context
    context.pagination = {
      limit: validation.limit,
      offset: validation.offset
    };
    
    return next();
  };
}

/**
 * CORS preflight handler
 * @returns {Function} Middleware function
 */
export function handleCors() {
  return async (context, next) => {
    const { request } = context;
    
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getSecurityHeaders()
      });
    }
    
    return next();
  };
}

/**
 * Create a standard API handler with middleware
 * @param {Object} handlers - Object with HTTP method handlers (get, post, put, delete)
 * @param {Object} options - Configuration options
 * @returns {Object} Cloudflare Pages Functions handler
 */
export function createApiHandler(handlers, options = {}) {
  const {
    requiresAuth = true,
    requiresDb = true,
    enableRateLimit = true,
    enableLogging = true,
    customMiddleware = []
  } = options;
  
  // Build middleware chain
  const middlewares = [
    errorHandler(),
    handleCors()
  ];
  
  if (enableLogging) {
    middlewares.push(requestLogger());
  }
  
  if (requiresDb) {
    middlewares.push(requireDatabase());
  }
  
  if (requiresAuth) {
    middlewares.push(requireAuth());
  }
  
  if (enableRateLimit) {
    middlewares.push(rateLimit());
  }
  
  // Add custom middleware
  middlewares.push(...customMiddleware);
  
  // Add security headers last
  middlewares.push(securityHeaders());
  
  // Create handlers for each HTTP method
  const apiHandlers = {};
  
  for (const [method, handler] of Object.entries(handlers)) {
    const methodName = `onRequest${method.charAt(0).toUpperCase()}${method.slice(1).toLowerCase()}`;
    
    apiHandlers[methodName] = async (context) => {
      // Create middleware chain with handler at the end
      const chain = compose(
        ...middlewares,
        async (ctx) => handler(ctx)
      );
      
      return await chain(context);
    };
  }
  
  return apiHandlers;
}

/**
 * Validate request body middleware
 * @param {Function} validator - Validation function that returns { valid, errors }
 * @returns {Function} Middleware function
 */
export function validateBody(validator) {
  return async (context, next) => {
    const { request } = context;
    
    try {
      const body = await request.json();
      const validation = validator(body);
      
      if (!validation.valid) {
        return createValidationErrorResponse(validation.errors);
      }
      
      // Add validated body to context
      context.body = body;
      
      return next();
    } catch (error) {
      return createValidationErrorResponse('Invalid JSON in request body');
    }
  };
}

/**
 * Check required query parameters
 * @param {Array<string>} requiredParams - Required parameter names
 * @returns {Function} Middleware function
 */
export function requireQueryParams(requiredParams) {
  return async (context, next) => {
    const { request } = context;
    const url = new URL(request.url);
    
    const missing = requiredParams.filter(param => !url.searchParams.has(param));
    
    if (missing.length > 0) {
      return createValidationErrorResponse(
        `Missing required query parameters: ${missing.join(', ')}`
      );
    }
    
    return next();
  };
}

/**
 * Performance monitoring middleware
 * @returns {Function} Middleware function
 */
export function performanceMonitor() {
  return async (context, next) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage?.() || { heapUsed: 0 };
    
    const response = await next();
    
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage?.() || { heapUsed: 0 };
    
    // Log performance metrics
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      category: 'performance',
      url: context.request.url,
      method: context.request.method,
      duration: `${duration}ms`,
      memoryDelta: endMemory.heapUsed - startMemory.heapUsed
    }));
    
    return response;
  };
}
