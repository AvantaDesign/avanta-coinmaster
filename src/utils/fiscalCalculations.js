// Mexican Tax Calculation Utilities
// ISR (Income Tax) and IVA (VAT) calculations according to Mexican tax laws

/**
 * ISR Tax Brackets for 2024 (Personas Físicas - Actividad Empresarial)
 * These are the official SAT tax brackets
 */
const ISR_BRACKETS = [
  { min: 0, max: 7735.00, rate: 0.0192, fixedFee: 0, lowerLimit: 0 },
  { min: 7735.01, max: 65651.07, rate: 0.0640, fixedFee: 148.51, lowerLimit: 7735.00 },
  { min: 65651.08, max: 115375.90, rate: 0.1088, fixedFee: 3855.14, lowerLimit: 65651.07 },
  { min: 115375.91, max: 134119.41, rate: 0.1600, fixedFee: 9265.20, lowerLimit: 115375.90 },
  { min: 134119.42, max: 160577.65, rate: 0.1792, fixedFee: 12264.16, lowerLimit: 134119.41 },
  { min: 160577.66, max: 323862.00, rate: 0.2136, fixedFee: 17005.47, lowerLimit: 160577.65 },
  { min: 323862.01, max: 510451.00, rate: 0.2352, fixedFee: 51883.01, lowerLimit: 323862.00 },
  { min: 510451.01, max: 974535.03, rate: 0.3000, fixedFee: 95768.74, lowerLimit: 510451.00 },
  { min: 974535.04, max: 1299380.04, rate: 0.3200, fixedFee: 234993.95, lowerLimit: 974535.03 },
  { min: 1299380.05, max: 3898140.12, rate: 0.3400, fixedFee: 338944.34, lowerLimit: 1299380.04 },
  { min: 3898140.13, max: Infinity, rate: 0.3500, fixedFee: 1222522.76, lowerLimit: 3898140.12 }
];

/**
 * Calculate ISR (Income Tax) based on Mexican tax brackets
 * @param {number} taxableIncome - Annual taxable income (utilidad)
 * @returns {number} - ISR amount to pay
 */
export function calculateISR(taxableIncome) {
  if (taxableIncome <= 0) return 0;

  // Find the appropriate tax bracket
  const bracket = ISR_BRACKETS.find(b => taxableIncome >= b.min && taxableIncome <= b.max);
  
  if (!bracket) {
    // If no bracket found, use the highest rate
    const lastBracket = ISR_BRACKETS[ISR_BRACKETS.length - 1];
    return (taxableIncome - lastBracket.lowerLimit) * lastBracket.rate + lastBracket.fixedFee;
  }

  // Calculate ISR: fixed fee + (income - lower limit) * rate
  const isr = bracket.fixedFee + (taxableIncome - bracket.lowerLimit) * bracket.rate;
  return Math.max(0, isr);
}

/**
 * Calculate ISR for a specific month (provisional payment)
 * @param {number} monthlyIncome - Monthly income
 * @param {number} monthlyDeductible - Monthly deductible expenses
 * @param {number} accumulatedIncome - Accumulated income for the year
 * @param {number} accumulatedDeductible - Accumulated deductible expenses for the year
 * @returns {Object} - ISR calculation details
 */
export function calculateMonthlyISR(monthlyIncome, monthlyDeductible, accumulatedIncome = 0, accumulatedDeductible = 0) {
  const monthlyUtilidad = monthlyIncome - monthlyDeductible;
  const totalIncome = accumulatedIncome + monthlyIncome;
  const totalDeductible = accumulatedDeductible + monthlyDeductible;
  const totalUtilidad = totalIncome - totalDeductible;

  // Calculate ISR on accumulated income
  const totalISR = calculateISR(totalUtilidad);
  
  // ISR already paid (on previous months)
  const previousUtilidad = accumulatedIncome - accumulatedDeductible;
  const previousISR = calculateISR(previousUtilidad);
  
  // Monthly ISR to pay = Total ISR - Previously paid ISR
  const monthlyISR = Math.max(0, totalISR - previousISR);

  return {
    monthlyUtilidad,
    totalUtilidad,
    monthlyISR,
    totalISR,
    previousISR,
    effectiveRate: totalUtilidad > 0 ? (totalISR / totalUtilidad) * 100 : 0
  };
}

