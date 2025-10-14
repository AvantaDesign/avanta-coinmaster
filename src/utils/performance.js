/**
 * Performance Optimization Middleware
 * 
 * Provides caching, compression, and performance optimizations for API endpoints.
 * 
 * Features:
 * - Response caching (in-memory and edge)
 * - Compression (gzip/brotli)
 * - Cache-Control headers
 * - ETag generation
 * - Rate limiting
 * - Request/response logging
 */

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
  // Short-term cache for frequently changing data
  short: {
    maxAge: 60, // 1 minute
    staleWhileRevalidate: 30
  },
  // Medium-term cache for semi-static data
  medium: {
    maxAge: 300, // 5 minutes
    staleWhileRevalidate: 60
  },
  // Long-term cache for static data
  long: {
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 300
  },
  // Very long cache for immutable data
  immutable: {
    maxAge: 31536000, // 1 year
    immutable: true
  }
};

/**
 * Generate ETag from content
 */
function generateETag(content) {
  // Simple hash function for ETag
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `W/"${Math.abs(hash).toString(36)}"`;
}

/**
 * Get cache control header string
 */
function getCacheControlHeader(config) {
  const parts = [];
  
  if (config.maxAge !== undefined) {
    parts.push(`max-age=${config.maxAge}`);
  }
  
  if (config.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${config.staleWhileRevalidate}`);
  }
  
  if (config.immutable) {
    parts.push('immutable');
  }
  
  if (config.public !== false) {
    parts.push('public');
  } else {
    parts.push('private');
  }
  
  return parts.join(', ');
}

/**
 * Add cache headers to response
 */
export function addCacheHeaders(response, cacheType = 'medium') {
  const config = CACHE_CONFIG[cacheType] || CACHE_CONFIG.medium;
  const headers = new Headers(response.headers);
  
  headers.set('Cache-Control', getCacheControlHeader(config));
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Add ETag header to response
 */
export function addETagHeader(response, content) {
  const etag = generateETag(content);
  const headers = new Headers(response.headers);
  
  headers.set('ETag', etag);
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Check if request has matching ETag
 */
export function hasMatchingETag(request, etag) {
  const ifNoneMatch = request.headers.get('If-None-Match');
  return ifNoneMatch === etag;
}

/**
 * Create 304 Not Modified response
 */
export function createNotModifiedResponse(etag) {
  return new Response(null, {
    status: 304,
    headers: {
      'ETag': etag,
      'Cache-Control': getCacheControlHeader(CACHE_CONFIG.medium)
    }
  });
}

/**
 * Compress response body
 */
export async function compressResponse(response) {
  // Cloudflare Workers automatically handles compression
  // This is a placeholder for additional compression logic if needed
  return response;
}

/**
 * Add performance headers
 */
export function addPerformanceHeaders(response, metrics = {}) {
  const headers = new Headers(response.headers);
  
  if (metrics.duration) {
    headers.set('X-Response-Time', `${metrics.duration}ms`);
  }
  
  if (metrics.dbQueryCount) {
    headers.set('X-DB-Queries', metrics.dbQueryCount.toString());
  }
  
  if (metrics.cacheHit !== undefined) {
    headers.set('X-Cache', metrics.cacheHit ? 'HIT' : 'MISS');
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Optimize JSON response
 */
export function optimizeJSON(data) {
  // Remove null values and empty strings
  function removeEmpty(obj) {
    if (Array.isArray(obj)) {
      return obj.map(removeEmpty);
    }
    
    if (obj && typeof obj === 'object') {
      return Object.entries(obj).reduce((acc, [key, value]) => {
        if (value !== null && value !== '') {
          acc[key] = removeEmpty(value);
        }
        return acc;
      }, {});
    }
    
    return obj;
  }
  
  return removeEmpty(data);
}

/**
 * Cache key generator
 */
export function generateCacheKey(request) {
  const url = new URL(request.url);
  const params = new URLSearchParams(url.search);
  
  // Sort params for consistent cache keys
  const sortedParams = Array.from(params.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  return `${url.pathname}?${sortedParams}`;
}

/**
 * Simple in-memory cache (for development)
 */
class SimpleCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  set(key, value, ttl = 300) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl * 1000)
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

// Create cache instance
export const apiCache = new SimpleCache(100);

/**
 * Cached API call wrapper
 */
export async function cachedAPICall(cacheKey, ttl, fetchFn) {
  // Check cache first
  const cached = apiCache.get(cacheKey);
  if (cached) {
    return { data: cached, fromCache: true };
  }
  
  // Fetch fresh data
  const data = await fetchFn();
  
  // Store in cache
  apiCache.set(cacheKey, data, ttl);
  
  return { data, fromCache: false };
}

/**
 * Rate limiter using sliding window
 */
class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  isAllowed(key, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get requests in current window
    const userRequests = this.requests.get(key) || [];
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }

  reset(key) {
    this.requests.delete(key);
  }

  clear() {
    this.requests.clear();
  }
}

// Create rate limiter instance
export const rateLimiter = new RateLimiter();

/**
 * Apply rate limiting
 */
export function applyRateLimit(request, maxRequests = 100, windowMs = 60000) {
  // Use IP or user ID as key
  const ip = request.headers.get('CF-Connecting-IP') || 
             request.headers.get('X-Forwarded-For') || 
             'unknown';
  
  const allowed = rateLimiter.isAllowed(ip, maxRequests, windowMs);
  
  if (!allowed) {
    return new Response(JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': Math.ceil(windowMs / 1000).toString(),
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': (Date.now() + windowMs).toString()
      }
    });
  }
  
  return null; // Allowed
}

/**
 * Measure request duration
 */
export function measureDuration(startTime) {
  return Date.now() - startTime;
}

/**
 * Log request with metrics
 */
export function logRequest(request, response, metrics = {}) {
  const log = {
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    status: response.status,
    duration: metrics.duration,
    userAgent: request.headers.get('User-Agent'),
    ip: request.headers.get('CF-Connecting-IP') || 
        request.headers.get('X-Forwarded-For'),
    cacheHit: metrics.cacheHit,
    dbQueries: metrics.dbQueryCount
  };
  
  console.log('[REQUEST]', JSON.stringify(log));
}

/**
 * Performance monitoring wrapper
 */
export async function withPerformanceMonitoring(requestHandler, context) {
  const startTime = Date.now();
  const metrics = {
    dbQueryCount: 0,
    cacheHit: false
  };
  
  try {
    // Execute request handler
    let response = await requestHandler(context);
    
    // Measure duration
    metrics.duration = measureDuration(startTime);
    
    // Add performance headers
    response = addPerformanceHeaders(response, metrics);
    
    // Log request
    logRequest(context.request, response, metrics);
    
    return response;
  } catch (error) {
    metrics.duration = measureDuration(startTime);
    
    console.error('[REQUEST ERROR]', {
      timestamp: new Date().toISOString(),
      url: context.request.url,
      duration: metrics.duration,
      error: error.message
    });
    
    throw error;
  }
}

/**
 * Batch database queries
 */
export async function batchQueries(db, queries) {
  // Execute queries in parallel
  const results = await Promise.all(
    queries.map(query => 
      db.prepare(query.sql).bind(...(query.params || [])).all()
    )
  );
  
  return results;
}

/**
 * Optimize database query
 */
export function optimizeQuery(query) {
  // Remove unnecessary whitespace
  query = query.replace(/\s+/g, ' ').trim();
  
  // Add query hints if needed
  // This is database-specific optimization
  
  return query;
}

export default {
  CACHE_CONFIG,
  addCacheHeaders,
  addETagHeader,
  hasMatchingETag,
  createNotModifiedResponse,
  compressResponse,
  addPerformanceHeaders,
  optimizeJSON,
  generateCacheKey,
  apiCache,
  cachedAPICall,
  rateLimiter,
  applyRateLimit,
  measureDuration,
  logRequest,
  withPerformanceMonitoring,
  batchQueries,
  optimizeQuery
};
