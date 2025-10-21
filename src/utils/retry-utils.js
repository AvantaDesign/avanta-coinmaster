/**
 * Retry Utilities
 * 
 * Phase 45: Comprehensive Error Handling & Resilience
 * 
 * Provides retry logic with exponential backoff, jitter, and timeout management.
 * Used for resilient API calls and external service interactions.
 * 
 * Features:
 * - Exponential backoff with configurable base delay
 * - Jitter to prevent thundering herd
 * - Maximum retry attempts
 * - Retry only for transient/retryable errors
 * - Timeout management
 * - Abort signal support
 * 
 * Usage:
 *   import { retry, createRetryPolicy } from './retry-utils';
 *   
 *   const result = await retry(() => fetchData(), {
 *     maxAttempts: 3,
 *     baseDelay: 1000
 *   });
 */

import { logger } from './errorMonitoring';

/**
 * Default retry policy configuration
 */
export const DEFAULT_RETRY_POLICY = {
  maxAttempts: 3,
  baseDelay: 1000, // milliseconds
  maxDelay: 30000, // 30 seconds
  exponentialBase: 2,
  jitter: true,
  timeout: 60000, // 60 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: [
    'NetworkError',
    'TimeoutError',
    'AbortError',
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED'
  ]
};

/**
 * Create custom retry policy
 * @param {Object} options - Policy options
 * @returns {Object} Retry policy
 */
export function createRetryPolicy(options = {}) {
  return {
    ...DEFAULT_RETRY_POLICY,
    ...options
  };
}

/**
 * Calculate delay with exponential backoff
 * @param {number} attempt - Current attempt number (0-based)
 * @param {Object} policy - Retry policy
 * @returns {number} Delay in milliseconds
 */
function calculateDelay(attempt, policy) {
  const exponentialDelay = policy.baseDelay * Math.pow(policy.exponentialBase, attempt);
  const delay = Math.min(exponentialDelay, policy.maxDelay);
  
  // Add jitter to prevent thundering herd
  if (policy.jitter) {
    const jitterAmount = delay * 0.1; // 10% jitter
    const jitter = Math.random() * jitterAmount * 2 - jitterAmount;
    return Math.max(0, delay + jitter);
  }
  
  return delay;
}

/**
 * Check if error is retryable
 * @param {Error} error - Error object
 * @param {Object} policy - Retry policy
 * @returns {boolean} True if retryable
 */
function isRetryableError(error, policy) {
  // Check HTTP status codes
  if (error.response?.status) {
    return policy.retryableStatuses.includes(error.response.status);
  }
  
  // Check error code
  if (error.code) {
    return policy.retryableErrors.some(code => 
      error.code.includes(code) || error.message?.includes(code)
    );
  }
  
  // Check error name
  if (error.name) {
    return policy.retryableErrors.includes(error.name);
  }
  
  // Check error message
  if (error.message) {
    return policy.retryableErrors.some(msg => 
      error.message.toLowerCase().includes(msg.toLowerCase())
    );
  }
  
  // Network errors are generally retryable
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  
  return false;
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @param {AbortSignal} signal - Abort signal
 * @returns {Promise} Promise that resolves after delay
 */
function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }
    
    const timeout = setTimeout(resolve, ms);
    
    if (signal) {
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Aborted'));
      });
    }
  });
}

/**
 * Retry an async operation with exponential backoff
 * @param {Function} operation - Async function to retry
 * @param {Object} options - Retry options
 * @param {AbortSignal} signal - Abort signal
 * @returns {Promise} Promise that resolves with operation result
 */
