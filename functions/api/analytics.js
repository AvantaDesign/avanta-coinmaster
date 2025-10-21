/**
 * Analytics API Endpoint
 * Phase 30: No monetary data handling required - tracks events and user metrics only
 * Phase 41: Authentication hardening - Added getUserIdFromToken for all endpoints
 * Phase 42: Structured logging implementation
 * 
 * Collects and stores custom analytics events from the frontend.
 * Provides endpoints for:
 * - Tracking custom events
 * - Retrieving analytics data
 * - Generating analytics reports
 * 
 * Routes:
 *   POST /api/analytics - Track custom event
 *   GET /api/analytics/stats - Get analytics statistics
 *   GET /api/analytics/events - Get recent events
 */

import { getUserIdFromToken } from './auth.js';
import { logInfo, logError, logBusinessEvent, getCorrelationId } from '../utils/logging.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
 * Handle GET requests - retrieve analytics data
 */
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Phase 41: Authentication check
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Route to appropriate handler
    if (pathname.includes('/stats')) {
      return getAnalyticsStats(context);
    } else if (pathname.includes('/events')) {
      return getAnalyticsEvents(context);
    } else {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Analytics endpoint not found',
        availableEndpoints: [
          '/api/analytics/stats',
          '/api/analytics/events'
        ]
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
  } catch (error) {
    await logError(error, {
      endpoint: '/api/analytics',
      method: 'GET',
      correlationId: getCorrelationId(request),
      category: 'api'
    }, env);
    
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
 * Handle POST requests - track events
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Phase 41: Authentication check
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        message: 'Valid authentication token required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const eventData = await request.json();

    // Validate event data
    if (!eventData.event) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'event field is required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Extract relevant data
    const event = {
      event_name: eventData.event,
      user_id: userId, // Phase 41: Associate event with user
      properties: JSON.stringify(eventData.properties || {}),
      timestamp: eventData.properties?.timestamp || new Date().toISOString(),
      url: eventData.properties?.url || null,
      user_agent: eventData.properties?.userAgent || null,
      screen_resolution: eventData.properties?.screenResolution || null,
      viewport: eventData.properties?.viewport || null
    };

    // Log the analytics event
    logBusinessEvent('analytics_event_tracked', {
      eventName: event.event_name,
      userId,
      correlationId: getCorrelationId(request),
      endpoint: '/api/analytics'
    }, env);

    // In production, store in database:
    // await env.DB.prepare(`
    //   INSERT INTO analytics_events (event_name, user_id, properties, timestamp, url, user_agent)
    //   VALUES (?, ?, ?, ?, ?, ?)
    // `).bind(event.event_name, event.user_id, event.properties, event.timestamp, event.url, event.user_agent).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Event tracked successfully',
      event: eventData.event
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, {
      endpoint: '/api/analytics',
      method: 'POST',
      correlationId: getCorrelationId(request),
      category: 'api'
    }, env);
    
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
 * Get analytics statistics
 */
async function getAnalyticsStats(context) {
  const { env } = context;

  try {
    // In production, query from database
    // For now, return mock stats
    const stats = {
      totalEvents: 0,
      eventsByType: {},
      topPages: [],
      userMetrics: {
        totalUsers: 0,
        activeSessions: 0,
        avgSessionDuration: 0
      },
      performanceMetrics: {
        avgPageLoadTime: 0,
        avgApiResponseTime: 0
      }
    };

    return new Response(JSON.stringify({
      success: true,
      stats
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, {
      endpoint: '/api/analytics/stats',
      method: 'GET',
      category: 'api'
    }, env);
    
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
 * Get recent analytics events
 */
async function getAnalyticsEvents(context) {
  const { request } = context;
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const eventType = url.searchParams.get('type');

  try {
    // In production, query from database
    // For now, return empty array
    const events = [];

    return new Response(JSON.stringify({
      success: true,
      events,
      count: events.length
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, {
      endpoint: '/api/analytics/events',
      method: 'GET',
      category: 'api'
    }, env);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
