/**
 * Error Monitoring and Logging Utility
 * 
 * Centralized error handling, logging, and monitoring for Avanta Finance.
 * Provides structured logging with severity levels and context tracking.
 * 
 * Features:
 * - Structured logging with severity levels
 * - Error aggregation and reporting
 * - Request ID tracking
 * - Performance monitoring
 * - Rate limiting for error prevention
 * 
 * Usage:
 *   import { logger, ErrorMonitor } from './utils/errorMonitoring';
 *   
 *   logger.info('Transaction created', { transactionId: 123 });
 *   logger.error('Failed to save', error, { context: 'transactions' });
 *   
 *   ErrorMonitor.track(error, { page: '/transactions' });
 */

// Log levels
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

// Log level names
const LogLevelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];

// Current log level (can be configured via environment)
let currentLogLevel = LogLevel.INFO;

// In-memory error storage (for aggregation)
const errorStore = {
  errors: [],
  maxSize: 100,
  rateLimits: new Map()
};

/**
 * Logger class with structured logging
 */
class Logger {
  constructor(context = 'app') {
    this.context = context;
    this.requestId = this.generateRequestId();
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current request ID
   */
  getRequestId() {
    return this.requestId;
  }

  /**
   * Set request ID (for tracking across async operations)
   */
  setRequestId(requestId) {
    this.requestId = requestId;
  }

  /**
   * Format log message
   */
  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: LogLevelNames[level],
      context: this.context,
      requestId: this.requestId,
      message,
      ...data
    };

    return logEntry;
  }

  /**
   * Write log to console with appropriate method
   */
  writeLog(level, message, data = {}) {
    if (level < currentLogLevel) return;

    const logEntry = this.formatMessage(level, message, data);
    const logString = JSON.stringify(logEntry, null, 2);

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
      case LogLevel.INFO:
        console.log(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(logString);
        break;
      default:
        console.log(logString);
    }

    // Store errors for aggregation
    if (level >= LogLevel.ERROR) {
      this.storeError(logEntry);
    }

    return logEntry;
  }

  /**
   * Store error for aggregation
   */
  storeError(logEntry) {
    errorStore.errors.push(logEntry);

    // Keep only last N errors
    if (errorStore.errors.length > errorStore.maxSize) {
      errorStore.errors.shift();
    }
  }

  /**
   * Debug level logging
   */
  debug(message, data = {}) {
    return this.writeLog(LogLevel.DEBUG, message, data);
  }

  /**
   * Info level logging
   */
  info(message, data = {}) {
    return this.writeLog(LogLevel.INFO, message, data);
  }

  /**
   * Warning level logging
   */
  warn(message, data = {}) {
    return this.writeLog(LogLevel.WARN, message, data);
  }

  /**
   * Error level logging
   */
  error(message, error = null, data = {}) {
    const errorData = {
      ...data
    };

    if (error) {
      errorData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }

    return this.writeLog(LogLevel.ERROR, message, errorData);
  }

  /**
   * Critical level logging
   */
  critical(message, error = null, data = {}) {
    const errorData = {
      ...data
    };

    if (error) {
      errorData.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }

    return this.writeLog(LogLevel.CRITICAL, message, errorData);
  }

  /**
   * Log with custom level
   */
  log(level, message, data = {}) {
    return this.writeLog(level, message, data);
  }

  /**
   * Create child logger with different context
   */
  child(context) {
    const childLogger = new Logger(`${this.context}:${context}`);
    childLogger.setRequestId(this.requestId);
    return childLogger;
  }
}

/**
 * Error Monitor class for tracking and aggregating errors
 */
class ErrorMonitorClass {
  constructor() {
    this.listeners = [];
    this.errorCounts = new Map();
    this.rateLimit = {
      maxErrors: 10,
      window: 60000, // 1 minute
      counts: new Map()
    };
  }

  /**
   * Track an error
   */
  track(error, context = {}) {
    const errorKey = `${error.name}:${error.message}`;
    
    // Check rate limit
    if (this.isRateLimited(errorKey)) {
      logger.debug('Error rate limited', { errorKey });
      return;
    }

    // Increment error count
    const count = (this.errorCounts.get(errorKey) || 0) + 1;
    this.errorCounts.set(errorKey, count);

    // Create error entry
    const errorEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context: {
        ...context,
        count,
        url: typeof window !== 'undefined' ? window.location.href : null,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      }
    };

    // Log error
    logger.error('Error tracked', error, context);

    // Notify listeners
    this.notifyListeners(errorEntry);

    // Send to error monitoring service
    this.sendToMonitoring(errorEntry);

