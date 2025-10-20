// Demo Scenarios API - Activate scenario
// Phase 40: Fixed dynamic routing structure
// Handles: POST /api/demo-scenarios/:id/activate

import { getUserIdFromToken } from '../../auth.js';
import { getSecurityHeaders } from '../../../utils/security.js';
import { logRequest, logError, logAuditEvent } from '../../../utils/logging.js';
import { createErrorResponse, createSuccessResponse } from '../../../utils/errors.js';

/**
 * POST /api/demo-scenarios/:id/activate - Activate a specific scenario
 */
export async function onRequestPost(context) {
  const { env, request, params } = context;
  const corsHeaders = getSecurityHeaders();

  try {
    logRequest(request, { endpoint: 'demo-scenarios-activate', method: 'POST', scenarioId: params.id }, env);

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
    logError('demo-scenarios-activate', error, { scenarioId: params.id }, env);
    return createErrorResponse(error, corsHeaders);
  }
}

/**
 * OPTIONS /api/demo-scenarios/:id/activate - CORS preflight
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
