/**
 * Smart Form Utilities
 * Provides intelligent form features like auto-suggestions, validation, and formatting
 */

import { suggestCategory } from './suggestions';

/**
 * Get category suggestions based on description and transaction type
 * @param {string} description - Transaction description
 * @param {string} transactionType - Type of transaction (ingreso/gasto)
 * @param {Array} history - Transaction history for pattern matching
 * @returns {Array} Array of category suggestions with confidence scores
 */
export function getCategorySuggestions(description, transactionType, history = []) {
  if (!description) return [];

  // Use existing suggestion system
  const suggestion = suggestCategory(description, 0, history);
  
  return [
    {
      value: suggestion.category,
      label: suggestion.category === 'avanta' ? 'Avanta (Negocio)' : 'Personal',
      confidence: suggestion.confidence,
      reasons: suggestion.reasons
    }
  ];
}

/**
 * Get description suggestions based on partial input
 * @param {string} partial - Partial description text
 * @param {Array} history - Transaction history
 * @param {number} limit - Maximum number of suggestions
 * @returns {Array} Array of suggested descriptions
 */
export function getDescriptionSuggestions(partial, history = [], limit = 5) {
  if (!partial || partial.length < 2) return [];

  const partialLower = partial.toLowerCase();
  const suggestions = new Map();

  // Find matching descriptions from history
  for (const transaction of history) {
    if (!transaction.description) continue;
    
    const desc = transaction.description;
    const descLower = desc.toLowerCase();
    
    // Match if description starts with partial or contains it
    if (descLower.includes(partialLower)) {
      const key = desc.toLowerCase();
      if (!suggestions.has(key)) {
        suggestions.set(key, {
          description: desc,
          count: 0,
          category: transaction.category,
          transaction_type: transaction.transaction_type,
          amount: transaction.amount
        });
      }
      suggestions.get(key).count++;
    }
  }

  // Sort by frequency and return top matches
  return Array.from(suggestions.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * Format currency input in real-time
 * @param {string} value - Input value
 * @param {string} locale - Locale for formatting (default: es-MX)
 * @returns {Object} Formatted value and raw number
 */
export function formatCurrencyInput(value, locale = 'es-MX') {
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  const integerPart = parts[0] || '0';
  const decimalPart = parts[1] ? `.${parts[1].slice(0, 2)}` : '';
  
  const rawValue = parseFloat(integerPart + decimalPart) || 0;
  
  // Format with thousand separators (no currency symbol for input)
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true
  }).format(rawValue);

  return {
    formatted,
    raw: rawValue,
    display: decimalPart ? formatted : formatted.replace(/\.0+$/, '')
  };
}

/**
 * Get account suggestions based on transaction type
 * @param {string} type - Transaction type (ingreso/gasto)
 * @param {Array} accounts - Available accounts
 * @param {Array} history - Transaction history
 * @returns {Array} Suggested accounts
 */
export function getAccountSuggestions(type, accounts = [], history = []) {
  if (!accounts || accounts.length === 0) return [];

  // Calculate usage frequency for each account
  const accountUsage = new Map();
  
  for (const transaction of history) {
    if (transaction.account && transaction.type === type) {
      const key = transaction.account.toLowerCase();
      accountUsage.set(key, (accountUsage.get(key) || 0) + 1);
    }
  }

  // Sort accounts by usage frequency
  const sortedAccounts = [...accounts].sort((a, b) => {
    const aUsage = accountUsage.get(a.name?.toLowerCase() || '') || 0;
    const bUsage = accountUsage.get(b.name?.toLowerCase() || '') || 0;
    return bUsage - aUsage;
  });

  // Return top 3 suggestions
  return sortedAccounts.slice(0, 3).map(account => ({
    value: account.name,
    label: account.name,
    balance: account.balance,
    usage: accountUsage.get(account.name?.toLowerCase() || '') || 0
  }));
}

/**
 * Validate transaction data in real-time
 * @param {Object} data - Transaction data
 * @returns {Object} Validation result with errors
 */
export function validateTransactionData(data) {
  const errors = {};

  // Required fields
  if (!data.date) {
    errors.date = 'La fecha es requerida';
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.description = 'La descripción es requerida';
  } else if (data.description.length > 200) {
    errors.description = 'La descripción no puede exceder 200 caracteres';
  }

  if (!data.amount || data.amount <= 0) {
    errors.amount = 'El monto debe ser mayor a 0';
  } else if (data.amount > 999999999.99) {
    errors.amount = 'El monto es demasiado grande';
  }

  if (!data.type) {
    errors.type = 'El tipo es requerido';
  }

  // Optional field validations
  if (data.notes && data.notes.length > 1000) {
    errors.notes = 'Las notas no pueden exceder 1000 caracteres';
  }

  if (data.economic_activity && data.economic_activity.length > 100) {
    errors.economic_activity = 'La actividad económica no puede exceder 100 caracteres';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Get quick date options for date picker
 * @returns {Array} Array of quick date options
 */
export function getQuickDateOptions() {
  const today = new Date();
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  return [
    {
      label: 'Hoy',
      value: today.toISOString().split('T')[0]
    },
    {
      label: 'Ayer',
      value: yesterday.toISOString().split('T')[0]
    },
    {
      label: 'Hace una semana',
      value: lastWeek.toISOString().split('T')[0]
    },
    {
      label: 'Inicio del mes',
      value: startOfMonth.toISOString().split('T')[0]
    },
    {
      label: 'Fin del mes',
      value: endOfMonth.toISOString().split('T')[0]
    }
  ];
}

/**
 * Fuzzy search for text matching with typo tolerance
 * @param {string} query - Search query
 * @param {string} target - Target text
 * @returns {number} Match score (0-1)
 */
export function fuzzyMatch(query, target) {
  if (!query || !target) return 0;
  
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  
  // Exact match
  if (targetLower === queryLower) return 1;
  
  // Starts with
  if (targetLower.startsWith(queryLower)) return 0.9;
  
  // Contains
  if (targetLower.includes(queryLower)) return 0.7;
  
  // Fuzzy match with Levenshtein distance
  const distance = levenshteinDistance(queryLower, targetLower);
  const maxLength = Math.max(queryLower.length, targetLower.length);
  const similarity = 1 - (distance / maxLength);
  
  return similarity > 0.6 ? similarity * 0.6 : 0;
}

/**
 * Calculate Levenshtein distance between two strings
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {number} Edit distance
 */
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Debounce function for input handlers
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
