// Task Templates API - Manage Task Templates
// Phase 36: Task System Redesign as Interactive Guide

import { getUserIdFromToken } from './auth.js';
import { getSecurityHeaders } from '../utils/security.js';
import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';
import { logInfo, logError } from '../utils/logging.js';

/**
 * Task Templates: Predefined task templates for quick task creation
 */

export async function onRequestOptions(context) {
  const corsHeaders = getSecurityHeaders();
  return new Response(null, { headers: corsHeaders });
}

/**
 * GET /api/task-templates
 * List available task templates
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
    const templateId = pathParts[pathParts.length - 1];

    // If templateId is provided and is a number, get specific template
    if (templateId && !isNaN(parseInt(templateId))) {
      return await getTemplateById(env, templateId);
    }

    // Get all templates
    const templateType = url.searchParams.get('type');
    const category = url.searchParams.get('category');

    let query = `
      SELECT 
        id, template_name, template_type, description,
        completion_criteria, priority, category,
        estimated_duration, help_text, default_auto_update, is_active
      FROM task_templates
      WHERE is_active = 1
    `;
    const params = [];

    if (templateType) {
      query += ' AND template_type = ?';
      params.push(templateType);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY priority ASC, template_name ASC';

    const { results: templates } = await env.DB.prepare(query).bind(...params).all();

    // Parse JSON fields
    const parsedTemplates = templates.map(template => ({
      ...template,
      completion_criteria: JSON.parse(template.completion_criteria || '{}')
    }));

    // Group by category
    const groupedByCategory = parsedTemplates.reduce((acc, template) => {
      const cat = template.category || 'other';
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(template);
      return acc;
    }, {});

    return createSuccessResponse({
      templates: parsedTemplates,
      grouped: groupedByCategory,
      total: templates.length
    });

  } catch (error) {
    logError('Get Templates Error', { error: error.message });
    return createErrorResponse('Failed to get templates', 'GET_ERROR', 500);
  }
}

/**
 * POST /api/task-templates
 * Create task from template
 */
