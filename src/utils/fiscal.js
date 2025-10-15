/**
 * Fiscal Utilities
 * Helper functions for fiscal calculations and tax management
 */

/**
 * Calculate ISR (Income Tax) based on annual income and ISR brackets
 */
export function calculateISR(annualIncome, isrBrackets) {
  if (annualIncome <= 0 || !isrBrackets || !Array.isArray(isrBrackets)) {
    return 0;
  }

  // Find applicable bracket
  let applicableBracket = isrBrackets[0];
  for (const bracket of isrBrackets) {
    if (annualIncome > bracket.lowerLimit) {
      applicableBracket = bracket;
    } else {
      break;
    }
  }

  // Calculate ISR
  const excess = annualIncome - applicableBracket.lowerLimit;
  const tax = applicableBracket.fixedFee + (excess * applicableBracket.rate);

  return Math.max(0, Math.round(tax * 100) / 100);
}

/**
 * Calculate monthly provisional ISR payment
 */
export function calculateMonthlyISR(monthlyIncome, monthlyDeductions, isrBrackets) {
  // Annualize for bracket calculation
  const annualizedIncome = monthlyIncome * 12;
  const annualizedDeductions = monthlyDeductions * 12;
  const taxableBase = Math.max(0, annualizedIncome - annualizedDeductions);

  // Calculate annual ISR
  const annualISR = calculateISR(taxableBase, isrBrackets);

  // Return monthly provisional payment
  return Math.round((annualISR / 12) * 100) / 100;
}

/**
 * Calculate IVA (Value Added Tax)
 */
export function calculateIVA(amount, ivaRate = 0.16) {
  return Math.round(amount * ivaRate * 100) / 100;
}

/**
 * Calculate IVA payable (IVA charged minus IVA creditable)
 */
export function calculateIVAPayable(income, deductibleExpenses, ivaRate = 0.16) {
  const ivaCharged = calculateIVA(income, ivaRate);
  const ivaCreditable = calculateIVA(deductibleExpenses, ivaRate);
  return Math.max(0, Math.round((ivaCharged - ivaCreditable) * 100) / 100);
}

/**
 * Calculate effective tax rate
 */
export function calculateEffectiveTaxRate(totalTax, totalIncome) {
  if (totalIncome <= 0) return 0;
  return Math.round((totalTax / totalIncome) * 10000) / 100;
}

/**
 * Calculate tax savings from deductions
 */
export function calculateTaxSavings(incomeWithDeductions, incomeWithoutDeductions, isrBrackets) {
  const taxWithDeductions = calculateISR(incomeWithDeductions, isrBrackets);
  const taxWithoutDeductions = calculateISR(incomeWithoutDeductions, isrBrackets);
  
  return {
    savings: Math.round((taxWithoutDeductions - taxWithDeductions) * 100) / 100,
    savingsPercent: incomeWithoutDeductions > 0 
      ? Math.round(((taxWithoutDeductions - taxWithDeductions) / incomeWithoutDeductions) * 10000) / 100 
      : 0
  };
}

/**
 * Get ISR bracket for given income
 */
export function getISRBracket(income, isrBrackets) {
  if (!isrBrackets || !Array.isArray(isrBrackets)) {
    return null;
  }

  for (const bracket of isrBrackets) {
    if (income <= bracket.limit && income > bracket.lowerLimit) {
      return bracket;
    }
  }

  return isrBrackets[isrBrackets.length - 1]; // Return highest bracket if exceeds all
}

/**
 * Validate ISR brackets structure
 */
