/**
 * Tax Calculation Engine for Mexican Tax System
 * Handles ISR (Impuesto Sobre la Renta) calculations for "Persona Física con Actividad Empresarial"
 */

/**
 * ISR Tax brackets for 2024 (amounts in MXN)
 * Source: SAT - Tabla de ISR personas físicas
 */
const ISR_BRACKETS_2024 = [
  { lowerLimit: 0.01, upperLimit: 7735.00, fixedFee: 0.00, excessRate: 0.0192 },
  { lowerLimit: 7735.01, upperLimit: 65651.07, fixedFee: 148.51, excessRate: 0.0640 },
  { lowerLimit: 65651.08, upperLimit: 115375.90, fixedFee: 3855.14, excessRate: 0.1088 },
  { lowerLimit: 115375.91, upperLimit: 134119.41, fixedFee: 9265.20, excessRate: 0.1600 },
  { lowerLimit: 134119.42, upperLimit: 160577.65, fixedFee: 12264.16, excessRate: 0.1792 },
  { lowerLimit: 160577.66, upperLimit: 323862.00, fixedFee: 17005.47, excessRate: 0.2136 },
  { lowerLimit: 323862.01, upperLimit: 510451.00, fixedFee: 51883.01, excessRate: 0.2352 },
  { lowerLimit: 510451.01, upperLimit: 974535.03, fixedFee: 95768.74, excessRate: 0.3000 },
  { lowerLimit: 974535.04, upperLimit: 1299380.04, fixedFee: 234993.95, excessRate: 0.3200 },
  { lowerLimit: 1299380.05, upperLimit: 3898140.12, fixedFee: 338944.34, excessRate: 0.3400 },
  { lowerLimit: 3898140.13, upperLimit: Infinity, fixedFee: 1222522.76, excessRate: 0.3500 }
];

/**
 * Deduction limits for 2024
 */
const DEDUCTION_LIMITS_2024 = {
  medical: {
    description: 'Gastos médicos, dentales y hospitalarios',
    limit: null, // No limit
    requires: 'Factura con RFC, pago con tarjeta/transferencia'
  },
  education: {
    description: 'Colegiaturas (educación básica y media superior)',
    limit: {
      preschool: 14200,
      primary: 12900,
      secondary: 19900,
      highSchool: 24500
    },
    requires: 'Factura con RFC, pago con tarjeta/transferencia'
  },
  mortgage: {
    description: 'Intereses reales de crédito hipotecario',
    limit: null, // No limit
    requires: 'Estado de cuenta del banco'
  },
  retirement: {
    description: 'Aportaciones complementarias al retiro',
    limit: 152000, // 10% of annual income or 5 UMAs, whichever is less
    requires: 'Comprobante de aportación'
  },
  medicalInsurance: {
    description: 'Primas de seguros de gastos médicos',
    limit: null, // No limit
    requires: 'Factura y póliza de seguro'
  },
  donations: {
    description: 'Donativos a instituciones autorizadas',
    limit: 0.07, // 7% of accumulated income
    requires: 'Comprobante de donativo autorizado por SAT'
  },
  funeralExpenses: {
    description: 'Gastos funerales',
    limit: 43650, // 1 UMA annual
    requires: 'Factura con RFC'
  },
  transportationSchool: {
    description: 'Transporte escolar obligatorio',
    limit: null, // No limit
    requires: 'Factura con RFC'
  },
  businessExpenses: {
    description: 'Gastos de negocio (persona física con actividad empresarial)',
    limit: null, // No limit, but must be strictly necessary for business
    requires: 'Facturas con RFC relacionadas con la actividad empresarial'
  }
};

/**
 * Calculate ISR (Income Tax) based on annual income
 * @param {number} annualIncome - Annual taxable income
 * @returns {Object} ISR calculation details
 */
export function calculateISR(annualIncome) {
  if (annualIncome <= 0) {
    return {
      annualIncome: 0,
      bracket: null,
      fixedFee: 0,
      marginalRate: 0,
      taxableExcess: 0,
      taxOnExcess: 0,
      totalTax: 0,
      effectiveRate: 0
    };
  }

  // Find applicable bracket
  const bracket = ISR_BRACKETS_2024.find(
    b => annualIncome >= b.lowerLimit && annualIncome <= b.upperLimit
  );

  if (!bracket) {
    throw new Error('No se encontró tabla de ISR aplicable');
  }

  const taxableExcess = annualIncome - bracket.lowerLimit + 0.01;
  const taxOnExcess = taxableExcess * bracket.excessRate;
  const totalTax = bracket.fixedFee + taxOnExcess;
  const effectiveRate = (totalTax / annualIncome) * 100;

  return {
    annualIncome: annualIncome,
    bracket: bracket,
    fixedFee: bracket.fixedFee,
    marginalRate: bracket.excessRate * 100,
    taxableExcess: taxableExcess,
    taxOnExcess: taxOnExcess,
    totalTax: totalTax,
    effectiveRate: effectiveRate
  };
}

/**
 * Get deduction limits for the year
 * @param {number} year - Tax year
 * @param {number} annualIncome - Annual income (for percentage-based limits)
 * @returns {Object} Deduction limits
 */