/**
 * Calculate quarterly ISR
 * @param {number} quarterlyIncome - Total income for the quarter
 * @param {number} quarterlyDeductible - Total deductible expenses for the quarter
 * @param {number} previousQuartersIncome - Income from previous quarters in the year
 * @param {number} previousQuartersDeductible - Deductible from previous quarters in the year
 * @returns {Object} - Quarterly ISR calculation
 */
export function calculateQuarterlyISR(quarterlyIncome, quarterlyDeductible, previousQuartersIncome = 0, previousQuartersDeductible = 0) {
  return calculateMonthlyISR(quarterlyIncome, quarterlyDeductible, previousQuartersIncome, previousQuartersDeductible);
}

/**
 * Calculate annual ISR
 * @param {number} annualIncome - Total annual income
 * @param {number} annualDeductible - Total annual deductible expenses
 * @returns {Object} - Annual ISR calculation
 */
export function calculateAnnualISR(annualIncome, annualDeductible) {
  const utilidad = annualIncome - annualDeductible;
  const isr = calculateISR(utilidad);
  
  return {
    annualIncome,
    annualDeductible,
    utilidad,
    isr,
    effectiveRate: utilidad > 0 ? (isr / utilidad) * 100 : 0
  };
}

/**
 * Calculate IVA (VAT - 16%)
 * @param {number} income - Total income subject to IVA
 * @param {number} deductible - Total deductible expenses with IVA
 * @returns {Object} - IVA calculation details
 */
export function calculateIVA(income, deductible) {
  const IVA_RATE = 0.16;
  
  const ivaCobrado = income * IVA_RATE;
  const ivaPagado = deductible * IVA_RATE;
  const ivaAPagar = Math.max(0, ivaCobrado - ivaPagado);
  const ivaAFavor = Math.max(0, ivaPagado - ivaCobrado);

  return {
    ivaCobrado,
    ivaPagado,
    ivaAPagar,
    ivaAFavor,
    rate: IVA_RATE * 100
  };
}

/**
 * Calculate deductible percentage
 * @param {number} totalExpenses - Total expenses
 * @param {number} deductibleExpenses - Deductible expenses
 * @returns {number} - Percentage of deductible expenses
 */
export function calculateDeductiblePercentage(totalExpenses, deductibleExpenses) {
  if (totalExpenses === 0) return 0;
  return (deductibleExpenses / totalExpenses) * 100;
}

/**
 * Get the tax payment due date
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Date} - Due date (17th of following month)
 */
export function getTaxDueDate(year, month) {
  const dueMonth = month === 12 ? 1 : month + 1;
  const dueYear = month === 12 ? year + 1 : year;
  return new Date(dueYear, dueMonth - 1, 17);
}

/**
 * Get quarterly tax payment due dates
 * @param {number} year - Year
 * @param {number} quarter - Quarter (1-4)
 * @returns {Date} - Due date
 */
export function getQuarterlyDueDate(year, quarter) {
  const quarterEndMonths = [3, 6, 9, 12]; // March, June, September, December
  const month = quarterEndMonths[quarter - 1];
  return getTaxDueDate(year, month);
}

/**
 * Calculate fiscal summary for a period
 * @param {Array} transactions - Array of transactions
 * @returns {Object} - Fiscal summary
 */
