// Savings Goals API - Manage savings goals and contributions
// Phase 30: Monetary values stored as INTEGER cents in database

import { getUserIdFromToken } from './auth.js';
import { 
  toCents, 
  fromCents, 
  convertArrayFromCents, 
  convertObjectFromCents, 
  parseMonetaryInput,
  MONETARY_FIELDS 
} from '../utils/monetary.js';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Helper to generate UUID
function generateId() {
  return 'sg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Calculate progress percentage
function calculateProgress(current, target) {
  if (target <= 0) return 0;
  const progress = (current / target) * 100;
  return Math.min(Math.round(progress * 100) / 100, 100);
}

// Calculate days remaining until target date
function calculateDaysRemaining(targetDate) {
  if (!targetDate) return null;
  const today = new Date();
  const target = new Date(targetDate);
  const diffTime = target - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders });
}

/**
 * GET /api/savings-goals
 * GET /api/savings-goals/:id
 * 
 * List all goals or get a specific goal
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    // Get user ID from token
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

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    // Parse URL to check for specific ID
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const goalId = pathParts[2]; // /api/savings-goals/:id

    // Get specific goal
    if (goalId) {
      const goal = await env.DB.prepare(
        'SELECT * FROM savings_goals WHERE id = ? AND user_id = ?'
      ).bind(goalId, userId).first();

      if (!goal) {
        return new Response(JSON.stringify({ 
          error: 'Goal not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Add calculated fields
      goal.progress_percentage = calculateProgress(goal.current_amount, goal.target_amount);
      goal.amount_remaining = goal.target_amount - goal.current_amount;
      goal.days_remaining = calculateDaysRemaining(goal.target_date);

      return new Response(JSON.stringify(goal), {
        headers: corsHeaders
      });
    }

    // List all goals with filtering
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status'); // all, in-progress, completed, overdue
    const isActive = url.searchParams.get('is_active');

    let query = 'SELECT * FROM savings_goals WHERE user_id = ?';
    const params = [userId];

    // Filter by type (personal/business)
    if (type && ['personal', 'business'].includes(type)) {
      query += ' AND type = ?';
      params.push(type);
    }

    // Filter by active status
    if (isActive !== null && isActive !== undefined) {
      query += ' AND is_active = ?';
      params.push(isActive === 'true' || isActive === '1' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    const result = await env.DB.prepare(query).bind(...params).all();
    let goals = result.results || [];

    // Add calculated fields and filter by status
    goals = goals.map(goal => {
      const progressPercentage = calculateProgress(goal.current_amount, goal.target_amount);
      const amountRemaining = goal.target_amount - goal.current_amount;
      const daysRemaining = calculateDaysRemaining(goal.target_date);
      
      return {
        ...goal,
        progress_percentage: progressPercentage,
        amount_remaining: amountRemaining,
        days_remaining: daysRemaining
      };
    });

    // Apply status filter after calculations
    if (status) {
      goals = goals.filter(goal => {
        switch (status) {
          case 'completed':
            return goal.progress_percentage >= 100;
          case 'in-progress':
            return goal.progress_percentage < 100 && goal.is_active === 1 && (goal.days_remaining === null || goal.days_remaining >= 0);
          case 'overdue':
            return goal.progress_percentage < 100 && goal.days_remaining !== null && goal.days_remaining < 0;
          default:
            return true;
        }
      });
    }

    return new Response(JSON.stringify(goals), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Savings goals GET error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch savings goals',
      message: error.message,
      code: 'QUERY_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/savings-goals
 * POST /api/savings-goals/:id/contribute
 * 
 * Create a new goal or add a contribution
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(p => p);
    const goalId = pathParts[2];
    const action = pathParts[3]; // contribute

    // Handle contribution
    if (goalId && action === 'contribute') {
      const data = await request.json();
      const { amount } = data;

      if (!amount || amount <= 0) {
        return new Response(JSON.stringify({ 
          error: 'Invalid contribution amount',
          code: 'INVALID_INPUT'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      // Get current goal
      const goal = await env.DB.prepare(
        'SELECT * FROM savings_goals WHERE id = ? AND user_id = ?'
      ).bind(goalId, userId).first();

      if (!goal) {
        return new Response(JSON.stringify({ 
          error: 'Goal not found',
          code: 'NOT_FOUND'
        }), {
          status: 404,
          headers: corsHeaders
        });
      }

      // Update current amount
      const newAmount = goal.current_amount + parseFloat(amount);
      await env.DB.prepare(
        'UPDATE savings_goals SET current_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(newAmount, goalId).run();

      // Return updated goal
      const updatedGoal = await env.DB.prepare(
        'SELECT * FROM savings_goals WHERE id = ?'
      ).bind(goalId).first();

      updatedGoal.progress_percentage = calculateProgress(updatedGoal.current_amount, updatedGoal.target_amount);
      updatedGoal.amount_remaining = updatedGoal.target_amount - updatedGoal.current_amount;
      updatedGoal.days_remaining = calculateDaysRemaining(updatedGoal.target_date);

      return new Response(JSON.stringify(updatedGoal), {
        headers: corsHeaders
      });
    }

    // Create new goal
    const data = await request.json();
    const { name, target_amount, target_date, type, category, description, current_amount } = data;

    if (!name || !target_amount || !type) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: name, target_amount, type',
        code: 'INVALID_INPUT'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!['personal', 'business'].includes(type)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid type. Must be personal or business',
        code: 'INVALID_INPUT'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const id = generateId();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO savings_goals (
        id, user_id, name, target_amount, current_amount, target_date, 
        type, category, description, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      id, userId, name, target_amount, current_amount || 0, target_date || null,
      type, category || null, description || null, now, now
    ).run();

    const newGoal = await env.DB.prepare(
      'SELECT * FROM savings_goals WHERE id = ?'
    ).bind(id).first();

    newGoal.progress_percentage = calculateProgress(newGoal.current_amount, newGoal.target_amount);
    newGoal.amount_remaining = newGoal.target_amount - newGoal.current_amount;
    newGoal.days_remaining = calculateDaysRemaining(newGoal.target_date);

    return new Response(JSON.stringify(newGoal), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Savings goals POST error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to create savings goal',
      message: error.message,
      code: 'QUERY_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * PUT /api/savings-goals/:id
 * 
 * Update a savings goal
 */
