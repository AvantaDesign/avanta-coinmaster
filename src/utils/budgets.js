/**
 * Budget Utilities
 * Helper functions for budget calculations and management
 */

/**
 * Calculate budget progress for a given budget and transactions
 */
export function calculateBudgetProgress(budget, transactions) {
  if (!budget || !transactions) {
    return {
      budgeted: 0,
      actual: 0,
      remaining: 0,
      percentUsed: 0,
      status: 'unknown'
    };
  }

  // Filter transactions by budget criteria
  const relevantTransactions = transactions.filter(t => {
    // Match classification
    if (t.transaction_type !== budget.classification) return false;

    // Match category if specified
    if (budget.category_id && t.category_id !== budget.category_id) return false;

    // Match date range
    const transDate = new Date(t.date);
    const startDate = new Date(budget.start_date);
    const endDate = budget.end_date ? new Date(budget.end_date) : new Date('2099-12-31');

    if (transDate < startDate || transDate > endDate) return false;

    // Only count expenses for budget tracking
    if (t.type !== 'gasto') return false;

    return true;
  });

  // Calculate actual spending
  const actual = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
  const remaining = budget.amount - actual;
  const percentUsed = budget.amount > 0 ? (actual / budget.amount) * 100 : 0;

  // Determine status
  let status = 'good';
  if (percentUsed >= 100) {
    status = 'exceeded';
  } else if (percentUsed >= 90) {
    status = 'warning';
  } else if (percentUsed >= 75) {
    status = 'caution';
  }

  return {
    budgeted: budget.amount,
    actual: Math.round(actual * 100) / 100,
    remaining: Math.round(remaining * 100) / 100,
    percentUsed: Math.round(percentUsed * 100) / 100,
    status,
    transactionCount: relevantTransactions.length
  };
}

/**
 * Get budget status color for UI
 */
export function getBudgetStatusColor(status) {
  switch (status) {
    case 'exceeded':
      return 'red';
    case 'warning':
      return 'orange';
    case 'caution':
      return 'yellow';
    case 'good':
      return 'green';
    default:
      return 'gray';
  }
}

/**
 * Get budget status icon
 */
export function getBudgetStatusIcon(status) {
  switch (status) {
    case 'exceeded':
      return '🔴';
    case 'warning':
      return '🟠';
    case 'caution':
      return '🟡';
    case 'good':
      return '🟢';
    default:
      return '⚪';
  }
}

/**
 * Calculate period dates for a budget
 */
