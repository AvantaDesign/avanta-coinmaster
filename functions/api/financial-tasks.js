// Financial Tasks API - Manage user financial task tracking
// Phase 5: In-App Financial Activities and Workflows
// Phase 36: Enhanced with automatic progress tracking and completion criteria

import { getUserIdFromToken } from './auth.js';
import { getSecurityHeaders } from '../utils/security.js';
import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';
import { logInfo, logError } from '../utils/logging.js';

// Default financial tasks by frequency
const DEFAULT_TASKS = {
  daily: [
    { task_key: 'check_cash_flow', title: 'Revisar Flujo de Efectivo', description: 'Verificar el saldo de cuentas y el flujo de efectivo del día', category: 'cash_flow' },
    { task_key: 'review_pending_invoices', title: 'Revisar Facturas Pendientes', description: 'Revisar facturas pendientes de cobro y pago', category: 'invoices' },
    { task_key: 'process_payments', title: 'Procesar Pagos', description: 'Procesar pagos pendientes y registrar transacciones', category: 'payments' }
  ],
  weekly: [
    { task_key: 'reconcile_bank', title: 'Conciliar Cuentas Bancarias', description: 'Reconciliar estados de cuenta bancarios', category: 'reconciliation' },
    { task_key: 'review_budget', title: 'Revisar Desempeño del Presupuesto', description: 'Comparar gastos reales vs presupuesto', category: 'budget' },
    { task_key: 'update_projects', title: 'Actualizar Estado de Proyectos', description: 'Actualizar el estado y facturación de proyectos activos', category: 'projects' },
    { task_key: 'follow_up_overdue', title: 'Seguimiento de Facturas Vencidas', description: 'Hacer seguimiento de facturas vencidas por cobrar', category: 'invoices' }
  ],
  monthly: [
    { task_key: 'generate_reports', title: 'Generar Reportes Financieros', description: 'Generar estados financieros mensuales', category: 'reports' },
    { task_key: 'review_tax_obligations', title: 'Revisar Obligaciones Fiscales', description: 'Revisar y calcular impuestos mensuales', category: 'tax' },
    { task_key: 'analyze_profitability', title: 'Analizar Rentabilidad', description: 'Analizar rentabilidad por categoría y proyecto', category: 'analysis' },
    { task_key: 'review_recurring', title: 'Revisar Pagos Recurrentes', description: 'Revisar y actualizar pagos recurrentes', category: 'recurring' }
  ],
  quarterly: [
    { task_key: 'quarterly_tax_filing', title: 'Declaración Fiscal Trimestral', description: 'Preparar y presentar declaración trimestral', category: 'tax' },
    { task_key: 'financial_review', title: 'Revisión Financiera Integral', description: 'Revisión completa de la situación financiera', category: 'review' },
    { task_key: 'budget_planning', title: 'Planificación Presupuestaria', description: 'Revisar y ajustar presupuestos para el próximo trimestre', category: 'budget' }
  ],
  annual: [
    { task_key: 'year_end_closing', title: 'Cierre Anual', description: 'Realizar el cierre contable del año fiscal', category: 'closing' },
    { task_key: 'annual_tax_prep', title: 'Preparación Fiscal Anual', description: 'Preparar documentación para declaración anual', category: 'tax' },
    { task_key: 'strategic_planning', title: 'Planificación Estratégica', description: 'Planificación financiera y estratégica para el próximo año', category: 'planning' }
  ]
};

