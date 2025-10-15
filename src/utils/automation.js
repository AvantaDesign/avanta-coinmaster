// Automation utility functions
// Scheduling, triggers, forecasting, and automation logic

/**
 * Calculate next generation date for recurring invoice
 * @param {Date} lastDate - Last generation date
 * @param {String} frequency - Frequency (daily, weekly, monthly, quarterly, yearly)
 * @returns {Date} Next generation date
 */
export function calculateNextGenerationDate(lastDate, frequency) {
  const date = new Date(lastDate);

  switch (frequency) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }

  return date;
}

/**
 * Check if automation rule should trigger
 * @param {Object} rule - Automation rule
 * @returns {Boolean} Whether rule should trigger
 */
export function shouldTriggerRule(rule) {
  if (!rule.is_active) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (rule.rule_type === 'recurring_invoice') {
    if (!rule.next_generation_date) {
      return false;
    }
    const nextDate = new Date(rule.next_generation_date);
    nextDate.setHours(0, 0, 0, 0);
    return today >= nextDate;
  }

  return false;
}

/**
 * Get automation rules that need to run today
 * @param {Array} rules - Array of automation rules
 * @returns {Array} Rules to execute
 */
export function getRulesToExecute(rules) {
  return rules.filter(rule => shouldTriggerRule(rule));
}

/**
 * Calculate cash flow forecast combining receivables and payables
 * @param {Array} receivables - Array of receivable objects
 * @param {Array} payables - Array of payable objects
 * @param {Number} daysAhead - Days to forecast
 * @returns {Array} Cash flow forecast
 */
export function calculateCashFlowForecast(receivables, payables, daysAhead = 90) {
  const today = new Date();
  const forecast = [];
  let runningBalance = 0;

  for (let i = 0; i <= daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    // Calculate expected inflow from receivables
    const inflow = receivables.reduce((sum, r) => {
      if (r.status !== 'paid' && r.status !== 'cancelled' && r.due_date === dateStr) {
        return sum + (r.amount - (r.amount_paid || 0));
      }
      return sum;
    }, 0);

    // Calculate expected outflow from payables
    const outflow = payables.reduce((sum, p) => {
      if (p.status !== 'paid' && p.status !== 'cancelled' && p.due_date === dateStr) {
        return sum + (p.amount - (p.amount_paid || 0));
      }
      return sum;
    }, 0);

    const netFlow = inflow - outflow;
    runningBalance += netFlow;

    if (inflow > 0 || outflow > 0) {
      forecast.push({
        date: dateStr,
        inflow,
        outflow,
        netFlow,
        runningBalance,
        formattedDate: date.toLocaleDateString('es-MX', {
          month: 'short',
          day: 'numeric'
        })
      });
    }
  }

  return forecast;
}

/**
 * Generate financial health indicators
 * @param {Object} receivablesMetrics - Receivables metrics
 * @param {Object} payablesMetrics - Payables metrics
 * @param {Array} cashFlowForecast - Cash flow forecast
 * @returns {Object} Health indicators
 */
export function calculateFinancialHealthIndicators(receivablesMetrics, payablesMetrics, cashFlowForecast) {
  // Days Sales Outstanding (DSO)
  const dso = receivablesMetrics.averageDaysToCollect || 0;

  // Days Payables Outstanding (DPO)
  const dpo = payablesMetrics.averageDaysToPay || 0;

  // Cash Conversion Cycle
  const cashConversionCycle = dso - dpo;

  // Quick Ratio (receivables / payables)
  const quickRatio = payablesMetrics.totalOutstanding > 0
    ? receivablesMetrics.totalOutstanding / payablesMetrics.totalOutstanding
    : 0;

  // Identify cash crunches in forecast
  const cashCrunches = cashFlowForecast.filter(f => f.runningBalance < 0);
  const hasCashCrunch = cashCrunches.length > 0;
  const worstCashPosition = cashCrunches.length > 0
    ? Math.min(...cashCrunches.map(c => c.runningBalance))
    : 0;

  // Calculate health score (0-100)
  let healthScore = 100;
  
  // Penalize for overdue receivables
  if (receivablesMetrics.overdueCount > 0) {
    healthScore -= Math.min(30, receivablesMetrics.overdueCount * 5);
  }
  
  // Penalize for overdue payables
  if (payablesMetrics.overdueCount > 0) {
    healthScore -= Math.min(30, payablesMetrics.overdueCount * 5);
  }
  
  // Penalize for cash crunches
  if (hasCashCrunch) {
    healthScore -= 20;
  }
  
  // Bonus for good collection rate
  if (receivablesMetrics.collectionRate > 90) {
    healthScore += 10;
  }
  
  healthScore = Math.max(0, Math.min(100, healthScore));

  return {
    dso,
    dpo,
    cashConversionCycle,
    quickRatio,
    hasCashCrunch,
    worstCashPosition,
    cashCrunchDays: cashCrunches.length,
    healthScore,
    healthLevel: healthScore >= 80 ? 'excellent' : healthScore >= 60 ? 'good' : healthScore >= 40 ? 'fair' : 'poor'
  };
}

