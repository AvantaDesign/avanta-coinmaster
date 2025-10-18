/**
 * SAT Reconciliation Utility
 * Compare app financial data with SAT declarations
 */

import Decimal from 'decimal.js';

/**
 * Compare app data with SAT declaration
 * @param {object} appData - Calculated data from app
 * @param {object} satDeclaration - SAT declaration data
 * @returns {object} Comparison results with discrepancies
 */
export function compareWithSATDeclaration(appData, satDeclaration) {
  const comparison = {
    period: {
      year: satDeclaration.year,
      month: satDeclaration.month,
    },
    declarationType: satDeclaration.declaration_type,
    income: compareField('income', appData.businessIncome, satDeclaration.declared_income),
    expenses: compareField('expenses', appData.deductibleExpenses, satDeclaration.declared_expenses),
    isr: compareField('isr', appData.isr, satDeclaration.declared_isr),
    iva: compareField('iva', appData.iva, satDeclaration.declared_iva),
    overallStatus: 'match',
    totalDiscrepancies: 0,
    criticalDiscrepancies: 0,
  };

  // Determine overall status
  const discrepancies = [
    comparison.income,
    comparison.expenses,
    comparison.isr,
    comparison.iva,
  ].filter(field => field.status !== 'match');

  comparison.totalDiscrepancies = discrepancies.length;
  comparison.criticalDiscrepancies = discrepancies.filter(
    d => d.severity === 'critical'
  ).length;

  if (comparison.criticalDiscrepancies > 0) {
    comparison.overallStatus = 'critical';
  } else if (comparison.totalDiscrepancies > 0) {
    comparison.overallStatus = 'warning';
  }

  return comparison;
}

/**
 * Compare a single field between app and SAT data
 */
function compareField(fieldName, appValue, satValue) {
  const app = new Decimal(appValue || 0);
  const sat = new Decimal(satValue || 0);
  const difference = app.minus(sat);
  const absDifference = difference.abs();
  
  // Calculate percentage difference
  let percentageDiff = new Decimal(0);
  if (!sat.isZero()) {
    percentageDiff = absDifference.div(sat).times(100);
  } else if (!app.isZero()) {
    percentageDiff = new Decimal(100);
  }

  // Determine severity
  let severity = 'none';
  let status = 'match';

  // Tolerance: 0.01 MXN (1 cent)
  const tolerance = new Decimal('0.01');

  if (absDifference.gt(tolerance)) {
    status = 'mismatch';

    // Severity thresholds
    if (absDifference.gte(1000) || percentageDiff.gte(10)) {
      severity = 'critical';
    } else if (absDifference.gte(100) || percentageDiff.gte(5)) {
      severity = 'warning';
    } else {
      severity = 'minor';
    }
  }

  return {
    fieldName,
    appValue: parseFloat(app.toFixed(2)),
    satValue: parseFloat(sat.toFixed(2)),
    difference: parseFloat(difference.toFixed(2)),
    absDifference: parseFloat(absDifference.toFixed(2)),
    percentageDiff: parseFloat(percentageDiff.toFixed(2)),
    status,
    severity,
    suggestion: generateSuggestion(fieldName, difference, severity),
  };
}

/**
 * Generate suggestion for resolving discrepancy
 */
function generateSuggestion(fieldName, difference, severity) {
  if (severity === 'none') return null;

  const isAppHigher = difference.gt(0);
  const absValue = difference.abs();

  const suggestions = [];

  if (fieldName === 'income') {
    if (isAppHigher) {
      suggestions.push('Revise si todos los ingresos registrados fueron declarados al SAT');
      suggestions.push('Verifique si hay ingresos duplicados en la aplicación');
    } else {
      suggestions.push('Revise si hay ingresos declarados que no están registrados en la app');
      suggestions.push('Verifique las facturas emitidas vs ingresos registrados');
    }
  } else if (fieldName === 'expenses') {
    if (isAppHigher) {
      suggestions.push('Revise si todos los gastos registrados son deducibles');
      suggestions.push('Verifique que las facturas de gastos sean válidas');
    } else {
      suggestions.push('Revise si hay gastos declarados que no están registrados');
      suggestions.push('Verifique las facturas recibidas vs gastos registrados');
    }
  } else if (fieldName === 'isr') {
    if (isAppHigher) {
      suggestions.push('El ISR calculado en la app es mayor que el declarado');
      suggestions.push('Revise las deducciones aplicadas en la declaración');
    } else {
      suggestions.push('El ISR declarado es mayor que el calculado en la app');
      suggestions.push('Verifique los ingresos y gastos deducibles');
    }
  } else if (fieldName === 'iva') {
    if (isAppHigher) {
      suggestions.push('El IVA calculado en la app es mayor que el declarado');
      suggestions.push('Revise el IVA acreditable vs IVA trasladado');
    } else {
      suggestions.push('El IVA declarado es mayor que el calculado en la app');
      suggestions.push('Verifique las facturas con IVA');
    }
  }

  if (severity === 'critical') {
    suggestions.unshift('⚠️ Discrepancia crítica - Requiere atención inmediata');
  }

  return suggestions;
}

/**
 * Categorize discrepancy by severity
 */
export function categorizeBySeverity(discrepancies) {
  return {
    critical: discrepancies.filter(d => d.severity === 'critical'),
    warning: discrepancies.filter(d => d.severity === 'warning'),
    minor: discrepancies.filter(d => d.severity === 'minor'),
  };
}

