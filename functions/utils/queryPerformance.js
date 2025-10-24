/**
 * Query Performance Monitoring Utility
 * Phase 49: Database Optimization & Performance Tuning
 * 
 * Provides comprehensive query performance tracking, slow query detection,
 * and performance metrics collection for database optimization.
 */

/**
 * Query performance thresholds (in milliseconds)
 */
export const PERFORMANCE_THRESHOLDS = {
  FAST: 50,       // Queries under 50ms are fast
  NORMAL: 100,    // Queries 50-100ms are acceptable
  SLOW: 200,      // Queries 100-200ms are slow
  VERY_SLOW: 500, // Queries 200-500ms are very slow
  CRITICAL: 1000  // Queries over 1000ms are critical
};

/**
 * Query performance metrics store
 * In production, this would be sent to a monitoring service
 */
class QueryPerformanceMetrics {
  constructor() {
    this.metrics = [];
    this.slowQueries = [];
    this.queryStats = new Map();
    this.maxMetricsSize = 1000; // Keep last 1000 queries
  }

  /**
   * Record a query execution
   * @param {Object} queryInfo - Query information
   * @param {string} queryInfo.query - SQL query or description
   * @param {number} queryInfo.duration - Duration in milliseconds
   * @param {string} queryInfo.endpoint - API endpoint
   * @param {string} queryInfo.userId - User ID
   * @param {Object} queryInfo.params - Query parameters
   */
  record(queryInfo) {
    const {
      query,
      duration,
      endpoint,
      userId,
      params = {},
      timestamp = new Date().toISOString()
    } = queryInfo;

    const metric = {
      query,
      duration,
      endpoint,
      userId,
      params,
      timestamp,
      severity: this.getSeverity(duration)
    };

    // Add to metrics array
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift(); // Remove oldest
    }

    // Track slow queries
    if (duration > PERFORMANCE_THRESHOLDS.NORMAL) {
      this.slowQueries.push(metric);
      if (this.slowQueries.length > 100) {
        this.slowQueries.shift(); // Keep last 100 slow queries
      }
    }

    // Update query statistics
    const queryKey = this.normalizeQuery(query);
    if (!this.queryStats.has(queryKey)) {
      this.queryStats.set(queryKey, {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
        slowCount: 0
      });
    }

    const stats = this.queryStats.get(queryKey);
    stats.count++;
    stats.totalDuration += duration;
    stats.minDuration = Math.min(stats.minDuration, duration);
    stats.maxDuration = Math.max(stats.maxDuration, duration);
    stats.avgDuration = stats.totalDuration / stats.count;
    if (duration > PERFORMANCE_THRESHOLDS.NORMAL) {
      stats.slowCount++;
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development' && duration > PERFORMANCE_THRESHOLDS.SLOW) {
      console.warn(`[SLOW QUERY] ${duration}ms - ${endpoint} - ${query.substring(0, 100)}...`);
    }

    return metric;
  }

  /**
   * Get severity level for a query duration
   * @param {number} duration - Duration in milliseconds
   * @returns {string} Severity level
   */
  getSeverity(duration) {
    if (duration < PERFORMANCE_THRESHOLDS.FAST) return 'fast';
    if (duration < PERFORMANCE_THRESHOLDS.NORMAL) return 'normal';
    if (duration < PERFORMANCE_THRESHOLDS.SLOW) return 'slow';
    if (duration < PERFORMANCE_THRESHOLDS.VERY_SLOW) return 'very_slow';
    if (duration < PERFORMANCE_THRESHOLDS.CRITICAL) return 'critical';
    return 'extreme';
  }

  /**
   * Normalize query for statistics grouping
   * @param {string} query - SQL query or description
   * @returns {string} Normalized query key
   */
  normalizeQuery(query) {
    // Remove specific values to group similar queries
    return query
      .replace(/['"][^'"]*['"]/g, '?') // Replace string literals
      .replace(/\b\d+\b/g, '?')         // Replace numbers
      .replace(/\s+/g, ' ')             // Normalize whitespace
      .trim();
  }

  /**
   * Get recent metrics
   * @param {number} limit - Number of metrics to return
   * @returns {Array} Recent metrics
   */
  getRecentMetrics(limit = 100) {
    return this.metrics.slice(-limit);
  }

  /**
   * Get slow queries
   * @param {number} limit - Number of queries to return
   * @returns {Array} Slow queries
   */
  getSlowQueries(limit = 50) {
    return this.slowQueries.slice(-limit);
  }

  /**
   * Get query statistics
   * @returns {Array} Query statistics sorted by average duration
   */
  getQueryStats() {
    return Array.from(this.queryStats.entries())
      .map(([query, stats]) => ({ query, ...stats }))
      .sort((a, b) => b.avgDuration - a.avgDuration);
  }

  /**
   * Get performance summary
   * @returns {Object} Performance summary
   */
  getSummary() {
    const total = this.metrics.length;
    if (total === 0) {
      return {
        totalQueries: 0,
        avgDuration: 0,
        slowQueries: 0,
        fastQueries: 0,
        normalQueries: 0,
        criticalQueries: 0
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    return {
      totalQueries: total,
      avgDuration: Math.round(totalDuration / total),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      p50Duration: this.percentile(durations, 0.5),
      p95Duration: this.percentile(durations, 0.95),
      p99Duration: this.percentile(durations, 0.99),
      fastQueries: this.metrics.filter(m => m.severity === 'fast').length,
      normalQueries: this.metrics.filter(m => m.severity === 'normal').length,
      slowQueries: this.metrics.filter(m => m.severity === 'slow').length,
      verySlowQueries: this.metrics.filter(m => m.severity === 'very_slow').length,
      criticalQueries: this.metrics.filter(m => m.severity === 'critical' || m.severity === 'extreme').length
    };
  }

  /**
   * Calculate percentile
   * @param {Array} arr - Array of numbers
   * @param {number} p - Percentile (0-1)
   * @returns {number} Percentile value
   */
  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = [];
    this.slowQueries = [];
    this.queryStats.clear();
  }

  /**
   * Export metrics for analysis
   * @returns {Object} Exportable metrics
   */
  export() {
    return {
      summary: this.getSummary(),
      recentMetrics: this.getRecentMetrics(100),
      slowQueries: this.getSlowQueries(50),
      queryStats: this.getQueryStats()
    };
  }
}

