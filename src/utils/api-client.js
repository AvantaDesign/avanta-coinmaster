/**
 * Enhanced API Client with Resilience
 * 
 * Phase 45: Comprehensive Error Handling & Resilience
 * 
 * Provides a resilient API client with:
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 * - Timeout management
 * - Request/response interceptors
 * - Error handling and recovery
 * 
 * Usage:
 *   import apiClient from './api-client';
 *   
 *   const data = await apiClient.get('/api/transactions');
 *   const result = await apiClient.post('/api/transactions', { data });
 */

import { retry, RetryPolicies } from './retry-utils';
import { createCircuitBreaker } from './circuit-breaker';
import { logger } from './errorMonitoring';
import { authFetch, getAuthHeaders } from './auth';

/**
 * API Client configuration
 */
const DEFAULT_CONFIG = {
  baseURL: '/api',
  timeout: 30000,
  retryPolicy: RetryPolicies.STANDARD,
  useCircuitBreaker: true,
  circuitBreakerConfig: {
    failureThreshold: 5,
    timeout: 60000
  }
};

/**
 * Create API error from response
 * @param {Response} response - Fetch response
 * @param {Object} data - Response data
 * @returns {Error} API error
 */
async function createApiError(response, data = null) {
  const error = new Error(data?.message || `API error: ${response.status} ${response.statusText}`);
  error.name = 'ApiError';
  error.response = response;
  error.status = response.status;
  error.statusText = response.statusText;
  error.data = data;
  error.code = data?.code || 'API_ERROR';
  error.retryable = data?.retryable ?? false;
  error.recoverable = data?.recoverable ?? true;
  
  return error;
}

/**
 * Enhanced API Client class
 */
class ApiClient {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.interceptors = {
      request: [],
      response: [],
      error: []
    };
    
    // Initialize circuit breakers for different endpoints
    this.circuitBreakers = new Map();
  }
  
  /**
   * Get or create circuit breaker for endpoint
   * @param {string} endpoint - API endpoint
   * @returns {CircuitBreaker} Circuit breaker instance
   */
  getCircuitBreaker(endpoint) {
    if (!this.config.useCircuitBreaker) {
      return null;
    }
    
    // Use base endpoint (e.g., /api/transactions instead of /api/transactions/123)
    const baseEndpoint = endpoint.split('/').slice(0, 3).join('/');
    
    if (!this.circuitBreakers.has(baseEndpoint)) {
      const breaker = createCircuitBreaker(
        `api-${baseEndpoint}`,
        this.config.circuitBreakerConfig
      );
      this.circuitBreakers.set(baseEndpoint, breaker);
    }
    
    return this.circuitBreakers.get(baseEndpoint);
  }
  
  /**
   * Add request interceptor
   * @param {Function} interceptor - Interceptor function
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }
  
  /**
   * Add response interceptor
   * @param {Function} interceptor - Interceptor function
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }
  
  /**
   * Add error interceptor
   * @param {Function} interceptor - Interceptor function
   */
  addErrorInterceptor(interceptor) {
    this.interceptors.error.push(interceptor);
  }
  
  /**
   * Apply request interceptors
   * @param {Object} config - Request configuration
   * @returns {Object} Modified configuration
   */
  async applyRequestInterceptors(config) {
    let modifiedConfig = { ...config };
    
    for (const interceptor of this.interceptors.request) {
      modifiedConfig = await interceptor(modifiedConfig);
    }
    
    return modifiedConfig;
  }
  
  /**
   * Apply response interceptors
   * @param {Response} response - Response object
   * @returns {Response} Modified response
   */
  async applyResponseInterceptors(response) {
    let modifiedResponse = response;
    
    for (const interceptor of this.interceptors.response) {
      modifiedResponse = await interceptor(modifiedResponse);
    }
    
    return modifiedResponse;
  }
  
  /**
   * Apply error interceptors
   * @param {Error} error - Error object
   * @returns {Error} Modified error
   */
  async applyErrorInterceptors(error) {
    let modifiedError = error;
    
    for (const interceptor of this.interceptors.error) {
      modifiedError = await interceptor(modifiedError);
    }
    
    return modifiedError;
  }
  
  /**
   * Make HTTP request with resilience
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise} Promise that resolves with response data
   */
  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.config.baseURL}${endpoint}`;
    
    // Apply request interceptors
    const config = await this.applyRequestInterceptors({
      url,
      ...options
    });
    
    // Create fetch operation
    const fetchOperation = async () => {
      const startTime = Date.now();
      
      logger.debug('API request', {
        method: config.method || 'GET',
        url: config.url
      });
      
      try {
        // Make request with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
        
        const response = await authFetch(config.url, {
          ...config,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const duration = Date.now() - startTime;
        
        logger.debug('API response', {
          method: config.method || 'GET',
          url: config.url,
          status: response.status,
          duration
        });
        
        // Apply response interceptors
        const interceptedResponse = await this.applyResponseInterceptors(response);
        
        // Parse response
        let data = null;
        const contentType = interceptedResponse.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await interceptedResponse.json();
        } else {
          data = await interceptedResponse.text();
        }
        
        // Check for error response
        if (!interceptedResponse.ok) {
          throw await createApiError(interceptedResponse, data);
        }
        
        return data;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error('API request failed', error, {
          method: config.method || 'GET',
          url: config.url,
          duration
        });
        
        // Apply error interceptors
        throw await this.applyErrorInterceptors(error);
      }
    };
    
    // Execute with circuit breaker if enabled
    const breaker = this.getCircuitBreaker(endpoint);
    const operation = breaker
      ? () => breaker.execute(fetchOperation)
      : fetchOperation;
    
    // Execute with retry
    try {
      return await retry(operation, this.config.retryPolicy);
    } catch (error) {
      // Log final error
      logger.error('API request failed after retries', error, {
        endpoint,
        method: options.method || 'GET'
      });
      
      throw error;
    }
  }
  
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} Promise that resolves with response data
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'GET'
    });
  }
  
  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise} Promise that resolves with response data
   */
  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers || {})
      },
      body: JSON.stringify(data)
    });
  }
  
  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise} Promise that resolves with response data
   */
  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers || {})
      },
      body: JSON.stringify(data)
    });
  }
  
  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @param {Object} options - Request options
   * @returns {Promise} Promise that resolves with response data
   */
  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...(options.headers || {})
      },
      body: JSON.stringify(data)
    });
  }
  
  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise} Promise that resolves with response data
   */
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {})
      }
    });
  }
  
  /**
   * Get circuit breaker stats
   * @returns {Object} Circuit breaker statistics
   */
  getCircuitBreakerStats() {
    const stats = {};
    this.circuitBreakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }
  
  /**
   * Reset all circuit breakers
   */
  resetCircuitBreakers() {
    this.circuitBreakers.forEach(breaker => breaker.reset());
  }
}

// Create default instance
const apiClient = new ApiClient();

// Add default error interceptor for authentication errors
apiClient.addErrorInterceptor(async (error) => {
  if (error.status === 401) {
    logger.warn('Authentication error, redirecting to login');
    // Let auth system handle redirect
  }
  return error;
});

export { ApiClient };
export default apiClient;
