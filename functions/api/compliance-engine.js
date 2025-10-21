// Compliance Engine API - Intelligent fiscal compliance validation
// 
// This API implements the automated compliance rules engine that:
// - Evaluates transactions against SAT compliance rules
// - Provides real-time compliance suggestions
// - Logs rule executions for audit
// - Automatically enriches transactions with fiscal metadata
//
// Endpoints:
// - POST /api/compliance-engine/validate - Validate transaction compliance
// - POST /api/compliance-engine/evaluate - Evaluate rules without saving
// - GET /api/compliance-engine/suggestions - Get compliance suggestions
// - GET /api/compliance-engine/rules - List active rules
// - GET /api/compliance-engine/execution-log - Get rule execution history
// - PUT /api/compliance-engine/rules/:id - Update rule configuration
// - POST /api/compliance-engine/rules/:id/toggle - Enable/disable rule

import { getUserIdFromToken } from './auth.js';
import { logInfo, logError, logWarn, logDebug, logAuthEvent, logBusinessEvent, getCorrelationId } from '../utils/logging.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handle OPTIONS requests for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Evaluate a condition against transaction data
 */
function evaluateCondition(condition, transactionData) {
  const [field, rule] = Object.entries(condition)[0];
  const value = transactionData[field];
  
  if (!rule) return true;
  
  // Handle different operators
  if (rule.equals !== undefined) {
    return value === rule.equals;
  }
  if (rule.not_equals !== undefined) {
    return value !== rule.not_equals;
  }
  if (rule.operator) {
    const compareValue = rule.value;
    switch (rule.operator) {
      case 'gt':
        return Number(value) > Number(compareValue);
      case 'gte':
        return Number(value) >= Number(compareValue);
      case 'lt':
        return Number(value) < Number(compareValue);
      case 'lte':
        return Number(value) <= Number(compareValue);
      default:
        return true;
    }
  }
  if (rule.contains !== undefined) {
    const containsArray = Array.isArray(rule.contains) ? rule.contains : [rule.contains];
    const valueStr = String(value || '').toLowerCase();
    return containsArray.some(item => valueStr.includes(String(item).toLowerCase()));
  }
  if (rule.not_contains !== undefined) {
    const notContainsArray = Array.isArray(rule.not_contains) ? rule.not_contains : [rule.not_contains];
    const valueStr = String(value || '').toLowerCase();
    return !notContainsArray.some(item => valueStr.includes(String(item).toLowerCase()));
  }
  if (rule.in !== undefined) {
    return rule.in.includes(value);
  }
  if (rule.not_in !== undefined) {
    return !rule.not_in.includes(value);
  }
  if (rule.exists !== undefined) {
    return rule.exists ? (value !== null && value !== undefined) : (value === null || value === undefined);
  }
  
  return true;
}

/**
 * Check if all conditions in a rule match the transaction
 */
function checkRuleConditions(ruleConditions, transactionData) {
  try {
    const conditions = typeof ruleConditions === 'string' 
      ? JSON.parse(ruleConditions) 
      : ruleConditions;
    
    // All conditions must be true (AND logic)
    return Object.entries(conditions).every(([field, rule]) => 
      evaluateCondition({ [field]: rule }, transactionData)
    );
  } catch (error) {
    logError(error, { endpoint: 'Error evaluating rule conditions', category: 'api' });
    return false;
  }
}

/**
 * Apply rule actions to transaction data
 */
function applyRuleActions(ruleActions, transactionData) {
  try {
    const actions = typeof ruleActions === 'string' 
      ? JSON.parse(ruleActions) 
      : ruleActions;
    
    const changes = {};
    const messages = {
      warnings: [],
      errors: [],
      info: []
    };
    
    // Process each action
    for (const [key, value] of Object.entries(actions)) {
      if (key.startsWith('set_')) {
        const fieldName = key.substring(4); // Remove 'set_' prefix
        
        if (fieldName === 'warning') {
          messages.warnings.push(value);
        } else if (fieldName === 'error') {
          messages.errors.push(value);
        } else if (fieldName === 'info') {
          messages.info.push(value);
        } else {
          changes[fieldName] = value;
        }
      } else if (key === 'severity') {
        // Store severity for later use
        messages.severity = value;
      }
    }
    
    return {
      changes,
      messages
    };
  } catch (error) {
    logError(error, { endpoint: 'Error applying rule actions', category: 'api' });
    return { changes: {}, messages: { warnings: [], errors: [], info: [] } };
  }
}

