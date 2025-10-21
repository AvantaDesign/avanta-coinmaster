/**
 * Logging Utilities
 * 
 * Phase 31: Backend Hardening and Security
 * 
 * Provides:
 * - Structured logging
 * - Request/response logging
 * - Audit logging
 * - Performance metrics
 * - Log levels
 */

import { getClientIp, maskSensitiveData } from './security.js';

/**
 * Log levels
 */
export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical'
};

/**
 * Log categories for filtering and routing
 */
export const LogCategory = {
  API: 'api',
  AUTH: 'auth',
  DATABASE: 'database',
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  AUDIT: 'audit',
  BUSINESS: 'business'
};

/**
 * Generate correlation ID for request tracking
 * @returns {string} Unique correlation ID
 */
export function generateCorrelationId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract correlation ID from request headers or generate new one
 * @param {Request} request - Request object
 * @returns {string} Correlation ID
 */
export function getCorrelationId(request) {
  return request?.headers?.get('X-Correlation-ID') || generateCorrelationId();
}

/**
 * Create structured log entry
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Structured log entry
 */
export function createLogEntry(level, message, metadata = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    correlationId: metadata.correlationId || null,
    userId: metadata.userId || null,
    endpoint: metadata.endpoint || null,
    ...metadata
  };
}

/**
 * Log debug message
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 * @param {Object} env - Environment bindings
 */
export function logDebug(message, metadata = {}, env = null) {
  if (env?.ENABLE_DEBUG_LOGS === 'true' || env?.ENVIRONMENT === 'preview') {
    const entry = createLogEntry(LogLevel.DEBUG, message, metadata);
    console.log(JSON.stringify(entry));
  }
}

/**
 * Log info message
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 */
export function logInfo(message, metadata = {}) {
  const entry = createLogEntry(LogLevel.INFO, message, metadata);
  console.log(JSON.stringify(entry));
}

/**
 * Log warning message
 * @param {string} message - Log message
 * @param {Object} metadata - Additional metadata
 */
export function logWarn(message, metadata = {}) {
  const entry = createLogEntry(LogLevel.WARN, message, metadata);
  console.warn(JSON.stringify(entry));
}

/**
 * Log error message
 * @param {Error|string} error - Error object or message
 * @param {Object} metadata - Additional metadata
 * @param {Object} env - Environment bindings
 */
export async function logError(error, metadata = {}, env = null) {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' ? error.stack : undefined;
  
  const entry = createLogEntry(LogLevel.ERROR, errorMessage, {
    ...metadata,
    stack: errorStack,
    errorName: error?.name
  });
  
  console.error(JSON.stringify(entry));
  
  // Store in database for monitoring if available
  if (env?.DB) {
    try {
      await storeErrorLog(entry, env);
    } catch (dbError) {
      console.error('Failed to store error log:', dbError);
    }
  }
  
  // Send to webhook if critical
  if (metadata.severity === 'critical' || metadata.severity === 'high') {
    await sendErrorAlert(entry, env);
  }
}

/**
 * Log critical error
 * @param {Error|string} error - Error object or message
 * @param {Object} metadata - Additional metadata
 * @param {Object} env - Environment bindings
 */
export async function logCritical(error, metadata = {}, env = null) {
  await logError(error, { ...metadata, severity: 'critical' }, env);
}

/**
 * Log API request
 * @param {Request} request - Request object
 * @param {Object} metadata - Additional metadata
 * @param {Object} env - Environment bindings
 */
export function logRequest(request, metadata = {}, env = null) {
  const entry = createLogEntry(LogLevel.INFO, 'API Request', {
    category: LogCategory.API,
    method: request.method,
    url: request.url,
    ip: getClientIp(request),
    userAgent: request.headers.get('User-Agent'),
    ...metadata
  });
  
  if (env?.ENABLE_DEBUG_LOGS === 'true') {
    console.log(JSON.stringify(entry));
  }
}

/**
 * Log API response
 * @param {Request} request - Request object
 * @param {Response} response - Response object
 * @param {number} duration - Request duration in ms
 * @param {Object} env - Environment bindings
 */
export function logResponse(request, response, duration, env = null) {
  const entry = createLogEntry(LogLevel.INFO, 'API Response', {
    category: LogCategory.API,
    method: request.method,
    url: request.url,
    status: response.status,
    duration: `${duration}ms`,
    ip: getClientIp(request)
  });
  
  if (env?.ENABLE_DEBUG_LOGS === 'true' || response.status >= 400) {
    console.log(JSON.stringify(entry));
  }
}

/**
 * Log authentication event
 * @param {string} event - Event type (login, logout, failed_login, etc.)
 * @param {Object} metadata - Additional metadata
 * @param {Object} env - Environment bindings
 */
export async function logAuthEvent(event, metadata = {}, env = null) {
  const entry = createLogEntry(LogLevel.INFO, `Auth: ${event}`, {
    category: LogCategory.AUTH,
    event,
    ...metadata
  });
  
  console.log(JSON.stringify(entry));
  
  // Store in audit log
  if (env?.DB) {
    await storeAuditLog(entry, env);
  }
}

/**
 * Log audit event for sensitive operations
 * @param {string} action - Action performed
 * @param {string} resource - Resource affected
 * @param {Object} metadata - Additional metadata
 * @param {Object} env - Environment bindings
 */
export async function logAuditEvent(action, resource, metadata = {}, env = null) {
  const entry = createLogEntry(LogLevel.INFO, `Audit: ${action} ${resource}`, {
    category: LogCategory.AUDIT,
    action,
    resource,
    ...metadata
  });
  
  console.log(JSON.stringify(entry));
  
  // Store in audit log
  if (env?.DB) {
    await storeAuditLog(entry, env);
  }
}