export async function onRequestPut(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const id = pathParts[2];
  
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    // Verify goal exists and belongs to user
    const existing = await env.DB.prepare(
      'SELECT * FROM savings_goals WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Goal not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const data = await request.json();
    const { name, target_amount, current_amount, target_date, type, category, description, is_active } = data;

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (target_amount !== undefined) {
      updates.push('target_amount = ?');
      params.push(target_amount);
    }
    if (current_amount !== undefined) {
      updates.push('current_amount = ?');
      params.push(current_amount);
    }
    if (target_date !== undefined) {
      updates.push('target_date = ?');
      params.push(target_date);
    }
    if (type !== undefined) {
      if (!['personal', 'business'].includes(type)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid type. Must be personal or business',
          code: 'INVALID_INPUT'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      updates.push('type = ?');
      params.push(type);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      params.push(category);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No fields to update',
        code: 'INVALID_INPUT'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE savings_goals SET ${updates.join(', ')} WHERE id = ?`;
    await env.DB.prepare(query).bind(...params).run();

    // Return updated goal
    const updated = await env.DB.prepare(
      'SELECT * FROM savings_goals WHERE id = ?'
    ).bind(id).first();

    updated.progress_percentage = calculateProgress(updated.current_amount, updated.target_amount);
    updated.amount_remaining = updated.target_amount - updated.current_amount;
    updated.days_remaining = calculateDaysRemaining(updated.target_date);

    return new Response(JSON.stringify(updated), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Savings goals PUT error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to update savings goal',
      message: error.message,
      code: 'QUERY_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * DELETE /api/savings-goals/:id
 * 
 * Soft delete a savings goal
 */
export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p);
  const id = pathParts[2];
  
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: corsHeaders
      });
    }

    if (!env.DB) {
      return new Response(JSON.stringify({ 
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }

    // Verify goal exists and belongs to user
    const existing = await env.DB.prepare(
      'SELECT * FROM savings_goals WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existing) {
      return new Response(JSON.stringify({ 
        error: 'Goal not found',
        code: 'NOT_FOUND'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Soft delete by setting is_active to 0
    await env.DB.prepare(
      'UPDATE savings_goals SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(id).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Savings goal deleted successfully'
    }), {
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Savings goals DELETE error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to delete savings goal',
      message: error.message,
      code: 'QUERY_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