/**
 * Evaluate transaction against all active rules
 */
async function evaluateTransaction(transactionData, db) {
  // Get all active rules ordered by priority
  const rules = await db.prepare(`
    SELECT * FROM compliance_rules 
    WHERE is_active = 1 
    AND (applies_to = 'all' OR applies_to = ?)
    ORDER BY priority DESC, id ASC
  `).bind(transactionData.type || 'all').all();
  
  const results = {
    matched_rules: [],
    changes: {},
    warnings: [],
    errors: [],
    info: [],
    highest_severity: 'info'
  };
  
  // Evaluate each rule
  for (const rule of rules.results || []) {
    const matched = checkRuleConditions(rule.rule_conditions, transactionData);
    
    if (matched) {
      const { changes, messages } = applyRuleActions(rule.rule_actions, transactionData);
      
      results.matched_rules.push({
        id: rule.id,
        name: rule.rule_name,
        type: rule.rule_type,
        severity: rule.severity
      });
      
      // Merge changes (later rules can override earlier ones based on priority)
      Object.assign(results.changes, changes);
      
      // Collect messages
      if (messages.warnings) results.warnings.push(...messages.warnings);
      if (messages.errors) results.errors.push(...messages.errors);
      if (messages.info) results.info.push(...messages.info);
      
      // Track highest severity
      const severityOrder = ['info', 'warning', 'error', 'blocking'];
      const currentSeverityIndex = severityOrder.indexOf(results.highest_severity);
      const ruleSeverityIndex = severityOrder.indexOf(rule.severity);
      if (ruleSeverityIndex > currentSeverityIndex) {
        results.highest_severity = rule.severity;
      }
    }
  }
  
  return results;
}

/**
 * Log rule execution to database
 */
