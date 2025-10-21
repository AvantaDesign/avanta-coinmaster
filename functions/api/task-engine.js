// Task Engine API - Automatic Task Progress Evaluation
// Phase 36: Task System Redesign as Interactive Guide

import { getUserIdFromToken } from './auth.js';
import { getSecurityHeaders } from '../utils/security.js';
import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';
import { logInfo, logError } from '../utils/logging.js';
import { validateTableName, validateFieldName } from '../utils/sql-security.js';

/**
 * Task Engine: Evaluates task completion criteria and updates progress
 * 
 * Criteria Types:
 * 1. Count-based: {type: 'count', resource: 'invoices', field: 'status', value: 'uploaded', min: 5}
 * 2. Percentage-based: {type: 'percentage', resource: 'transactions', field: 'reconciled', min: 95}
 * 3. Boolean-based: {type: 'boolean', checks: ['income_recorded', 'expenses_recorded']}
 * 4. Date-based: {type: 'date', resource: 'declarations', field: 'submitted_at', required: true}
 * 5. Calculation-based: {type: 'calculation', formula: 'iva_collected - iva_creditable', validate: 'calculated'}
 */

export async function onRequestOptions(context) {
  const corsHeaders = getSecurityHeaders();
  return new Response(null, { headers: corsHeaders });
}

/**
 * POST /api/task-engine/evaluate-all
 * Evaluate all auto-update tasks for the current user
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'evaluate-all';

    if (action === 'evaluate-all') {
      return await evaluateAllTasks(env, userId);
    } else if (action === 'evaluate-task') {
      const body = await request.json();
      const { taskId } = body;
      
      if (!taskId) {
        return createErrorResponse('Task ID is required', 'VALIDATION_ERROR', 400);
      }
      
      return await evaluateTask(env, userId, taskId);
    } else if (action === 'update-progress') {
      const body = await request.json();
      return await manualProgressUpdate(env, userId, body);
    }

    return createErrorResponse('Invalid action', 'INVALID_ACTION', 400);

  } catch (error) {
    logError('Task Engine Error', { error: error.message, stack: error.stack });
    return createErrorResponse('Task engine error', 'ENGINE_ERROR', 500);
  }
}

/**
 * GET /api/task-engine/criteria/:taskType
 * Get completion criteria template for a task type
 */
export async function onRequestGet(context) {
  const { env, request } = context;

  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const taskType = pathParts[pathParts.length - 1];

    // Get criteria template from task_templates
    const template = await env.DB.prepare(`
      SELECT template_name, description, completion_criteria, help_text, estimated_duration
      FROM task_templates
      WHERE template_type = ? OR template_name = ?
      AND is_active = 1
      LIMIT 1
    `).bind(taskType, taskType).first();

    if (!template) {
      return createErrorResponse('Task template not found', 'NOT_FOUND', 404);
    }

    return createSuccessResponse({
      template: template.template_name,
      description: template.description,
      criteria: JSON.parse(template.completion_criteria || '{}'),
      help: template.help_text,
      estimatedDuration: template.estimated_duration
    });

  } catch (error) {
    logError('Get Criteria Error', { error: error.message });
    return createErrorResponse('Failed to get criteria', 'GET_ERROR', 500);
  }
}

/**
 * Evaluate all auto-update tasks for a user
 */
async function evaluateAllTasks(db, userId) {
  try {
    // Get all tasks with auto_update enabled
    const { results: tasks } = await db.prepare(`
      SELECT id, task_key, frequency, completion_criteria, task_type
      FROM financial_tasks
      WHERE user_id = ? AND auto_update = 1 AND is_completed = 0
    `).bind(userId).all();

    const evaluationResults = [];

    for (const task of tasks) {
      try {
        const result = await evaluateSingleTask(db, userId, task);
        evaluationResults.push(result);
      } catch (error) {
        logError('Task Evaluation Error', { taskId: task.id, error: error.message });
        evaluationResults.push({
          taskId: task.id,
          success: false,
          error: error.message
        });
      }
    }

    logInfo('Evaluated All Tasks', { userId, count: tasks.length, results: evaluationResults });

    return createSuccessResponse({
      message: 'Tasks evaluated successfully',
      evaluated: tasks.length,
      results: evaluationResults
    });

  } catch (error) {
    logError('Evaluate All Tasks Error', { error: error.message });
    throw error;
  }
}

