/**
 * Centralized Error Handling Utilities
 * 
 * Phase 31: Backend Hardening and Security
 * 
 * Provides:
 * - Standardized error responses
 * - Error categorization
 * - Error logging
 * - User-friendly error messages
 */

import { getSecurityHeaders } from './security.js';
import { logError } from './logging.js';

/**
 * Error types for categorization
 */
export const ErrorType = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  DATABASE: 'DATABASE_ERROR',
  EXTERNAL_SERVICE: 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  SERVER: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST'
};

/**
 * HTTP status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  constructor(message, type = ErrorType.SERVER, statusCode = HttpStatus.INTERNAL_SERVER_ERROR, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Create error response
 * @param {Error|AppError} error - Error object
 * @param {Object} request - Request object for logging
 * @param {Object} env - Environment bindings
 * @returns {Response} Error response
 */
export async function createErrorResponse(error, request = null, env = null) {
  // Determine error type and status code
  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let errorType = ErrorType.SERVER;
  let message = 'An unexpected error occurred';
  let details = null;
  
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorType = error.type;
    message = error.message;
    details = error.context;
  } else if (error.name === 'ValidationError') {
    statusCode = HttpStatus.BAD_REQUEST;
    errorType = ErrorType.VALIDATION;
    message = error.message;
  } else if (error.message) {
    message = error.message;
  }
  
  // Log error for monitoring
  if (env) {
    await logError(error, {
      type: errorType,
      statusCode,
      request: request ? {
        method: request.method,
        url: request.url,
        headers: Object.fromEntries(request.headers)
      } : null
    }, env);
  }
  
  // Create response body
  const responseBody = {
    error: true,
    type: errorType,
    message: sanitizeErrorMessage(message, statusCode),
    timestamp: new Date().toISOString()
  };
  
  // Add details in development mode
  if (env?.ENVIRONMENT === 'preview' || env?.ENABLE_DEBUG_LOGS === 'true') {
    responseBody.details = details;
    responseBody.stack = error.stack;
  }
  
  return new Response(JSON.stringify(responseBody), {
    status: statusCode,
    headers: getSecurityHeaders()
  });
}

/**
 * Sanitize error message for client (remove sensitive info)
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {string} Sanitized message
 */
function sanitizeErrorMessage(message, statusCode) {
  // For 500 errors, return generic message
  if (statusCode >= 500) {
    return 'An internal error occurred. Please try again later.';
  }
  
  // Remove sensitive patterns
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /database/i,
    /sql/i
  ];
  
  if (sensitivePatterns.some(pattern => pattern.test(message))) {
    return 'An error occurred. Please contact support.';
  }
  
  return message;
}

/**
 * Create validation error response
 * @param {Array<string>|string} errors - Validation errors
 * @returns {Response} Error response
 */
export function createValidationErrorResponse(errors) {
  const errorArray = Array.isArray(errors) ? errors : [errors];
  
  return new Response(JSON.stringify({
    error: true,
    type: ErrorType.VALIDATION,
    message: 'Validation failed',
    errors: errorArray,
    timestamp: new Date().toISOString()
  }), {
    status: HttpStatus.BAD_REQUEST,
    headers: getSecurityHeaders()
  });
}

/**
 * Create unauthorized error response
 * @param {string} message - Error message
 * @returns {Response} Error response
 */
export function createUnauthorizedResponse(message = 'Authentication required') {
  return new Response(JSON.stringify({
    error: true,
    type: ErrorType.AUTHENTICATION,
    message,
    code: 'AUTH_REQUIRED',
    timestamp: new Date().toISOString()
  }), {
    status: HttpStatus.UNAUTHORIZED,
    headers: getSecurityHeaders()
  });
}

/**
 * Create forbidden error response
 * @param {string} message - Error message
 * @returns {Response} Error response
 */
export function createForbiddenResponse(message = 'Access denied') {
  return new Response(JSON.stringify({
    error: true,
    type: ErrorType.AUTHORIZATION,
    message,
    code: 'ACCESS_DENIED',
    timestamp: new Date().toISOString()
  }), {
    status: HttpStatus.FORBIDDEN,
    headers: getSecurityHeaders()
  });
}

