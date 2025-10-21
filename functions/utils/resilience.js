/**
 * Backend Resilience Utilities
 * 
 * Phase 45: Comprehensive Error Handling & Resilience
 * 
 * Server-side resilience utilities for handling external service calls,
 * timeouts, and failure scenarios in Cloudflare Workers.
 * 
 * Features:
 * - Retry logic for external API calls
 * - Timeout management
 * - Circuit breaker pattern for external services
 * - Graceful degradation strategies
 * - Health check utilities
 * 
 * Usage:
 *   import { withRetry, withTimeout } from './resilience';
 *   
 *   const result = await withRetry(
 *     () => fetch('https://api.example.com/data'),
 *     { maxAttempts: 3 }
 *   );
 */

import { logWarn, logError, logInfo } from './logging.js';
import { AppError, ErrorType, HttpStatus } from './errors.js';

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBase: 2,
  jitter: true,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  timeout: 30000
};

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number
 * @param {Object} config - Retry configuration
 * @returns {number} Delay in milliseconds
 */
function calculateBackoff(attempt, config) {
  const exponentialDelay = config.baseDelay * Math.pow(config.exponentialBase, attempt);
  const delay = Math.min(exponentialDelay, config.maxDelay);
  
  // Add jitter
  if (config.jitter) {
    const jitterAmount = delay * 0.1;
    const jitter = Math.random() * jitterAmount * 2 - jitterAmount;
    return Math.max(0, delay + jitter);
  }
  
  return delay;
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
 * Check if error/response is retryable
 * @param {Error|Response} errorOrResponse - Error or Response object
 * @param {Object} config - Configuration
 * @returns {boolean} True if retryable
 */
function isRetryable(errorOrResponse, config) {
  // Check if it's a Response object
  if (errorOrResponse instanceof Response) {
    return config.retryableStatuses.includes(errorOrResponse.status);
  }
  
  // Check error types
  if (errorOrResponse instanceof Error) {
    const message = errorOrResponse.message?.toLowerCase() || '';
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('econnreset') ||
      errorOrResponse.name === 'TimeoutError' ||
      errorOrResponse.name === 'NetworkError'
    );
  }
  
  return false;
}

/**
 * Execute operation with retry logic
 * @param {Function} operation - Async operation to retry
 * @param {Object} config - Retry configuration
 * @param {Object} env - Environment bindings
 * @returns {Promise} Promise that resolves with operation result
 */
