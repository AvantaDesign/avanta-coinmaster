/**
 * Analytics API Endpoint
 * Phase 30: No monetary data handling required - tracks events and user metrics only
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

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
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
    console.error('Analytics GET Error:', error);
    
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
      properties: JSON.stringify(eventData.properties || {}),
      timestamp: eventData.properties?.timestamp || new Date().toISOString(),
      url: eventData.properties?.url || null,
      user_agent: eventData.properties?.userAgent || null,
      screen_resolution: eventData.properties?.screenResolution || null,
      viewport: eventData.properties?.viewport || null
    };

    // For now, just log the event (in production, store in D1 or KV)
    console.log('Analytics Event:', JSON.stringify(event, null, 2));

    // In production, store in database:
    // await env.DB.prepare(`
    //   INSERT INTO analytics_events (event_name, properties, timestamp, url, user_agent)
    //   VALUES (?, ?, ?, ?, ?)
    // `).bind(event.event_name, event.properties, event.timestamp, event.url, event.user_agent).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Event tracked successfully',
      event: eventData.event
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Analytics POST Error:', error);
    
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
    console.error('Analytics Stats Error:', error);
    
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
    console.error('Analytics Events Error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