// Global metrics instance
const queryMetrics = new QueryPerformanceMetrics();

/**
 * Measure query performance
 * @param {Function} queryFn - Async function to execute
 * @param {Object} options - Measurement options
 * @param {string} options.query - Query description
 * @param {string} options.endpoint - API endpoint
 * @param {string} options.userId - User ID
 * @param {Object} options.params - Query parameters
 * @returns {Promise} Query result with performance metadata
 */
export async function measureQuery(queryFn, options = {}) {
  const startTime = performance.now();
  
  try {
    const result = await queryFn();
    const duration = Math.round(performance.now() - startTime);
    
    // Record performance metrics
    const metric = queryMetrics.record({
      ...options,
      duration,
      success: true
    });

    return {
      data: result,
      performance: {
        duration,
        severity: metric.severity,
        timestamp: metric.timestamp
      }
    };
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    
    // Record failed query
    queryMetrics.record({
      ...options,
      duration,
      success: false,
      error: error.message
    });

    throw error;
  }
}

/**
 * Get query performance metrics
 * @returns {QueryPerformanceMetrics} Metrics instance
 */
export function getQueryMetrics() {
  return queryMetrics;
}

/**
 * Create a performance monitoring middleware for API endpoints
 * @param {string} endpoint - Endpoint name
 * @returns {Function} Middleware function
 */
export function performanceMonitoringMiddleware(endpoint) {
  return async (request, env, ctx) => {
    const startTime = Date.now();
    
    try {
      // Execute the request
      const response = await ctx.next();
      
      const duration = Date.now() - startTime;
      
      // Record performance
      queryMetrics.record({
        query: `${request.method} ${endpoint}`,
        duration,
        endpoint,
        userId: request.headers.get('X-User-Id') || 'unknown',
        params: {
          method: request.method,
          url: request.url
        }
      });

      // Add performance headers
      response.headers.set('X-Response-Time', `${duration}ms`);
      response.headers.set('X-Performance-Severity', queryMetrics.getSeverity(duration));

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      queryMetrics.record({
        query: `${request.method} ${endpoint}`,
        duration,
        endpoint,
        userId: request.headers.get('X-User-Id') || 'unknown',
        params: {
          method: request.method,
          url: request.url,
          error: error.message
        }
      });

      throw error;
    }
  };
}

/**
 * Database query wrapper with performance monitoring
 * @param {Object} db - Database connection
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @param {Object} options - Monitoring options
 * @returns {Promise} Query result
 */
export async function queryWithMonitoring(db, query, params = [], options = {}) {
  const startTime = performance.now();
  
  try {
    const stmt = db.prepare(query);
    const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
    
    const duration = Math.round(performance.now() - startTime);
    
    // Record performance
    queryMetrics.record({
      query: query.substring(0, 200), // Limit query length
      duration,
      endpoint: options.endpoint || 'database',
      userId: options.userId || 'system',
      params: { paramCount: params.length, rowCount: result.results?.length || 0 }
    });

    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - startTime);
    
    queryMetrics.record({
      query: query.substring(0, 200),
      duration,
      endpoint: options.endpoint || 'database',
      userId: options.userId || 'system',
      params: { error: error.message }
    });

    throw error;
  }
}

export default {
  measureQuery,
  getQueryMetrics,
  performanceMonitoringMiddleware,
  queryWithMonitoring,
  PERFORMANCE_THRESHOLDS
};
