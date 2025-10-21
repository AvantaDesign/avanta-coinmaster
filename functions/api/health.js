/**
 * Health Check API
 * 
 * Phase 31: Backend Hardening and Security
 * 
 * Provides system health status and monitoring endpoints
 */

import { getSecurityHeaders } from '../utils/security.js';
import { logInfo } from '../utils/logging.js';

/**
 * GET /api/health
 * Basic health check endpoint
 */
export async function onRequestGet(context) {
  const { env } = context;
  
  const corsHeaders = getSecurityHeaders();
  
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT || 'unknown',
      version: env.APP_VERSION || '1.0.0',
      checks: {}
    };
    
    // Check database connectivity
    try {
      if (env.DB) {
        const result = await env.DB.prepare('SELECT 1 as health').first();
        health.checks.database = result?.health === 1 ? 'healthy' : 'unhealthy';
      } else {
        health.checks.database = 'not_configured';
      }
    } catch (error) {
      await logError(error, { endpoint: 'Database health check failed', category: 'api' }, env);
      health.checks.database = 'unhealthy';
      health.status = 'degraded';
    }
    
    // Check R2 storage (if configured)
    try {
      if (env.RECEIPTS) {
        health.checks.storage = 'healthy';
      } else {
        health.checks.storage = 'not_configured';
      }
    } catch (error) {
      await logError(error, { endpoint: 'Storage health check failed', category: 'api' }, env);
      health.checks.storage = 'unhealthy';
      health.status = 'degraded';
    }
    
    // Log health check (for monitoring)
    logInfo('Health check', {
      status: health.status,
      checks: health.checks
    });
    
    // Return appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    return new Response(JSON.stringify(health), {
      status: statusCode,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Health check error', category: 'api' }, env);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }), {
      status: 503,
      headers: corsHeaders
    });
  }
}

/**
 * GET /api/health/ready
 * Readiness check - is the service ready to handle requests
 */
export async function onRequestReadiness(context) {
  const { env } = context;
  
  try {
    // Check critical dependencies
    const isReady = env.DB !== undefined;
    
    const response = {
      ready: isReady,
      timestamp: new Date().toISOString()
    };
    
    return new Response(JSON.stringify(response), {
      status: isReady ? 200 : 503,
      headers: getSecurityHeaders()
    });
  } catch (error) {
    return new Response(JSON.stringify({
      ready: false,
      timestamp: new Date().toISOString(),
      error: error.message
    }), {
      status: 503,
      headers: getSecurityHeaders()
    });
  }
}

/**
 * GET /api/health/live
 * Liveness check - is the service alive
 */
export async function onRequestLiveness(context) {
  return new Response(JSON.stringify({
    alive: true,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: getSecurityHeaders()
  });
}

/**
 * OPTIONS /api/health
 * CORS preflight
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
