/**
 * IVA Calculation Utilities
 * Handles IVA (Value Added Tax) calculations for Mexican tax compliance
 */

const IVA_RATE = 0.16; // 16% IVA rate in Mexico

/**
 * Calculate IVA Acreditable (creditable VAT from expenses)
 * @param {Array} expenses - Array of expense transactions
 * @returns {Object} IVA acreditable summary
 */
export function calculateIVAAcreditable(expenses) {
  if (!Array.isArray(expenses) || expenses.length === 0) {
    return {
      total: 0,
      count: 0,
      breakdown: []
    };
  }

  const breakdown = expenses
    .filter(expense => expense.transaction_type === 'egreso' && expense.amount > 0)
    .map(expense => {
      const amount = parseFloat(expense.amount) || 0;
      const ivaAmount = amount * IVA_RATE;
      return {
        id: expense.id,
        date: expense.date,
        description: expense.description,
        amount: amount,
        ivaAmount: ivaAmount,
        category: expense.category_name || 'Sin categoría'
      };
    });

  const total = breakdown.reduce((sum, item) => sum + item.ivaAmount, 0);

  return {
    total: total,
    count: breakdown.length,
    breakdown: breakdown
  };
}

/**
 * Calculate IVA Trasladado (transferred VAT from income)
 * @param {Array} income - Array of income transactions
 * @returns {Object} IVA trasladado summary
 */
export function calculateIVATrasladado(income) {
  if (!Array.isArray(income) || income.length === 0) {
    return {
      total: 0,
      count: 0,
      breakdown: []
    };
  }

  const breakdown = income
    .filter(inc => inc.transaction_type === 'ingreso' && inc.amount > 0)
    .map(inc => {
      const amount = parseFloat(inc.amount) || 0;
      const ivaAmount = amount * IVA_RATE;
      return {
        id: inc.id,
        date: inc.date,
        description: inc.description,
        amount: amount,
        ivaAmount: ivaAmount,
        category: inc.category_name || 'Sin categoría'
      };
    });

  const total = breakdown.reduce((sum, item) => sum + item.ivaAmount, 0);

  return {
    total: total,
    count: breakdown.length,
    breakdown: breakdown
  };
}

/**
 * Calculate IVA balance (favor or contra)
 * @param {number} acreditable - IVA acreditable amount
 * @param {number} trasladado - IVA trasladado amount
 * @returns {Object} IVA balance information
 */
export function getIVABalance(acreditable, trasladado) {
  const balance = acreditable - trasladado;
  
  return {
    balance: balance,
    status: balance > 0 ? 'favor' : balance < 0 ? 'pagar' : 'neutral',
    absoluteAmount: Math.abs(balance),
    acreditable: acreditable,
    trasladado: trasladado
  };
}

/**
 * Get payment deadline for IVA period
 * @param {Date} periodDate - Date in the period
 * @returns {Object} Payment deadline information
 */
export function getPaymentDeadline(periodDate = new Date()) {
  const date = new Date(periodDate);
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // IVA is paid monthly, deadline is 17th of following month
  const deadlineMonth = month === 11 ? 0 : month + 1;
  const deadlineYear = month === 11 ? year + 1 : year;
  const deadline = new Date(deadlineYear, deadlineMonth, 17);
  
  const today = new Date();
  const daysUntil = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
  
  return {
    deadline: deadline,
    daysUntil: daysUntil,
    isPastDue: daysUntil < 0,
    isUrgent: daysUntil >= 0 && daysUntil <= 5
  };
}

/**
 * Format IVA status for display
 * @param {number} balance - IVA balance amount
 * @returns {Object} Formatted status information
 */
export function formatIVAStatus(balance) {
  const status = balance > 0 ? 'favor' : balance < 0 ? 'pagar' : 'neutral';
  
  const statusLabels = {
    favor: 'IVA a Favor',
    pagar: 'IVA a Pagar',
    neutral: 'IVA Neutral'
  };
  
  const statusColors = {
    favor: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-800 dark:text-green-200',
      border: 'border-green-300 dark:border-green-700'
    },
    pagar: {
      bg: 'bg-red-100 dark:bg-red-900/20',
      text: 'text-red-800 dark:text-red-200',
      border: 'border-red-300 dark:border-red-700'
    },
    neutral: {
      bg: 'bg-gray-100 dark:bg-gray-800',
      text: 'text-gray-800 dark:text-gray-200',
      border: 'border-gray-300 dark:border-gray-600'
    }
  };
  
  return {
    status: status,
    label: statusLabels[status],
    colors: statusColors[status],
    amount: Math.abs(balance)
  };
}

/**
 * Calculate IVA for a specific month
 * @param {Array} transactions - All transactions
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {Object} Monthly IVA calculation
 */
export function calculateMonthlyIVA(transactions, year, month) {
  if (!Array.isArray(transactions)) {
    return {
      acreditable: 0,
      trasladado: 0,
      balance: 0,
      status: 'neutral',
      income: [],
      expenses: []
    };
  }

  const monthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });

  const income = monthTransactions.filter(t => t.transaction_type === 'ingreso');
  const expenses = monthTransactions.filter(t => t.transaction_type === 'egreso');

  const acreditable = calculateIVAAcreditable(expenses);
  const trasladado = calculateIVATrasladado(income);
  const balance = getIVABalance(acreditable.total, trasladado.total);

  return {
    acreditable: acreditable.total,
    trasladado: trasladado.total,
    balance: balance.balance,
    status: balance.status,
    income: income,
    expenses: expenses,
    period: {
      year: year,
      month: month,
      label: new Date(year, month).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
    }
  };
}

/**
 * Get IVA trends over time
 * @param {Array} transactions - All transactions
 * @param {number} months - Number of months to analyze
 * @returns {Array} Array of monthly IVA data
 */
export function getIVATrends(transactions, months = 6) {
  const trends = [];
  const today = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthData = calculateMonthlyIVA(transactions, date.getFullYear(), date.getMonth());
    trends.push(monthData);
  }
  
  return trends;
}

/**
 * Calculate IVA from base amount
 * @param {number} baseAmount - Amount without IVA
 * @returns {Object} IVA calculation
 */
export function calculateIVAFromBase(baseAmount) {
  const amount = parseFloat(baseAmount) || 0;
  const ivaAmount = amount * IVA_RATE;
  const totalAmount = amount + ivaAmount;
  
  return {
    base: amount,
    iva: ivaAmount,
    total: totalAmount,
    rate: IVA_RATE
  };
}

/**
 * Extract IVA from total amount
 * @param {number} totalAmount - Amount including IVA
 * @returns {Object} IVA extraction
 */
export function extractIVAFromTotal(totalAmount) {
  const total = parseFloat(totalAmount) || 0;
  const baseAmount = total / (1 + IVA_RATE);
  const ivaAmount = total - baseAmount;
  
  return {
    base: baseAmount,
    iva: ivaAmount,
    total: total,
    rate: IVA_RATE
  };
}
