// Demo Data API - Manage demo scenarios and data
// Phase 37: Advanced Demo Experience
//
// This API handles:
// - List available demo scenarios
// - Get current demo scenario
// - Load demo scenario data
// - Reset demo data
//
// Security: Only accessible by demo users (is_demo = 1)

import { getUserIdFromToken } from './auth.js';
import { getSecurityHeaders } from '../utils/security.js';
import { logRequest, logError, logAuditEvent } from '../utils/logging.js';
import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';
import { toCents, fromCents } from '../utils/monetary.js';

/**
 * GET /api/demo-data/scenarios - List all available demo scenarios
 * GET /api/demo-data/current - Get current demo scenario
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  const corsHeaders = getSecurityHeaders();

  try {
    logRequest(request, { endpoint: 'demo-data', method: 'GET' }, env);

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
      'SELECT is_demo, current_demo_scenario_id FROM users WHERE id = ?'
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

    // Handle different endpoints
    if (path.endsWith('/current')) {
      // Get current scenario
      if (!user.current_demo_scenario_id) {
        return new Response(JSON.stringify({
          success: true,
          data: null,
          message: 'No scenario currently active'
        }), {
          status: 200,
          headers: corsHeaders
        });
      }

      const scenario = await env.DB.prepare(`
        SELECT id, scenario_name, scenario_type, description, business_context,
               financial_state, learning_objectives, display_order
        FROM demo_scenarios
        WHERE id = ? AND is_active = 1
      `).bind(user.current_demo_scenario_id).first();

      if (!scenario) {
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: 'Current scenario not found'
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

      return new Response(JSON.stringify({
        success: true,
        data: scenarioData
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      // List all scenarios
      const scenarios = await env.DB.prepare(`
        SELECT id, scenario_name, scenario_type, description, business_context,
               financial_state, learning_objectives, display_order
        FROM demo_scenarios
        WHERE is_active = 1
        ORDER BY display_order ASC, id ASC
      `).all();

      // Parse JSON fields for each scenario
      const scenariosData = scenarios.results.map(scenario => ({
        ...scenario,
        business_context: scenario.business_context ? JSON.parse(scenario.business_context) : null,
        financial_state: scenario.financial_state ? JSON.parse(scenario.financial_state) : null,
        learning_objectives: scenario.learning_objectives ? JSON.parse(scenario.learning_objectives) : []
      }));

      return new Response(JSON.stringify({
        success: true,
        data: scenariosData,
        count: scenariosData.length
      }), {
        status: 200,
        headers: corsHeaders
      });
    }
  } catch (error) {
    logError('demo-data-get', error, { userId: 'unknown' }, env);
    return createErrorResponse(error, corsHeaders);
  }
}

/**
 * POST /api/demo-data/load-scenario - Load a specific demo scenario
 * POST /api/demo-data/reset - Reset current demo scenario data
 * 
 * Body for load-scenario:
 *   - scenario_id: number
 * 
 * Body for reset:
 *   (no parameters)
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname;
  
  const corsHeaders = getSecurityHeaders();

  try {
    logRequest(request, { endpoint: 'demo-data', method: 'POST' }, env);

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
      'SELECT is_demo, current_demo_scenario_id FROM users WHERE id = ?'
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

    if (path.endsWith('/load-scenario')) {
      // Load a specific scenario
      const body = await request.json();
      const { scenario_id } = body;

      if (!scenario_id) {
        return new Response(JSON.stringify({
          error: 'Bad Request',
          message: 'scenario_id is required'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Verify scenario exists
      const scenario = await env.DB.prepare(
        'SELECT id, scenario_name FROM demo_scenarios WHERE id = ? AND is_active = 1'
      ).bind(scenario_id).first();

      if (!scenario) {
        return new Response(JSON.stringify({
          error: 'Not Found',
          message: 'Scenario not found'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Load scenario data
      await loadDemoScenario(env, userId, scenario_id);

      // Update user's current scenario
      await env.DB.prepare(
        'UPDATE users SET current_demo_scenario_id = ? WHERE id = ?'
      ).bind(scenario_id, userId).run();

      // Log audit event
      logAuditEvent(userId, 'demo_scenario_loaded', {
        scenario_id,
        scenario_name: scenario.scenario_name
      }, env);

      return new Response(JSON.stringify({
        success: true,
        message: `Demo scenario "${scenario.scenario_name}" loaded successfully`,
        data: { scenario_id: scenario_id }
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else if (path.endsWith('/reset')) {
      // Reset current scenario
      if (!user.current_demo_scenario_id) {
        return new Response(JSON.stringify({
          error: 'Bad Request',
          message: 'No active scenario to reset'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Reload the current scenario
      await loadDemoScenario(env, userId, user.current_demo_scenario_id);

      // Log audit event
      logAuditEvent(userId, 'demo_scenario_reset', {
        scenario_id: user.current_demo_scenario_id
      }, env);

      return new Response(JSON.stringify({
        success: true,
        message: 'Demo data reset successfully',
        data: { scenario_id: user.current_demo_scenario_id }
      }), {
        status: 200,
        headers: corsHeaders
      });
    } else {
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'Endpoint not found'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }
  } catch (error) {
    logError('demo-data-post', error, { userId: 'unknown' }, env);
    return createErrorResponse(error, corsHeaders);
  }
}

/**
 * Load demo scenario data for a user
 * This function clears existing demo data and loads fresh data from snapshots
 */