/**
 * Evaluate a specific task
 */
async function evaluateTask(db, userId, taskId) {
  try {
    const task = await db.prepare(`
      SELECT id, task_key, frequency, completion_criteria, task_type, progress_percentage
      FROM financial_tasks
      WHERE id = ? AND user_id = ?
    `).bind(taskId, userId).first();

    if (!task) {
      return createErrorResponse('Task not found', 'NOT_FOUND', 404);
    }

    const result = await evaluateSingleTask(db, userId, task);

    return createSuccessResponse({
      message: 'Task evaluated successfully',
      result
    });

  } catch (error) {
    logError('Evaluate Task Error', { taskId, error: error.message });
    throw error;
  }
}

/**
 * Evaluate a single task and update its progress
 */
async function evaluateSingleTask(db, userId, task) {
  let criteria = {};
  try {
    criteria = task.completion_criteria ? JSON.parse(task.completion_criteria) : {};
  } catch (error) {
    logError('Invalid Criteria JSON', { taskId: task.id, criteria: task.completion_criteria });
    return {
      taskId: task.id,
      success: false,
      error: 'Invalid completion criteria'
    };
  }

  // If no criteria, task is manual and cannot be auto-evaluated
  if (!criteria.type) {
    return {
      taskId: task.id,
      success: true,
      progress: task.progress_percentage || 0,
      message: 'Manual task - no auto-evaluation'
    };
  }

  // Evaluate based on criteria type
  let progress = 0;
  let completionData = {};

  switch (criteria.type) {
    case 'count':
      ({ progress, completionData } = await evaluateCountCriteria(db, userId, criteria));
      break;
    case 'percentage':
      ({ progress, completionData } = await evaluatePercentageCriteria(db, userId, criteria));
      break;
    case 'boolean':
      ({ progress, completionData } = await evaluateBooleanCriteria(db, userId, criteria));
      break;
    case 'date':
      ({ progress, completionData } = await evaluateDateCriteria(db, userId, criteria));
      break;
    case 'declaration':
      ({ progress, completionData } = await evaluateDeclarationCriteria(db, userId, criteria, task));
      break;
    case 'reconciliation':
      ({ progress, completionData } = await evaluateReconciliationCriteria(db, userId, criteria));
      break;
    case 'review':
      ({ progress, completionData } = await evaluateReviewCriteria(db, userId, criteria));
      break;
    case 'budget_review':
      ({ progress, completionData } = await evaluateBudgetReviewCriteria(db, userId, criteria));
      break;
    default:
      logError('Unknown Criteria Type', { type: criteria.type, taskId: task.id });
      return {
        taskId: task.id,
        success: false,
        error: `Unknown criteria type: ${criteria.type}`
      };
  }

  // Update task progress
  await db.prepare(`
    UPDATE financial_tasks
    SET progress_percentage = ?,
        last_evaluated_at = CURRENT_TIMESTAMP,
        is_completed = ?,
        completed_at = CASE WHEN ? = 100 AND is_completed = 0 THEN CURRENT_TIMESTAMP ELSE completed_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    progress,
    progress >= 100 ? 1 : 0,
    progress,
    task.id
  ).run();

  // Record progress history
  await db.prepare(`
    INSERT INTO task_progress (task_id, user_id, progress_percentage, completion_data, evaluation_criteria)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    task.id,
    userId,
    progress,
    JSON.stringify(completionData),
    JSON.stringify(criteria)
  ).run();

  return {
    taskId: task.id,
    success: true,
    progress,
    previousProgress: task.progress_percentage || 0,
    completionData
  };
}

/**
 * Evaluate count-based criteria
 * Example: {type: 'count', resource: 'invoices', field: 'status', value: 'uploaded', min: 5}
 * Phase 43: Fixed SQL injection vulnerability with table/field validation
 */
