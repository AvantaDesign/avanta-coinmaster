// Credits Utility Functions
// Helper functions for credit calculations and formatting

/**
 * Calculate current balance from credit movements
 * @param {Array} movements - Array of credit movements
 * @returns {number} Current balance
 */
export function calculateCreditBalance(movements) {
  let balance = 0;
  
  movements.forEach(movement => {
    if (movement.type === 'charge' || movement.type === 'interest') {
      balance += movement.amount;
    } else if (movement.type === 'payment') {
      balance -= movement.amount;
    }
  });
  
  return balance;
}

/**
 * Calculate available credit
 * @param {number} creditLimit - Total credit limit
 * @param {number} currentBalance - Current balance owed
 * @returns {number} Available credit
 */
export function calculateAvailableCredit(creditLimit, currentBalance) {
  if (!creditLimit) return null;
  return Math.max(0, creditLimit - currentBalance);
}

/**
 * Calculate credit utilization percentage
 * @param {number} currentBalance - Current balance owed
 * @param {number} creditLimit - Total credit limit
 * @returns {number} Utilization percentage (0-100)
 */
export function calculateCreditUtilization(currentBalance, creditLimit) {
  if (!creditLimit || creditLimit === 0) return 0;
  return Math.min(100, (currentBalance / creditLimit) * 100);
}

/**
 * Get next statement date
 * @param {number} statementDay - Day of month for statement (1-31)
 * @param {Date} fromDate - Starting date (defaults to today)
 * @returns {Date} Next statement date
 */
export function getNextStatementDate(statementDay, fromDate = new Date()) {
  if (!statementDay) return null;
  
  const date = new Date(fromDate);
  date.setDate(statementDay);
  
  // If statement day has passed this month, move to next month
  if (date <= fromDate) {
    date.setMonth(date.getMonth() + 1);
  }
  
  // Handle months with fewer days (e.g., February)
  if (date.getDate() !== statementDay) {
    date.setDate(0); // Last day of previous month
  }
  
  return date;
}

/**
 * Get next payment due date
 * @param {number} paymentDueDay - Day of month for payment (1-31)
 * @param {Date} fromDate - Starting date (defaults to today)
 * @returns {Date} Next payment due date
 */
export function getNextPaymentDueDate(paymentDueDay, fromDate = new Date()) {
  if (!paymentDueDay) return null;
  
  const date = new Date(fromDate);
  date.setDate(paymentDueDay);
  
  // If payment day has passed this month, move to next month
  if (date <= fromDate) {
    date.setMonth(date.getMonth() + 1);
  }
  
  // Handle months with fewer days
  if (date.getDate() !== paymentDueDay) {
    date.setDate(0); // Last day of previous month
  }
  
  return date;
}

/**
 * Get days until payment due
 * @param {number} paymentDueDay - Day of month for payment (1-31)
 * @param {Date} fromDate - Starting date (defaults to today)
 * @returns {number} Days until payment due (negative if overdue)
 */
