// Compliance Monitoring API - Real-time compliance tracking and alerts
//
// This API handles all compliance monitoring operations including:
// - Run compliance checks for specific periods
// - Get compliance status and scores
// - Generate compliance alerts
// - Track compliance issues and recommendations
// - Generate compliance reports
//
// Endpoints:
// - GET /api/compliance-monitoring - List compliance checks with filtering
// - GET /api/compliance-monitoring/:id - Get single compliance check
// - GET /api/compliance-monitoring/alerts - Get compliance alerts
// - GET /api/compliance-monitoring/reports - Generate compliance reports
// - POST /api/compliance-monitoring - Run compliance check
// - PUT /api/compliance-monitoring/:id - Update compliance status
// - DELETE /api/compliance-monitoring/:id - Delete compliance check

import { getUserIdFromToken } from './auth.js';

// CORS headers
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * OPTIONS handler for CORS
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * GET handler - List compliance checks or get single check
 */
export async function onRequestGet({ request, env, params }) {
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    // Handle alerts endpoint
    if (pathname.includes('/alerts')) {
      return getComplianceAlerts(env, userId, url);
    }

    // Handle reports endpoint
    if (pathname.includes('/reports')) {
      return generateComplianceReport(env, userId, url);
    }

    // Handle single check retrieval
    if (params.id) {
      return getSingleComplianceCheck(env, userId, params.id);
    }

    // Handle list with filters
    return listComplianceChecks(env, userId, url);
  } catch (error) {
    console.error('Error in compliance-monitoring GET:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * POST handler - Run compliance check
 */
export async function onRequestPost({ request, env }) {
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    const {
      compliance_type = 'fiscal',
      period_year,
      period_month
    } = body;

    // Validate required fields
    if (!period_year) {
      return new Response(JSON.stringify({ 
        error: 'Missing required field: period_year' 
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Run compliance check
    const complianceResult = await runComplianceCheck(
      env,
      userId,
      compliance_type,
      period_year,
      period_month
    );

    // Insert compliance check result
    const result = await env.DB.prepare(`
      INSERT INTO compliance_monitoring (
        user_id, compliance_type, period_year, period_month,
        compliance_score, status, issues_found, recommendations,
        next_check, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+30 days'), ?)
    `).bind(
      userId,
      compliance_type,
      period_year,
      period_month,
      complianceResult.score,
      complianceResult.status,
      JSON.stringify(complianceResult.issues),
      JSON.stringify(complianceResult.recommendations),
      JSON.stringify(complianceResult.metadata)
    ).run();

    // Log audit trail
    await logAuditTrail(env, userId, 'create', 'compliance', result.meta.last_row_id, {
      compliance_type,
      period_year,
      period_month,
      score: complianceResult.score
    });

    return new Response(JSON.stringify({
      success: true,
      id: result.meta.last_row_id,
      compliance_score: complianceResult.score,
      status: complianceResult.status,
      issues: complianceResult.issues,
      recommendations: complianceResult.recommendations
    }), {
      status: 201,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in compliance-monitoring POST:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * PUT handler - Update compliance status
 */
export async function onRequestPut({ request, env, params }) {
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    if (!params.id) {
      return new Response(JSON.stringify({ error: 'Compliance check ID required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const body = await request.json();
    const {
      status,
      resolution_notes
    } = body;

    // Verify compliance check exists and belongs to user
    const check = await env.DB.prepare(`
      SELECT * FROM compliance_monitoring
      WHERE id = ? AND user_id = ?
    `).bind(params.id, userId).first();

    if (!check) {
      return new Response(JSON.stringify({ error: 'Compliance check not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
      
      if (status === 'resolved') {
        updates.push('resolved_date = CURRENT_TIMESTAMP');
        updates.push('resolved_by = ?');
        values.push(userId);
      }
    }

    if (resolution_notes !== undefined) {
      updates.push('resolution_notes = ?');
      values.push(resolution_notes);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({ error: 'No fields to update' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    values.push(params.id);
    values.push(userId);

    await env.DB.prepare(`
      UPDATE compliance_monitoring
      SET ${updates.join(', ')}
      WHERE id = ? AND user_id = ?
    `).bind(...values).run();

    // Log audit trail
    await logAuditTrail(env, userId, 'update', 'compliance', params.id, {
      updated_fields: Object.keys(body),
      new_status: status
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Compliance check updated successfully'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in compliance-monitoring PUT:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * DELETE handler - Delete compliance check
 */
export async function onRequestDelete({ request, env, params }) {
  try {
    const userId = await getUserIdFromToken(request, env);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders
      });
    }

    if (!params.id) {
      return new Response(JSON.stringify({ error: 'Compliance check ID required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verify compliance check exists and belongs to user
    const check = await env.DB.prepare(`
      SELECT * FROM compliance_monitoring
      WHERE id = ? AND user_id = ?
    `).bind(params.id, userId).first();

    if (!check) {
      return new Response(JSON.stringify({ error: 'Compliance check not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    await env.DB.prepare(`
      DELETE FROM compliance_monitoring
      WHERE id = ? AND user_id = ?
    `).bind(params.id, userId).run();

    // Log audit trail
    await logAuditTrail(env, userId, 'delete', 'compliance', params.id, {
      compliance_type: check.compliance_type,
      period: `${check.period_year}-${check.period_month || 'annual'}`
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Compliance check deleted'
    }), {
      status: 200,
      headers: corsHeaders
    });
  } catch (error) {
    console.error('Error in compliance-monitoring DELETE:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Helper: List compliance checks with filtering
 */
async function listComplianceChecks(env, userId, url) {
  const complianceType = url.searchParams.get('type');
  const status = url.searchParams.get('status');
  const year = url.searchParams.get('year');
  const month = url.searchParams.get('month');
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 50, 100);
  const offset = (page - 1) * limit;

  // Build query
  let query = `
    SELECT * FROM compliance_monitoring
    WHERE user_id = ?
  `;
  const params = [userId];

  if (complianceType) {
    query += ` AND compliance_type = ?`;
    params.push(complianceType);
  }

  if (status) {
    query += ` AND status = ?`;
    params.push(status);
  }

  if (year) {
    query += ` AND period_year = ?`;
    params.push(parseInt(year));
  }

  if (month) {
    query += ` AND period_month = ?`;
    params.push(parseInt(month));
  }

  // Get total count
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const countResult = await env.DB.prepare(countQuery).bind(...params).first();
  const total = countResult.count;

  // Get paginated results
  query += ` ORDER BY last_checked DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const { results } = await env.DB.prepare(query).bind(...params).all();

  // Parse JSON fields
  const checks = results.map(check => ({
    ...check,
    issues_found: check.issues_found ? JSON.parse(check.issues_found) : [],
    recommendations: check.recommendations ? JSON.parse(check.recommendations) : [],
    metadata: check.metadata ? JSON.parse(check.metadata) : {}
  }));

  return new Response(JSON.stringify({
    checks,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Helper: Get single compliance check
 */
async function getSingleComplianceCheck(env, userId, checkId) {
  const check = await env.DB.prepare(`
    SELECT * FROM compliance_monitoring
    WHERE id = ? AND user_id = ?
  `).bind(checkId, userId).first();

  if (!check) {
    return new Response(JSON.stringify({ error: 'Compliance check not found' }), {
      status: 404,
      headers: corsHeaders
    });
  }

  // Parse JSON fields
  check.issues_found = check.issues_found ? JSON.parse(check.issues_found) : [];
  check.recommendations = check.recommendations ? JSON.parse(check.recommendations) : [];
  check.metadata = check.metadata ? JSON.parse(check.metadata) : {};

  return new Response(JSON.stringify(check), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Helper: Get compliance alerts
 */
async function getComplianceAlerts(env, userId, url) {
  const severity = url.searchParams.get('severity') || 'all';
  const limit = Math.min(parseInt(url.searchParams.get('limit')) || 20, 50);

  let query = `
    SELECT * FROM compliance_monitoring
    WHERE user_id = ?
      AND status IN ('warning', 'non_compliant', 'critical')
      AND (resolved_date IS NULL OR resolved_date = '')
  `;
  const params = [userId];

  if (severity !== 'all') {
    query += ` AND status = ?`;
    params.push(severity);
  }

  query += ` ORDER BY 
    CASE status 
      WHEN 'critical' THEN 1 
      WHEN 'non_compliant' THEN 2 
      WHEN 'warning' THEN 3 
      ELSE 4 
    END,
    last_checked DESC
    LIMIT ?
  `;
  params.push(limit);

  const { results } = await env.DB.prepare(query).bind(...params).all();

  const alerts = results.map(alert => ({
    ...alert,
    issues_found: alert.issues_found ? JSON.parse(alert.issues_found) : [],
    recommendations: alert.recommendations ? JSON.parse(alert.recommendations) : [],
    metadata: alert.metadata ? JSON.parse(alert.metadata) : {}
  }));

  return new Response(JSON.stringify({
    alerts,
    count: alerts.length
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Helper: Generate compliance report
 */
async function generateComplianceReport(env, userId, url) {
  const year = parseInt(url.searchParams.get('year')) || new Date().getFullYear();
  const month = url.searchParams.get('month') ? parseInt(url.searchParams.get('month')) : null;

  // Get compliance checks for the period
  let query = `
    SELECT * FROM compliance_monitoring
    WHERE user_id = ? AND period_year = ?
  `;
  const params = [userId, year];

  if (month) {
    query += ` AND period_month = ?`;
    params.push(month);
  }

  query += ` ORDER BY last_checked DESC`;

  const { results } = await env.DB.prepare(query).bind(...params).all();

  // Calculate summary statistics
  const totalChecks = results.length;
  const compliantCount = results.filter(c => c.status === 'compliant').length;
  const warningCount = results.filter(c => c.status === 'warning').length;
  const nonCompliantCount = results.filter(c => c.status === 'non_compliant').length;
  const criticalCount = results.filter(c => c.status === 'critical').length;
  
  const avgScore = totalChecks > 0 
    ? results.reduce((sum, c) => sum + c.compliance_score, 0) / totalChecks 
    : 0;

  // Group by compliance type
  const byType = {};
  results.forEach(check => {
    if (!byType[check.compliance_type]) {
      byType[check.compliance_type] = {
        count: 0,
        avg_score: 0,
        compliant: 0,
        issues: 0
      };
    }
    byType[check.compliance_type].count++;
    byType[check.compliance_type].avg_score += check.compliance_score;
    if (check.status === 'compliant') {
      byType[check.compliance_type].compliant++;
    } else {
      byType[check.compliance_type].issues++;
    }
  });

  // Calculate averages
  Object.keys(byType).forEach(type => {
    byType[type].avg_score = byType[type].count > 0 
      ? byType[type].avg_score / byType[type].count 
      : 0;
  });

  // Parse JSON fields for details
  const checks = results.map(check => ({
    ...check,
    issues_found: check.issues_found ? JSON.parse(check.issues_found) : [],
    recommendations: check.recommendations ? JSON.parse(check.recommendations) : []
  }));

  // Log audit trail
  await logAuditTrail(env, userId, 'export', 'compliance', null, {
    report_type: 'compliance_report',
    period: month ? `${year}-${month}` : `${year}`,
    total_checks: totalChecks
  });

  return new Response(JSON.stringify({
    period: {
      year,
      month
    },
    summary: {
      total_checks: totalChecks,
      compliant: compliantCount,
      warning: warningCount,
      non_compliant: nonCompliantCount,
      critical: criticalCount,
      avg_score: Math.round(avgScore * 100) / 100,
      compliance_rate: totalChecks > 0 ? Math.round((compliantCount / totalChecks) * 100) : 0
    },
    by_type: byType,
    checks
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * Helper: Run compliance check
 */
async function runComplianceCheck(env, userId, complianceType, periodYear, periodMonth) {
  const issues = [];
  const recommendations = [];
  let score = 100;
  const metadata = {};

  // Define date range
  const startDate = periodMonth 
    ? `${periodYear}-${String(periodMonth).padStart(2, '0')}-01`
    : `${periodYear}-01-01`;
  const endDate = periodMonth
    ? new Date(periodYear, periodMonth, 0).toISOString().split('T')[0]
    : `${periodYear}-12-31`;

  // Check 1: CFDI compliance
  const transactionsResult = await env.DB.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN cfdi_uuid IS NOT NULL AND cfdi_uuid != '' THEN 1 ELSE 0 END) as with_cfdi,
      SUM(CASE WHEN type = 'gasto' AND amount >= 2000 AND (cfdi_uuid IS NULL OR cfdi_uuid = '') THEN 1 ELSE 0 END) as missing_cfdi_high_value
    FROM transactions
    WHERE user_id = ?
      AND date BETWEEN ? AND ?
      AND is_deleted = 0
  `).bind(userId, startDate, endDate).first();

  const cfdiCompliance = transactionsResult.total > 0 
    ? (transactionsResult.with_cfdi / transactionsResult.total) * 100 
    : 100;

  metadata.cfdi_compliance = Math.round(cfdiCompliance);
  metadata.total_transactions = transactionsResult.total;
  metadata.with_cfdi = transactionsResult.with_cfdi;

  if (cfdiCompliance < 80) {
    score -= 15;
    issues.push({
      severity: 'high',
      type: 'cfdi_compliance',
      message: `Solo ${Math.round(cfdiCompliance)}% de transacciones tienen CFDI`,
      affected_count: transactionsResult.total - transactionsResult.with_cfdi
    });
    recommendations.push({
      priority: 'high',
      action: 'Solicitar CFDIs faltantes para mejorar deducibilidad',
      impact: 'Aumentará deducibilidad de ISR e IVA'
    });
  }

  if (transactionsResult.missing_cfdi_high_value > 0) {
    score -= 10;
    issues.push({
      severity: 'critical',
      type: 'high_value_without_cfdi',
      message: `${transactionsResult.missing_cfdi_high_value} gastos mayores a $2,000 sin CFDI`,
      affected_count: transactionsResult.missing_cfdi_high_value
    });
  }

  // Check 2: Bank reconciliation
  const unmatched = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM transactions t
    LEFT JOIN reconciliation_matches rm ON t.id = rm.transaction_id
    WHERE t.user_id = ?
      AND t.date BETWEEN ? AND ?
      AND t.is_deleted = 0
      AND rm.id IS NULL
  `).bind(userId, startDate, endDate).first();

  const unmatchedCount = unmatched.count || 0;
  metadata.unmatched_transactions = unmatchedCount;

  if (unmatchedCount > 0) {
    const reconciliationRate = transactionsResult.total > 0
      ? ((transactionsResult.total - unmatchedCount) / transactionsResult.total) * 100
      : 100;

    metadata.reconciliation_rate = Math.round(reconciliationRate);

    if (reconciliationRate < 90) {
      score -= 10;
      issues.push({
        severity: 'medium',
        type: 'reconciliation',
        message: `${unmatchedCount} transacciones sin conciliar bancariamente`,
        affected_count: unmatchedCount
      });
      recommendations.push({
        priority: 'medium',
        action: 'Conciliar transacciones pendientes',
        impact: 'Asegura validez de "pago efectivamente realizado"'
      });
    }
  }

  // Check 3: Tax calculations
  const taxCalcs = await env.DB.prepare(`
    SELECT COUNT(*) as count
    FROM tax_calculations
    WHERE user_id = ?
      AND period_year = ?
      ${periodMonth ? 'AND period_month = ?' : ''}
      AND status = 'calculated'
  `).bind(userId, periodYear, ...(periodMonth ? [periodMonth] : [])).first();

  metadata.tax_calculations = taxCalcs.count || 0;

  if (taxCalcs.count === 0) {
    score -= 20;
    issues.push({
      severity: 'high',
      type: 'missing_tax_calculation',
      message: 'No se han realizado cálculos fiscales para este período',
      affected_count: 0
    });
    recommendations.push({
      priority: 'high',
      action: 'Realizar cálculos fiscales mensuales',
      impact: 'Evitar multas por declaraciones incorrectas o tardías'
    });
  }

  // Check 4: Personal deductions (if annual check)
  if (!periodMonth) {
    const deductions = await env.DB.prepare(`
      SELECT 
        deduction_breakdown
      FROM annual_declarations
      WHERE user_id = ?
        AND fiscal_year = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(userId, periodYear).first();

    if (!deductions || !deductions.deduction_breakdown) {
      recommendations.push({
        priority: 'medium',
        action: 'Revisar deducciones personales disponibles',
        impact: 'Puede reducir ISR anual significativamente'
      });
    }
  }

  // Determine status based on score
  let status;
  if (score >= 90) {
    status = 'compliant';
  } else if (score >= 70) {
    status = 'warning';
  } else if (score >= 50) {
    status = 'non_compliant';
  } else {
    status = 'critical';
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    status,
    issues,
    recommendations,
    metadata
  };
}

/**
 * Helper: Log audit trail
 */
async function logAuditTrail(env, userId, actionType, entityType, entityId, details) {
  try {
    await env.DB.prepare(`
      INSERT INTO audit_trail (
        user_id, action_type, entity_type, entity_id,
        action_details, compliance_relevant
      ) VALUES (?, ?, ?, ?, ?, 1)
    `).bind(
      userId,
      actionType,
      entityType,
      entityId,
      JSON.stringify(details)
    ).run();
  } catch (error) {
    console.error('Error logging audit trail:', error);
  }
}
