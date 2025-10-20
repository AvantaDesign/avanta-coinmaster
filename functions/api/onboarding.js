// Onboarding API - User onboarding progress tracking
// 
// This API handles onboarding operations including:
// - Get onboarding progress for user
// - Update step completion status
// - Get recommended next steps
// - Skip steps
//
// Phase 38: Help Center and Onboarding Guide Expansion

import { getUserIdFromToken } from './auth.js';
import { getSecurityHeaders } from '../utils/security.js';
import { sanitizeString } from '../utils/validation.js';
import { logRequest, logError, logAuditEvent } from '../utils/logging.js';
import { createErrorResponse, createSuccessResponse } from '../utils/errors.js';

// Define onboarding steps
const ONBOARDING_STEPS = [
  {
    step_id: 'welcome',
    step_name: 'Bienvenida',
    description: 'Introducción a Avanta Finance',
    order: 1
  },
  {
    step_id: 'setup_accounts',
    step_name: 'Configurar Cuentas',
    description: 'Agrega tus cuentas bancarias y tarjetas',
    order: 2
  },
  {
    step_id: 'setup_categories',
    step_name: 'Definir Categorías',
    description: 'Organiza tus transacciones con categorías',
    order: 3
  },
  {
    step_id: 'first_transaction',
    step_name: 'Primera Transacción',
    description: 'Registra tu primer ingreso o gasto',
    order: 4
  },
  {
    step_id: 'deductibility_rules',
    step_name: 'Reglas de Deducibilidad',
    description: 'Automatiza la clasificación fiscal',
    order: 5
  },
  {
    step_id: 'setup_budgets',
    step_name: 'Presupuestos',
    description: 'Establece presupuestos mensuales',
    order: 6
  },
  {
    step_id: 'explore_dashboard',
    step_name: 'Explorar Dashboard',
    description: 'Conoce tu centro de control financiero',
    order: 7
  },
  {
    step_id: 'notifications',
    step_name: 'Notificaciones',
    description: 'Activa alertas importantes',
    order: 8
  },
  {
    step_id: 'complete',
    step_name: '¡Completado!',
    description: 'Ya estás listo para usar Avanta Finance',
    order: 9
  }
];

/**
 * GET /api/onboarding
 * GET /api/onboarding/progress
 * GET /api/onboarding/recommendations
 */
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname.split('/api/onboarding')[1] || '';
  
  const corsHeaders = getSecurityHeaders();

  try {
    logRequest(request, { endpoint: 'onboarding', method: 'GET', path }, env);

    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (path === '' || path === '/' || path === '/progress') {
      return handleGetProgress(env, userId, corsHeaders);
    } else if (path === '/recommendations') {
      return handleGetRecommendations(env, userId, corsHeaders);
    }

    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'Invalid onboarding endpoint'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError(error, { endpoint: 'onboarding', method: 'GET' }, env);
    return createErrorResponse(error, corsHeaders);
  }
}

/**
 * POST /api/onboarding/step
 * POST /api/onboarding/complete
 * POST /api/onboarding/skip
 */
export async function onRequestPost(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const path = url.pathname.split('/api/onboarding')[1] || '';
  
  const corsHeaders = getSecurityHeaders();

  try {
    logRequest(request, { endpoint: 'onboarding', method: 'POST', path }, env);

    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized',
        message: 'Valid authentication token required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();

    if (path === '/step') {
      return handleUpdateStep(env, userId, data, corsHeaders);
    } else if (path === '/complete') {
      return handleCompleteStep(env, userId, data, corsHeaders);
    } else if (path === '/skip') {
      return handleSkipStep(env, userId, data, corsHeaders);
    }

    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'Invalid onboarding endpoint'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError(error, { endpoint: 'onboarding', method: 'POST' }, env);
    return createErrorResponse(error, corsHeaders);
  }
}