/**
 * Log database operation
 * @param {string} operation - Operation type (SELECT, INSERT, UPDATE, DELETE)
 * @param {string} table - Table name
 * @param {number} duration - Operation duration in ms
 * @param {Object} metadata - Additional metadata
 * @param {Object} env - Environment bindings
 */
export function logDatabaseOperation(operation, table, duration, metadata = {}, env = null) {
  const entry = createLogEntry(LogLevel.DEBUG, `DB: ${operation} ${table}`, {
    category: LogCategory.DATABASE,
    operation,
    table,
    duration: `${duration}ms`,
    ...metadata
  });
  
  if (env?.ENABLE_DEBUG_LOGS === 'true') {
    console.log(JSON.stringify(entry));
  }
}

/**
 * Log performance metrics
 * @param {string} metric - Metric name
 * @param {number} value - Metric value
 * @param {string} unit - Unit of measurement
 * @param {Object} metadata - Additional metadata
 */
export function logPerformanceMetric(metric, value, unit = 'ms', metadata = {}) {
  const entry = createLogEntry(LogLevel.INFO, `Performance: ${metric}`, {
    category: LogCategory.PERFORMANCE,
    metric,
    value,
    unit,
    ...metadata
  });
  
  console.log(JSON.stringify(entry));
}

/**
 * Log security event
 * @param {string} event - Security event type
 * @param {Object} metadata - Additional metadata
 * @param {Object} env - Environment bindings
 */
export async function logSecurityEvent(event, metadata = {}, env = null) {
  const entry = createLogEntry(LogLevel.WARN, `Security: ${event}`, {
    category: LogCategory.SECURITY,
    event,
    ...metadata
  });
  
  console.warn(JSON.stringify(entry));
  
  // Store in audit log
  if (env?.DB) {
    await storeAuditLog(entry, env);
  }
  
  // Alert on critical security events
  if (metadata.severity === 'critical' || metadata.severity === 'high') {
    await sendSecurityAlert(entry, env);
  }
}

/**
 * Log business event
 * @param {string} event - Business event type
 * @param {Object} metadata - Additional metadata
 * @param {Object} env - Environment bindings
 */
export function logBusinessEvent(event, metadata = {}, env = null) {
  const entry = createLogEntry(LogLevel.INFO, `Business: ${event}`, {
    category: LogCategory.BUSINESS,
    event,
    ...metadata
  });
  
  console.log(JSON.stringify(entry));
}

/**
 * Store error log in database
 * @param {Object} entry - Log entry
 * @param {Object} env - Environment bindings
 */
async function storeErrorLog(entry, env) {
  try {
    // Check if error_logs table exists, create if not
    await env.DB.prepare(`
      INSERT INTO error_logs (
        timestamp, level, message, stack, metadata
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      entry.timestamp,
      entry.level,
      entry.message,
      entry.stack || '',
      JSON.stringify(entry)
    ).run();
  } catch (error) {
    // Table might not exist, ignore error
    console.error('Error storing log:', error.message);
  }
}

/**
 * Store audit log in database
 * @param {Object} entry - Log entry
 * @param {Object} env - Environment bindings
 */
async function storeAuditLog(entry, env) {
  try {
    await env.DB.prepare(`
      INSERT INTO audit_logs (
        timestamp, category, action, metadata
      ) VALUES (?, ?, ?, ?)
    `).bind(
      entry.timestamp,
      entry.category,
      entry.action || entry.event,
      JSON.stringify(entry)
    ).run();
  } catch (error) {
    // Table might not exist, ignore error
    console.error('Error storing audit log:', error.message);
  }
}

/**
 * Send error alert to webhook
 * @param {Object} entry - Log entry
 * @param {Object} env - Environment bindings
 */
async function sendErrorAlert(entry, env) {
  const webhook = env?.ERROR_ALERT_WEBHOOK;
  if (!webhook) return;
  
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🚨 Error Alert',
        severity: entry.severity || 'high',
        message: entry.message,
        timestamp: entry.timestamp,
        environment: env.ENVIRONMENT,
        details: entry
      })
    });
  } catch (error) {
    console.error('Failed to send error alert:', error);
  }
}

/**
 * Send security alert to webhook
 * @param {Object} entry - Log entry
 * @param {Object} env - Environment bindings
 */
async function sendSecurityAlert(entry, env) {
  const webhook = env?.ERROR_ALERT_WEBHOOK;
  if (!webhook) return;
  
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🔒 Security Alert',
        severity: entry.severity || 'high',
        event: entry.event,
        message: entry.message,
        timestamp: entry.timestamp,
        environment: env.ENVIRONMENT,
        details: entry
      })
    });
  } catch (error) {
    console.error('Failed to send security alert:', error);
  }
}

/**
 * Sanitize log data to remove sensitive information
 * @param {Object} data - Data to sanitize
 * @returns {Object} Sanitized data
 */
export function sanitizeLogData(data) {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = maskSensitiveData(sanitized[field]);
    }
  }
  
  return sanitized;
}

/**
 * Create request logger middleware
 * @param {Object} env - Environment bindings
 * @returns {Function} Middleware function
 */
export function createRequestLogger(env) {
  return async (request, handler) => {
    const startTime = Date.now();
    
    logRequest(request, {}, env);
    
    const response = await handler(request);
    
    const duration = Date.now() - startTime;
    logResponse(request, response, duration, env);
    
    // Log slow requests
    if (duration > 1000) {
      logWarn('Slow request detected', {
        url: request.url,
        duration: `${duration}ms`
      });
    }
    
    return response;
  };
}
