/**
 * Caching Utilities
 * 
 * Phase 31: Backend Hardening and Security
 * 
 * Provides caching strategies for:
 * - API responses
 * - Database query results
 * - Frequently accessed data
 * 
 * Note: This is an in-memory cache for Cloudflare Workers.
 * For production, consider using Cloudflare KV or Cache API.
 */

import { logDebug } from './logging.js';

/**
 * In-memory cache store
 * In production, replace with Cloudflare KV or Cache API
 */
class InMemoryCacheStore {
  constructor() {
    this.store = new Map();
    this.maxSize = 1000; // Maximum number of cached items
  }
  
  /**
   * Get item from cache
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/not found
   */
  get(key) {
    const item = this.store.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if expired
    if (item.expiresAt && item.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    // Update access time for LRU
    item.lastAccessed = Date.now();
    
    return item.value;
  }
  
  /**
   * Set item in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (default: 300)
   */
  set(key, value, ttlSeconds = 300) {
    // Check if cache is full
    if (this.store.size >= this.maxSize) {
      this.evict();
    }
    
    const expiresAt = ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : null;
    
    this.store.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
      lastAccessed: Date.now()
    });
  }
  
  /**
   * Delete item from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.store.delete(key);
  }
  
  /**
   * Clear all cache
   */
  clear() {
    this.store.clear();
  }
  
  /**
   * Evict least recently used items when cache is full
   */
  evict() {
    // Remove expired items first
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (item.expiresAt && item.expiresAt < now) {
        this.store.delete(key);
      }
    }
    
    // If still full, remove LRU items
    if (this.store.size >= this.maxSize) {
      const entries = Array.from(this.store.entries());
      entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      // Remove oldest 10% of entries
      const toRemove = Math.floor(this.maxSize * 0.1);
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.store.delete(entries[i][0]);
      }
    }
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    
    for (const item of this.store.values()) {
      if (item.expiresAt && item.expiresAt < now) {
        expired++;
      }
    }
    
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      expired,
      active: this.store.size - expired
    };
  }
}

// Global cache instance
const cache = new InMemoryCacheStore();

/**
 * Cache TTL configurations for different data types
 */
export const CacheTTL = {
  SHORT: 60,          // 1 minute - frequently changing data
  MEDIUM: 300,        // 5 minutes - moderately changing data
  LONG: 900,          // 15 minutes - rarely changing data
  VERY_LONG: 3600,    // 1 hour - very stable data
  DASHBOARD: 300,     // 5 minutes - dashboard data
  REPORTS: 600,       // 10 minutes - reports
  REFERENCE: 3600     // 1 hour - reference data (categories, etc.)
};

/**
 * Generate cache key from parameters
 * @param {string} prefix - Key prefix (e.g., 'transactions', 'dashboard')
 * @param {Object} params - Parameters to include in key
 * @returns {string} Cache key
 */
export function generateCacheKey(prefix, params = {}) {
  const sortedParams = Object.keys(params).sort().map(key => `${key}:${params[key]}`).join('|');
  return `${prefix}:${sortedParams}`;
}

/**
 * Get item from cache
 * @param {string} key - Cache key
 * @param {Object} env - Environment bindings
 * @returns {Promise<any|null>} Cached value or null
 */
