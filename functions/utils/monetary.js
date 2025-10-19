/**
 * Monetary Utility Functions
 * 
 * Phase 30: Critical Infrastructure and Data Hardening
 * 
 * These utilities handle conversion between decimal monetary values and 
 * integer cents for database storage, eliminating floating-point errors.
 * 
 * DATABASE STORAGE: All monetary values stored as INTEGER (cents)
 * API/FRONTEND: All monetary values transmitted as DECIMAL (dollars/pesos)
 * 
 * Examples:
 *   100.50 pesos → 10050 cents (stored in DB)
 *   10050 cents → 100.50 pesos (returned from DB)
 */

import Decimal from 'decimal.js';

/**
 * Convert decimal amount to cents for database storage
 * 
 * @param {number|string|Decimal} value - Decimal amount (e.g., 100.50)
 * @returns {number} Integer cents (e.g., 10050)
 * 
 * @example
 * toCents(100.50)  // returns 10050
 * toCents("100.5") // returns 10050
 * toCents(0.01)    // returns 1
 */
export function toCents(value) {
  if (value === null || value === undefined) {
    return null;
  }
  
  try {
    const decimal = new Decimal(value);
    return decimal.mul(100).round().toNumber();
  } catch (error) {
    console.error('Error converting to cents:', error, 'Value:', value);
    throw new Error(`Invalid monetary value: ${value}`);
  }
}

/**
 * Convert cents from database to decimal amount
 * 
 * @param {number} cents - Integer cents (e.g., 10050)
 * @returns {string} Decimal amount as string (e.g., "100.50")
 * 
 * @example
 * fromCents(10050) // returns "100.50"
 * fromCents(1)     // returns "0.01"
 * fromCents(0)     // returns "0.00"
 */
export function fromCents(cents) {
  if (cents === null || cents === undefined) {
    return null;
  }
  
  try {
    const decimal = new Decimal(cents);
    return decimal.div(100).toFixed(2);
  } catch (error) {
    console.error('Error converting from cents:', error, 'Value:', cents);
    throw new Error(`Invalid cents value: ${cents}`);
  }
}

/**
 * Convert cents from database to Decimal object for calculations
 * 
 * @param {number} cents - Integer cents (e.g., 10050)
 * @returns {Decimal} Decimal object (e.g., Decimal(100.50))
 * 
 * @example
 * const amount = fromCentsToDecimal(10050);
 * const tax = amount.mul(0.16); // Calculate 16% tax
 */
export function fromCentsToDecimal(cents) {
  if (cents === null || cents === undefined) {
    return null;
  }
  
  try {
    return new Decimal(cents).div(100);
  } catch (error) {
    console.error('Error converting from cents to Decimal:', error, 'Value:', cents);
    throw new Error(`Invalid cents value: ${cents}`);
  }
}

/**
 * Convert multiple monetary fields in an object from cents to decimal
 * 
 * @param {Object} obj - Object with monetary fields
 * @param {string[]} fields - Array of field names to convert
 * @returns {Object} New object with converted fields
 * 
 * @example
 * const transaction = { id: 1, amount: 10050, balance: 50000 };
 * const converted = convertObjectFromCents(transaction, ['amount', 'balance']);
 * // { id: 1, amount: "100.50", balance: "500.00" }
 */
export function convertObjectFromCents(obj, fields) {
  if (!obj) return obj;
  
  const converted = { ...obj };
  fields.forEach(field => {
    if (field in converted && converted[field] !== null && converted[field] !== undefined) {
      converted[field] = fromCents(converted[field]);
    }
  });
  
  return converted;
}

/**
 * Convert array of objects from cents to decimal for specified fields
 * 
 * @param {Array} array - Array of objects
 * @param {string[]} fields - Array of field names to convert
 * @returns {Array} New array with converted objects
 * 
 * @example
 * const transactions = [
 *   { id: 1, amount: 10050 },
 *   { id: 2, amount: 25000 }
 * ];
 * const converted = convertArrayFromCents(transactions, ['amount']);
 * // [{ id: 1, amount: "100.50" }, { id: 2, amount: "250.00" }]
 */
export function convertArrayFromCents(array, fields) {
  if (!Array.isArray(array)) return array;
  
  return array.map(obj => convertObjectFromCents(obj, fields));
}

/**
 * Validate that a value can be safely converted to cents
 * 
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is valid
 */
export function isValidMonetaryValue(value) {
  if (value === null || value === undefined) return true;
  
  try {
    const decimal = new Decimal(value);
    // Check for reasonable limits (0 to 999,999,999.99)
    if (decimal.lt(0) || decimal.gt(999999999.99)) {
      return false;
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Parse monetary value from request and convert to cents
 * Includes validation
 * 
 * @param {any} value - Value from request
 * @param {string} fieldName - Field name for error messages
 * @param {boolean} required - Whether field is required
 * @returns {{ value: number|null, error: string|null }} Result object
 * 
 * @example
 * const { value, error } = parseMonetaryInput(req.amount, 'amount', true);
 * if (error) return errorResponse(error);
 * // Use value (in cents) for database insert
 */
export function parseMonetaryInput(value, fieldName = 'amount', required = false) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    if (required) {
      return { value: null, error: `${fieldName} is required` };
    }
    return { value: null, error: null };
  }
  
  // Parse the value
  const numValue = parseFloat(value);
  
  // Validate it's a number
  if (isNaN(numValue)) {
    return { value: null, error: `${fieldName} must be a valid number` };
  }
  
  // Validate it's positive (or zero for some fields)
  if (numValue < 0) {
    return { value: null, error: `${fieldName} cannot be negative` };
  }
  
  // Validate reasonable limits
  if (numValue > 999999999.99) {
    return { value: null, error: `${fieldName} is too large (max: 999,999,999.99)` };
  }
  
  // Convert to cents
  try {
    const cents = toCents(numValue);
    return { value: cents, error: null };
  } catch (error) {
    return { value: null, error: `Invalid ${fieldName}: ${error.message}` };
  }
}

/**
 * List of monetary field names commonly used in the application
 * Useful for bulk conversions
 */
export const MONETARY_FIELDS = {
  TRANSACTIONS: ['amount'],
  ACCOUNTS: ['balance'],
  INVOICES: ['subtotal', 'iva', 'total'],
  FISCAL_PAYMENTS: ['isr', 'iva'],
  CREDITS: ['credit_limit'],
  CREDIT_MOVEMENTS: ['amount'],
  BUDGETS: ['amount'],
  RECEIVABLES: ['amount', 'amount_paid'],
  PAYABLES: ['amount', 'amount_paid'],
  DEBTS: ['principal_amount', 'current_balance', 'monthly_payment'],
  INVESTMENTS: ['purchase_amount', 'current_value', 'current_price_per_unit'],
  SAVINGS_GOALS: ['target_amount', 'current_amount'],
  PAYMENTS: ['amount'],
  SCHEDULES: ['amount']
};