export function validateISRBrackets(brackets) {
  const errors = [];

  if (!Array.isArray(brackets)) {
    errors.push('ISR brackets must be an array');
    return { isValid: false, errors };
  }

  if (brackets.length === 0) {
    errors.push('ISR brackets cannot be empty');
    return { isValid: false, errors };
  }

  brackets.forEach((bracket, index) => {
    if (typeof bracket.limit !== 'number') {
      errors.push(`Bracket ${index + 1}: limit must be a number`);
    }
    if (typeof bracket.rate !== 'number') {
      errors.push(`Bracket ${index + 1}: rate must be a number`);
    }
    if (typeof bracket.fixedFee !== 'number') {
      errors.push(`Bracket ${index + 1}: fixedFee must be a number`);
    }
    if (typeof bracket.lowerLimit !== 'number') {
      errors.push(`Bracket ${index + 1}: lowerLimit must be a number`);
    }

    // Validate ranges
    if (bracket.rate < 0 || bracket.rate > 1) {
      errors.push(`Bracket ${index + 1}: rate must be between 0 and 1`);
    }
    if (bracket.fixedFee < 0) {
      errors.push(`Bracket ${index + 1}: fixedFee cannot be negative`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculate annual tax summary
 */
export function calculateAnnualTaxSummary(income, deductions, fiscalConfig) {
  const taxableBase = Math.max(0, income - deductions);
  
  const isr = calculateISR(taxableBase, fiscalConfig.isr_brackets);
  const ivaPayable = calculateIVAPayable(income, deductions, fiscalConfig.iva_rate);
  const totalTax = isr + ivaPayable;
  const effectiveRate = calculateEffectiveTaxRate(totalTax, income);

  return {
    income: Math.round(income * 100) / 100,
    deductions: Math.round(deductions * 100) / 100,
    taxableBase: Math.round(taxableBase * 100) / 100,
    isr: Math.round(isr * 100) / 100,
    iva: Math.round(ivaPayable * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    netIncome: Math.round((income - totalTax) * 100) / 100
  };
}

/**
 * Calculate quarterly tax projection
 */
export function calculateQuarterlyProjection(q1Income, q2Income, q3Income, q4Income, deductionRate, fiscalConfig) {
  const quarters = [
    { quarter: 1, income: q1Income },
    { quarter: 2, income: q2Income },
    { quarter: 3, income: q3Income },
    { quarter: 4, income: q4Income }
  ];

  return quarters.map(q => {
    const deductions = q.income * deductionRate;
    const taxableBase = Math.max(0, q.income - deductions);
    
    // Calculate cumulative for year-to-date
    const cumulativeIncome = quarters
      .filter(qt => qt.quarter <= q.quarter)
      .reduce((sum, qt) => sum + qt.income, 0);
    
    const cumulativeDeductions = cumulativeIncome * deductionRate;
    const cumulativeTaxableBase = Math.max(0, cumulativeIncome - cumulativeDeductions);
    
    const quarterlyISR = calculateISR(taxableBase, fiscalConfig.isr_brackets) / 4;
    const quarterlyIVA = calculateIVAPayable(q.income, deductions, fiscalConfig.iva_rate);
    const cumulativeISR = calculateISR(cumulativeTaxableBase, fiscalConfig.isr_brackets);
    
    return {
      quarter: q.quarter,
      income: Math.round(q.income * 100) / 100,
      deductions: Math.round(deductions * 100) / 100,
      taxableBase: Math.round(taxableBase * 100) / 100,
      isr: Math.round(quarterlyISR * 100) / 100,
      iva: Math.round(quarterlyIVA * 100) / 100,
      totalTax: Math.round((quarterlyISR + quarterlyIVA) * 100) / 100,
      cumulativeIncome: Math.round(cumulativeIncome * 100) / 100,
      cumulativeISR: Math.round(cumulativeISR * 100) / 100
    };
  });
}

/**
 * Calculate DIOT (Declaración Informativa de Operaciones con Terceros) requirement
 */
export function requiresDIOT(monthlyPayments, threshold = 50000) {
  return monthlyPayments >= threshold;
}

/**
 * Get tax payment calendar for the year
 */
export function getTaxPaymentCalendar(year) {
  const calendar = [];
  
  for (let month = 1; month <= 12; month++) {
    const paymentDate = new Date(year, month, 17); // 17th of following month
    
    calendar.push({
      month,
      month_name: getMonthName(month),
      period: `${getMonthName(month)} ${year}`,
      payment_date: paymentDate.toISOString().split('T')[0],
      payment_type: 'Provisional ISR & IVA',
      due_day: 17
    });
  }

  // Add annual declaration
  calendar.push({
    month: 13,
    month_name: 'Declaración Anual',
    period: `Año ${year}`,
    payment_date: new Date(year + 1, 3, 30).toISOString().split('T')[0], // April 30 of following year
    payment_type: 'Declaración Anual',
    due_day: 30
  });

  return calendar;
}

/**
 * Calculate deduction percentage from expenses
 */
export function calculateDeductionPercentage(totalExpenses, deductibleExpenses) {
  if (totalExpenses <= 0) return 0;
  return Math.round((deductibleExpenses / totalExpenses) * 10000) / 100;
}

/**
 * Suggest deduction optimization
 */
export function suggestDeductionOptimization(income, currentDeductions, maxDeductionRate = 0.4) {
  const currentDeductionRate = income > 0 ? currentDeductions / income : 0;
  const optimalDeductions = income * maxDeductionRate;
  const potentialAdditional = Math.max(0, optimalDeductions - currentDeductions);

  return {
    currentDeductions: Math.round(currentDeductions * 100) / 100,
    currentRate: Math.round(currentDeductionRate * 10000) / 100,
    optimalDeductions: Math.round(optimalDeductions * 100) / 100,
    optimalRate: Math.round(maxDeductionRate * 10000) / 100,
    potentialAdditional: Math.round(potentialAdditional * 100) / 100,
    hasRoom: potentialAdditional > 100
  };
}

/**
 * Calculate tax comparison scenarios
 */
export function calculateTaxScenarios(baseIncome, fiscalConfig) {
  const scenarios = [
    { name: 'Sin deducciones', deductionRate: 0 },
    { name: 'Deducciones mínimas (20%)', deductionRate: 0.20 },
    { name: 'Deducciones moderadas (30%)', deductionRate: 0.30 },
    { name: 'Deducciones óptimas (40%)', deductionRate: 0.40 }
  ];

  return scenarios.map(scenario => {
    const deductions = baseIncome * scenario.deductionRate;
    const summary = calculateAnnualTaxSummary(baseIncome, deductions, fiscalConfig);
    
    return {
      name: scenario.name,
      deductionRate: Math.round(scenario.deductionRate * 100),
      ...summary
    };
  });
}

/**
 * Get month name in Spanish
 */
function getMonthName(month) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[month - 1];
}

/**
 * Format ISR bracket for display
 */
export function formatISRBracket(bracket) {
  return {
    range: `$${bracket.lowerLimit.toLocaleString()} - $${bracket.limit.toLocaleString()}`,
    rate: `${(bracket.rate * 100).toFixed(2)}%`,
    fixedFee: `$${bracket.fixedFee.toLocaleString()}`
  };
}

/**
 * Calculate payment schedule
 */
export function calculatePaymentSchedule(annualIncome, annualDeductions, fiscalConfig) {
  const schedule = [];
  const monthlyIncome = annualIncome / 12;
  const monthlyDeductions = annualDeductions / 12;

  for (let month = 1; month <= 12; month++) {
    const accumulatedIncome = monthlyIncome * month;
    const accumulatedDeductions = monthlyDeductions * month;
    const accumulatedTaxableBase = Math.max(0, accumulatedIncome - accumulatedDeductions);

    const monthlyISR = calculateMonthlyISR(monthlyIncome, monthlyDeductions, fiscalConfig.isr_brackets);
    const monthlyIVA = calculateIVAPayable(monthlyIncome, monthlyDeductions, fiscalConfig.iva_rate);

    schedule.push({
      month,
      month_name: getMonthName(month),
      monthly_income: Math.round(monthlyIncome * 100) / 100,
      monthly_deductions: Math.round(monthlyDeductions * 100) / 100,
      monthly_isr: Math.round(monthlyISR * 100) / 100,
      monthly_iva: Math.round(monthlyIVA * 100) / 100,
      monthly_total: Math.round((monthlyISR + monthlyIVA) * 100) / 100,
      accumulated_income: Math.round(accumulatedIncome * 100) / 100,
      accumulated_taxable: Math.round(accumulatedTaxableBase * 100) / 100
    });
  }

  return schedule;
}

/**
 * Validate fiscal year data
 */
export function validateFiscalYearData(data) {
  const errors = [];
  const warnings = [];

  if (!data.income || data.income <= 0) {
    errors.push('Income must be greater than 0');
  }

  if (data.deductions && data.deductions > data.income) {
    warnings.push('Deductions exceed income - this may trigger audit');
  }

  const deductionRate = data.income > 0 ? data.deductions / data.income : 0;
  if (deductionRate > 0.5) {
    warnings.push('Deduction rate exceeds 50% - may require additional documentation');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