export async function withRetry(operation, config = {}, env = null) {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError;
  
  for (let attempt = 0; attempt < finalConfig.maxAttempts; attempt++) {
    try {
      // Execute with timeout
      const result = await withTimeout(
        operation,
        finalConfig.timeout
      );
      
      // Check if result is a Response and if it's an error
      if (result instanceof Response && !result.ok) {
        if (isRetryable(result, finalConfig) && attempt < finalConfig.maxAttempts - 1) {
          lastError = new Error(`HTTP ${result.status}: ${result.statusText}`);
          throw lastError;
        }
        return result;
      }
      
      // Log success after retry
      if (attempt > 0 && env) {
        logInfo('Operation succeeded after retry', {
          attempt: attempt + 1,
          operation: operation.name || 'anonymous'
        });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      if (env) {
        logWarn('Operation failed, checking retry', {
          attempt: attempt + 1,
          maxAttempts: finalConfig.maxAttempts,
          error: error.message,
          retryable: isRetryable(error, finalConfig)
        });
      }
      
      // Check if we should retry
      if (attempt < finalConfig.maxAttempts - 1 && isRetryable(error, finalConfig)) {
        const delay = calculateBackoff(attempt, finalConfig);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}

/**
 * Execute operation with timeout
 * @param {Function} operation - Async operation
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} Promise that resolves with result or rejects with timeout
 */
export async function withTimeout(operation, timeout) {
  return Promise.race([
    operation(),
    new Promise((_, reject) => 
      setTimeout(() => {
        const error = new Error('Operation timeout');
        error.name = 'TimeoutError';
        reject(error);
      }, timeout)
    )
  ]);
}

/**
 * Execute fetch with retry and timeout
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {Object} config - Retry configuration
 * @param {Object} env - Environment bindings
 * @returns {Promise<Response>} Response object
 */
export async function fetchWithResilience(url, options = {}, config = {}, env = null) {
  return withRetry(
    () => fetch(url, options),
    config,
    env
  );
}

/**
 * Execute multiple operations with fallback
 * @param {Array<Function>} operations - Array of operation functions (primary, fallback1, fallback2, ...)
 * @param {Object} env - Environment bindings
 * @returns {Promise} Result from first successful operation
 */
export async function withFallbacks(operations, env = null) {
  let lastError;
  
  for (let i = 0; i < operations.length; i++) {
    try {
      const result = await operations[i]();
      
      if (i > 0 && env) {
        logInfo('Fallback operation succeeded', {
          fallbackIndex: i
        });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      if (env) {
        logWarn('Operation failed, trying next fallback', {
          operationIndex: i,
          totalOperations: operations.length,
          error: error.message
        });
      }
    }
  }
  
  if (env) {
    await logError(lastError, {
      context: 'all-fallbacks-failed',
      totalAttempts: operations.length
    }, env);
  }
  
  throw lastError;
}

/**
 * Health check for external service
 * @param {string} url - Service URL
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} True if healthy
 */
export async function healthCheck(url, options = {}, timeout = 5000) {
  try {
    const response = await withTimeout(
      () => fetch(url, { ...options, method: 'GET' }),
      timeout
    );
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

/**
 * Circuit breaker state management
 */
const circuitBreakerStates = new Map();

/**
 * Get or initialize circuit breaker state
 * @param {string} name - Circuit breaker name
 * @param {Object} config - Configuration
 * @returns {Object} Circuit breaker state
 */
function getCircuitBreakerState(name, config = {}) {
  if (!circuitBreakerStates.has(name)) {
    circuitBreakerStates.set(name, {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: null,
      nextAttemptTime: null,
      config: {
        failureThreshold: config.failureThreshold || 5,
        timeout: config.timeout || 60000,
        ...config
      }
    });
  }
  return circuitBreakerStates.get(name);
}

/**
 * Execute operation with circuit breaker
 * @param {string} name - Circuit breaker name
 * @param {Function} operation - Operation to execute
 * @param {Object} config - Circuit breaker configuration
 * @param {Object} env - Environment bindings
 * @returns {Promise} Operation result
 */
export async function withCircuitBreaker(name, operation, config = {}, env = null) {
  const state = getCircuitBreakerState(name, config);
  
  // Check if circuit is open
  if (state.state === 'OPEN') {
    if (Date.now() >= state.nextAttemptTime) {
      state.state = 'HALF_OPEN';
      if (env) {
        logInfo('Circuit breaker transitioning to HALF_OPEN', { name });
      }
    } else {
      const error = new AppError(
        `Circuit breaker is OPEN for ${name}`,
        ErrorType.EXTERNAL_SERVICE,
        HttpStatus.SERVICE_UNAVAILABLE,
        { code: 'EXT_SERVICE_UNAVAILABLE' }
      );
      throw error;
    }
  }
  
  try {
    const result = await operation();
    
    // Success - reset failure count or close circuit
    if (state.state === 'HALF_OPEN') {
      state.state = 'CLOSED';
      state.failureCount = 0;
      if (env) {
        logInfo('Circuit breaker closed', { name });
      }
    } else {
      state.failureCount = Math.max(0, state.failureCount - 1);
    }
    
    return result;
  } catch (error) {
    state.failureCount++;
    state.lastFailureTime = Date.now();
    
    // Check if threshold exceeded
    if (state.failureCount >= state.config.failureThreshold) {
      state.state = 'OPEN';
      state.nextAttemptTime = Date.now() + state.config.timeout;
      
      if (env) {
        logWarn('Circuit breaker opened', {
          name,
          failureCount: state.failureCount,
          threshold: state.config.failureThreshold
        });
      }
    }
    
    throw error;
  }
}

/**
 * Reset circuit breaker
 * @param {string} name - Circuit breaker name
 */
export function resetCircuitBreaker(name) {
  circuitBreakerStates.delete(name);
}

/**
 * Get all circuit breaker states
 * @returns {Object} Circuit breaker states
 */
export function getCircuitBreakerStates() {
  const states = {};
  circuitBreakerStates.forEach((state, name) => {
    states[name] = { ...state };
  });
  return states;
}

export default {
  withRetry,
  withTimeout,
  fetchWithResilience,
  withFallbacks,
  healthCheck,
  withCircuitBreaker,
  resetCircuitBreaker,
  getCircuitBreakerStates
};
