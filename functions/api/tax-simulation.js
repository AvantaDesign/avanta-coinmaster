// Tax Simulation API - Declaración Anual Simulator
import { getUserIdFromToken } from './auth.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// GET - Fetch simulations or specific simulation
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const simulationId = pathSegments[pathSegments.length - 1];

  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    // Get specific simulation
    if (simulationId && !isNaN(simulationId)) {
      const simulation = await env.DB.prepare(
        'SELECT * FROM tax_simulations WHERE id = ? AND user_id = ?'
      ).bind(simulationId, userId).first();

      if (!simulation) {
        return new Response(JSON.stringify({ error: 'Simulation not found' }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Get deductions
      const deductions = await env.DB.prepare(
        'SELECT * FROM tax_deductions WHERE simulation_id = ?'
      ).bind(simulationId).all();

      // Get credits
      const credits = await env.DB.prepare(
        'SELECT * FROM tax_credits WHERE simulation_id = ?'
      ).bind(simulationId).all();

      // Get results
      const results = await env.DB.prepare(
        'SELECT * FROM simulation_results WHERE simulation_id = ?'
      ).bind(simulationId).all();

      return new Response(JSON.stringify({
        simulation: {
          ...simulation,
          metadata: simulation.metadata ? JSON.parse(simulation.metadata) : null
        },
        deductions: deductions.results || [],
        credits: credits.results || [],
        results: results.results?.map(r => ({
          ...r,
          calculation_breakdown: r.calculation_breakdown ? JSON.parse(r.calculation_breakdown) : null,
          recommendations: r.recommendations ? JSON.parse(r.recommendations) : null
        })) || []
      }), {
        headers: corsHeaders
      });
    }

    // Get all simulations for user
    const year = url.searchParams.get('year');
    const status = url.searchParams.get('status');

    let query = 'SELECT * FROM tax_simulations WHERE user_id = ?';
    const params = [userId];

    if (year) {
      query += ' AND tax_year = ?';
      params.push(year);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const simulations = await env.DB.prepare(query).bind(...params).all();

    return new Response(JSON.stringify({
      simulations: simulations.results?.map(s => ({
        ...s,
        metadata: s.metadata ? JSON.parse(s.metadata) : null
      })) || []
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Tax simulation GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch simulations',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// POST - Create simulation or calculate results
export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const action = pathSegments[pathSegments.length - 1];

  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const body = await request.json();

    // Calculate simulation results
    if (action === 'calculate') {
      const simulationId = pathSegments[pathSegments.length - 2];
      
      // Get simulation
      const simulation = await env.DB.prepare(
        'SELECT * FROM tax_simulations WHERE id = ? AND user_id = ?'
      ).bind(simulationId, userId).first();

      if (!simulation) {
        return new Response(JSON.stringify({ error: 'Simulation not found' }), {
          status: 404,
          headers: corsHeaders
        });
      }

      const {
        gross_income,
        total_deductions,
        taxable_income,
        isr_calculated,
        total_credits,
        net_tax_liability,
        effective_tax_rate,
        calculation_breakdown,
        recommendations
      } = body;

      // Insert results
      const result = await env.DB.prepare(`
        INSERT INTO simulation_results (
          simulation_id, gross_income, total_deductions, taxable_income,
          isr_calculated, total_credits, net_tax_liability, effective_tax_rate,
          calculation_breakdown, recommendations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        simulationId,
        gross_income || 0,
        total_deductions || 0,
        taxable_income || 0,
        isr_calculated || 0,
        total_credits || 0,
        net_tax_liability || 0,
        effective_tax_rate || 0,
        JSON.stringify(calculation_breakdown || {}),
        JSON.stringify(recommendations || [])
      ).run();

      // Update simulation totals
      await env.DB.prepare(`
        UPDATE tax_simulations 
        SET income_total = ?, deductions_total = ?, credits_total = ?, 
            tax_liability = ?, status = 'completed', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        gross_income || 0,
        total_deductions || 0,
        total_credits || 0,
        net_tax_liability || 0,
        simulationId
      ).run();

      return new Response(JSON.stringify({
        success: true,
        result_id: result.meta.last_row_id
      }), {
        headers: corsHeaders
      });
    }

    // Create new simulation
    const { name, tax_year, metadata } = body;

    if (!name || !tax_year) {
      return new Response(JSON.stringify({ 
        error: 'Name and tax year are required' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const result = await env.DB.prepare(`
      INSERT INTO tax_simulations (
        user_id, name, tax_year, metadata
      ) VALUES (?, ?, ?, ?)
    `).bind(
      userId,
      name,
      tax_year,
      JSON.stringify(metadata || {})
    ).run();

    return new Response(JSON.stringify({
      success: true,
      id: result.meta.last_row_id
    }), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Tax simulation POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create simulation',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// PUT - Update simulation
export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const simulationId = pathSegments[pathSegments.length - 1];

  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    if (!simulationId || isNaN(simulationId)) {
      return new Response(JSON.stringify({ error: 'Invalid simulation ID' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    const { name, status, metadata } = body;

    // Verify ownership
    const existing = await env.DB.prepare(
      'SELECT id FROM tax_simulations WHERE id = ? AND user_id = ?'
    ).bind(simulationId, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Simulation not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Update simulation
    await env.DB.prepare(`
      UPDATE tax_simulations 
      SET name = COALESCE(?, name),
          status = COALESCE(?, status),
          metadata = COALESCE(?, metadata),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      name || null,
      status || null,
      metadata ? JSON.stringify(metadata) : null,
      simulationId
    ).run();

    return new Response(JSON.stringify({
      success: true
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Tax simulation PUT error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update simulation',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// DELETE - Delete simulation
export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const simulationId = pathSegments[pathSegments.length - 1];

  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    if (!simulationId || isNaN(simulationId)) {
      return new Response(JSON.stringify({ error: 'Invalid simulation ID' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify ownership
    const existing = await env.DB.prepare(
      'SELECT id FROM tax_simulations WHERE id = ? AND user_id = ?'
    ).bind(simulationId, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ error: 'Simulation not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Delete simulation (cascade will handle related records)
    await env.DB.prepare(
      'DELETE FROM tax_simulations WHERE id = ?'
    ).bind(simulationId).run();

    return new Response(JSON.stringify({
      success: true
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Tax simulation DELETE error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete simulation',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