async function evaluateCountCriteria(db, userId, criteria) {
  const { resource, field, value, min } = criteria;

  // Phase 43: Validate table name against whitelist
  const tableValidation = validateTableName(resource);
  if (!tableValidation.valid) {
    throw new Error(`Invalid resource table: ${tableValidation.error}`);
  }

  let query = `SELECT COUNT(*) as count FROM ${tableValidation.sanitized} WHERE user_id = ?`;
  const params = [userId];

  if (field && value) {
    // Phase 43: Validate field name against whitelist
    const fieldValidation = validateFieldName(tableValidation.sanitized, field);
    if (!fieldValidation.valid) {
      throw new Error(`Invalid field for ${resource}: ${fieldValidation.error}`);
    }
    query += ` AND ${fieldValidation.sanitized} = ?`;
    params.push(value);
  }

  const result = await db.prepare(query).bind(...params).first();
  const count = result?.count || 0;

  const progress = min > 0 ? Math.min(100, Math.round((count / min) * 100)) : 0;

  return {
    progress,
    completionData: {
      current: count,
      required: min,
      resource,
      field,
      value
    }
  };
}

/**
 * Evaluate percentage-based criteria
 * Example: {type: 'percentage', resource: 'transactions', field: 'is_reconciled', min: 95}
 * Phase 43: Fixed SQL injection vulnerability with table/field validation
 */
async function evaluatePercentageCriteria(db, userId, criteria) {
  const { resource, field, min } = criteria;

  // Phase 43: Validate table name against whitelist
  const tableValidation = validateTableName(resource);
  if (!tableValidation.valid) {
    throw new Error(`Invalid resource table: ${tableValidation.error}`);
  }

  // Phase 43: Validate field name against whitelist
  const fieldValidation = validateFieldName(tableValidation.sanitized, field);
  if (!fieldValidation.valid) {
    throw new Error(`Invalid field for ${resource}: ${fieldValidation.error}`);
  }

  const totalResult = await db.prepare(
    `SELECT COUNT(*) as count FROM ${tableValidation.sanitized} WHERE user_id = ?`
  ).bind(userId).first();

  const completeResult = await db.prepare(
    `SELECT COUNT(*) as count FROM ${tableValidation.sanitized} WHERE user_id = ? AND ${fieldValidation.sanitized} = 1`
  ).bind(userId).first();

  const total = totalResult?.count || 0;
  const complete = completeResult?.count || 0;
  const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;

  const progress = percentage >= min ? 100 : Math.round((percentage / min) * 100);

  return {
    progress,
    completionData: {
      total,
      complete,
      percentage,
      required: min
    }
  };
}

/**
 * Evaluate boolean checks criteria
 * Example: {type: 'boolean', checks: ['income_recorded', 'expenses_recorded']}
 */
async function evaluateBooleanCriteria(db, userId, criteria) {
  const { checks } = criteria;
  const checkResults = {};

  for (const check of checks) {
    checkResults[check] = await performBooleanCheck(db, userId, check);
  }

  const completed = Object.values(checkResults).filter(v => v).length;
  const progress = checks.length > 0 ? Math.round((completed / checks.length) * 100) : 0;

  return {
    progress,
    completionData: {
      checks: checkResults,
      completed,
      total: checks.length
    }
  };
}

/**
 * Evaluate date-based criteria
 * Phase 43: Fixed SQL injection vulnerability with table/field validation
 */
async function evaluateDateCriteria(db, userId, criteria) {
  const { resource, field, required } = criteria;

  // Phase 43: Validate table name against whitelist
  const tableValidation = validateTableName(resource);
  if (!tableValidation.valid) {
    throw new Error(`Invalid resource table: ${tableValidation.error}`);
  }

  // Phase 43: Validate field name against whitelist
  const fieldValidation = validateFieldName(tableValidation.sanitized, field);
  if (!fieldValidation.valid) {
    throw new Error(`Invalid field for ${resource}: ${fieldValidation.error}`);
  }

  const result = await db.prepare(
    `SELECT ${fieldValidation.sanitized} FROM ${tableValidation.sanitized} WHERE user_id = ? ORDER BY ${fieldValidation.sanitized} DESC LIMIT 1`
  ).bind(userId).first();

  const hasDate = result && result[field];
  const progress = hasDate && required ? 100 : 0;

  return {
    progress,
    completionData: {
      lastDate: hasDate ? result[field] : null,
      required
    }
  };
}