export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const body = await request.json();
    const { template_id, due_date, frequency, custom_criteria } = body;

    if (!template_id) {
      return createErrorResponse('Template ID is required', 'VALIDATION_ERROR', 400);
    }

    // Get template
    const template = await env.DB.prepare(`
      SELECT * FROM task_templates WHERE id = ? AND is_active = 1
    `).bind(template_id).first();

    if (!template) {
      return createErrorResponse('Template not found', 'NOT_FOUND', 404);
    }

    // Determine frequency from template_type if not provided
    const taskFrequency = frequency || template.template_type;
    const taskDueDate = due_date || new Date().toISOString().split('T')[0];

    // Check if task already exists
    const existing = await env.DB.prepare(`
      SELECT id FROM financial_tasks
      WHERE user_id = ? AND task_key = ? AND due_date = ?
    `).bind(user.id, template.template_name, taskDueDate).first();

    if (existing) {
      return createErrorResponse('Task already exists for this period', 'DUPLICATE_ERROR', 409);
    }

    // Use custom criteria if provided, otherwise use template criteria
    const criteria = custom_criteria || template.completion_criteria;

    // Determine task_type based on criteria
    let taskType = 'manual';
    try {
      const parsedCriteria = typeof criteria === 'string' ? JSON.parse(criteria) : criteria;
      if (parsedCriteria.type === 'declaration') {
        taskType = 'declaration';
      } else if (parsedCriteria.type && parsedCriteria.type !== 'manual') {
        taskType = 'auto';
      }
    } catch (e) {
      // Keep as manual if parsing fails
    }

    // Create task from template
    const result = await env.DB.prepare(`
      INSERT INTO financial_tasks (
        user_id, task_key, frequency, title, description,
        category, due_date, is_completed, completion_criteria,
        progress_percentage, auto_update, task_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?)
    `).bind(
      userId,
      template.template_name,
      taskFrequency,
      template.template_name,
      template.description,
      template.category,
      taskDueDate,
      typeof criteria === 'string' ? criteria : JSON.stringify(criteria),
      template.default_auto_update,
      taskType
    ).run();

    const task = await env.DB.prepare(`
      SELECT * FROM financial_tasks WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    logInfo('Task Created from Template', {
      userId: userId,
      templateId: template_id,
      taskId: result.meta.last_row_id
    });

    return createSuccessResponse({
      message: 'Task created successfully from template',
      task: {
        ...task,
        completion_criteria: JSON.parse(task.completion_criteria || '{}')
      },
      template: {
        id: template.id,
        name: template.template_name,
        help_text: template.help_text,
        estimated_duration: template.estimated_duration
      }
    }, 201);

  } catch (error) {
    logError('Create Task from Template Error', { error: error.message });
    return createErrorResponse('Failed to create task from template', 'CREATE_ERROR', 500);
  }
}

/**
 * PUT /api/task-templates/:id
 * Update a task template (admin only)
 */
export async function onRequestPut(context) {
  const { env, request } = context;

  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Check if user is admin
    const user = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first();
    if (!user || user.role !== 'admin') {
      return createErrorResponse('Unauthorized - Admin access required', 'UNAUTHORIZED', 403);
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const templateId = pathParts[pathParts.length - 1];

    if (!templateId || isNaN(parseInt(templateId))) {
      return createErrorResponse('Valid template ID is required', 'VALIDATION_ERROR', 400);
    }

    const body = await request.json();

    // Build update query
    const updates = [];
    const params = [];

    if (body.template_name !== undefined) {
      updates.push('template_name = ?');
      params.push(body.template_name);
    }
    if (body.template_type !== undefined) {
      updates.push('template_type = ?');
      params.push(body.template_type);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      params.push(body.description);
    }
    if (body.completion_criteria !== undefined) {
      updates.push('completion_criteria = ?');
      params.push(typeof body.completion_criteria === 'string' 
        ? body.completion_criteria 
        : JSON.stringify(body.completion_criteria));
    }
    if (body.priority !== undefined) {
      updates.push('priority = ?');
      params.push(body.priority);
    }
    if (body.category !== undefined) {
      updates.push('category = ?');
      params.push(body.category);
    }
    if (body.estimated_duration !== undefined) {
      updates.push('estimated_duration = ?');
      params.push(body.estimated_duration);
    }
    if (body.help_text !== undefined) {
      updates.push('help_text = ?');
      params.push(body.help_text);
    }
    if (body.default_auto_update !== undefined) {
      updates.push('default_auto_update = ?');
      params.push(body.default_auto_update ? 1 : 0);
    }
    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(body.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return createErrorResponse('No valid fields to update', 'VALIDATION_ERROR', 400);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(templateId);

    const query = `
      UPDATE task_templates
      SET ${updates.join(', ')}
      WHERE id = ?
    `;

    await env.DB.prepare(query).bind(...params).run();

    const updated = await env.DB.prepare(`
      SELECT * FROM task_templates WHERE id = ?
    `).bind(templateId).first();

    logInfo('Template Updated', { userId: userId, templateId });

    return createSuccessResponse({
      message: 'Template updated successfully',
      template: {
        ...updated,
        completion_criteria: JSON.parse(updated.completion_criteria || '{}')
      }
    });

  } catch (error) {
    logError('Update Template Error', { error: error.message });
    return createErrorResponse('Failed to update template', 'UPDATE_ERROR', 500);
  }
}

/**
 * DELETE /api/task-templates/:id
 * Deactivate a task template (soft delete)
 */
export async function onRequestDelete(context) {
  const { env, request } = context;

  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return createErrorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Check if user is admin
    const user = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(userId).first();
    if (!user || user.role !== 'admin') {
      return createErrorResponse('Unauthorized - Admin access required', 'UNAUTHORIZED', 403);
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const templateId = pathParts[pathParts.length - 1];

    if (!templateId || isNaN(parseInt(templateId))) {
      return createErrorResponse('Valid template ID is required', 'VALIDATION_ERROR', 400);
    }

    // Soft delete by setting is_active to 0
    await env.DB.prepare(`
      UPDATE task_templates
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(templateId).run();

    logInfo('Template Deactivated', { userId: userId, templateId });

    return createSuccessResponse({
      message: 'Template deactivated successfully'
    });

  } catch (error) {
    logError('Delete Template Error', { error: error.message });
    return createErrorResponse('Failed to deactivate template', 'DELETE_ERROR', 500);
  }
}

/**
 * Get template by ID
 */
async function getTemplateById(db, templateId) {
  try {
    const template = await db.prepare(`
      SELECT 
        id, template_name, template_type, description,
        completion_criteria, priority, category,
        estimated_duration, help_text, default_auto_update, is_active,
        created_at, updated_at
      FROM task_templates
      WHERE id = ? AND is_active = 1
    `).bind(templateId).first();

    if (!template) {
      return createErrorResponse('Template not found', 'NOT_FOUND', 404);
    }

    return createSuccessResponse({
      template: {
        ...template,
        completion_criteria: JSON.parse(template.completion_criteria || '{}')
      }
    });

  } catch (error) {
    logError('Get Template By ID Error', { error: error.message });
    throw error;
  }
}