export async function retry(operation, options = {}, signal = null) {
  const policy = createRetryPolicy(options);
  let lastError;
  
  // Set up timeout
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, policy.timeout);
  
  // Combine abort signals
  const combinedSignal = signal || timeoutController.signal;
  
  try {
    for (let attempt = 0; attempt < policy.maxAttempts; attempt++) {
      try {
        // Check if operation was aborted
        if (combinedSignal?.aborted) {
          throw new Error('Operation aborted');
        }
        
        logger.debug('Retry attempt', {
          attempt: attempt + 1,
          maxAttempts: policy.maxAttempts
        });
        
        // Execute operation
        const result = await operation(attempt);
        
        // Success - clear timeout and return result
        clearTimeout(timeoutId);
        
        if (attempt > 0) {
          logger.info('Operation succeeded after retry', {
            attempts: attempt + 1
          });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        logger.warn('Operation failed', {
          attempt: attempt + 1,
          error: error.message,
          retryable: isRetryableError(error, policy)
        });
        
        // Check if we should retry
        if (attempt < policy.maxAttempts - 1 && isRetryableError(error, policy)) {
          const delay = calculateDelay(attempt, policy);
          
          logger.debug('Retrying after delay', {
            delay,
            nextAttempt: attempt + 2
          });
          
          await sleep(delay, combinedSignal);
        } else {
          // Not retryable or last attempt
          throw error;
        }
      }
    }
  } finally {
    clearTimeout(timeoutId);
  }
  
  // All attempts failed
  throw lastError;
}

/**
 * Retry with specific policies for different operations
 */
export const RetryPolicies = {
  /**
   * Fast retry for quick operations
   */
  FAST: createRetryPolicy({
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000,
    timeout: 10000
  }),
  
  /**
   * Standard retry for normal API calls
   */
  STANDARD: createRetryPolicy({
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    timeout: 30000
  }),
  
  /**
   * Aggressive retry for critical operations
   */
  AGGRESSIVE: createRetryPolicy({
    maxAttempts: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    timeout: 120000
  }),
  
  /**
   * Patient retry for long-running operations
   */
  PATIENT: createRetryPolicy({
    maxAttempts: 3,
    baseDelay: 5000,
    maxDelay: 60000,
    timeout: 300000
  }),
  
  /**
   * No retry - fail fast
   */
  NO_RETRY: createRetryPolicy({
    maxAttempts: 1,
    timeout: 30000
  })
};

/**
 * Create a retryable function wrapper
 * @param {Function} fn - Function to wrap
 * @param {Object} policy - Retry policy
 * @returns {Function} Wrapped function with retry logic
 */
export function retryable(fn, policy = DEFAULT_RETRY_POLICY) {
  return async function(...args) {
    return retry(() => fn(...args), policy);
  };
}

/**
 * Batch retry multiple operations with individual retry policies
 * @param {Array} operations - Array of {operation, policy} objects
 * @returns {Promise<Array>} Array of results
 */
export async function retryBatch(operations) {
  return Promise.all(
    operations.map(({ operation, policy }) => 
      retry(operation, policy).catch(error => ({ error }))
    )
  );
}

/**
 * Retry with conditional logic
 * @param {Function} operation - Operation to retry
 * @param {Function} shouldRetry - Function to determine if should retry
 * @param {Object} options - Retry options
 * @returns {Promise} Promise that resolves with operation result
 */
export async function retryIf(operation, shouldRetry, options = {}) {
  const policy = createRetryPolicy(options);
  let lastError;
  
  for (let attempt = 0; attempt < policy.maxAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      
      if (attempt < policy.maxAttempts - 1 && shouldRetry(error, attempt)) {
        const delay = calculateDelay(attempt, policy);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}

/**
 * Retry with custom backoff function
 * @param {Function} operation - Operation to retry
 * @param {Function} backoffFn - Custom backoff function (attempt => delay)
 * @param {number} maxAttempts - Maximum attempts
 * @returns {Promise} Promise that resolves with operation result
 */
export async function retryWithBackoff(operation, backoffFn, maxAttempts = 3) {
  let lastError;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts - 1) {
        const delay = backoffFn(attempt);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}

export default {
  retry,
  createRetryPolicy,
  RetryPolicies,
  retryable,
  retryBatch,
  retryIf,
  retryWithBackoff,
  DEFAULT_RETRY_POLICY
};