    return errorEntry;
  }

  /**
   * Check if error is rate limited
   */
  isRateLimited(errorKey) {
    const now = Date.now();
    const windowStart = now - this.rateLimit.window;

    // Get error count in current window
    const counts = this.rateLimit.counts.get(errorKey) || [];
    const recentCounts = counts.filter(timestamp => timestamp > windowStart);

    // Update counts
    this.rateLimit.counts.set(errorKey, [...recentCounts, now]);

    return recentCounts.length >= this.rateLimit.maxErrors;
  }

  /**
   * Add error listener
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Remove error listener
   */
  removeListener(listener) {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners
   */
  notifyListeners(errorEntry) {
    this.listeners.forEach(listener => {
      try {
        listener(errorEntry);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }

  /**
   * Send error to monitoring service
   */
  async sendToMonitoring(errorEntry) {
    try {
      if (typeof fetch === 'undefined') return;

      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorEntry),
        keepalive: true
      }).catch(() => {
        // Silently fail - don't cause more errors
      });
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Get error statistics
   */
  getStats() {
    const stats = {
      totalErrors: errorStore.errors.length,
      errorsByLevel: {},
      errorsByContext: {},
      topErrors: []
    };

    // Count by level
    errorStore.errors.forEach(error => {
      const level = error.level;
      stats.errorsByLevel[level] = (stats.errorsByLevel[level] || 0) + 1;

      const context = error.context;
      stats.errorsByContext[context] = (stats.errorsByContext[context] || 0) + 1;
    });

    // Get top errors
    const errorCountsArray = Array.from(this.errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    stats.topErrors = errorCountsArray.map(([key, count]) => ({
      error: key,
      count
    }));

    return stats;
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10) {
    return errorStore.errors.slice(-limit).reverse();
  }

  /**
   * Clear error store
   */
  clear() {
    errorStore.errors = [];
    this.errorCounts.clear();
    this.rateLimit.counts.clear();
  }
}

/**
 * Performance Monitor class
 */
class PerformanceMonitorClass {
  constructor() {
    this.metrics = new Map();
  }

  /**
   * Start timing an operation
   */
  start(name) {
    this.metrics.set(name, {
      startTime: Date.now(),
      endTime: null,
      duration: null
    });
  }

  /**
   * End timing an operation
   */
  end(name) {
    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn('Performance metric not found', { name });
      return null;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;

    logger.debug('Performance metric', {
      name,
      duration: metric.duration,
      unit: 'ms'
    });

    return metric.duration;
  }

  /**
   * Measure an async operation
   */
  async measure(name, operation) {
    this.start(name);
    try {
      const result = await operation();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get metric
   */
  get(name) {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAll() {
    return Array.from(this.metrics.entries()).map(([name, metric]) => ({
      name,
      ...metric
    }));
  }

  /**
   * Clear metrics
   */
  clear() {
    this.metrics.clear();
  }
}

/**
 * Rate Limiter class
 */
class RateLimiterClass {
  constructor() {
    this.limits = new Map();
  }

  /**
   * Check if action is rate limited
   */
  isLimited(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get request timestamps for this key
    const timestamps = this.limits.get(key) || [];
    const recentTimestamps = timestamps.filter(ts => ts > windowStart);

    // Check if limit exceeded
    if (recentTimestamps.length >= maxRequests) {
      return true;
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.limits.set(key, recentTimestamps);

    return false;
  }

  /**
   * Clear rate limit for a key
   */
  clear(key) {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clearAll() {
    this.limits.clear();
  }
}

// Create singleton instances
export const logger = new Logger();
export const ErrorMonitor = new ErrorMonitorClass();
export const PerformanceMonitor = new PerformanceMonitorClass();
export const RateLimiter = new RateLimiterClass();

/**
 * Set log level
 */
export function setLogLevel(level) {
  if (level >= LogLevel.DEBUG && level <= LogLevel.CRITICAL) {
    currentLogLevel = level;
    logger.info('Log level changed', { level: LogLevelNames[level] });
  }
}

/**
 * Initialize error monitoring
 */
export function initializeErrorMonitoring() {
  if (typeof window === 'undefined') return;

  // Set up global error handler
  window.addEventListener('error', (event) => {
    ErrorMonitor.track(event.error || new Error(event.message), {
      source: 'window.error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Set up unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    ErrorMonitor.track(
      new Error(event.reason || 'Unhandled Promise Rejection'),
      {
        source: 'unhandledrejection',
        promise: event.promise
      }
    );
  });

  logger.info('Error monitoring initialized');
}

/**
 * Create API logger with request context
 */
export function createAPILogger(requestId, endpoint) {
  const apiLogger = new Logger(`api:${endpoint}`);
  apiLogger.setRequestId(requestId);
  return apiLogger;
}

export default {
  logger,
  Logger,
  ErrorMonitor,
  PerformanceMonitor,
  RateLimiter,
  LogLevel,
  setLogLevel,
  initializeErrorMonitoring,
  createAPILogger
};