export function calculatePeriodDates(period, startDate) {
  const start = new Date(startDate);
  let endDate;

  switch (period) {
    case 'monthly':
      endDate = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      break;
    case 'quarterly':
      endDate = new Date(start.getFullYear(), start.getMonth() + 3, 0);
      break;
    case 'yearly':
      endDate = new Date(start.getFullYear(), 11, 31);
      break;
    default:
      endDate = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

/**
 * Get period label in Spanish
 */
export function getPeriodLabel(period) {
  switch (period) {
    case 'monthly':
      return 'Mensual';
    case 'quarterly':
      return 'Trimestral';
    case 'yearly':
      return 'Anual';
    default:
      return period;
  }
}

/**
 * Get classification label in Spanish
 */
export function getClassificationLabel(classification) {
  switch (classification) {
    case 'business':
      return 'Negocio';
    case 'personal':
      return 'Personal';
    default:
      return classification;
  }
}

/**
 * Validate budget data
 */
export function validateBudget(budget) {
  const errors = [];

  if (!budget.classification) {
    errors.push('La clasificación es requerida');
  } else if (!['business', 'personal'].includes(budget.classification)) {
    errors.push('Clasificación inválida');
  }

  if (!budget.amount) {
    errors.push('El monto es requerido');
  } else if (budget.amount <= 0) {
    errors.push('El monto debe ser mayor a 0');
  }

  if (!budget.period) {
    errors.push('El período es requerido');
  } else if (!['monthly', 'quarterly', 'yearly'].includes(budget.period)) {
    errors.push('Período inválido');
  }

  if (!budget.start_date) {
    errors.push('La fecha de inicio es requerida');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Group budgets by classification
 */
export function groupBudgetsByClassification(budgets) {
  return budgets.reduce((acc, budget) => {
    const key = budget.classification;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(budget);
    return acc;
  }, {});
}

/**
 * Calculate total budgets by period
 */
export function calculateTotalByPeriod(budgets, period) {
  return budgets
    .filter(b => b.period === period && b.is_active)
    .reduce((sum, b) => sum + b.amount, 0);
}

/**
 * Get budget recommendations based on historical spending
 */
export function getBudgetRecommendations(transactions, categories, months = 3) {
  const recommendations = [];
  
  // Calculate average spending per category
  const categorySpending = {};
  
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);

  transactions
    .filter(t => t.type === 'gasto' && new Date(t.date) >= cutoffDate)
    .forEach(t => {
      const key = `${t.transaction_type}_${t.category_id || 'uncategorized'}`;
      if (!categorySpending[key]) {
        categorySpending[key] = {
          classification: t.transaction_type,
          category_id: t.category_id,
          total: 0,
          count: 0
        };
      }
      categorySpending[key].total += t.amount;
      categorySpending[key].count += 1;
    });

  // Generate recommendations
  Object.entries(categorySpending).forEach(([key, data]) => {
    const avgMonthly = data.total / months;
    const category = categories.find(c => c.id === data.category_id);
    
    recommendations.push({
      classification: data.classification,
      category_id: data.category_id,
      category_name: category?.name || 'Sin categoría',
      recommended_monthly: Math.round(avgMonthly * 1.1 * 100) / 100, // Add 10% buffer
      based_on_average: Math.round(avgMonthly * 100) / 100,
      transaction_count: data.count,
      confidence: data.count >= 5 ? 'high' : data.count >= 2 ? 'medium' : 'low'
    });
  });

  // Sort by amount (highest first)
  recommendations.sort((a, b) => b.recommended_monthly - a.recommended_monthly);

  return recommendations;
}

/**
 * Compare budget performance across periods
 */
export function compareBudgetPerformance(currentProgress, previousProgress) {
  if (!previousProgress) {
    return {
      trend: 'new',
      change: 0,
      changePercent: 0
    };
  }

  const change = currentProgress.actual - previousProgress.actual;
  const changePercent = previousProgress.actual > 0 
    ? (change / previousProgress.actual) * 100 
    : 0;

  let trend = 'stable';
  if (Math.abs(changePercent) > 10) {
    trend = change > 0 ? 'increasing' : 'decreasing';
  }

  return {
    trend,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100
  };
}

/**
 * Calculate budget variance analysis
 */
export function calculateVarianceAnalysis(budgets, actuals) {
  const analysis = budgets.map(budget => {
    const actual = actuals.find(a => a.budget_id === budget.id);
    const actualAmount = actual?.amount || 0;
    const variance = budget.amount - actualAmount;
    const variancePercent = budget.amount > 0 ? (variance / budget.amount) * 100 : 0;

    return {
      budget_id: budget.id,
      budget_name: budget.category_name || 'General',
      budgeted: budget.amount,
      actual: actualAmount,
      variance,
      variance_percent: Math.round(variancePercent * 100) / 100,
      is_favorable: variance >= 0,
      significance: Math.abs(variancePercent) > 20 ? 'high' : Math.abs(variancePercent) > 10 ? 'medium' : 'low'
    };
  });

  return analysis;
}

/**
 * Generate budget alerts
 */
export function generateBudgetAlerts(progress) {
  const alerts = [];

  progress.forEach(p => {
    if (p.status === 'exceeded') {
      alerts.push({
        type: 'critical',
        budget_id: p.id,
        category: p.category_name || 'General',
        message: `Presupuesto excedido en ${p.percentUsed - 100}%`,
        severity: 'high'
      });
    } else if (p.status === 'warning') {
      alerts.push({
        type: 'warning',
        budget_id: p.id,
        category: p.category_name || 'General',
        message: `Se ha utilizado ${p.percentUsed}% del presupuesto`,
        severity: 'medium'
      });
    } else if (p.status === 'caution') {
      alerts.push({
        type: 'info',
        budget_id: p.id,
        category: p.category_name || 'General',
        message: `Se ha utilizado ${p.percentUsed}% del presupuesto`,
        severity: 'low'
      });
    }
  });

  return alerts;
}

/**
 * Format budget period for display
 */
export function formatBudgetPeriod(budget) {
  const start = new Date(budget.start_date);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  switch (budget.period) {
    case 'monthly':
      return `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    case 'quarterly':
      const quarter = Math.floor(start.getMonth() / 3) + 1;
      return `Q${quarter} ${start.getFullYear()}`;
    case 'yearly':
      return `${start.getFullYear()}`;
    default:
      return budget.start_date;
  }
}
