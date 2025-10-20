// Demo Scenarios API - Get specific scenario details
// Phase 40: Fixed dynamic routing structure
// Handles: GET /api/demo-scenarios/:id

import { getUserIdFromToken } from '../auth.js';
import { getSecurityHeaders } from '../../utils/security.js';
import { logRequest, logError, logAuditEvent } from '../../utils/logging.js';
import { createErrorResponse, createSuccessResponse } from '../../utils/errors.js';

/**
 * GET /api/demo-scenarios/:id - Get scenario details
 */
export async function onRequestGet(context) {
  const { env, request, params } = context;
  const corsHeaders = getSecurityHeaders();

  try {
    logRequest(request, { endpoint: 'demo-scenarios', method: 'GET', scenarioId: params.id }, env);

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
    logError('demo-scenarios-get', error, { scenarioId: params.id }, env);
    return createErrorResponse(error, corsHeaders);
  }
}

/**
 * OPTIONS /api/demo-scenarios/:id - CORS preflight
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