export function getDeductionLimits(year = 2024, annualIncome = 0) {
  // Currently only 2024 data available
  if (year !== 2024) {
    console.warn(`Limits for year ${year} not available, using 2024`);
  }

  const limits = { ...DEDUCTION_LIMITS_2024 };

  // Calculate percentage-based limits
  if (annualIncome > 0) {
    limits.donations.calculatedLimit = annualIncome * limits.donations.limit;
    limits.retirement.calculatedLimit = Math.min(
      annualIncome * 0.10,
      limits.retirement.limit
    );
  }

  return limits;
}

/**
 * Identify potential deductions from transactions
 * @param {Array} transactions - Array of transaction objects
 * @returns {Array} Identified deductions
 */
export function identifyDeductions(transactions) {
  const deductions = [];

  if (!Array.isArray(transactions)) {
    return deductions;
  }

  transactions.forEach(transaction => {
    const amount = parseFloat(transaction.amount) || 0;
    if (amount <= 0) return;

    const description = (transaction.description || '').toLowerCase();
    const category = (transaction.category_name || '').toLowerCase();
    const notes = (transaction.notes || '').toLowerCase();
    const searchText = `${description} ${category} ${notes}`;

    // Medical expenses
    if (searchText.match(/médico|doctor|hospital|clínica|dental|medicamento|consulta|análisis|radiografía/)) {
      deductions.push({
        transaction_id: transaction.id,
        category: 'medical',
        description: transaction.description,
        amount: amount,
        date: transaction.date,
        confidence: 0.8,
        reason: 'Gasto médico identificado'
      });
    }

    // Education expenses
    if (searchText.match(/colegiatura|escuela|universidad|curso|educación|colegio/)) {
      deductions.push({
        transaction_id: transaction.id,
        category: 'education',
        description: transaction.description,
        amount: amount,
        date: transaction.date,
        confidence: 0.7,
        reason: 'Gasto educativo identificado'
      });
    }

    // Mortgage interest
    if (searchText.match(/hipoteca|interés|crédito hipotecario|vivienda/)) {
      deductions.push({
        transaction_id: transaction.id,
        category: 'mortgage',
        description: transaction.description,
        amount: amount,
        date: transaction.date,
        confidence: 0.6,
        reason: 'Posible interés hipotecario'
      });
    }

    // Medical insurance
    if (searchText.match(/seguro médico|seguro de gastos médicos|prima de seguro/)) {
      deductions.push({
        transaction_id: transaction.id,
        category: 'medicalInsurance',
        description: transaction.description,
        amount: amount,
        date: transaction.date,
        confidence: 0.8,
        reason: 'Seguro médico identificado'
      });
    }

    // Donations
    if (searchText.match(/donativo|donación|fundación|caridad|ong/)) {
      deductions.push({
        transaction_id: transaction.id,
        category: 'donations',
        description: transaction.description,
        amount: amount,
        date: transaction.date,
        confidence: 0.7,
        reason: 'Donativo identificado'
      });
    }

    // Retirement contributions
    if (searchText.match(/afore|retiro|pensión|sar/)) {
      deductions.push({
        transaction_id: transaction.id,
        category: 'retirement',
        description: transaction.description,
        amount: amount,
        date: transaction.date,
        confidence: 0.9,
        reason: 'Aportación al retiro identificada'
      });
    }

    // Business expenses (if marked as deductible or business transaction)
    if (transaction.is_deductible || transaction.transaction_type === 'business') {
      deductions.push({
        transaction_id: transaction.id,
        category: 'businessExpenses',
        description: transaction.description,
        amount: amount,
        date: transaction.date,
        confidence: 0.9,
        reason: 'Gasto de negocio marcado como deducible'
      });
    }
  });

  return deductions;
}

/**
 * Calculate tax credits
 * @param {number} taxLiability - Calculated tax liability
 * @param {Array} credits - Array of available credits
 * @returns {Object} Credits calculation
 */
export function calculateCredits(taxLiability, credits = []) {
  if (!Array.isArray(credits) || credits.length === 0) {
    return {
      totalCredits: 0,
      appliedCredits: [],
      remainingLiability: taxLiability
    };
  }

  let totalCredits = 0;
  const appliedCredits = [];

  credits.forEach(credit => {
    const amount = parseFloat(credit.amount) || 0;
    if (amount > 0 && credit.is_applied) {
      totalCredits += amount;
      appliedCredits.push({
        type: credit.credit_type,
        description: credit.description,
        amount: amount
      });
    }
  });

  const remainingLiability = Math.max(0, taxLiability - totalCredits);

  return {
    totalCredits: totalCredits,
    appliedCredits: appliedCredits,
    remainingLiability: remainingLiability,
    creditUtilization: taxLiability > 0 ? (totalCredits / taxLiability) * 100 : 0
  };
}

/**
 * Generate detailed tax report
 * @param {Object} simulation - Simulation data
 * @returns {Object} Detailed report
 */