async function loadDemoScenario(env, userId, scenarioId) {
  try {
    // Get all data snapshots for this scenario
    const snapshots = await env.DB.prepare(`
      SELECT data_type, data_snapshot
      FROM demo_data_snapshots
      WHERE scenario_id = ?
      ORDER BY id ASC
    `).bind(scenarioId).all();

    if (!snapshots.results || snapshots.results.length === 0) {
      throw new Error('No demo data snapshots found for this scenario');
    }

    // Start transaction by clearing existing demo data
    // Note: In D1, we don't have explicit transactions, so we do operations sequentially
    
    // Delete existing demo transactions
    await env.DB.prepare(
      'DELETE FROM transactions WHERE user_id = ?'
    ).bind(userId).run();

    // Delete existing demo accounts
    await env.DB.prepare(
      'DELETE FROM accounts WHERE user_id = ?'
    ).bind(userId).run();

    // Delete existing demo invoices
    await env.DB.prepare(
      'DELETE FROM invoices WHERE user_id = ?'
    ).bind(userId).run();

    // Load data from snapshots
    for (const snapshot of snapshots.results) {
      const data = JSON.parse(snapshot.data_snapshot);
      
      switch (snapshot.data_type) {
        case 'accounts':
          await loadDemoAccounts(env, userId, data);
          break;
        case 'transactions':
          await loadDemoTransactions(env, userId, data);
          break;
        case 'invoices':
          await loadDemoInvoices(env, userId, data);
          break;
        default:
          logWarn(`Unknown data type: ${snapshot.data_type}`, {
            category: 'business',
            dataType: snapshot.data_type
          });
      }
    }
  } catch (error) {
    await logError(error, { endpoint: 'Error loading demo scenario', category: 'api' }, env);
    throw error;
  }
}

/**
 * Load demo accounts from snapshot data
 */
async function loadDemoAccounts(env, userId, accounts) {
  for (const account of accounts) {
    await env.DB.prepare(`
      INSERT INTO accounts (user_id, name, type, balance, opening_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      account.name,
      account.type,
      account.balance, // Already in cents from migration
      account.opening_date,
      account.is_active
    ).run();
  }
}

/**
 * Load demo transactions from snapshot data
 */
async function loadDemoTransactions(env, userId, transactions) {
  for (const transaction of transactions) {
    await env.DB.prepare(`
      INSERT INTO transactions (
        user_id, date, description, amount, type, category, account,
        is_isr_deductible, is_iva_deductible, transaction_type, expense_type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      transaction.date,
      transaction.description,
      transaction.amount, // Already in cents from migration
      transaction.type,
      transaction.category,
      transaction.account,
      transaction.is_isr_deductible || 0,
      transaction.is_iva_deductible || 0,
      transaction.transaction_type || 'business',
      transaction.expense_type || 'national'
    ).run();
  }
}

/**
 * Load demo invoices from snapshot data
 */
async function loadDemoInvoices(env, userId, invoices) {
  for (const invoice of invoices) {
    await env.DB.prepare(`
      INSERT INTO invoices (
        user_id, uuid, rfc_emisor, rfc_receptor, date, subtotal, iva, total,
        xml_url, invoice_type, payment_method, payment_form, currency, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      invoice.uuid,
      invoice.rfc_emisor,
      invoice.rfc_receptor,
      invoice.date,
      invoice.subtotal, // Already in cents
      invoice.iva, // Already in cents
      invoice.total, // Already in cents
      invoice.xml_url,
      invoice.invoice_type,
      invoice.payment_method,
      invoice.payment_form,
      invoice.currency,
      invoice.status
    ).run();
  }
}

/**
 * OPTIONS /api/demo-data/* - CORS preflight
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
