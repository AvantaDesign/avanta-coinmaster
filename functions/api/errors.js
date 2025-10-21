/**
 * Error Monitoring API Endpoint
 * 
 * Collects and stores error reports from the frontend.
 * Provides endpoints for:
 * - Tracking errors
 * - Retrieving error statistics
 * - Managing error alerts
 * 
 * Routes:
 *   POST /api/errors - Track error
 *   GET /api/errors/stats - Get error statistics
 *   GET /api/errors/recent - Get recent errors
 */

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// In-memory error storage (in production, use D1 or KV)
const errorStore = {
  errors: [],
  maxSize: 1000
};

/**
 * Handle OPTIONS requests (CORS preflight)
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Handle GET requests - retrieve error data
 */
export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    if (pathname.includes('/stats')) {
      return getErrorStats(context);
    } else if (pathname.includes('/recent')) {
      return getRecentErrors(context);
    } else {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Error monitoring endpoint not found',
        availableEndpoints: [
          '/api/errors/stats',
          '/api/errors/recent'
        ]
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
  } catch (error) {
    await logError(error, { endpoint: 'Error Monitoring GET Error', category: 'api' }, env);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Handle POST requests - track errors
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const errorData = await request.json();

    // Validate error data
    if (!errorData.message && !errorData.error?.message) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'error message is required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Create error entry
    const errorEntry = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: errorData.timestamp || new Date().toISOString(),
      message: errorData.message || errorData.error?.message,
      stack: errorData.stack || errorData.error?.stack,
      name: errorData.name || errorData.error?.name || 'Error',
      context: errorData.context || {},
      url: errorData.url,
      userAgent: errorData.userAgent,
      source: errorData.source || 'frontend'
    };

    // Store error
    storeError(errorEntry);

    // Already tracked - no need to log again

    // In production, store in database:
    // await env.DB.prepare(`
    //   INSERT INTO error_logs (id, timestamp, message, stack, name, context, url, user_agent, source)
    //   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    // `).bind(
    //   errorEntry.id,
    //   errorEntry.timestamp,
    //   errorEntry.message,
    //   errorEntry.stack,
    //   errorEntry.name,
    //   JSON.stringify(errorEntry.context),
    //   errorEntry.url,
    //   errorEntry.userAgent,
    //   errorEntry.source
    // ).run();

    // Check for critical errors and alert if needed
    if (isCriticalError(errorEntry)) {
      await sendAlert(errorEntry, env);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Error tracked successfully',
      errorId: errorEntry.id
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error Monitoring POST Error', category: 'api' }, env);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Store error in memory
 */
function storeError(errorEntry) {
  errorStore.errors.push(errorEntry);

  // Keep only last N errors
  if (errorStore.errors.length > errorStore.maxSize) {
    errorStore.errors.shift();
  }
}

/**
 * Check if error is critical
 */
function isCriticalError(errorEntry) {
  const criticalPatterns = [
    /database/i,
    /connection/i,
    /authentication/i,
    /authorization/i,
    /payment/i,
    /security/i
  ];

  return criticalPatterns.some(pattern => 
    pattern.test(errorEntry.message) || pattern.test(errorEntry.name)
  );
}

/**
 * Send alert for critical errors
 */
async function sendAlert(errorEntry, env) {
  const alertWebhook = env.ERROR_ALERT_WEBHOOK;
  
  if (!alertWebhook) return;

  try {
    await fetch(alertWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🚨 Critical Error Alert',
        message: errorEntry.message,
        error: errorEntry,
        timestamp: errorEntry.timestamp
      })
    });
  } catch (error) {
    await logError(error, { endpoint: 'Failed to send alert', category: 'api' }, env);
  }
}

/**
 * Get error statistics
 */
async function getErrorStats(context) {
  try {
    const stats = {
      totalErrors: errorStore.errors.length,
      errorsByName: {},
      errorsBySource: {},
      errorsByHour: {},
      recentErrors: errorStore.errors.slice(-10).reverse()
    };

    // Count by name
    errorStore.errors.forEach(error => {
      const name = error.name || 'Unknown';
      stats.errorsByName[name] = (stats.errorsByName[name] || 0) + 1;

      const source = error.source || 'unknown';
      stats.errorsBySource[source] = (stats.errorsBySource[source] || 0) + 1;

      const hour = new Date(error.timestamp).getHours();
      stats.errorsByHour[hour] = (stats.errorsByHour[hour] || 0) + 1;
    });

    return new Response(JSON.stringify({
      success: true,
      stats
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error Stats Error', category: 'api' }, env);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Get recent errors
 */
async function getRecentErrors(context) {
  const { request } = context;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const source = url.searchParams.get('source');

  try {
    let errors = [...errorStore.errors];

    // Filter by source if specified
    if (source) {
      errors = errors.filter(e => e.source === source);
    }

    // Get most recent
    errors = errors.slice(-limit).reverse();

    return new Response(JSON.stringify({
      success: true,
      errors,
      count: errors.length
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Recent Errors Error', category: 'api' }, env);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
