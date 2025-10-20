// Demo Scenarios API - Manage demo scenario switching
// Phase 37: Advanced Demo Experience
//
// This API handles:
// - Get specific scenario details
// - Activate/switch to a scenario
// - Get scenario metadata

import { getUserIdFromToken } from './auth.js';
import { getSecurityHeaders } from '../utils/security.js';
import { logRequest, logError, logAuditEvent } from '../utils/logging.js';
import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';

/**
 * GET /api/demo-scenarios/:id - Get scenario details
 */
export async function onRequestGet(context) {
  const { env, request, params } = context;
  const corsHeaders = getSecurityHeaders();

  try {
    logRequest(request, { endpoint: 'demo-scenarios', method: 'GET' }, env);

    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required'
      }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Verify user is a demo user
    const user = await env.DB.prepare(
      'SELECT is_demo FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user || !user.is_demo) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Demo features only available for demo users'
      }), {
        status: 403,
        headers: corsHeaders
      });
    }

    const scenarioId = params.id;

    if (!scenarioId) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'Scenario ID is required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Get scenario details
    const scenario = await env.DB.prepare(`
      SELECT id, scenario_name, scenario_type, description, business_context,
             financial_state, learning_objectives, display_order
      FROM demo_scenarios
      WHERE id = ? AND is_active = 1
    `).bind(scenarioId).first();

    if (!scenario) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Scenario not found'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Parse JSON fields
    const scenarioData = {
      ...scenario,
      business_context: scenario.business_context ? JSON.parse(scenario.business_context) : null,
      financial_state: scenario.financial_state ? JSON.parse(scenario.financial_state) : null,
      learning_objectives: scenario.learning_objectives ? JSON.parse(scenario.learning_objectives) : []
    };

    // Get available data snapshots for this scenario
    const snapshots = await env.DB.prepare(`
      SELECT id, snapshot_name, data_type
      FROM demo_data_snapshots
      WHERE scenario_id = ?
      ORDER BY data_type ASC
    `).bind(scenarioId).all();

    return new Response(JSON.stringify({
      success: true,
      data: {
        scenario: scenarioData,
        available_data: snapshots.results
      }
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    logError('demo-scenarios-get', error, { userId: 'unknown' }, env);
    return createErrorResponse(error, corsHeaders);
  }
}

/**
 * POST /api/demo-scenarios/:id/activate - Activate a specific scenario
 */
export async function onRequestPost(context) {
  const { env, request, params } = context;
  const url = new URL(request.url);
  const corsHeaders = getSecurityHeaders();

  try {
    logRequest(request, { endpoint: 'demo-scenarios', method: 'POST' }, env);

    // Get user ID from token
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required'
      }), { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Verify user is a demo user
    const user = await env.DB.prepare(
      'SELECT is_demo FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user || !user.is_demo) {
      return new Response(JSON.stringify({
        error: 'Forbidden',
        message: 'Demo features only available for demo users'
      }), {
        status: 403,
        headers: corsHeaders
      });
    }

    const scenarioId = params.id;

    if (!scenarioId) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: 'Scenario ID is required'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Check if this is an activate request
    if (!url.pathname.endsWith('/activate')) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Endpoint not found. Use /activate to switch scenarios'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Verify scenario exists
    const scenario = await env.DB.prepare(
      'SELECT id, scenario_name, scenario_type FROM demo_scenarios WHERE id = ? AND is_active = 1'
    ).bind(scenarioId).first();

    if (!scenario) {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Scenario not found'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Update user's current scenario
    await env.DB.prepare(
      'UPDATE users SET current_demo_scenario_id = ? WHERE id = ?'
    ).bind(scenarioId, userId).run();

    // Log audit event
    logAuditEvent(userId, 'demo_scenario_activated', {
      scenario_id: scenarioId,
      scenario_name: scenario.scenario_name,
      scenario_type: scenario.scenario_type
    }, env);

    return new Response(JSON.stringify({
      success: true,
      message: `Scenario "${scenario.scenario_name}" activated. Use /api/demo-data/load-scenario to load the data.`,
      data: {
        scenario_id: scenarioId,
        scenario_name: scenario.scenario_name,
        scenario_type: scenario.scenario_type
      }
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    logError('demo-scenarios-post', error, { userId: 'unknown' }, env);
    return createErrorResponse(error, corsHeaders);
  }
}

/**
 * OPTIONS /api/demo-scenarios/* - CORS preflight
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
