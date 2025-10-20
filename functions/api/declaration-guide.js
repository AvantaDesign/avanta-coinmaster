// Declaration Guide API - Interactive Declaration Assistance
// Phase 36: Task System Redesign as Interactive Guide

import { getUserFromRequest, corsHeaders } from '../utils/security.js';
import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';
import { validateRequired } from '../utils/validation.js';
import { logInfo, logError } from '../utils/logging.js';

/**
 * Declaration Guide: Provides step-by-step guidance for fiscal declarations
 * 
 * Supported declaration types:
 * - isr: Monthly ISR declaration
 * - iva: Monthly IVA declaration
 * - diot: Monthly DIOT (Declaración Informativa de Operaciones con Terceros)
 * - annual_isr: Annual ISR declaration
 * - annual_iva: Annual IVA declaration
 */

export async function onRequestOptions(context) {
  return new Response(null, { headers: corsHeaders });
}

/**
 * GET /api/declaration-guide/:type
 * Get declaration steps for a specific type
 */
export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const type = pathParts[pathParts.length - 1];
    const action = pathParts[pathParts.length - 2];

    if (action === 'progress') {
      // Get user's progress for this declaration type
      return await getDeclarationProgress(env, user.id, type);
    }

    // Get declaration steps
    const { results: steps } = await env.DB.prepare(`
      SELECT 
        id, step_number, step_title, step_description,
        required_fields, help_text, validation_rules, common_errors,
        is_required, estimated_time, display_order
      FROM declaration_steps
      WHERE declaration_type = ?
      ORDER BY display_order ASC
    `).bind(type).all();

    if (steps.length === 0) {
      return createErrorResponse('Declaration type not found', 'NOT_FOUND', 404);
    }

    // Parse JSON fields
    const parsedSteps = steps.map(step => ({
      ...step,
      required_fields: JSON.parse(step.required_fields || '[]'),
      validation_rules: JSON.parse(step.validation_rules || '{}'),
      common_errors: JSON.parse(step.common_errors || '[]')
    }));

    return createSuccessResponse({
      declaration_type: type,
      steps: parsedSteps,
      total_steps: steps.length,
      total_estimated_time: steps.reduce((sum, s) => sum + (s.estimated_time || 0), 0)
    });

  } catch (error) {
    logError('Get Declaration Steps Error', { error: error.message });
    return createErrorResponse('Failed to get declaration steps', 'GET_ERROR', 500);
  }
}

/**
 * POST /api/declaration-guide/:type/start
 * Start a new guided declaration
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const action = pathParts[pathParts.length - 1];
    const type = pathParts[pathParts.indexOf('declaration-guide') + 1];

    if (action === 'start') {
      return await startDeclaration(env, user.id, type, request);
    } else if (action.startsWith('step')) {
      const stepId = pathParts[pathParts.length - 1];
      return await completeDeclarationStep(env, user.id, type, stepId, request);
    }

    return createErrorResponse('Invalid action', 'INVALID_ACTION', 400);

  } catch (error) {
    logError('Declaration Guide Error', { error: error.message, stack: error.stack });
    return createErrorResponse('Declaration guide error', 'GUIDE_ERROR', 500);
  }
}

/**
 * PUT /api/declaration-guide/:type/step/:stepId
 * Complete or update a declaration step
 */
export async function onRequestPut(context) {
  const { env, request } = context;

  try {
    const user = await getUserFromRequest(request, env);
    if (!user) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const stepId = pathParts[pathParts.length - 1];
    const type = pathParts[pathParts.indexOf('declaration-guide') + 1];

    return await completeDeclarationStep(env, user.id, type, stepId, request);

  } catch (error) {
    logError('Complete Step Error', { error: error.message });
    return createErrorResponse('Failed to complete step', 'UPDATE_ERROR', 500);
  }
}

/**
 * Start a new declaration
 */