/**
 * Create not found error response
 * @param {string} resource - Resource name
 * @returns {Response} Error response
 */
export function createNotFoundResponse(resource = 'Resource') {
  return new Response(JSON.stringify({
    error: true,
    type: ErrorType.NOT_FOUND,
    message: `${resource} not found`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  }), {
    status: HttpStatus.NOT_FOUND,
    headers: getSecurityHeaders()
  });
}

/**
 * Create rate limit error response
 * @param {Object} rateLimitInfo - Rate limit information
 * @returns {Response} Error response
 */
export function createRateLimitResponse(rateLimitInfo = {}) {
  const headers = getSecurityHeaders();
  
  if (rateLimitInfo.resetAt) {
    headers['X-RateLimit-Reset'] = rateLimitInfo.resetAt.toString();
  }
  if (rateLimitInfo.limit) {
    headers['X-RateLimit-Limit'] = rateLimitInfo.limit.toString();
  }
  
  return new Response(JSON.stringify({
    error: true,
    type: ErrorType.RATE_LIMIT,
    message: 'Rate limit exceeded. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: rateLimitInfo.retryAfter || 60,
    timestamp: new Date().toISOString()
  }), {
    status: HttpStatus.TOO_MANY_REQUESTS,
    headers
  });
}

/**
 * Create database error response
 * @param {Error} error - Database error
 * @returns {Response} Error response
 */
export function createDatabaseErrorResponse(error) {
  console.error('Database error:', error);
  
  return new Response(JSON.stringify({
    error: true,
    type: ErrorType.DATABASE,
    message: 'Database operation failed',
    code: 'DB_ERROR',
    timestamp: new Date().toISOString()
  }), {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    headers: getSecurityHeaders()
  });
}

/**
 * Create conflict error response
 * @param {string} message - Error message
 * @returns {Response} Error response
 */
export function createConflictResponse(message = 'Resource already exists') {
  return new Response(JSON.stringify({
    error: true,
    type: ErrorType.CONFLICT,
    message,
    code: 'CONFLICT',
    timestamp: new Date().toISOString()
  }), {
    status: HttpStatus.CONFLICT,
    headers: getSecurityHeaders()
  });
}

/**
 * Create success response
 * @param {any} data - Response data
 * @param {number} statusCode - HTTP status code
 * @param {Object} headers - Additional headers
 * @returns {Response} Success response
 */
export function createSuccessResponse(data, statusCode = HttpStatus.OK, headers = {}) {
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers: {
      ...getSecurityHeaders(),
      ...headers
    }
  });
}

/**
 * Wrap async handler with error handling
 * @param {Function} handler - Async handler function
 * @returns {Function} Wrapped handler
 */
export function withErrorHandling(handler) {
  return async (context) => {
    try {
      return await handler(context);
    } catch (error) {
      console.error('Handler error:', error);
      return await createErrorResponse(error, context.request, context.env);
    }
  };
}

/**
 * Check if error is operational (expected) vs programming error
 * @param {Error} error - Error object
 * @returns {boolean} True if operational
 */
export function isOperationalError(error) {
  if (error instanceof AppError) return true;
  
  const operationalErrors = [
    'ValidationError',
    'UnauthorizedError',
    'ForbiddenError',
    'NotFoundError',
    'ConflictError'
  ];
  
  return operationalErrors.includes(error.name);
}

/**
 * Get error severity level
 * @param {Error|AppError} error - Error object
 * @returns {string} Severity level (low, medium, high, critical)
 */
export function getErrorSeverity(error) {
  if (error instanceof AppError) {
    if (error.statusCode >= 500) return 'high';
    if (error.type === ErrorType.AUTHENTICATION || error.type === ErrorType.AUTHORIZATION) {
      return 'medium';
    }
    return 'low';
  }
  
  return 'high'; // Unknown errors are high severity
}

/**
 * Format error for external monitoring service
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 * @returns {Object} Formatted error
 */
export function formatErrorForMonitoring(error, context = {}) {
  return {
    message: error.message,
    name: error.name,
    stack: error.stack,
    type: error.type || ErrorType.SERVER,
    statusCode: error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
    severity: getErrorSeverity(error),
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      ...(error.context || {})
    }
  };
}