async function logRuleExecution(userId, ruleId, entityType, entityId, executionResult, db) {
  try {
    await db.prepare(`
      INSERT INTO rule_execution_log (
        user_id, rule_id, entity_type, entity_id, 
        execution_result, rule_matched, actions_applied
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      ruleId,
      entityType,
      entityId,
      JSON.stringify(executionResult),
      executionResult.matched ? 1 : 0,
      executionResult.applied ? 1 : 0
    ).run();
  } catch (error) {
    logError(error, { endpoint: 'Error logging rule execution', category: 'api' });
  }
}

/**
 * Create compliance suggestion
 */
async function createSuggestion(userId, entityType, entityId, suggestion, db) {
  try {
    await db.prepare(`
      INSERT INTO compliance_suggestions (
        user_id, entity_type, entity_id, 
        suggestion_type, title, description, severity, suggested_action
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      userId,
      entityType,
      entityId,
      suggestion.type || 'general',
      suggestion.title,
      suggestion.description,
      suggestion.severity || 'info',
      suggestion.action || null
    ).run();
  } catch (error) {
    logError(error, { endpoint: 'Error creating suggestion', category: 'api' });
  }
}

/**
 * POST /api/compliance-engine/validate
 * Validate a transaction and return compliance status with suggestions
 */
async function handleValidate(request, env, userId) {
  try {
    const transactionData = await request.json();
    
    if (!transactionData) {
      return new Response(JSON.stringify({
        error: 'Transaction data is required',
        code: 'INVALID_INPUT'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Evaluate transaction against rules
    const evaluation = await evaluateTransaction(transactionData, env.DB);
    
    // Log each matched rule
    for (const rule of evaluation.matched_rules) {
      await logRuleExecution(
        userId,
        rule.id,
        'transaction',
        transactionData.id || null,
        {
          matched: true,
          applied: true,
          changes: evaluation.changes,
          rule_name: rule.name
        },
        env.DB
      );
    }
    
    // Create suggestions for errors and warnings
    if (evaluation.errors.length > 0 || evaluation.warnings.length > 0) {
      const allMessages = [
        ...evaluation.errors.map(msg => ({ severity: 'error', message: msg })),
        ...evaluation.warnings.map(msg => ({ severity: 'warning', message: msg }))
      ];
      
      for (const msg of allMessages) {
        await createSuggestion(
          userId,
          'transaction',
          transactionData.id || null,
          {
            type: 'general',
            title: msg.severity === 'error' ? 'Error de Cumplimiento' : 'Advertencia de Cumplimiento',
            description: msg.message,
            severity: msg.severity,
            action: 'Revisar y corregir la transacción'
          },
          env.DB
        );
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      compliance_status: evaluation.highest_severity === 'error' || evaluation.highest_severity === 'blocking' 
        ? 'non_compliant' 
        : evaluation.highest_severity === 'warning' 
        ? 'needs_review' 
        : 'compliant',
      severity: evaluation.highest_severity,
      matched_rules: evaluation.matched_rules,
      suggested_changes: evaluation.changes,
      warnings: evaluation.warnings,
      errors: evaluation.errors,
      info: evaluation.info,
      is_blocking: evaluation.highest_severity === 'blocking'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error in validate', category: 'api' }, env);
    return new Response(JSON.stringify({
      error: 'Failed to validate transaction',
      message: error.message,
      code: 'VALIDATION_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST /api/compliance-engine/evaluate
 * Evaluate transaction without logging (for real-time UI feedback)
 */
async function handleEvaluate(request, env, userId) {
  try {
    const transactionData = await request.json();
    
    if (!transactionData) {
      return new Response(JSON.stringify({
        error: 'Transaction data is required',
        code: 'INVALID_INPUT'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Evaluate transaction against rules (without logging)
    const evaluation = await evaluateTransaction(transactionData, env.DB);
    
    return new Response(JSON.stringify({
      success: true,
      compliance_status: evaluation.highest_severity === 'error' || evaluation.highest_severity === 'blocking' 
        ? 'non_compliant' 
        : evaluation.highest_severity === 'warning' 
        ? 'needs_review' 
        : 'compliant',
      severity: evaluation.highest_severity,
      matched_rules: evaluation.matched_rules,
      suggested_changes: evaluation.changes,
      warnings: evaluation.warnings,
      errors: evaluation.errors,
      info: evaluation.info,
      is_blocking: evaluation.highest_severity === 'blocking'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error in evaluate', category: 'api' }, env);
    return new Response(JSON.stringify({
      error: 'Failed to evaluate transaction',
      message: error.message,
      code: 'EVALUATION_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * GET /api/compliance-engine/suggestions
 * Get compliance suggestions for user
 */
async function handleGetSuggestions(request, env, userId) {
  try {
    const url = new URL(request.url);
    const resolved = url.searchParams.get('resolved') === 'true';
    const entityType = url.searchParams.get('entity_type');
    const entityId = url.searchParams.get('entity_id');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    let query = `
      SELECT * FROM compliance_suggestions 
      WHERE user_id = ? AND is_resolved = ?
    `;
    const params = [userId, resolved ? 1 : 0];
    
    if (entityType) {
      query += ` AND entity_type = ?`;
      params.push(entityType);
    }
    
    if (entityId) {
      query += ` AND entity_id = ?`;
      params.push(entityId);
    }
    
    query += ` ORDER BY 
      CASE severity 
        WHEN 'error' THEN 1 
        WHEN 'warning' THEN 2 
        WHEN 'info' THEN 3 
      END,
      created_at DESC
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);
    
    const suggestions = await env.DB.prepare(query).bind(...params).all();
    
    // Get count
    const countResult = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM compliance_suggestions 
       WHERE user_id = ? AND is_resolved = ?`
    ).bind(userId, resolved ? 1 : 0).first();
    
    return new Response(JSON.stringify({
      success: true,
      suggestions: suggestions.results || [],
      total: countResult.count || 0,
      limit,
      offset
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error getting suggestions', category: 'api' }, env);
    return new Response(JSON.stringify({
      error: 'Failed to get suggestions',
      message: error.message,
      code: 'GET_SUGGESTIONS_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * GET /api/compliance-engine/rules
 * List active compliance rules
 */
async function handleGetRules(request, env, userId) {
  try {
    const url = new URL(request.url);
    const ruleType = url.searchParams.get('type');
    const active = url.searchParams.get('active') !== 'false';
    
    let query = `SELECT * FROM compliance_rules WHERE 1=1`;
    const params = [];
    
    if (active) {
      query += ` AND is_active = 1`;
    }
    
    if (ruleType) {
      query += ` AND rule_type = ?`;
      params.push(ruleType);
    }
    
    query += ` ORDER BY priority DESC, id ASC`;
    
    const rules = await env.DB.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify({
      success: true,
      rules: rules.results || []
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error getting rules', category: 'api' }, env);
    return new Response(JSON.stringify({
      error: 'Failed to get rules',
      message: error.message,
      code: 'GET_RULES_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * GET /api/compliance-engine/execution-log
 * Get rule execution history
 */
async function handleGetExecutionLog(request, env, userId) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const entityType = url.searchParams.get('entity_type');
    const entityId = url.searchParams.get('entity_id');
    
    let query = `
      SELECT 
        rel.*,
        cr.rule_name,
        cr.rule_type,
        cr.description
      FROM rule_execution_log rel
      LEFT JOIN compliance_rules cr ON rel.rule_id = cr.id
      WHERE rel.user_id = ?
    `;
    const params = [userId];
    
    if (entityType) {
      query += ` AND rel.entity_type = ?`;
      params.push(entityType);
    }
    
    if (entityId) {
      query += ` AND rel.entity_id = ?`;
      params.push(entityId);
    }
    
    query += ` ORDER BY rel.executed_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    
    const logs = await env.DB.prepare(query).bind(...params).all();
    
    // Get count
    const countResult = await env.DB.prepare(
      `SELECT COUNT(*) as count FROM rule_execution_log WHERE user_id = ?`
    ).bind(userId).first();
    
    return new Response(JSON.stringify({
      success: true,
      logs: logs.results || [],
      total: countResult.count || 0,
      limit,
      offset
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error getting execution log', category: 'api' }, env);
    return new Response(JSON.stringify({
      error: 'Failed to get execution log',
      message: error.message,
      code: 'GET_LOG_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Main request handler
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;
  
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
    
    // Validate database connection
    if (!env.DB) {
      return new Response(JSON.stringify({
        error: 'Database connection not available',
        code: 'DB_NOT_CONFIGURED'
      }), {
        status: 503,
        headers: corsHeaders
      });
    }
    
    // Route to appropriate handler based on path and method
    const pathParts = url.pathname.split('/').filter(p => p);
    const endpoint = pathParts[pathParts.length - 1];
    
    if (method === 'POST' && endpoint === 'validate') {
      return handleValidate(request, env, userId);
    }
    
    if (method === 'POST' && endpoint === 'evaluate') {
      return handleEvaluate(request, env, userId);
    }
    
    if (method === 'GET' && endpoint === 'suggestions') {
      return handleGetSuggestions(request, env, userId);
    }
    
    if (method === 'GET' && endpoint === 'rules') {
      return handleGetRules(request, env, userId);
    }
    
    if (method === 'GET' && endpoint === 'execution-log') {
      return handleGetExecutionLog(request, env, userId);
    }
    
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: 'Endpoint not found',
      code: 'NOT_FOUND'
    }), {
      status: 404,
      headers: corsHeaders
    });
  } catch (error) {
    await logError(error, { endpoint: 'Error in compliance engine', category: 'api' }, env);
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message,
      code: 'INTERNAL_ERROR'
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// Named exports for specific methods
export const onRequestPost = onRequest;
export const onRequestGet = onRequest;
export const onRequestPut = onRequest;