/**
 * Generate reconciliation report summary
 */
export function generateReconciliationSummary(comparison) {
  const summary = {
    period: `${comparison.period.month}/${comparison.period.year}`,
    declarationType: comparison.declarationType,
    overallStatus: comparison.overallStatus,
    totalDiscrepancies: comparison.totalDiscrepancies,
    criticalDiscrepancies: comparison.criticalDiscrepancies,
    fields: [],
  };

  // Add field summaries
  ['income', 'expenses', 'isr', 'iva'].forEach(fieldKey => {
    const field = comparison[fieldKey];
    if (field.status !== 'match') {
      summary.fields.push({
        name: getFieldDisplayName(fieldKey),
        app: field.appValue,
        sat: field.satValue,
        difference: field.difference,
        percentage: field.percentageDiff,
        severity: field.severity,
      });
    }
  });

  return summary;
}

/**
 * Get display name for field
 */
function getFieldDisplayName(fieldKey) {
  const names = {
    income: 'Ingresos',
    expenses: 'Gastos Deducibles',
    isr: 'ISR',
    iva: 'IVA',
  };
  return names[fieldKey] || fieldKey;
}

/**
 * Check if reconciliation is required for a period
 */
export function isReconciliationRequired(year, month) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Reconciliation is required for past months
  if (year < currentYear) return true;
  if (year === currentYear && month < currentMonth) return true;

  return false;
}

/**
 * Get months requiring reconciliation
 */
export function getPeriodsRequiringReconciliation(declarations, currentYear) {
  const periods = [];
  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  // Check last 12 months
  for (let i = 0; i < 12; i++) {
    let year = currentYear;
    let month = currentMonth - i;

    if (month <= 0) {
      month += 12;
      year -= 1;
    }

    const hasDeclaration = declarations.some(
      d => d.year === year && d.month === month
    );

    if (!hasDeclaration && isReconciliationRequired(year, month)) {
      periods.push({ year, month, status: 'missing' });
    } else if (hasDeclaration) {
      periods.push({ year, month, status: 'declared' });
    }
  }

  return periods.reverse();
}

/**
 * Calculate compliance score (0-100)
 */
export function calculateComplianceScore(declarations, discrepancies) {
  let score = 100;

  // Deduct points for missing declarations
  const missingDeclarations = getPeriodsRequiringReconciliation(
    declarations,
    new Date().getFullYear()
  ).filter(p => p.status === 'missing');

  score -= missingDeclarations.length * 5; // -5 points per missing month

  // Deduct points for discrepancies
  const criticalCount = discrepancies.filter(d => d.severity === 'critical').length;
  const warningCount = discrepancies.filter(d => d.severity === 'warning').length;
  const minorCount = discrepancies.filter(d => d.severity === 'minor').length;

  score -= criticalCount * 10; // -10 points per critical issue
  score -= warningCount * 5;   // -5 points per warning
  score -= minorCount * 2;     // -2 points per minor issue

  return Math.max(0, Math.min(100, score));
}

/**
 * Get compliance status label
 */
export function getComplianceStatusLabel(score) {
  if (score >= 90) return { label: 'Excelente', color: 'green' };
  if (score >= 75) return { label: 'Bueno', color: 'blue' };
  if (score >= 60) return { label: 'Regular', color: 'yellow' };
  if (score >= 40) return { label: 'Requiere Atención', color: 'orange' };
  return { label: 'Crítico', color: 'red' };
}

/**
 * Format period for display
 */
export function formatPeriod(year, month) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${months[month - 1]} ${year}`;
}

/**
 * Export reconciliation report to text format
 */
export function exportReconciliationReport(comparison) {
  const lines = [];
  
  lines.push('REPORTE DE CONCILIACIÓN SAT');
  lines.push('='.repeat(50));
  lines.push('');
  lines.push(`Período: ${formatPeriod(comparison.period.year, comparison.period.month)}`);
  lines.push(`Tipo de Declaración: ${comparison.declarationType.toUpperCase()}`);
  lines.push(`Estado General: ${comparison.overallStatus.toUpperCase()}`);
  lines.push('');
  
  lines.push('RESUMEN DE DISCREPANCIAS');
  lines.push('-'.repeat(50));
  lines.push(`Total de Discrepancias: ${comparison.totalDiscrepancies}`);
  lines.push(`Discrepancias Críticas: ${comparison.criticalDiscrepancies}`);
  lines.push('');

  // Add detailed comparison for each field
  ['income', 'expenses', 'isr', 'iva'].forEach(fieldKey => {
    const field = comparison[fieldKey];
    lines.push(`${getFieldDisplayName(fieldKey).toUpperCase()}`);
    lines.push(`  App: $${field.appValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    lines.push(`  SAT: $${field.satValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`);
    lines.push(`  Diferencia: $${field.difference.toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${field.percentageDiff.toFixed(2)}%)`);
    lines.push(`  Estado: ${field.status} - Severidad: ${field.severity}`);
    
    if (field.suggestion && field.suggestion.length > 0) {
      lines.push('  Sugerencias:');
      field.suggestion.forEach(s => lines.push(`    - ${s}`));
    }
    lines.push('');
  });

  lines.push('='.repeat(50));
  lines.push(`Generado: ${new Date().toLocaleString('es-MX')}`);

  return lines.join('\n');
}