async function startDeclaration(db, userId, declarationType, request) {
  try {
    const body = await request.json();
    const { declaration_period } = body;

    if (!declaration_period) {
      return createErrorResponse('Declaration period is required (format: YYYY-MM or YYYY)', 'VALIDATION_ERROR', 400);
    }

    // Check if declaration already exists
    const existing = await db.prepare(`
      SELECT id, status, current_step, overall_progress
      FROM user_declaration_progress
      WHERE user_id = ? AND declaration_type = ? AND declaration_period = ?
    `).bind(userId, declarationType, declaration_period).first();

    if (existing) {
      return createSuccessResponse({
        message: 'Declaration already exists',
        declaration_id: existing.id,
        status: existing.status,
        current_step: existing.current_step,
        progress: existing.overall_progress
      });
    }

    // Create new declaration progress
    const result = await db.prepare(`
      INSERT INTO user_declaration_progress (
        user_id, declaration_type, declaration_period,
        current_step, completed_steps, step_data, overall_progress, status
      ) VALUES (?, ?, ?, 1, '[]', '{}', 0, 'in_progress')
    `).bind(userId, declarationType, declaration_period).run();

    logInfo('Declaration Started', { 
      userId, 
      declarationType, 
      declaration_period, 
      id: result.meta.last_row_id 
    });

    return createSuccessResponse({
      message: 'Declaration started successfully',
      declaration_id: result.meta.last_row_id,
      declaration_type: declarationType,
      declaration_period,
      status: 'in_progress',
      current_step: 1
    });

  } catch (error) {
    logError('Start Declaration Error', { error: error.message });
    throw error;
  }
}

/**
 * Complete a declaration step
 */
