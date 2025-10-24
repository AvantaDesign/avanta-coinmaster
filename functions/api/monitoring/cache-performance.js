/**
 * Cache Performance Dashboard API Endpoint
 * Phase 49: Database Optimization & Performance Tuning
 * 
 * GET /api/monitoring/cache-performance
 * - Get comprehensive cache performance metrics
 * - Cache hit/miss rates
 * - Cache efficiency analysis
 * - Performance recommendations
 * 
 * POST /api/monitoring/cache-performance/warm
 * - Manually warm cache with common data
 * 
 * DELETE /api/monitoring/cache-performance
 * - Clear all cache (admin only)
 */

import { corsHeaders } from '../../utils/cors.js';
import { logInfo, logError } from '../../utils/logging.js';
import { getUserIdFromToken } from '../../utils/auth.js';

// Import cache utilities - note: cacheStats is module-level
let cacheStats;
try {
  const cacheModule = await import('../../utils/cache.js');
  cacheStats = cacheModule.cacheStats || { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 };
} catch (error) {
  console.error('Failed to import cache module:', error);
  cacheStats = { hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 };
}

/**
 * Main handler
 */
export async function onRequest(context) {
  const { request, env } = context;
  
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Route to appropriate handler based on method
    if (request.method === 'GET') {
      return await handleGetCachePerformance(context, userId);
    } else if (request.method === 'POST') {
      return await handleWarmCache(context, userId);
    } else if (request.method === 'DELETE') {
      // Admin only for cache clearing
      const userStmt = env.DB.prepare('SELECT role FROM users WHERE id = ?');
      const user = await userStmt.bind(userId).first();
      
      if (!user || user.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      return await handleClearCache(context, userId);
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError('Cache performance monitoring error', error, env);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Get cache performance metrics
 */
async function handleGetCachePerformance(context, userId) {
  const { env } = context;
  const startTime = Date.now();

  try {
    // Calculate cache statistics
    const totalRequests = (cacheStats?.hits || 0) + (cacheStats?.misses || 0);
    const hitRate = totalRequests > 0 ? (cacheStats?.hits || 0) / totalRequests : 0;
    const missRate = 1 - hitRate;

    // Estimate performance impact
    const avgCacheHitTime = 5; // ms - typical cache hit time
    const avgCacheMissTime = 200; // ms - typical database query time
    const timeSaved = (cacheStats?.hits || 0) * (avgCacheMissTime - avgCacheHitTime);
    const avgResponseTime = totalRequests > 0 
      ? ((cacheStats?.hits || 0) * avgCacheHitTime + (cacheStats?.misses || 0) * avgCacheMissTime) / totalRequests 
      : 0;

    // Build metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      cache: {
        hits: cacheStats?.hits || 0,
        misses: cacheStats?.misses || 0,
        sets: cacheStats?.sets || 0,
        deletes: cacheStats?.deletes || 0,
        errors: cacheStats?.errors || 0,
        totalRequests
      },
      performance: {
        hitRate: Math.round(hitRate * 100),
        missRate: Math.round(missRate * 100),
        hitRatePercentage: `${Math.round(hitRate * 100)}%`,
        avgResponseTime: Math.round(avgResponseTime),
        timeSavedMs: Math.round(timeSaved),
        timeSavedSeconds: Math.round(timeSaved / 1000),
        efficiency: hitRate > 0.8 ? 'excellent' : hitRate > 0.6 ? 'good' : hitRate > 0.4 ? 'fair' : 'poor'
      },
      trends: {
        cacheUtilization: totalRequests > 0 ? 'active' : 'idle',
        cacheEffectiveness: hitRate > 0.8 ? 'high' : hitRate > 0.5 ? 'medium' : 'low'
      },
      recommendations: generateCacheRecommendations(hitRate, cacheStats),
      responseTime: Date.now() - startTime
    };

    logInfo('Cache performance metrics retrieved', { userId }, env);

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });

  } catch (error) {
    logError('Failed to get cache performance metrics', error, env);
    throw error;
  }
}

/**
 * Warm cache with common data
 */
async function handleWarmCache(context, userId) {
  const { env } = context;

  try {
    const { generateCacheKey, setInCache, CacheTTL } = await import('../../utils/cache.js');

    // Pre-cache user categories
    const categoriesStmt = env.DB.prepare(
      'SELECT * FROM categories WHERE user_id = ? AND is_active = 1 ORDER BY name'
    );
    const categories = await categoriesStmt.bind(userId).all();
    
    const categoriesCacheKey = generateCacheKey('categories', { userId });
    await setInCache(categoriesCacheKey, categories.results || [], CacheTTL.REFERENCE, env);

    // Pre-cache user accounts
    const accountsStmt = env.DB.prepare(
      'SELECT * FROM accounts WHERE user_id = ? AND is_active = 1 ORDER BY name'
    );
    const accounts = await accountsStmt.bind(userId).all();
    
    const accountsCacheKey = generateCacheKey('accounts', { userId });
    await setInCache(accountsCacheKey, accounts.results || [], CacheTTL.REFERENCE, env);

    logInfo('Cache warmed successfully', { userId, itemsCached: 2 }, env);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Cache warmed successfully',
      itemsCached: ['categories', 'accounts']
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError('Failed to warm cache', error, env);
    throw error;
  }
}

/**
 * Clear all cache (admin only)
 */
async function handleClearCache(context, userId) {
  const { env } = context;

  try {
    const { clearCache } = await import('../../utils/cache.js');
    
    await clearCache(env);

    logInfo('Cache cleared by admin', { userId }, env);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Cache cleared successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError('Failed to clear cache', error, env);
    throw error;
  }
}

/**
 * Generate cache performance recommendations
 */
function generateCacheRecommendations(hitRate, stats) {
  const recommendations = [];

  // Check cache hit rate
  if (hitRate < 0.5) {
    recommendations.push({
      severity: 'high',
      category: 'cache-efficiency',
      message: `Cache hit rate is low (${Math.round(hitRate * 100)}%)`,
      action: 'Review cache TTL settings and implement cache warming strategies'
    });
  } else if (hitRate < 0.7) {
    recommendations.push({
      severity: 'medium',
      category: 'cache-efficiency',
      message: `Cache hit rate could be improved (${Math.round(hitRate * 100)}%)`,
      action: 'Consider increasing cache TTL for stable data'
    });
  }

  // Check for cache errors
  if ((stats?.errors || 0) > 0) {
    recommendations.push({
      severity: 'medium',
      category: 'cache-reliability',
      message: `${stats.errors} cache errors detected`,
      action: 'Review cache error logs and fix underlying issues'
    });
  }

  // Check cache utilization
  const totalRequests = (stats?.hits || 0) + (stats?.misses || 0);
  if (totalRequests === 0) {
    recommendations.push({
      severity: 'info',
      category: 'cache-usage',
      message: 'Cache is not being utilized',
      action: 'Ensure caching is enabled for frequently accessed data'
    });
  }

  // Success message if everything is good
  if (recommendations.length === 0 && hitRate >= 0.8) {
    recommendations.push({
      severity: 'info',
      category: 'cache-performance',
      message: `Excellent cache performance (${Math.round(hitRate * 100)}% hit rate)`,
      action: 'Continue monitoring for regressions'
    });
  }

  return recommendations;
}
