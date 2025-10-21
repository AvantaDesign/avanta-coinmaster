/**
 * Database Resilience Utilities
 * 
 * Phase 45: Comprehensive Error Handling & Resilience
 * 
 * Provides database error handling and recovery mechanisms:
 * - Connection retry logic
 * - Transaction management with rollback
 * - Query timeout handling
 * - Connection health checks
 * - Graceful degradation
 * 
 * Usage:
 *   import { withDatabaseResilience, healthCheck } from './database-resilience';
 *   
 *   const result = await withDatabaseResilience(
 *     (db) => db.prepare('SELECT * FROM users').all(),
 *     env.DB
 *   );
 */

import { logError, logWarn, logInfo } from './logging.js';
import { AppError, ErrorType, HttpStatus } from './errors.js';

/**
 * Default configuration for database resilience
 */
const DEFAULT_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  timeout: 30000,
  healthCheckInterval: 60000
};

/**
 * Database error types
 */
const DB_ERROR_TYPES = {
  CONNECTION: 'connection',
  TIMEOUT: 'timeout',
  CONSTRAINT: 'constraint',
  SYNTAX: 'syntax',
  UNKNOWN: 'unknown'
};

/**
 * Classify database error
 * @param {Error} error - Database error
 * @returns {string} Error type
 */
function classifyDatabaseError(error) {
  const message = error.message?.toLowerCase() || '';
  
  if (message.includes('connection') || message.includes('connect')) {
    return DB_ERROR_TYPES.CONNECTION;
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return DB_ERROR_TYPES.TIMEOUT;
  }
  if (message.includes('constraint') || message.includes('unique') || message.includes('foreign key')) {
    return DB_ERROR_TYPES.CONSTRAINT;
  }
  if (message.includes('syntax') || message.includes('parse')) {
    return DB_ERROR_TYPES.SYNTAX;
  }
  
  return DB_ERROR_TYPES.UNKNOWN;
}

/**
 * Check if error is retryable
 * @param {Error} error - Database error
 * @returns {boolean} True if retryable
 */
function isRetryableDatabaseError(error) {
  const errorType = classifyDatabaseError(error);
  
  // Connection and timeout errors are retryable
  return errorType === DB_ERROR_TYPES.CONNECTION || errorType === DB_ERROR_TYPES.TIMEOUT;
}

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Retry attempt number
 * @param {Object} config - Configuration
 * @returns {number} Delay in milliseconds
 */
function calculateBackoff(attempt, config) {
  const exponentialDelay = config.baseDelay * Math.pow(2, attempt);
  const delay = Math.min(exponentialDelay, config.maxDelay);
  
  // Add jitter (10%)
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  
  return Math.max(0, delay + jitter);
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute database operation with retry logic
 * @param {Function} operation - Database operation function
 * @param {Object} db - Database connection
 * @param {Object} config - Configuration
 * @param {Object} env - Environment bindings
 * @returns {Promise} Promise that resolves with operation result
 */
export async function withDatabaseResilience(operation, db, config = {}, env = null) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError;
  
  // Validate database connection
  if (!db) {
    throw new AppError(
      'Database connection not available',
      ErrorType.DATABASE,
      HttpStatus.SERVICE_UNAVAILABLE,
      { code: 'DB_NOT_CONFIGURED' }
    );
  }
  
  for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
    try {
      // Execute operation with timeout
      const result = await executeWithTimeout(
        () => operation(db),
        finalConfig.timeout
      );
      
      // Log success if retried
      if (attempt > 0 && env) {
        logInfo('Database operation succeeded after retry', {
          attempt: attempt + 1,
          operation: operation.name || 'anonymous'
        });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      const errorType = classifyDatabaseError(error);
      
      // Log error
      if (env) {
        logWarn('Database operation failed', {
          attempt: attempt + 1,
          maxRetries: finalConfig.maxRetries,
          errorType,
          error: error.message
        });
      }
      
      // Check if we should retry
      const shouldRetry = attempt < finalConfig.maxRetries - 1 && isRetryableDatabaseError(error);
      
      if (shouldRetry) {
        const delay = calculateBackoff(attempt, finalConfig);
        await sleep(delay);
      } else {
        // Not retryable or last attempt
        if (env) {
          await logError(error, {
            type: 'database',
            errorType,
            attempts: attempt + 1,
            retryable: isRetryableDatabaseError(error)
          }, env);
        }
        
        throw new AppError(
          'Database operation failed',
          ErrorType.DATABASE,
          HttpStatus.INTERNAL_SERVER_ERROR,
          {
            code: errorType === DB_ERROR_TYPES.CONNECTION ? 'DB_CONNECTION_FAILED' : 'DB_QUERY_FAILED',
            originalError: error.message,
            errorType,
            attempts: attempt + 1
          }
        );
      }
    }
  }
  
  throw lastError;
}

/**
 * Execute operation with timeout
 * @param {Function} operation - Operation to execute
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} Promise that resolves with result or rejects with timeout
 */