async function completeDeclarationStep(db, userId, declarationType, stepId, request) {
  try {
    const body = await request.json();
    const { declaration_period, step_data, validation_passed } = body;

    if (!declaration_period) {
      return createErrorResponse('Declaration period is required', 'VALIDATION_ERROR', 400);
    }

    // Get declaration progress
    const progress = await db.prepare(`
      SELECT id, current_step, completed_steps, step_data, overall_progress
      FROM user_declaration_progress
      WHERE user_id = ? AND declaration_type = ? AND declaration_period = ?
    `).bind(userId, declarationType, declaration_period).first();

    if (!progress) {
      return createErrorResponse('Declaration not found', 'NOT_FOUND', 404);
    }

    // Get step information
    const step = await db.prepare(`
      SELECT id, step_number, step_title, is_required, validation_rules
      FROM declaration_steps
      WHERE id = ? AND declaration_type = ?
    `).bind(stepId, declarationType).first();

    if (!step) {
      return createErrorResponse('Step not found', 'NOT_FOUND', 404);
    }

    // Validate step data if validation rules exist
    if (step.validation_rules && validation_passed === undefined) {
      const rules = JSON.parse(step.validation_rules);
      const validationResult = validateStepData(step_data, rules);
      
      if (!validationResult.valid) {
        return createErrorResponse(
          'Validation failed',
          'VALIDATION_ERROR',
          400,
          { errors: validationResult.errors }
        );
      }
    }

    // Update completed steps
    const completedSteps = JSON.parse(progress.completed_steps || '[]');
    if (!completedSteps.includes(parseInt(stepId))) {
      completedSteps.push(parseInt(stepId));
    }

    // Update step data
    const allStepData = JSON.parse(progress.step_data || '{}');
    allStepData[stepId] = step_data;

    // Get total steps for this declaration
    const totalStepsResult = await db.prepare(`
      SELECT COUNT(*) as count FROM declaration_steps
      WHERE declaration_type = ?
    `).bind(declarationType).first();
    const totalSteps = totalStepsResult?.count || 0;

    // Calculate overall progress
    const overallProgress = totalSteps > 0 
      ? Math.round((completedSteps.length / totalSteps) * 100)
      : 0;

    // Determine status
    let status = 'in_progress';
    if (overallProgress >= 100) {
      status = 'completed';
    }

    // Update next step
    const nextStep = step.step_number + 1;

    // Update declaration progress
    await db.prepare(`
      UPDATE user_declaration_progress
      SET completed_steps = ?,
          step_data = ?,
          overall_progress = ?,
          current_step = ?,
          status = ?,
          completed_at = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_at END,
          last_updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      JSON.stringify(completedSteps),
      JSON.stringify(allStepData),
      overallProgress,
      nextStep,
      status,
      status,
      progress.id
    ).run();

    logInfo('Declaration Step Completed', {
      userId,
      declarationType,
      stepId,
      progress: overallProgress
    });

    return createSuccessResponse({
      message: 'Step completed successfully',
      step_number: step.step_number,
      step_title: step.step_title,
      overall_progress: overallProgress,
      completed_steps: completedSteps.length,
      total_steps: totalSteps,
      next_step: nextStep <= totalSteps ? nextStep : null,
      status
    });

  } catch (error) {
    logError('Complete Step Error', { error: error.message });
    throw error;
  }
}

/**
 * Get declaration progress
 */
async function getDeclarationProgress(db, userId, declarationType) {
  try {
    const url = new URL(db.url || '');
    const declaration_period = url.searchParams.get('period');

    let query = `
      SELECT 
        id, declaration_type, declaration_period, current_step,
        completed_steps, step_data, overall_progress, status,
        started_at, completed_at, last_updated_at
      FROM user_declaration_progress
      WHERE user_id = ? AND declaration_type = ?
    `;
    const params = [userId, declarationType];

    if (declaration_period) {
      query += ' AND declaration_period = ?';
      params.push(declaration_period);
    }

    query += ' ORDER BY started_at DESC LIMIT 1';

    const progress = await db.prepare(query).bind(...params).first();

    if (!progress) {
      return createSuccessResponse({
        message: 'No declaration found',
        declaration_type: declarationType,
        status: 'not_started',
        progress: 0
      });
    }

    // Parse JSON fields
    const completedSteps = JSON.parse(progress.completed_steps || '[]');
    const stepData = JSON.parse(progress.step_data || '{}');

    return createSuccessResponse({
      declaration_id: progress.id,
      declaration_type: progress.declaration_type,
      declaration_period: progress.declaration_period,
      current_step: progress.current_step,
      completed_steps: completedSteps,
      step_data: stepData,
      overall_progress: progress.overall_progress,
      status: progress.status,
      started_at: progress.started_at,
      completed_at: progress.completed_at,
      last_updated_at: progress.last_updated_at
    });

  } catch (error) {
    logError('Get Declaration Progress Error', { error: error.message });
    throw error;
  }
}

/**
 * Validate step data against rules
 */
function validateStepData(data, rules) {
  const errors = [];

  // Check required fields
  if (rules.required) {
    for (const field of rules.required) {
      if (!data || data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push(`Field '${field}' is required`);
      }
    }
  }

  // Check numeric fields
  if (rules.numeric) {
    for (const field of rules.numeric) {
      if (data && data[field] !== undefined && isNaN(Number(data[field]))) {
        errors.push(`Field '${field}' must be a number`);
      }
    }
  }

  // Check minimum values
  if (rules.min) {
    for (const [field, minValue] of Object.entries(rules.min)) {
      if (data && data[field] !== undefined && Number(data[field]) < minValue) {
        errors.push(`Field '${field}' must be at least ${minValue}`);
      }
    }
  }

  // Check maximum values
  if (rules.max) {
    for (const [field, maxValue] of Object.entries(rules.max)) {
      if (data && data[field] !== undefined && Number(data[field]) > maxValue) {
        errors.push(`Field '${field}' must be at most ${maxValue}`);
      }
    }
  }

  // Check date formats
  if (rules.date) {
    for (const field of rules.date) {
      if (data && data[field] && !isValidDate(data[field])) {
        errors.push(`Field '${field}' must be a valid date`);
      }
    }
  }

  // Custom validation functions
  if (rules.custom) {
    for (const [field, validationFn] of Object.entries(rules.custom)) {
      if (data && data[field] !== undefined) {
        const customResult = evaluateCustomValidation(data[field], validationFn);
        if (!customResult.valid) {
          errors.push(customResult.error || `Field '${field}' validation failed`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Check if a date string is valid
 */
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Evaluate custom validation
 */
function evaluateCustomValidation(value, validationFn) {
  try {
    // For security, we only support predefined validation functions
    const validations = {
      'rfc': (v) => /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(v),
      'email': (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      'phone': (v) => /^\d{10}$/.test(v),
      'positive': (v) => Number(v) > 0,
      'non_negative': (v) => Number(v) >= 0,
      'percentage': (v) => Number(v) >= 0 && Number(v) <= 100
    };

    const fn = validations[validationFn];
    if (!fn) {
      return { valid: false, error: 'Unknown validation function' };
    }

    const valid = fn(value);
    return { valid, error: valid ? null : `Validation '${validationFn}' failed` };

  } catch (error) {
    return { valid: false, error: error.message };
  }
}
