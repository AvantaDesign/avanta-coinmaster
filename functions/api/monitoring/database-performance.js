/**
 * Database Performance Monitoring API Endpoint
 * Phase 49: Database Optimization & Performance Tuning
 * 
 * GET /api/monitoring/database-performance
 * - Get comprehensive database performance metrics
 * - Query performance statistics
 * - Slow query analysis
 * - Index usage statistics
 * 
 * POST /api/monitoring/database-performance/reset
 * - Reset performance metrics
 */

import { getUserIdFromToken } from '../auth.js';
import { getSecurityHeaders } from '../../utils/security.js';
import { logInfo, logError } from '../../utils/logging.js';
import { getQueryMetrics } from '../../utils/queryPerformance.js';

// CORS headers
const corsHeaders = {
  ...getSecurityHeaders(),
  'Cache-Control': 'no-cache, no-store, must-revalidate',
};

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

    // Verify admin role
    const userStmt = env.DB.prepare('SELECT role FROM users WHERE id = ?');
    const user = await userStmt.bind(userId).first();
    
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Route to appropriate handler
    if (request.method === 'GET') {
      return await handleGetPerformanceMetrics(context, userId);
    } else if (request.method === 'POST') {
      return await handleResetMetrics(context, userId);
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError('Database performance monitoring error', error, env);
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
 * Get comprehensive performance metrics
 */
async function handleGetPerformanceMetrics(context, userId) {
  const { env } = context;
  const startTime = Date.now();

  try {
    const queryMetrics = getQueryMetrics();
    const db = env.DB;

    // Get database statistics
    const tableCount = await db.prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type="table"').first();
    const indexCount = await db.prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type="index"').first();
    const viewCount = await db.prepare('SELECT COUNT(*) as count FROM sqlite_master WHERE type="view"').first();

    // Get table sizes (approximate)
    const tableSizes = await db.prepare(`
      SELECT 
        name,
        (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND tbl_name=m.name) as index_count
      FROM sqlite_master m
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all();

    // Get index information
    const indexes = await db.prepare(`
      SELECT 
        name,
        tbl_name,
        sql
      FROM sqlite_master
      WHERE type='index' AND name LIKE 'idx_%'
      ORDER BY tbl_name, name
    `).all();

    // Analyze index usage from query patterns
    const indexAnalysis = analyzeIndexUsage(indexes.results || []);

    // Build comprehensive metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      database: {
        tables: tableCount?.count || 0,
        indexes: indexCount?.count || 0,
        views: viewCount?.count || 0,
        customIndexes: (indexes.results || []).length
      },
      queryPerformance: queryMetrics.getSummary(),
      slowQueries: queryMetrics.getSlowQueries(20),
      queryStats: queryMetrics.getQueryStats().slice(0, 20),
      tableStats: {
        total: (tableSizes.results || []).length,
        tables: (tableSizes.results || []).map(t => ({
          name: t.name,
          indexCount: t.index_count
        }))
      },
      indexAnalysis,
      recommendations: generateRecommendations(queryMetrics, tableSizes.results || []),
      responseTime: Date.now() - startTime
    };

    logInfo('Database performance metrics retrieved', { userId }, env);

    return new Response(JSON.stringify(metrics), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    });

  } catch (error) {
    logError('Failed to get performance metrics', error, env);
    throw error;
  }
}

/**
 * Reset performance metrics
 */
async function handleResetMetrics(context, userId) {
  const { env } = context;

  try {
    const queryMetrics = getQueryMetrics();
    queryMetrics.reset();

    logInfo('Database performance metrics reset', { userId }, env);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Performance metrics reset successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError('Failed to reset metrics', error, env);
    throw error;
  }
}

/**
 * Analyze index usage patterns
 */
function analyzeIndexUsage(indexes) {
  const byTable = {};
  
  for (const index of indexes) {
    if (!byTable[index.tbl_name]) {
      byTable[index.tbl_name] = [];
    }
    byTable[index.tbl_name].push({
      name: index.name,
      sql: index.sql
    });
  }

  return {
    byTable,
    totalIndexes: indexes.length,
    tablesWithIndexes: Object.keys(byTable).length
  };
}

/**
 * Generate performance recommendations
 */
function generateRecommendations(queryMetrics, tables) {
  const recommendations = [];
  const summary = queryMetrics.getSummary();
  const slowQueries = queryMetrics.getSlowQueries(10);

  // Check for slow queries
  if (summary.criticalQueries > 0) {
    recommendations.push({
      severity: 'high',
      category: 'performance',
      message: `${summary.criticalQueries} queries are critically slow (>500ms)`,
      action: 'Review slow queries and add appropriate indexes'
    });
  }

  if (summary.slowQueries > summary.totalQueries * 0.1) {
    recommendations.push({
      severity: 'medium',
      category: 'performance',
      message: `${Math.round((summary.slowQueries / summary.totalQueries) * 100)}% of queries are slow`,
      action: 'Consider adding composite indexes for common query patterns'
    });
  }

  // Check for tables without indexes
  const tablesWithoutIndexes = tables.filter(t => t.index_count === 0);
  if (tablesWithoutIndexes.length > 0) {
    recommendations.push({
      severity: 'medium',
      category: 'indexing',
      message: `${tablesWithoutIndexes.length} tables have no indexes`,
      action: 'Add indexes to: ' + tablesWithoutIndexes.map(t => t.name).join(', ')
    });
  }

  // Check average query time
  if (summary.avgDuration > 100) {
    recommendations.push({
      severity: 'medium',
      category: 'performance',
      message: `Average query time (${summary.avgDuration}ms) exceeds target (100ms)`,
      action: 'Review and optimize slow query patterns'
    });
  }

  // Check P95 latency
  if (summary.p95Duration > 200) {
    recommendations.push({
      severity: 'medium',
      category: 'performance',
      message: `P95 query latency (${summary.p95Duration}ms) is high`,
      action: 'Optimize top 5% slowest queries'
    });
  }

  // Success message if everything is good
  if (recommendations.length === 0) {
    recommendations.push({
      severity: 'info',
      category: 'performance',
      message: 'Database performance is excellent',
      action: 'Continue monitoring for regressions'
    });
  }

  return recommendations;
}