/**
 * Get automated alerts based on current state
 * @param {Array} receivables - Array of receivable objects
 * @param {Array} payables - Array of payable objects
 * @param {Object} healthIndicators - Financial health indicators
 * @returns {Array} Alert objects
 */
export function generateAutomatedAlerts(receivables, payables, healthIndicators) {
  const alerts = [];
  const today = new Date();

  // Critical overdue receivables
  const criticalReceivables = receivables.filter(r => {
    if (r.status === 'paid' || r.status === 'cancelled') return false;
    const dueDate = new Date(r.due_date);
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    return daysOverdue > 30;
  });

  if (criticalReceivables.length > 0) {
    alerts.push({
      type: 'critical',
      category: 'receivables',
      title: 'Cuentas por Cobrar Críticas',
      message: `${criticalReceivables.length} factura${criticalReceivables.length > 1 ? 's' : ''} con más de 30 días de retraso`,
      count: criticalReceivables.length,
      action: 'view_receivables'
    });
  }

  // Urgent payables
  const urgentPayables = payables.filter(p => {
    if (p.status === 'paid' || p.status === 'cancelled') return false;
    const dueDate = new Date(p.due_date);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3 && daysUntilDue >= 0;
  });

  if (urgentPayables.length > 0) {
    alerts.push({
      type: 'warning',
      category: 'payables',
      title: 'Pagos Urgentes',
      message: `${urgentPayables.length} pago${urgentPayables.length > 1 ? 's' : ''} por vencer en los próximos 3 días`,
      count: urgentPayables.length,
      action: 'view_payables'
    });
  }

  // Cash crunch warning
  if (healthIndicators.hasCashCrunch) {
    alerts.push({
      type: 'warning',
      category: 'cashflow',
      title: 'Alerta de Flujo de Efectivo',
      message: `Se detectan ${healthIndicators.cashCrunchDays} día${healthIndicators.cashCrunchDays > 1 ? 's' : ''} con déficit de efectivo`,
      action: 'view_forecast'
    });
  }

  // Poor collection performance
  const receivablesMetrics = {
    overdueCount: receivables.filter(r => r.status === 'overdue').length
  };

  if (receivablesMetrics.overdueCount > 5) {
    alerts.push({
      type: 'info',
      category: 'receivables',
      title: 'Cobranza Requiere Atención',
      message: `${receivablesMetrics.overdueCount} facturas vencidas pendientes de cobro`,
      count: receivablesMetrics.overdueCount,
      action: 'view_receivables'
    });
  }

  // Overdue payables
  const overduePayables = payables.filter(p => p.status === 'overdue');
  if (overduePayables.length > 0) {
    alerts.push({
      type: 'critical',
      category: 'payables',
      title: 'Pagos Vencidos',
      message: `${overduePayables.length} pago${overduePayables.length > 1 ? 's' : ''} vencido${overduePayables.length > 1 ? 's' : ''}`,
      count: overduePayables.length,
      action: 'view_payables'
    });
  }

  return alerts.sort((a, b) => {
    const typeOrder = { critical: 0, warning: 1, info: 2 };
    return typeOrder[a.type] - typeOrder[b.type];
  });
}

/**
 * Calculate automation status metrics
 * @param {Array} rules - Array of automation rules
 * @returns {Object} Automation metrics
 */
export function calculateAutomationMetrics(rules) {
  const activeRules = rules.filter(r => r.is_active);
  const recurringInvoices = activeRules.filter(r => r.rule_type === 'recurring_invoice');
  const paymentReminders = activeRules.filter(r => r.rule_type === 'payment_reminder');
  const overdueAlerts = activeRules.filter(r => r.rule_type === 'overdue_alert');

  const rulesToRunToday = getRulesToExecute(activeRules);

  return {
    totalRules: rules.length,
    activeRules: activeRules.length,
    inactiveRules: rules.length - activeRules.length,
    recurringInvoiceCount: recurringInvoices.length,
    paymentReminderCount: paymentReminders.length,
    overdueAlertCount: overdueAlerts.length,
    rulesToRunToday: rulesToRunToday.length,
    automationRate: rules.length > 0 ? (activeRules.length / rules.length) * 100 : 0
  };
}

/**
 * Validate automation rule configuration
 * @param {Object} rule - Automation rule to validate
 * @returns {Object} Validation result
 */
export function validateAutomationRule(rule) {
  const errors = [];

  if (!rule.name || rule.name.trim() === '') {
    errors.push('El nombre de la regla es requerido');
  }

  if (!rule.rule_type) {
    errors.push('El tipo de regla es requerido');
  }

  if (rule.rule_type === 'recurring_invoice') {
    if (!rule.customer_name) {
      errors.push('El nombre del cliente es requerido');
    }
    if (!rule.amount || rule.amount <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }
    if (!rule.frequency) {
      errors.push('La frecuencia es requerida');
    }
    if (!rule.start_date) {
      errors.push('La fecha de inicio es requerida');
    }
  }

  if (rule.rule_type === 'payment_reminder' || rule.rule_type === 'overdue_alert') {
    if (!rule.days_before_due && rule.days_before_due !== 0) {
      errors.push('Los días antes del vencimiento son requeridos');
    }
    if (!rule.reminder_type) {
      errors.push('El tipo de recordatorio es requerido');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
