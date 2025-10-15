// Classification Utilities
// Helper functions for business vs personal transaction classification

/**
 * Transaction type constants
 */
export const TRANSACTION_TYPES = {
  BUSINESS: 'business',
  PERSONAL: 'personal',
  TRANSFER: 'transfer'
};

/**
 * Validate transaction type
 * @param {string} type - Transaction type to validate
 * @returns {boolean} - True if valid
 */
export function isValidTransactionType(type) {
  return Object.values(TRANSACTION_TYPES).includes(type);
}

/**
 * Get transaction type label
 * @param {string} type - Transaction type
 * @returns {string} - Human-readable label
 */
export function getTransactionTypeLabel(type) {
  switch (type) {
    case TRANSACTION_TYPES.BUSINESS:
      return '💼 Negocio';
    case TRANSACTION_TYPES.PERSONAL:
      return '👤 Personal';
    case TRANSACTION_TYPES.TRANSFER:
      return '🔄 Transferencia';
    default:
      return '❓ Desconocido';
  }
}

/**
 * Get transaction type color classes
 * @param {string} type - Transaction type
 * @returns {Object} - Object with bg and text color classes
 */
export function getTransactionTypeColors(type) {
  switch (type) {
    case TRANSACTION_TYPES.BUSINESS:
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-200'
      };
    case TRANSACTION_TYPES.PERSONAL:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200'
      };
    case TRANSACTION_TYPES.TRANSFER:
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        border: 'border-gray-200'
      };
  }
}

/**
 * Filter transactions by type
 * @param {Array} transactions - Array of transactions
 * @param {string} type - Transaction type to filter by
 * @returns {Array} - Filtered transactions
 */
export function filterTransactionsByType(transactions, type) {
  if (!type || type === 'all') {
    return transactions;
  }
  return transactions.filter(tx => tx.transaction_type === type);
}

/**
 * Calculate totals by transaction type
 * @param {Array} transactions - Array of transactions
 * @returns {Object} - Totals by type
 */
export function calculateTotalsByType(transactions) {
  const totals = {
    business: { income: 0, expenses: 0, net: 0, count: 0 },
    personal: { income: 0, expenses: 0, net: 0, count: 0 },
    transfer: { income: 0, expenses: 0, net: 0, count: 0 }
  };

  transactions.forEach(tx => {
    const type = tx.transaction_type || TRANSACTION_TYPES.PERSONAL;
    const amount = Math.abs(tx.amount);

    if (!totals[type]) return;

    totals[type].count++;

    if (tx.type === 'ingreso') {
      totals[type].income += amount;
      totals[type].net += amount;
    } else if (tx.type === 'gasto') {
      totals[type].expenses += amount;
      totals[type].net -= amount;
    }
  });

  return totals;
}

/**
 * Get business transactions only (for fiscal calculations)
 * @param {Array} transactions - Array of transactions
 * @returns {Array} - Business transactions only
 */
export function getBusinessTransactions(transactions) {
  return transactions.filter(tx => 
    tx.transaction_type === TRANSACTION_TYPES.BUSINESS || 
    tx.category === 'avanta' // Backward compatibility
  );
}

/**
 * Get personal transactions only
 * @param {Array} transactions - Array of transactions
 * @returns {Array} - Personal transactions only
 */
export function getPersonalTransactions(transactions) {
  return transactions.filter(tx => 
    tx.transaction_type === TRANSACTION_TYPES.PERSONAL ||
    (tx.category === 'personal' && !tx.transaction_type) // Backward compatibility
  );
}

/**
 * Check if transaction is business-related
 * @param {Object} transaction - Transaction object
 * @returns {boolean} - True if business transaction
 */
export function isBusinessTransaction(transaction) {
  return transaction.transaction_type === TRANSACTION_TYPES.BUSINESS ||
         transaction.category === 'avanta';
}

/**
 * Check if transaction is personal
 * @param {Object} transaction - Transaction object
 * @returns {boolean} - True if personal transaction
 */
export function isPersonalTransaction(transaction) {
  return transaction.transaction_type === TRANSACTION_TYPES.PERSONAL ||
         (transaction.category === 'personal' && !transaction.transaction_type);
}

/**
 * Get default transaction type based on legacy category
 * @param {string} category - Legacy category ('personal' or 'avanta')
 * @returns {string} - Transaction type
 */
export function getDefaultTransactionType(category) {
  return category === 'avanta' ? TRANSACTION_TYPES.BUSINESS : TRANSACTION_TYPES.PERSONAL;
}

/**
 * Suggest transaction type based on description and amount
 * @param {string} description - Transaction description
 * @param {number} amount - Transaction amount
 * @param {string} type - Transaction type ('ingreso' or 'gasto')
 * @returns {string} - Suggested transaction type
 */
export function suggestTransactionType(description, amount, type) {
  const desc = description.toLowerCase();
  
  // Business keywords
  const businessKeywords = [
    'cliente', 'factura', 'cfdi', 'honorarios', 'servicio',
    'proyecto', 'trabajo', 'negocio', 'empresa', 'profesional',
    'oficina', 'equipo', 'software', 'marketing', 'publicidad'
  ];

  // Personal keywords
  const personalKeywords = [
    'super', 'mercado', 'restaurante', 'comida', 'cena',
    'cine', 'entretenimiento', 'personal', 'casa', 'hogar',
    'ropa', 'regalos', 'viaje personal', 'vacaciones'
  ];

  // Check for business keywords
  if (businessKeywords.some(keyword => desc.includes(keyword))) {
    return TRANSACTION_TYPES.BUSINESS;
  }

  // Check for personal keywords
  if (personalKeywords.some(keyword => desc.includes(keyword))) {
    return TRANSACTION_TYPES.PERSONAL;
  }

  // Check for transfer keywords
  if (desc.includes('transfer') || desc.includes('traspaso')) {
    return TRANSACTION_TYPES.TRANSFER;
  }

  // Default: large amounts more likely to be business
  if (type === 'ingreso' && amount > 5000) {
    return TRANSACTION_TYPES.BUSINESS;
  }

  // Default to personal
  return TRANSACTION_TYPES.PERSONAL;
}

/**
 * Format classification statistics for display
 * @param {Object} totals - Totals by type from calculateTotalsByType
 * @returns {Array} - Formatted statistics
 */
export function formatClassificationStats(totals) {
  return Object.entries(totals).map(([type, data]) => ({
    type,
    label: getTransactionTypeLabel(type),
    colors: getTransactionTypeColors(type),
    ...data
  }));
}