export function getDaysUntilPayment(paymentDueDay, fromDate = new Date()) {
  const nextDue = getNextPaymentDueDate(paymentDueDay, fromDate);
  if (!nextDue) return null;
  
  const today = new Date(fromDate);
  today.setHours(0, 0, 0, 0);
  nextDue.setHours(0, 0, 0, 0);
  
  const diff = nextDue - today;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if payment is due soon
 * @param {number} paymentDueDay - Day of month for payment (1-31)
 * @param {number} warningDays - Days before due date to warn (default: 7)
 * @param {Date} fromDate - Starting date (defaults to today)
 * @returns {boolean} True if payment is due within warning days
 */
export function isPaymentDueSoon(paymentDueDay, warningDays = 7, fromDate = new Date()) {
  const daysUntil = getDaysUntilPayment(paymentDueDay, fromDate);
  if (daysUntil === null) return false;
  
  return daysUntil >= 0 && daysUntil <= warningDays;
}

/**
 * Check if payment is overdue
 * @param {number} paymentDueDay - Day of month for payment (1-31)
 * @param {Date} fromDate - Starting date (defaults to today)
 * @returns {boolean} True if payment is overdue
 */
export function isPaymentOverdue(paymentDueDay, fromDate = new Date()) {
  const daysUntil = getDaysUntilPayment(paymentDueDay, fromDate);
  if (daysUntil === null) return false;
  
  return daysUntil < 0;
}

/**
 * Calculate minimum payment (typically 2-5% of balance or fixed amount)
 * @param {number} currentBalance - Current balance owed
 * @param {number} percentage - Minimum payment percentage (default: 0.02 = 2%)
 * @param {number} minimumAmount - Absolute minimum payment (default: 250)
 * @returns {number} Minimum payment amount
 */
export function calculateMinimumPayment(currentBalance, percentage = 0.02, minimumAmount = 250) {
  if (currentBalance <= 0) return 0;
  
  const percentagePayment = currentBalance * percentage;
  return Math.max(percentagePayment, minimumAmount);
}

/**
 * Calculate interest charge for a period
 * @param {number} balance - Current balance
 * @param {number} annualRate - Annual interest rate (e.g., 0.24 for 24%)
 * @param {number} days - Number of days in period (default: 30)
 * @returns {number} Interest charge
 */
export function calculateInterestCharge(balance, annualRate, days = 30) {
  if (!balance || !annualRate || balance <= 0) return 0;
  
  const dailyRate = annualRate / 365;
  return balance * dailyRate * days;
}

/**
 * Format credit type for display
 * @param {string} type - Credit type (credit_card, loan, mortgage)
 * @returns {string} Formatted type
 */
export function formatCreditType(type) {
  const types = {
    credit_card: 'Tarjeta de Crédito',
    loan: 'Préstamo',
    mortgage: 'Hipoteca'
  };
  return types[type] || type;
}

/**
 * Format movement type for display
 * @param {string} type - Movement type (payment, charge, interest)
 * @returns {string} Formatted type
 */
export function formatMovementType(type) {
  const types = {
    payment: 'Pago',
    charge: 'Cargo',
    interest: 'Interés'
  };
  return types[type] || type;
}

/**
 * Get credit status color based on utilization
 * @param {number} utilization - Credit utilization percentage (0-100)
 * @returns {string} Tailwind color class
 */
export function getCreditStatusColor(utilization) {
  if (utilization >= 90) return 'text-red-600';
  if (utilization >= 70) return 'text-orange-600';
  if (utilization >= 50) return 'text-yellow-600';
  return 'text-green-600';
}

/**
 * Get payment urgency color
 * @param {number} daysUntilPayment - Days until payment due
 * @returns {string} Tailwind color class
 */
export function getPaymentUrgencyColor(daysUntilPayment) {
  if (daysUntilPayment < 0) return 'text-red-600';
  if (daysUntilPayment <= 3) return 'text-orange-600';
  if (daysUntilPayment <= 7) return 'text-yellow-600';
  return 'text-green-600';
}

/**
 * Get payment urgency background color
 * @param {number} daysUntilPayment - Days until payment due
 * @returns {string} Tailwind background color class
 */
export function getPaymentUrgencyBgColor(daysUntilPayment) {
  if (daysUntilPayment < 0) return 'bg-red-100 border-red-300';
  if (daysUntilPayment <= 3) return 'bg-orange-100 border-orange-300';
  if (daysUntilPayment <= 7) return 'bg-yellow-100 border-yellow-300';
  return 'bg-green-100 border-green-300';
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
export function formatDateForAPI(date) {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date
 */
export function formatDateForDisplay(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Generate unique credit ID
 * @returns {string} Unique credit ID
 */
export function generateCreditId() {
  return `crd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique movement ID
 * @returns {string} Unique movement ID
 */
export function generateMovementId() {
  return `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate credit data
 * @param {Object} credit - Credit data to validate
 * @returns {Array} Array of error messages (empty if valid)
 */
export function validateCredit(credit) {
  const errors = [];
  
  if (!credit.name || credit.name.trim().length === 0) {
    errors.push('El nombre es requerido');
  }
  
  if (!credit.type || !['credit_card', 'loan', 'mortgage'].includes(credit.type)) {
    errors.push('El tipo de crédito es inválido');
  }
  
  if (credit.credit_limit && (isNaN(credit.credit_limit) || credit.credit_limit <= 0)) {
    errors.push('El límite de crédito debe ser un número positivo');
  }
  
  if (credit.interest_rate && (isNaN(credit.interest_rate) || credit.interest_rate < 0 || credit.interest_rate > 1)) {
    errors.push('La tasa de interés debe estar entre 0 y 1');
  }
  
  if (credit.statement_day && (isNaN(credit.statement_day) || credit.statement_day < 1 || credit.statement_day > 31)) {
    errors.push('El día de corte debe estar entre 1 y 31');
  }
  
  if (credit.payment_due_day && (isNaN(credit.payment_due_day) || credit.payment_due_day < 1 || credit.payment_due_day > 31)) {
    errors.push('El día de pago debe estar entre 1 y 31');
  }
  
  return errors;
}

/**
 * Validate movement data
 * @param {Object} movement - Movement data to validate
 * @returns {Array} Array of error messages (empty if valid)
 */
export function validateMovement(movement) {
  const errors = [];
  
  if (!movement.description || movement.description.trim().length === 0) {
    errors.push('La descripción es requerida');
  }
  
  if (!movement.amount || isNaN(movement.amount) || movement.amount <= 0) {
    errors.push('El monto debe ser un número positivo');
  }
  
  if (!movement.type || !['payment', 'charge', 'interest'].includes(movement.type)) {
    errors.push('El tipo de movimiento es inválido');
  }
  
  if (!movement.date || !/^\d{4}-\d{2}-\d{2}$/.test(movement.date)) {
    errors.push('La fecha debe estar en formato YYYY-MM-DD');
  }
  
  return errors;
}