// Helper: Get user's onboarding progress
async function handleGetProgress(env, userId, corsHeaders) {
  // Get existing progress from database
  const progress = await env.DB.prepare(`
    SELECT step_id, step_name, status, completed_at, skipped_at, metadata
    FROM user_onboarding_progress
    WHERE user_id = ?
    ORDER BY created_at ASC
  `).bind(userId).all();

  const progressMap = new Map();
  (progress.results || []).forEach(p => {
    progressMap.set(p.step_id, p);
  });

  // Merge with defined steps
  const steps = ONBOARDING_STEPS.map(step => {
    const userProgress = progressMap.get(step.step_id);
    return {
      ...step,
      status: userProgress?.status || 'pending',
      completed_at: userProgress?.completed_at || null,
      skipped_at: userProgress?.skipped_at || null,
      metadata: userProgress?.metadata ? JSON.parse(userProgress.metadata) : null
    };
  });

  // Calculate overall progress
  const completed = steps.filter(s => s.status === 'completed').length;
  const total = steps.length;
  const percentage = Math.round((completed / total) * 100);

  return new Response(JSON.stringify({
    success: true,
    data: {
      steps,
      progress: {
        completed,
        total,
        percentage
      }
    }
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper: Get personalized recommendations
async function handleGetRecommendations(env, userId, corsHeaders) {
  const recommendations = [];

  // Check if user has accounts
  const accountsCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM accounts WHERE user_id = ? AND is_active = 1
  `).bind(userId).first();

  if (accountsCount.count === 0) {
    recommendations.push({
      type: 'action',
      priority: 'high',
      title: 'Configura tus cuentas',
      description: 'Agrega al menos una cuenta bancaria para comenzar',
      action: '/accounts',
      step_id: 'setup_accounts'
    });
  }

  // Check if user has categories
  const categoriesCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM categories WHERE user_id = ? AND is_active = 1
  `).bind(userId).first();

  if (categoriesCount.count === 0) {
    recommendations.push({
      type: 'action',
      priority: 'high',
      title: 'Define tus categorías',
      description: 'Crea categorías para organizar tus transacciones',
      action: '/categories',
      step_id: 'setup_categories'
    });
  }

  // Check if user has transactions
  const transactionsCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM transactions WHERE user_id = ? AND is_deleted = 0
  `).bind(userId).first();

  if (transactionsCount.count === 0) {
    recommendations.push({
      type: 'action',
      priority: 'high',
      title: 'Registra tu primera transacción',
      description: 'Comienza a registrar tus ingresos y gastos',
      action: '/transactions',
      step_id: 'first_transaction'
    });
  }

  // Check if user has deductibility rules
  const rulesCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM deductibility_rules WHERE user_id = ? AND is_active = 1
  `).bind(userId).first();

  if (rulesCount.count === 0 && transactionsCount.count > 0) {
    recommendations.push({
      type: 'action',
      priority: 'medium',
      title: 'Crea reglas de deducibilidad',
      description: 'Automatiza la clasificación fiscal de tus gastos',
      action: '/deductibility-rules',
      step_id: 'deductibility_rules'
    });
  }

  // Check if user has budgets
  const budgetsCount = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM budgets WHERE user_id = ? AND is_active = 1
  `).bind(userId).first();

  if (budgetsCount.count === 0 && transactionsCount.count > 0) {
    recommendations.push({
      type: 'action',
      priority: 'medium',
      title: 'Establece presupuestos',
      description: 'Define límites de gasto para tus categorías',
      action: '/budgets',
      step_id: 'setup_budgets'
    });
  }

  return new Response(JSON.stringify({
    success: true,
    data: recommendations
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper: Update step status
async function handleUpdateStep(env, userId, data, corsHeaders) {
  const { step_id, status, metadata } = data;

  if (!step_id || !status) {
    return new Response(JSON.stringify({
      error: 'Invalid Request',
      message: 'step_id and status are required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const validStatuses = ['pending', 'in_progress', 'completed', 'skipped'];
  if (!validStatuses.includes(status)) {
    return new Response(JSON.stringify({
      error: 'Invalid Request',
      message: 'Invalid status value'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const step = ONBOARDING_STEPS.find(s => s.step_id === step_id);
  if (!step) {
    return new Response(JSON.stringify({
      error: 'Invalid Request',
      message: 'Invalid step_id'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  // Upsert progress
  await env.DB.prepare(`
    INSERT INTO user_onboarding_progress (user_id, step_id, step_name, status, metadata, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, step_id) DO UPDATE SET
      status = excluded.status,
      metadata = excluded.metadata,
      updated_at = CURRENT_TIMESTAMP
  `).bind(userId, step_id, step.step_name, status, metadataJson).run();

  logAuditEvent(env, userId, 'onboarding_step_updated', { step_id, status });

  return new Response(JSON.stringify({
    success: true,
    message: 'Step updated successfully'
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper: Complete a step
async function handleCompleteStep(env, userId, data, corsHeaders) {
  const { step_id, metadata } = data;

  if (!step_id) {
    return new Response(JSON.stringify({
      error: 'Invalid Request',
      message: 'step_id is required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const step = ONBOARDING_STEPS.find(s => s.step_id === step_id);
  if (!step) {
    return new Response(JSON.stringify({
      error: 'Invalid Request',
      message: 'Invalid step_id'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  await env.DB.prepare(`
    INSERT INTO user_onboarding_progress (user_id, step_id, step_name, status, completed_at, metadata, updated_at)
    VALUES (?, ?, ?, 'completed', CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, step_id) DO UPDATE SET
      status = 'completed',
      completed_at = CURRENT_TIMESTAMP,
      metadata = excluded.metadata,
      updated_at = CURRENT_TIMESTAMP
  `).bind(userId, step_id, step.step_name, metadataJson).run();

  logAuditEvent(env, userId, 'onboarding_step_completed', { step_id });

  return new Response(JSON.stringify({
    success: true,
    message: 'Step completed successfully'
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Helper: Skip a step
async function handleSkipStep(env, userId, data, corsHeaders) {
  const { step_id } = data;

  if (!step_id) {
    return new Response(JSON.stringify({
      error: 'Invalid Request',
      message: 'step_id is required'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const step = ONBOARDING_STEPS.find(s => s.step_id === step_id);
  if (!step) {
    return new Response(JSON.stringify({
      error: 'Invalid Request',
      message: 'Invalid step_id'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  await env.DB.prepare(`
    INSERT INTO user_onboarding_progress (user_id, step_id, step_name, status, skipped_at, updated_at)
    VALUES (?, ?, ?, 'skipped', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, step_id) DO UPDATE SET
      status = 'skipped',
      skipped_at = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
  `).bind(userId, step_id, step.step_name).run();

  logAuditEvent(env, userId, 'onboarding_step_skipped', { step_id });

  return new Response(JSON.stringify({
    success: true,
    message: 'Step skipped successfully'
  }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: getSecurityHeaders()
  });
}