export async function getFromCache(key, env = null) {
  try {
    // Phase 32: Try Cloudflare KV first (if available)
    if (env && env.CACHE_KV) {
      try {
        const value = await env.CACHE_KV.get(key);
        if (value !== null) {
          logDebug('KV cache hit', { key }, env);
          return JSON.parse(value);
        }
      } catch (kvError) {
        console.error('KV cache get error:', kvError);
        // Fall through to in-memory cache
      }
    }
    
    // Try in-memory cache as fallback
    const value = cache.get(key);
    
    if (value !== null) {
      logDebug('Memory cache hit', { key }, env);
      return value;
    }
    
    logDebug('Cache miss', { key }, env);
    return null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set item in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttlSeconds - Time to live in seconds
 * @param {Object} env - Environment bindings
 */
export async function setInCache(key, value, ttlSeconds = CacheTTL.MEDIUM, env = null) {
  try {
    // Phase 32: Use Cloudflare KV if available
    if (env && env.CACHE_KV) {
      try {
        await env.CACHE_KV.put(key, JSON.stringify(value), {
          expirationTtl: ttlSeconds
        });
        logDebug('KV cache set', { key, ttl: ttlSeconds }, env);
        return;
      } catch (kvError) {
        console.error('KV cache set error:', kvError);
        // Fall through to in-memory cache
      }
    }
    
    // Use in-memory cache as fallback
    cache.set(key, value, ttlSeconds);
    logDebug('Memory cache set', { key, ttl: ttlSeconds }, env);
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Delete item from cache
 * @param {string} key - Cache key
 * @param {Object} env - Environment bindings
 */
export async function deleteFromCache(key, env = null) {
  try {
    // Phase 32: Delete from KV if available
    if (env && env.CACHE_KV) {
      try {
        await env.CACHE_KV.delete(key);
      } catch (kvError) {
        console.error('KV cache delete error:', kvError);
      }
    }
    
    // Also delete from in-memory cache
    cache.delete(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
}

/**
 * Clear all cache
 * Note: KV namespace cannot be cleared entirely via API
 * @param {Object} env - Environment bindings
 */
export async function clearCache(env = null) {
  try {
    // Clear in-memory cache
    cache.clear();
    
    // Note: Cloudflare KV doesn't support clearing all keys
    // In production, implement key prefix-based deletion if needed
    if (env && env.CACHE_KV) {
      console.log('KV cache cannot be cleared entirely. Use key prefixes for targeted deletion.');
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Invalidate cache by prefix
 * @param {string} prefix - Key prefix to invalidate
 */
export async function invalidateCacheByPrefix(prefix) {
  try {
    for (const key of cache.store.keys()) {
      if (key.startsWith(prefix + ':')) {
        cache.delete(key);
      }
    }
  } catch (error) {
    console.error('Cache invalidate error:', error);
  }
}

/**
 * Cache wrapper for function results
 * @param {string} key - Cache key
 * @param {Function} fn - Function to execute if cache miss
 * @param {number} ttlSeconds - Cache TTL
 * @param {Object} env - Environment bindings
 * @returns {Promise<any>} Result (from cache or function)
 */
export async function cacheWrapper(key, fn, ttlSeconds = CacheTTL.MEDIUM, env = null) {
  // Try to get from cache
  const cached = await getFromCache(key, env);
  if (cached !== null) {
    return cached;
  }
  
  // Execute function
  const result = await fn();
  
  // Cache result
  await setInCache(key, result, ttlSeconds, env);
  
  return result;
}

/**
 * Cache middleware for API responses
 * @param {Object} options - Cache options
 * @returns {Function} Middleware function
 */
export function cacheMiddleware(options = {}) {
  const {
    ttl = CacheTTL.MEDIUM,
    keyPrefix = 'api',
    enabled = true
  } = options;
  
  return async (context, next) => {
    const { request, env } = context;
    
    // Skip caching if disabled or not GET request
    if (!enabled || request.method !== 'GET') {
      return next();
    }
    
    // Generate cache key from URL and user
    const url = new URL(request.url);
    const cacheKey = generateCacheKey(keyPrefix, {
      path: url.pathname,
      search: url.search,
      userId: context.userId || 'anonymous'
    });
    
    // Try to get from cache
    const cached = await getFromCache(cacheKey, env);
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'Cache-Control': `max-age=${ttl}`
        }
      });
    }
    
    // Execute handler
    const response = await next();
    
    // Cache successful responses
    if (response.ok) {
      try {
        const data = await response.clone().json();
        await setInCache(cacheKey, data, ttl, env);
      } catch (error) {
        // Response not JSON, skip caching
      }
    }
    
    // Add cache header
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-Cache', 'MISS');
    return newResponse;
  };
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export function getCacheStats() {
  return cache.getStats();
}

/**
 * Cached database query wrapper
 * @param {string} cacheKey - Cache key
 * @param {Object} db - D1 database binding
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @param {number} ttl - Cache TTL
 * @param {Object} env - Environment bindings
 * @returns {Promise<any>} Query result
 */
export async function cachedQuery(cacheKey, db, query, params = [], ttl = CacheTTL.MEDIUM, env = null) {
  return cacheWrapper(
    cacheKey,
    async () => {
      const result = await db.prepare(query).bind(...params).all();
      return result.results;
    },
    ttl,
    env
  );
}

/**
 * Cache invalidation patterns for different operations
 */
export const CacheInvalidation = {
  /**
   * Invalidate transaction caches when transactions change
   * @param {string} userId - User ID
   */
  async transactions(userId) {
    await invalidateCacheByPrefix(`transactions:userId:${userId}`);
    await invalidateCacheByPrefix(`dashboard:userId:${userId}`);
    await invalidateCacheByPrefix(`reports:userId:${userId}`);
  },
  
  /**
   * Invalidate account caches when accounts change
   * @param {string} userId - User ID
   */
  async accounts(userId) {
    await invalidateCacheByPrefix(`accounts:userId:${userId}`);
    await invalidateCacheByPrefix(`dashboard:userId:${userId}`);
  },
  
  /**
   * Invalidate all user caches
   * @param {string} userId - User ID
   */
  async user(userId) {
    await invalidateCacheByPrefix(`userId:${userId}`);
  },
  
  /**
   * Invalidate specific resource cache
   * @param {string} resource - Resource type
   * @param {string} id - Resource ID
   */
  async resource(resource, id) {
    await invalidateCacheByPrefix(`${resource}:id:${id}`);
  }
};

/**
 * Preload cache with frequently accessed data
 * @param {string} userId - User ID
 * @param {Object} env - Environment bindings
 */
export async function preloadCache(userId, env) {
  try {
    // Preload accounts
    const accountsKey = generateCacheKey('accounts', { userId });
    const accounts = await env.DB.prepare(
      'SELECT * FROM accounts WHERE user_id = ? AND is_active = 1'
    ).bind(userId).all();
    await setInCache(accountsKey, accounts.results, CacheTTL.REFERENCE, env);
    
    // Preload categories
    const categoriesKey = generateCacheKey('categories', { userId });
    const categories = await env.DB.prepare(
      'SELECT * FROM categories WHERE user_id = ? AND is_active = 1'
    ).bind(userId).all();
    await setInCache(categoriesKey, categories.results, CacheTTL.REFERENCE, env);
    
    logDebug('Cache preloaded', { userId }, env);
  } catch (error) {
    console.error('Cache preload error:', error);
  }
}