/**
 * Evaluate declaration-specific criteria
 */
async function evaluateDeclarationCriteria(db, userId, criteria, task) {
  const { declaration_type, steps_required, validation } = criteria;

  // Get declaration progress
  const declarationProgress = await db.prepare(`
    SELECT overall_progress, completed_steps, status
    FROM user_declaration_progress
    WHERE user_id = ? AND declaration_type = ?
    ORDER BY started_at DESC LIMIT 1
  `).bind(userId, declaration_type).first();

  if (!declarationProgress) {
    return {
      progress: 0,
      completionData: {
        declaration_type,
        status: 'not_started',
        message: 'Declaración no iniciada'
      }
    };
  }

  const progress = declarationProgress.overall_progress || 0;
  const completedSteps = JSON.parse(declarationProgress.completed_steps || '[]');

  return {
    progress,
    completionData: {
      declaration_type,
      status: declarationProgress.status,
      completedSteps: completedSteps.length,
      totalSteps: steps_required,
      currentProgress: progress
    }
  };
}

/**
 * Evaluate reconciliation criteria
 */
async function evaluateReconciliationCriteria(db, userId, criteria) {
  const { threshold } = criteria;

  // Check if statements are uploaded
  const statementsResult = await db.prepare(`
    SELECT COUNT(*) as count FROM bank_statements
    WHERE user_id = ? AND status = 'uploaded'
    AND strftime('%Y-%m', upload_date) = strftime('%Y-%m', 'now')
  `).bind(userId).first();

  // Check if transactions are matched
  const matchedResult = await db.prepare(`
    SELECT COUNT(*) as count FROM transactions
    WHERE user_id = ? AND is_reconciled = 1
    AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
  `).bind(userId).first();

  const totalResult = await db.prepare(`
    SELECT COUNT(*) as count FROM transactions
    WHERE user_id = ? 
    AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
  `).bind(userId).first();

  const hasStatements = (statementsResult?.count || 0) > 0;
  const matched = matchedResult?.count || 0;
  const total = totalResult?.count || 0;
  const matchPercentage = total > 0 ? Math.round((matched / total) * 100) : 0;

  let progress = 0;
  if (hasStatements) progress += 33;
  if (matched > 0) progress += 33;
  if (matchPercentage >= (threshold || 95)) progress += 34;

  return {
    progress: Math.min(100, progress),
    completionData: {
      statementsUploaded: hasStatements,
      transactionsMatched: matched,
      totalTransactions: total,
      matchPercentage
    }
  };
}

/**
 * Evaluate review criteria
 */
async function evaluateReviewCriteria(db, userId, criteria) {
  const { min_percentage } = criteria;

  // Check invoices uploaded and validated
  const uploadedResult = await db.prepare(`
    SELECT COUNT(*) as count FROM invoices
    WHERE user_id = ? AND xml_url IS NOT NULL
    AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
  `).bind(userId).first();

  const validatedResult = await db.prepare(`
    SELECT COUNT(*) as count FROM invoices
    WHERE user_id = ? AND validation_status = 'valid'
    AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
  `).bind(userId).first();

  const uploaded = uploadedResult?.count || 0;
  const validated = validatedResult?.count || 0;
  const percentage = uploaded > 0 ? Math.round((validated / uploaded) * 100) : 0;

  const progress = percentage >= (min_percentage || 95) ? 100 : Math.round((percentage / (min_percentage || 95)) * 100);

  return {
    progress,
    completionData: {
      invoicesUploaded: uploaded,
      invoicesValidated: validated,
      validationPercentage: percentage,
      requiredPercentage: min_percentage || 95
    }
  };
}