export function generateReport(simulation) {
  const {
    income_total = 0,
    deductions_total = 0,
    credits_total = 0
  } = simulation;

  // Calculate taxable income
  const taxableIncome = Math.max(0, income_total - deductions_total);

  // Calculate ISR
  const isrCalculation = calculateISR(taxableIncome);

  // Apply credits
  const creditsCalculation = calculateCredits(isrCalculation.totalTax, [
    { amount: credits_total, is_applied: true, credit_type: 'general', description: 'Créditos fiscales' }
  ]);

  // Calculate savings
  const savingsFromDeductions = calculateISR(income_total).totalTax - isrCalculation.totalTax;
  const savingsFromCredits = isrCalculation.totalTax - creditsCalculation.remainingLiability;
  const totalSavings = savingsFromDeductions + savingsFromCredits;

  // Generate recommendations
  const recommendations = [];
  
  if (deductions_total < income_total * 0.15) {
    recommendations.push({
      type: 'deductions',
      priority: 'high',
      message: 'Tus deducciones son bajas. Revisa gastos médicos, educativos y de negocio que puedas deducir.',
      potentialSaving: income_total * 0.05 * (isrCalculation.bracket?.excessRate || 0.25)
    });
  }

  if (creditsCalculation.creditUtilization < 50 && credits_total > 0) {
    recommendations.push({
      type: 'credits',
      priority: 'medium',
      message: 'Tienes créditos fiscales disponibles que no estás aprovechando completamente.',
      potentialSaving: credits_total * 0.5
    });
  }

  if (isrCalculation.effectiveRate > 25) {
    recommendations.push({
      type: 'planning',
      priority: 'high',
      message: 'Tu tasa efectiva es alta. Considera estrategias de planificación fiscal.',
      potentialSaving: income_total * 0.03
    });
  }

  return {
    summary: {
      grossIncome: income_total,
      totalDeductions: deductions_total,
      taxableIncome: taxableIncome,
      isrCalculated: isrCalculation.totalTax,
      totalCredits: credits_total,
      netTaxLiability: creditsCalculation.remainingLiability,
      effectiveTaxRate: isrCalculation.effectiveRate,
      marginalTaxRate: isrCalculation.marginalRate
    },
    breakdown: {
      isr: isrCalculation,
      credits: creditsCalculation,
      savings: {
        fromDeductions: savingsFromDeductions,
        fromCredits: savingsFromCredits,
        total: totalSavings
      }
    },
    recommendations: recommendations,
    comparisonScenarios: [
      {
        name: 'Sin deducciones',
        taxLiability: calculateISR(income_total).totalTax,
        difference: calculateISR(income_total).totalTax - creditsCalculation.remainingLiability
      },
      {
        name: 'Con 10% más de deducciones',
        taxLiability: calculateISR(taxableIncome * 0.90).totalTax,
        difference: creditsCalculation.remainingLiability - calculateISR(taxableIncome * 0.90).totalTax
      }
    ]
  };
}

/**
 * Calculate monthly ISR provisional payments
 * @param {number} monthlyIncome - Monthly income
 * @param {number} monthlyDeductions - Monthly deductions
 * @returns {Object} Monthly ISR calculation
 */
export function calculateMonthlyISR(monthlyIncome, monthlyDeductions = 0) {
  const taxableIncome = Math.max(0, monthlyIncome - monthlyDeductions);
  const annualEquivalent = taxableIncome * 12;
  
  const annualISR = calculateISR(annualEquivalent);
  const monthlyISR = annualISR.totalTax / 12;

  return {
    monthlyIncome: monthlyIncome,
    monthlyDeductions: monthlyDeductions,
    taxableIncome: taxableIncome,
    annualEquivalent: annualEquivalent,
    monthlyISR: monthlyISR,
    effectiveRate: (monthlyISR / monthlyIncome) * 100
  };
}

/**
 * Validate deduction against limits
 * @param {string} category - Deduction category
 * @param {number} amount - Deduction amount
 * @param {number} annualIncome - Annual income
 * @returns {Object} Validation result
 */
export function validateDeduction(category, amount, annualIncome) {
  const limits = getDeductionLimits(2024, annualIncome);
  const categoryLimit = limits[category];

  if (!categoryLimit) {
    return {
      valid: false,
      error: 'Categoría de deducción no válida',
      allowedAmount: 0
    };
  }

  let allowedAmount = amount;
  let warning = null;

  // Check specific limits
  if (typeof categoryLimit.limit === 'number') {
    if (amount > categoryLimit.limit) {
      allowedAmount = categoryLimit.limit;
      warning = `Esta deducción tiene un límite de $${categoryLimit.limit.toFixed(2)}`;
    }
  } else if (typeof categoryLimit.calculatedLimit === 'number') {
    if (amount > categoryLimit.calculatedLimit) {
      allowedAmount = categoryLimit.calculatedLimit;
      warning = `Esta deducción tiene un límite de $${categoryLimit.calculatedLimit.toFixed(2)}`;
    }
  }

  return {
    valid: true,
    allowedAmount: allowedAmount,
    originalAmount: amount,
    exceededLimit: amount > allowedAmount,
    warning: warning,
    description: categoryLimit.description,
    requirements: categoryLimit.requires
  };
}