export function calculateFiscalSummary(transactions) {
  let totalIncome = 0;
  let totalExpenses = 0;
  let deductibleExpenses = 0;
  let businessIncome = 0;
  let businessExpenses = 0;
  let personalExpenses = 0;

  transactions.forEach(tx => {
    const amount = Math.abs(tx.amount);
    
    if (tx.type === 'ingreso') {
      totalIncome += amount;
      if (tx.category === 'avanta' || tx.transaction_type === 'business') {
        businessIncome += amount;
      }
    } else if (tx.type === 'gasto') {
      totalExpenses += amount;
      
      if (tx.category === 'avanta' || tx.transaction_type === 'business') {
        businessExpenses += amount;
        if (tx.is_deductible === 1) {
          deductibleExpenses += amount;
        }
      } else {
        personalExpenses += amount;
      }
    }
  });

  const utilidad = businessIncome - deductibleExpenses;
  const isr = calculateISR(utilidad);
  const iva = calculateIVA(businessIncome, deductibleExpenses);

  return {
    totalIncome,
    totalExpenses,
    businessIncome,
    businessExpenses,
    personalExpenses,
    deductibleExpenses,
    utilidad,
    isr,
    iva: iva.ivaAPagar,
    ivaDetails: iva,
    deductiblePercentage: calculateDeductiblePercentage(businessExpenses, deductibleExpenses)
  };
}

/**
 * Calculate quarterly summaries for the year
 * @param {Array} transactions - Array of transactions for the year
 * @returns {Array} - Array of quarterly summaries
 */
export function calculateQuarterlySummaries(transactions) {
  const quarters = [
    { quarter: 1, months: [1, 2, 3], name: 'Q1 Enero-Marzo' },
    { quarter: 2, months: [4, 5, 6], name: 'Q2 Abril-Junio' },
    { quarter: 3, months: [7, 8, 9], name: 'Q3 Julio-Septiembre' },
    { quarter: 4, months: [10, 11, 12], name: 'Q4 Octubre-Diciembre' }
  ];

  return quarters.map(q => {
    const quarterTransactions = transactions.filter(tx => {
      const txDate = new Date(tx.date);
      const txMonth = txDate.getMonth() + 1;
      return q.months.includes(txMonth);
    });

    const summary = calculateFiscalSummary(quarterTransactions);
    
    return {
      ...q,
      ...summary,
      dueDate: getQuarterlyDueDate(new Date(transactions[0]?.date).getFullYear(), q.quarter)
    };
  });
}

/**
 * Calculate expense breakdown by category
 * @param {Array} transactions - Array of transactions
 * @returns {Array} - Expense breakdown
 */
export function calculateExpenseBreakdown(transactions) {
  const breakdown = {};

  transactions
    .filter(tx => tx.type === 'gasto')
    .forEach(tx => {
      const category = tx.category || 'Sin categoría';
      const amount = Math.abs(tx.amount);
      
      if (!breakdown[category]) {
        breakdown[category] = {
          category,
          total: 0,
          deductible: 0,
          count: 0,
          isDeductible: false
        };
      }

      breakdown[category].total += amount;
      breakdown[category].count += 1;
      
      if (tx.is_deductible === 1) {
        breakdown[category].deductible += amount;
        breakdown[category].isDeductible = true;
      }
    });

  return Object.values(breakdown).sort((a, b) => b.total - a.total);
}

/**
 * Format currency in Mexican Pesos
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format date
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date
 */
export function formatDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(d);
}

/**
 * Format percentage
 * @param {number} value - Percentage value
 * @returns {string} - Formatted percentage
 */
export function formatPercentage(value) {
  return `${value.toFixed(2)}%`;
}

/**
 * Check if a date is overdue
 * @param {Date} dueDate - Due date
 * @returns {boolean} - True if overdue
 */
export function isOverdue(dueDate) {
  return new Date() > new Date(dueDate);
}

/**
 * Get days until due date
 * @param {Date} dueDate - Due date
 * @returns {number} - Days until due (negative if overdue)
 */
export function getDaysUntilDue(dueDate) {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