/**
 * Evaluate budget review criteria
 */
async function evaluateBudgetReviewCriteria(db, userId, criteria) {
  const { variance_threshold } = criteria;

  // Get budget vs actual comparison
  const result = await db.prepare(`
    SELECT 
      SUM(budgeted_amount) as total_budget,
      SUM(actual_amount) as total_actual
    FROM budgets
    WHERE user_id = ?
    AND strftime('%Y-%m', period_start) = strftime('%Y-%m', 'now')
  `).bind(userId).first();

  const budget = result?.total_budget || 0;
  const actual = result?.total_actual || 0;
  const variance = budget > 0 ? Math.abs(((actual - budget) / budget) * 100) : 0;

  let progress = 0;
  if (budget > 0) progress += 33; // Budget exists
  if (actual > 0) progress += 33; // Actuals recorded
  if (variance <= (variance_threshold || 10)) progress += 34; // Within variance

  return {
    progress: Math.min(100, progress),
    completionData: {
      budgetAmount: budget,
      actualAmount: actual,
      variance: variance.toFixed(2),
      withinThreshold: variance <= (variance_threshold || 10)
    }
  };
}

/**
 * Perform boolean check for common validation scenarios
 */
async function performBooleanCheck(db, userId, checkName) {
  switch (checkName) {
    case 'income_recorded':
      const incomeResult = await db.prepare(`
        SELECT COUNT(*) as count FROM transactions
        WHERE user_id = ? AND type = 'ingreso'
        AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
      `).bind(userId).first();
      return (incomeResult?.count || 0) > 0;

    case 'expenses_recorded':
      const expenseResult = await db.prepare(`
        SELECT COUNT(*) as count FROM transactions
        WHERE user_id = ? AND type = 'gasto'
        AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
      `).bind(userId).first();
      return (expenseResult?.count || 0) > 0;

    case 'invoices_uploaded':
      const invoiceResult = await db.prepare(`
        SELECT COUNT(*) as count FROM invoices
        WHERE user_id = ? AND xml_url IS NOT NULL
        AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
      `).bind(userId).first();
      return (invoiceResult?.count || 0) > 0;

    case 'budget_defined':
      const budgetResult = await db.prepare(`
        SELECT COUNT(*) as count FROM budgets
        WHERE user_id = ?
        AND strftime('%Y-%m', period_start) = strftime('%Y-%m', 'now')
      `).bind(userId).first();
      return (budgetResult?.count || 0) > 0;

    default:
      return false;
  }
}

/**
 * Manual progress update
 */
async function manualProgressUpdate(db, userId, data) {
  const { taskId, progress, notes } = data;

  if (!taskId || progress === undefined) {
    return createErrorResponse('Task ID and progress are required', 'VALIDATION_ERROR', 400);
  }

  if (progress < 0 || progress > 100) {
    return createErrorResponse('Progress must be between 0 and 100', 'VALIDATION_ERROR', 400);
  }

  const task = await db.prepare(`
    SELECT id FROM financial_tasks
    WHERE id = ? AND user_id = ?
  `).bind(taskId, userId).first();

  if (!task) {
    return createErrorResponse('Task not found', 'NOT_FOUND', 404);
  }

  await db.prepare(`
    UPDATE financial_tasks
    SET progress_percentage = ?,
        is_completed = ?,
        completed_at = CASE WHEN ? = 100 AND is_completed = 0 THEN CURRENT_TIMESTAMP ELSE completed_at END,
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    progress,
    progress >= 100 ? 1 : 0,
    progress,
    notes,
    taskId
  ).run();

  // Record progress
  await db.prepare(`
    INSERT INTO task_progress (task_id, user_id, progress_percentage, completion_data)
    VALUES (?, ?, ?, ?)
  `).bind(
    taskId,
    userId,
    progress,
    JSON.stringify({ manual: true, notes, updatedAt: new Date().toISOString() })
  ).run();

  logInfo('Manual Progress Update', { userId, taskId, progress });

  return createSuccessResponse({
    message: 'Progress updated successfully',
    taskId,
    progress
  });
}