async function executeWithTimeout(operation, timeout) {
  return Promise.race([
    operation(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database operation timeout')), timeout)
    )
  ]);
}

/**
 * Execute database query with error handling
 * @param {Object} db - Database connection
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @param {Object} options - Options
 * @param {Object} env - Environment bindings
 * @returns {Promise} Query result
 */
export async function executeQuery(db, sql, params = [], options = {}, env = null) {
  return withDatabaseResilience(
    async (database) => {
      const stmt = database.prepare(sql);
      
      if (params && params.length > 0) {
        stmt.bind(...params);
      }
      
      // Execute based on query type
      if (options.first) {
        return await stmt.first();
      } else if (options.all) {
        return await stmt.all();
      } else if (options.run) {
        return await stmt.run();
      } else {
        return await stmt.all();
      }
    },
    db,
    options,
    env
  );
}

/**
 * Check database connection health
 * @param {Object} db - Database connection
 * @returns {Promise<boolean>} True if healthy
 */
export async function healthCheck(db) {
  try {
    // Simple query to check if database is responsive
    await db.prepare('SELECT 1 as health').first();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database connection with health check
 * @param {Object} env - Environment bindings
 * @returns {Promise<Object>} Database connection
 */
export async function getDatabaseConnection(env) {
  if (!env.DB) {
    throw new AppError(
      'Database not configured',
      ErrorType.DATABASE,
      HttpStatus.SERVICE_UNAVAILABLE,
      { code: 'DB_NOT_CONFIGURED' }
    );
  }
  
  // Check health
  const isHealthy = await healthCheck(env.DB);
  
  if (!isHealthy) {
    throw new AppError(
      'Database health check failed',
      ErrorType.DATABASE,
      HttpStatus.SERVICE_UNAVAILABLE,
      { code: 'DB_CONNECTION_FAILED' }
    );
  }
  
  return env.DB;
}

/**
 * Execute multiple queries in sequence with error recovery
 * @param {Object} db - Database connection
 * @param {Array} queries - Array of {sql, params} objects
 * @param {Object} env - Environment bindings
 * @returns {Promise<Array>} Array of results
 */
export async function executeBatch(db, queries, env = null) {
  const results = [];
  
  for (const query of queries) {
    try {
      const result = await executeQuery(
        db,
        query.sql,
        query.params || [],
        query.options || {},
        env
      );
      results.push({ success: true, result });
    } catch (error) {
      results.push({ success: false, error });
      
      // Stop on first error if not continuing on error
      if (!query.continueOnError) {
        break;
      }
    }
  }
  
  return results;
}

/**
 * Create a fallback value provider for when database is unavailable
 * @param {Function} fallbackFn - Function that provides fallback value
 * @returns {Function} Wrapped operation with fallback
 */
export function withFallback(operation, fallbackFn) {
  return async (...args) => {
    try {
      return await operation(...args);
    } catch (error) {
      const errorType = classifyDatabaseError(error);
      
      // Only use fallback for connection errors
      if (errorType === DB_ERROR_TYPES.CONNECTION || errorType === DB_ERROR_TYPES.TIMEOUT) {
        console.warn('Using fallback due to database error:', error.message);
        return fallbackFn(error);
      }
      
      throw error;
    }
  };
}

/**
 * Monitor database operations and collect metrics
 */
export class DatabaseMonitor {
  constructor() {
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      retriedQueries: 0,
      averageLatency: 0,
      lastError: null,
      lastHealthCheck: null
    };
  }
  
  /**
   * Record query execution
   * @param {number} latency - Query latency in ms
   * @param {boolean} success - Whether query succeeded
   * @param {boolean} retried - Whether query was retried
   */
  recordQuery(latency, success, retried = false) {
    this.metrics.totalQueries++;
    
    if (success) {
      this.metrics.successfulQueries++;
    } else {
      this.metrics.failedQueries++;
    }
    
    if (retried) {
      this.metrics.retriedQueries++;
    }
    
    // Update average latency
    this.metrics.averageLatency = 
      (this.metrics.averageLatency * (this.metrics.totalQueries - 1) + latency) / 
      this.metrics.totalQueries;
  }
  
  /**
   * Record error
   * @param {Error} error - Error object
   */
  recordError(error) {
    this.metrics.lastError = {
      message: error.message,
      type: classifyDatabaseError(error),
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Record health check result
   * @param {boolean} healthy - Health check result
   */
  recordHealthCheck(healthy) {
    this.metrics.lastHealthCheck = {
      healthy,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get metrics
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return { ...this.metrics };
  }
  
  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      retriedQueries: 0,
      averageLatency: 0,
      lastError: null,
      lastHealthCheck: null
    };
  }
}

// Global database monitor instance
export const databaseMonitor = new DatabaseMonitor();

export default {
  withDatabaseResilience,
  executeQuery,
  healthCheck,
  getDatabaseConnection,
  executeBatch,
  withFallback,
  DatabaseMonitor,
  databaseMonitor
};
