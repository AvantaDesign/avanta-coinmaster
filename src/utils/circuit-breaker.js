/**
 * Circuit Breaker Pattern Implementation
 * 
 * Phase 45: Comprehensive Error Handling & Resilience
 * 
 * Implements the circuit breaker pattern to prevent cascade failures
 * when external services or operations are failing.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests fail fast
 * - HALF_OPEN: Testing if service has recovered
 * 
 * Features:
 * - Automatic state transitions
 * - Configurable failure threshold
 * - Configurable timeout for recovery attempts
 * - Fallback support
 * - Event listeners for monitoring
 * 
 * Usage:
 *   import { CircuitBreaker } from './circuit-breaker';
 *   
 *   const breaker = new CircuitBreaker('api-service', {
 *     failureThreshold: 5,
 *     timeout: 60000
 *   });
 *   
 *   const result = await breaker.execute(() => fetchData());
 */

import { logger } from './errorMonitoring';

/**
 * Circuit breaker states
 */
export const CircuitState = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CONFIG = {
  failureThreshold: 5,        // Number of failures before opening
  successThreshold: 2,        // Number of successes before closing from half-open
  timeout: 60000,             // Time in ms before attempting to half-open
  halfOpenMaxAttempts: 3,     // Max attempts in half-open state
  monitoringPeriod: 10000,    // Time window for tracking failures
  volumeThreshold: 10         // Minimum requests before calculating failure rate
};

/**
 * Circuit Breaker class
 */
export class CircuitBreaker {
  constructor(name, config = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // State management
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.requestCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.halfOpenAttempts = 0;
    
    // Monitoring
    this.stats = {
      totalRequests: 0,
      totalSuccesses: 0,
      totalFailures: 0,
      totalRejections: 0,
      stateChanges: []
    };
    
    // Event listeners
    this.listeners = {
      stateChange: [],
      success: [],
      failure: [],
      open: [],
      halfOpen: [],
      close: []
    };
    
    // Fallback function
    this.fallbackFn = null;
    
    logger.debug('Circuit breaker initialized', {
      name: this.name,
      config: this.config
    });
  }
  
