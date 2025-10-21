// Savings Goals API - Manage savings goals and contributions
// Phase 30: Monetary values stored as INTEGER cents in database

import { getUserIdFromToken } from './auth.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';
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

      // Phase 30: Convert monetary fields from cents to decimal
      const convertedGoal = convertObjectFromCents(goal, MONETARY_FIELDS.SAVINGS_GOALS);

      // Add calculated fields (use string values for calculations after conversion)
      convertedGoal.progress_percentage = calculateProgress(
        parseFloat(convertedGoal.current_amount), 
        parseFloat(convertedGoal.target_amount)
      );
      convertedGoal.amount_remaining = (parseFloat(convertedGoal.target_amount) - parseFloat(convertedGoal.current_amount)).toFixed(2);
      convertedGoal.days_remaining = calculateDaysRemaining(convertedGoal.target_date);
      return new Response(JSON.stringify(convertedGoal), {
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

    // Phase 30: Convert monetary fields from cents to decimal
    goals = convertArrayFromCents(goals, MONETARY_FIELDS.SAVINGS_GOALS);

    // Add calculated fields and filter by status
    goals = goals.map(goal => {
      const currentAmt = parseFloat(goal.current_amount);
      const targetAmt = parseFloat(goal.target_amount);
      const progressPercentage = calculateProgress(currentAmt, targetAmt);
      const amountRemaining = (targetAmt - currentAmt).toFixed(2);
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
    await logError(error, { endpoint: 'Savings goals GET error', category: 'api' }, env);
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
      
      // Phase 30: Parse and validate monetary input
      const amountResult = parseMonetaryInput(data.amount, 'amount', true);
      if (amountResult.error) {
        return new Response(JSON.stringify({ 
          error: amountResult.error,
          code: 'INVALID_INPUT'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }

      if (amountResult.value <= 0) {
        return new Response(JSON.stringify({ 
          error: 'Amount must be greater than 0',
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

      // Phase 30: Update current amount (add cents to cents)
      const newAmountCents = goal.current_amount + amountResult.value;
      await env.DB.prepare(
        'UPDATE savings_goals SET current_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).bind(newAmountCents, goalId).run();

      // Return updated goal
      const updatedGoal = await env.DB.prepare(
        'SELECT * FROM savings_goals WHERE id = ?'
      ).bind(goalId).first();

      // Phase 30: Convert monetary fields from cents to decimal
      const convertedGoal = convertObjectFromCents(updatedGoal, MONETARY_FIELDS.SAVINGS_GOALS);

      convertedGoal.progress_percentage = calculateProgress(
        parseFloat(convertedGoal.current_amount), 
        parseFloat(convertedGoal.target_amount)
      );
      convertedGoal.amount_remaining = (parseFloat(convertedGoal.target_amount) - parseFloat(convertedGoal.current_amount)).toFixed(2);
      convertedGoal.days_remaining = calculateDaysRemaining(convertedGoal.target_date);
      return new Response(JSON.stringify(convertedGoal), {
        headers: corsHeaders
      });
    }

    // Create new goal
    const data = await request.json();
    const { name, target_date, type, category, description } = data;
    
    if (!name || !type) {
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

    // Phase 30: Parse and validate monetary inputs
    const targetAmountResult = parseMonetaryInput(data.target_amount, 'target_amount', true);
    if (targetAmountResult.error) {
      return new Response(JSON.stringify({ 
        error: targetAmountResult.error,
        code: 'INVALID_INPUT'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const currentAmountResult = parseMonetaryInput(data.current_amount || 0, 'current_amount', false);
    if (currentAmountResult.error) {
      return new Response(JSON.stringify({ 
        error: currentAmountResult.error,
        code: 'INVALID_INPUT'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const id = generateId();
    const now = new Date().toISOString();

    // Phase 30: Store amounts in cents
    await env.DB.prepare(`
      INSERT INTO savings_goals (
        id, user_id, name, target_amount, current_amount, target_date, 
        type, category, description, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(
      id, userId, name, 
      targetAmountResult.value,  // Phase 30: Store as cents
      currentAmountResult.value,  // Phase 30: Store as cents
      target_date || null,
      type, category || null, description || null, now, now
    ).run();

    const newGoal = await env.DB.prepare(
      'SELECT * FROM savings_goals WHERE id = ?'
    ).bind(id).first();

    // Phase 30: Convert monetary fields from cents to decimal
    const convertedGoal = convertObjectFromCents(newGoal, MONETARY_FIELDS.SAVINGS_GOALS);

    convertedGoal.progress_percentage = calculateProgress(
      parseFloat(convertedGoal.current_amount), 
      parseFloat(convertedGoal.target_amount)
    );
    convertedGoal.amount_remaining = (parseFloat(convertedGoal.target_amount) - parseFloat(convertedGoal.current_amount)).toFixed(2);
    convertedGoal.days_remaining = calculateDaysRemaining(convertedGoal.target_date);

    return new Response(JSON.stringify(convertedGoal), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Savings goals POST error', category: 'api' }, env);
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
    const { name, target_date, type, category, description, is_active } = data;

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    
    // Phase 30: Handle monetary fields with validation
    if (data.target_amount !== undefined) {
      const targetAmountResult = parseMonetaryInput(data.target_amount, 'target_amount', true);
      if (targetAmountResult.error) {
        return new Response(JSON.stringify({ 
          error: targetAmountResult.error,
          code: 'INVALID_INPUT'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      updates.push('target_amount = ?');
      params.push(targetAmountResult.value);
    }
    
    if (data.current_amount !== undefined) {
      const currentAmountResult = parseMonetaryInput(data.current_amount, 'current_amount', false);
      if (currentAmountResult.error) {
        return new Response(JSON.stringify({ 
          error: currentAmountResult.error,
          code: 'INVALID_INPUT'
        }), {
          status: 400,
          headers: corsHeaders
        });
      }
      updates.push('current_amount = ?');
      params.push(currentAmountResult.value);
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

    // Phase 30: Convert monetary fields from cents to decimal
    const convertedGoal = convertObjectFromCents(updated, MONETARY_FIELDS.SAVINGS_GOALS);

    convertedGoal.progress_percentage = calculateProgress(
      parseFloat(convertedGoal.current_amount), 
      parseFloat(convertedGoal.target_amount)
    );
    convertedGoal.amount_remaining = (parseFloat(convertedGoal.target_amount) - parseFloat(convertedGoal.current_amount)).toFixed(2);
    convertedGoal.days_remaining = calculateDaysRemaining(convertedGoal.target_date);

    return new Response(JSON.stringify(convertedGoal), {
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Savings goals PUT error', category: 'api' }, env);
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
    await logError(error, { endpoint: 'Savings goals DELETE error', category: 'api' }, env);
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