export async function onRequestOptions(context) {
  const corsHeaders = getSecurityHeaders();
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return createErrorResponse('Database not available', 'DB_NOT_CONFIGURED', 503);
    }

    // Get authenticated user
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const url = new URL(request.url);
    const frequency = url.searchParams.get('frequency');
    const completed = url.searchParams.get('completed');
    const dueDate = url.searchParams.get('due_date');
    const taskType = url.searchParams.get('task_type');

    // Build query with enhanced fields
    let query = `
      SELECT 
        id, user_id, task_key, frequency, title, description,
        category, due_date, is_completed, completed_at,
        completion_criteria, progress_percentage, last_evaluated_at,
        auto_update, task_type, notes, created_at, updated_at
      FROM financial_tasks 
      WHERE user_id = ?
    `;
    const params = [userId];

    if (frequency) {
      query += ' AND frequency = ?';
      params.push(frequency);
    }

    if (completed !== null && completed !== undefined) {
      query += ' AND is_completed = ?';
      params.push(completed === 'true' ? 1 : 0);
    }

    if (dueDate) {
      query += ' AND due_date = ?';
      params.push(dueDate);
    }

    if (taskType) {
      query += ' AND task_type = ?';
      params.push(taskType);
    }

    query += ' ORDER BY is_completed ASC, due_date DESC, progress_percentage DESC, frequency, created_at DESC';

    const { results: tasks } = await env.DB.prepare(query)
      .bind(...params)
      .all();

    // Parse completion_criteria JSON for each task
    const parsedTasks = tasks.map(task => ({
      ...task,
      completion_criteria: task.completion_criteria ? JSON.parse(task.completion_criteria) : null
    }));

    // Get completion stats with progress
    const stats = await env.DB.prepare(`
      SELECT 
        frequency,
        COUNT(*) as total,
        SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed,
        AVG(progress_percentage) as avg_progress
      FROM financial_tasks 
      WHERE user_id = ?
      GROUP BY frequency
    `).bind(userId).all();

    // Get task type breakdown
    const typeStats = await env.DB.prepare(`
      SELECT 
        task_type,
        COUNT(*) as count,
        AVG(progress_percentage) as avg_progress
      FROM financial_tasks 
      WHERE user_id = ?
      GROUP BY task_type
    `).bind(userId).all();

    return createSuccessResponse({
      tasks: parsedTasks,
      stats: stats.results || [],
      typeStats: typeStats.results || [],
      defaultTasks: DEFAULT_TASKS
    });

  } catch (error) {
    logError('Fetch Tasks Error', { error: error.message });
    return createErrorResponse('Failed to fetch tasks', 'FETCH_ERROR', 500);
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return createErrorResponse('Database not available', 'DB_NOT_CONFIGURED', 503);
    }

    // Get authenticated user
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const data = await request.json();

    // Validate required fields
    if (!data.task_key || !data.frequency || !data.title) {
      return createErrorResponse(
        'Missing required fields: task_key, frequency, title',
        'VALIDATION_ERROR',
        400
      );
    }

    // Validate frequency
    const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];
    if (!validFrequencies.includes(data.frequency)) {
      return createErrorResponse(
        `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}`,
        'VALIDATION_ERROR',
        400
      );
    }

    // Check if task already exists for this period
    if (data.due_date) {
      const existing = await env.DB.prepare(
        'SELECT id FROM financial_tasks WHERE user_id = ? AND task_key = ? AND due_date = ?'
      ).bind(userId, data.task_key, data.due_date).first();

      if (existing) {
        return createErrorResponse('Task already exists for this period', 'DUPLICATE_ERROR', 409);
      }
    }

    // Prepare completion criteria
    const criteria = data.completion_criteria 
      ? (typeof data.completion_criteria === 'string' ? data.completion_criteria : JSON.stringify(data.completion_criteria))
      : null;

    // Determine task_type
    const taskType = data.task_type || 'custom';

    // Insert task with enhanced fields
    const result = await env.DB.prepare(`
      INSERT INTO financial_tasks (
        user_id, task_key, frequency, title, description, 
        category, due_date, is_completed, completion_criteria,
        progress_percentage, auto_update, task_type, notes
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      data.task_key,
      data.frequency,
      data.title,
      data.description || null,
      data.category || null,
      data.due_date || null,
      data.is_completed || 0,
      criteria,
      data.progress_percentage || 0,
      data.auto_update !== undefined ? (data.auto_update ? 1 : 0) : 1,
      taskType,
      data.notes || null
    ).run();

    // Fetch the created task
    const task = await env.DB.prepare(
      'SELECT * FROM financial_tasks WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    // Parse completion_criteria
    const parsedTask = {
      ...task,
      completion_criteria: task.completion_criteria ? JSON.parse(task.completion_criteria) : null
    };

    logInfo('Task Created', { userId: userId, taskId: result.meta.last_row_id });

    return createSuccessResponse(parsedTask, 201);

  } catch (error) {
    logError('Create Task Error', { error: error.message });
    return createErrorResponse('Failed to create task', 'CREATE_ERROR', 500);
  }
}

export async function onRequestPut(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return createErrorResponse('Database not available', 'DB_NOT_CONFIGURED', 503);
    }

    // Get authenticated user
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');

    if (!id) {
      return createErrorResponse('Task ID is required', 'VALIDATION_ERROR', 400);
    }

    // Check if task exists
    const existing = await env.DB.prepare(
      'SELECT * FROM financial_tasks WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existing) {
      return createErrorResponse('Task not found', 'NOT_FOUND', 404);
    }

    // Handle different actions
    if (action === 'toggle') {
      const newCompleted = existing.is_completed ? 0 : 1;
      const newProgress = newCompleted ? 100 : existing.progress_percentage || 0;
      
      await env.DB.prepare(`
        UPDATE financial_tasks 
        SET is_completed = ?, 
            progress_percentage = ?,
            completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `).bind(newCompleted, newProgress, newCompleted, id, userId).run();

      logInfo('Task Toggled', { userId: userId, taskId: id, completed: newCompleted });
    } else {
      // Regular update
      const data = await request.json();
      const updates = [];
      const params = [];

      if (data.title !== undefined) {
        updates.push('title = ?');
        params.push(data.title);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        params.push(data.description);
      }
      if (data.category !== undefined) {
        updates.push('category = ?');
        params.push(data.category);
      }
      if (data.due_date !== undefined) {
        updates.push('due_date = ?');
        params.push(data.due_date);
      }
      if (data.notes !== undefined) {
        updates.push('notes = ?');
        params.push(data.notes);
      }
      if (data.progress_percentage !== undefined) {
        updates.push('progress_percentage = ?');
        params.push(Math.max(0, Math.min(100, data.progress_percentage)));
      }
      if (data.auto_update !== undefined) {
        updates.push('auto_update = ?');
        params.push(data.auto_update ? 1 : 0);
      }
      if (data.completion_criteria !== undefined) {
        updates.push('completion_criteria = ?');
        params.push(typeof data.completion_criteria === 'string' 
          ? data.completion_criteria 
          : JSON.stringify(data.completion_criteria));
      }
      if (data.is_completed !== undefined) {
        updates.push('is_completed = ?');
        params.push(data.is_completed ? 1 : 0);
        if (data.is_completed) {
          updates.push('completed_at = CURRENT_TIMESTAMP');
          updates.push('progress_percentage = 100');
        } else {
          updates.push('completed_at = NULL');
        }
      }

      if (updates.length === 0) {
        return createErrorResponse('No valid fields to update', 'VALIDATION_ERROR', 400);
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id, userId);

      const query = `
        UPDATE financial_tasks 
        SET ${updates.join(', ')}
        WHERE id = ? AND user_id = ?
      `;

      await env.DB.prepare(query).bind(...params).run();

      logInfo('Task Updated', { userId: userId, taskId: id });
    }

    // Fetch updated task
    const updated = await env.DB.prepare(
      'SELECT * FROM financial_tasks WHERE id = ?'
    ).bind(id).first();

    // Parse completion_criteria
    const parsedTask = {
      ...updated,
      completion_criteria: updated.completion_criteria ? JSON.parse(updated.completion_criteria) : null
    };

    return createSuccessResponse(parsedTask);

  } catch (error) {
    logError('Update Task Error', { error: error.message });
    return createErrorResponse('Failed to update task', 'UPDATE_ERROR', 500);
  }
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  
  try {
    if (!env.DB) {
      return createErrorResponse('Database not available', 'DB_NOT_CONFIGURED', 503);
    }

    // Get authenticated user
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return createErrorResponse('Task ID is required', 'VALIDATION_ERROR', 400);
    }

    // Check if task exists
    const existing = await env.DB.prepare(
      'SELECT * FROM financial_tasks WHERE id = ? AND user_id = ?'
    ).bind(id, userId).first();

    if (!existing) {
      return createErrorResponse('Task not found', 'NOT_FOUND', 404);
    }

    // Delete task (cascade will delete task_progress records)
    await env.DB.prepare(
      'DELETE FROM financial_tasks WHERE id = ? AND user_id = ?'
    ).bind(id, userId).run();

    logInfo('Task Deleted', { userId: userId, taskId: id });

    return createSuccessResponse({ 
      message: 'Task deleted successfully'
    });

  } catch (error) {
    logError('Delete Task Error', { error: error.message });
    return createErrorResponse('Failed to delete task', 'DELETE_ERROR', 500);
  }
}