  /**
   * Execute operation with circuit breaker
   * @param {Function} operation - Async operation to execute
   * @returns {Promise} Promise that resolves with operation result
   */
  async execute(operation) {
    this.stats.totalRequests++;
    
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if timeout has elapsed
      if (Date.now() >= this.nextAttemptTime) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        this.stats.totalRejections++;
        const error = new Error(`Circuit breaker is OPEN for ${this.name}`);
        error.name = 'CircuitBreakerError';
        error.circuitState = this.state;
        
        logger.warn('Circuit breaker rejected request', {
          name: this.name,
          state: this.state
        });
        
        // Try fallback if available
        if (this.fallbackFn) {
          logger.debug('Executing fallback', { name: this.name });
          return this.fallbackFn(error);
        }
        
        throw error;
      }
    }
    
    try {
      const result = await this.callWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      
      // Try fallback if circuit is now open
      if (this.state === CircuitState.OPEN && this.fallbackFn) {
        logger.debug('Executing fallback after failure', { name: this.name });
        return this.fallbackFn(error);
      }
      
      throw error;
    }
  }
  
  /**
   * Call operation with timeout
   * @param {Function} operation - Operation to call
   * @returns {Promise} Promise that resolves with result
   */
  async callWithTimeout(operation) {
    if (!this.config.operationTimeout) {
      return operation();
    }
    
    return Promise.race([
      operation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), this.config.operationTimeout)
      )
    ]);
  }
  
  /**
   * Handle successful operation
   */
  onSuccess() {
    this.stats.totalSuccesses++;
    this.requestCount++;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      this.halfOpenAttempts++;
      
      logger.debug('Half-open success', {
        name: this.name,
        successCount: this.successCount,
        threshold: this.config.successThreshold
      });
      
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
    
    this.emit('success');
  }
  
  /**
   * Handle failed operation
   * @param {Error} error - Error that occurred
   */
  onFailure(error) {
    this.stats.totalFailures++;
    this.failureCount++;
    this.requestCount++;
    this.lastFailureTime = Date.now();
    
    logger.warn('Circuit breaker operation failed', {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      error: error.message
    });
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenAttempts++;
      
      // Failure in half-open state opens the circuit immediately
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      // Check if failure threshold exceeded
      if (this.requestCount >= this.config.volumeThreshold) {
        const failureRate = this.failureCount / this.requestCount;
        const threshold = this.config.failureThreshold / this.config.volumeThreshold;
        
        if (failureRate >= threshold) {
          this.transitionTo(CircuitState.OPEN);
        }
      } else if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
    
    this.emit('failure', error);
  }
  
  /**
   * Transition to new state
   * @param {string} newState - New circuit state
   */
  transitionTo(newState) {
    const oldState = this.state;
    
    if (oldState === newState) {
      return;
    }
    
    this.state = newState;
    
    logger.info('Circuit breaker state changed', {
      name: this.name,
      oldState,
      newState,
      failureCount: this.failureCount
    });
    
    // Record state change
    this.stats.stateChanges.push({
      from: oldState,
      to: newState,
      timestamp: new Date().toISOString(),
      failureCount: this.failureCount
    });
    
    // Reset counters based on new state
    if (newState === CircuitState.OPEN) {
      this.nextAttemptTime = Date.now() + this.config.timeout;
      this.emit('open');
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
      this.halfOpenAttempts = 0;
      this.emit('halfOpen');
    } else if (newState === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
      this.requestCount = 0;
      this.halfOpenAttempts = 0;
      this.emit('close');
    }
    
    this.emit('stateChange', { oldState, newState });
  }
  
  /**
   * Set fallback function
   * @param {Function} fallbackFn - Fallback function
   */
  fallback(fallbackFn) {
    this.fallbackFn = fallbackFn;
    return this;
  }
  
  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} listener - Listener function
   */
  on(event, listener) {
    if (this.listeners[event]) {
      this.listeners[event].push(listener);
    }
    return this;
  }
  
  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} listener - Listener function
   */
  off(event, listener) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(listener);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
    return this;
  }
  
  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          logger.error('Error in circuit breaker listener', error, {
            event,
            name: this.name
          });
        }
      });
    }
  }
  
  /**
   * Get current state
   * @returns {string} Current circuit state
   */
  getState() {
    return this.state;
  }
  
  /**
   * Get statistics
   * @returns {Object} Circuit breaker statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentState: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      requestCount: this.requestCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }
  
  /**
   * Manually open circuit
   */
  open() {
    this.transitionTo(CircuitState.OPEN);
  }
  
  /**
   * Manually close circuit
   */
  close() {
    this.transitionTo(CircuitState.CLOSED);
  }
  
  /**
   * Reset circuit breaker
   */
  reset() {
    this.failureCount = 0;
    this.successCount = 0;
    this.requestCount = 0;
    this.halfOpenAttempts = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
    this.transitionTo(CircuitState.CLOSED);
    
    logger.info('Circuit breaker reset', { name: this.name });
  }
}

/**
 * Circuit Breaker Registry
 * Manages multiple circuit breakers
 */
class CircuitBreakerRegistry {
  constructor() {
    this.breakers = new Map();
  }
  
  /**
   * Get or create circuit breaker
   * @param {string} name - Breaker name
   * @param {Object} config - Breaker configuration
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  get(name, config = {}) {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name);
  }
  
  /**
   * Remove circuit breaker
   * @param {string} name - Breaker name
   */
  remove(name) {
    this.breakers.delete(name);
  }
  
  /**
   * Get all circuit breakers
   * @returns {Map} Map of circuit breakers
   */
  getAll() {
    return this.breakers;
  }
  
  /**
   * Get statistics for all breakers
   * @returns {Object} Statistics object
   */
  getAllStats() {
    const stats = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }
  
  /**
   * Reset all circuit breakers
   */
  resetAll() {
    this.breakers.forEach(breaker => breaker.reset());
  }
}

// Global registry
export const circuitBreakerRegistry = new CircuitBreakerRegistry();

/**
 * Create or get circuit breaker
 * @param {string} name - Breaker name
 * @param {Object} config - Configuration
 * @returns {CircuitBreaker} Circuit breaker instance
 */
export function createCircuitBreaker(name, config = {}) {
  return circuitBreakerRegistry.get(name, config);
}

/**
 * Execute operation with circuit breaker
 * @param {string} name - Breaker name
 * @param {Function} operation - Operation to execute
 * @param {Object} config - Breaker configuration
 * @returns {Promise} Promise that resolves with result
 */
export async function withCircuitBreaker(name, operation, config = {}) {
  const breaker = circuitBreakerRegistry.get(name, config);
  return breaker.execute(operation);
}

export default {
  CircuitBreaker,
  CircuitState,
  circuitBreakerRegistry,
  createCircuitBreaker,
  withCircuitBreaker
};
