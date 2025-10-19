/**
 * Input Validation Utilities
 * 
 * Phase 31: Backend Hardening and Security
 * 
 * Comprehensive validation functions to prevent:
 * - SQL injection
 * - XSS attacks
 * - Invalid data entry
 * - Malicious payloads
 */

/**
 * Sanitize string input to prevent XSS
 * @param {string} input - Raw string input
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes to prevent injection
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Sanitize HTML to prevent XSS while allowing basic formatting
 * @param {string} html - HTML string
 * @returns {string} Sanitized HTML
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  
  // Remove script tags and event handlers
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, 10000);
}

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  if (email.length > 255) {
    return { valid: false, error: 'Email is too long' };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate date string (YYYY-MM-DD format)
 * @param {string} dateStr - Date string
 * @returns {{ valid: boolean, error: string|null, date: Date|null }}
 */
export function validateDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { valid: false, error: 'Date is required', date: null };
  }
  
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return { valid: false, error: 'Date must be in YYYY-MM-DD format', date: null };
  }
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date', date: null };
  }
  
  // Check if date is in reasonable range (1900-2100)
  const year = date.getFullYear();
  if (year < 1900 || year > 2100) {
    return { valid: false, error: 'Date must be between 1900 and 2100', date: null };
  }
  
  return { valid: true, error: null, date };
}

/**
 * Validate UUID format
 * @param {string} uuid - UUID string
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateUuid(uuid) {
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: 'UUID is required' };
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate integer within range
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} fieldName - Field name for error messages
 * @returns {{ valid: boolean, error: string|null, value: number|null }}
 */
export function validateInteger(value, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, fieldName = 'value') {
  if (value === null || value === undefined) {
    return { valid: false, error: `${fieldName} is required`, value: null };
  }
  
  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be an integer`, value: null };
  }
  
  if (num < min || num > max) {
    return { valid: false, error: `${fieldName} must be between ${min} and ${max}`, value: null };
  }
  
  return { valid: true, error: null, value: num };
}

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @param {string} fieldName - Field name for error messages
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateStringLength(str, minLength = 0, maxLength = 1000, fieldName = 'field') {
  if (!str && minLength > 0) {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  if (typeof str !== 'string') {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  
  if (str.length < minLength) {
    return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  
  if (str.length > maxLength) {
    return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate enum value
 * @param {any} value - Value to validate
 * @param {Array} allowedValues - Array of allowed values
 * @param {string} fieldName - Field name for error messages
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateEnum(value, allowedValues, fieldName = 'value') {
  if (!value) {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  if (!allowedValues.includes(value)) {
    return { valid: false, error: `${fieldName} must be one of: ${allowedValues.join(', ')}` };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate RFC (Mexican Tax ID)
 * @param {string} rfc - RFC string
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateRFC(rfc) {
  if (!rfc || typeof rfc !== 'string') {
    return { valid: false, error: 'RFC is required' };
  }
  
  // Physical person: 13 characters, Legal entity: 12 characters
  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
  if (!rfcRegex.test(rfc.toUpperCase())) {
    return { valid: false, error: 'Invalid RFC format' };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate file upload
 * @param {File} file - File object
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @param {number} maxSizeMB - Maximum file size in MB
 * @returns {{ valid: boolean, error: string|null }}
 */
export function validateFile(file, allowedTypes, maxSizeMB = 10) {
  if (!file) {
    return { valid: false, error: 'File is required' };
  }
  
  // Validate file type
  if (allowedTypes && allowedTypes.length > 0) {
    const fileType = file.type || '';
    if (!allowedTypes.includes(fileType)) {
      return { valid: false, error: `File type must be one of: ${allowedTypes.join(', ')}` };
    }
  }
  
  // Validate file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }
  
  // Validate file name (prevent path traversal)
  const fileName = file.name || '';
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return { valid: false, error: 'Invalid file name' };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate transaction data
 * @param {Object} data - Transaction data
 * @returns {{ valid: boolean, errors: Array<string> }}
 */
export function validateTransactionData(data) {
  const errors = [];
  
  // Validate required fields
  if (!data.description || typeof data.description !== 'string') {
    errors.push('Description is required');
  } else if (data.description.length > 500) {
    errors.push('Description must be at most 500 characters');
  }
  
  if (!data.date) {
    errors.push('Date is required');
  } else {
    const dateValidation = validateDate(data.date);
    if (!dateValidation.valid) {
      errors.push(dateValidation.error);
    }
  }
  
  if (!['ingreso', 'gasto'].includes(data.type)) {
    errors.push('Type must be either "ingreso" or "gasto"');
  }
  
  if (!['personal', 'avanta'].includes(data.category)) {
    errors.push('Category must be either "personal" or "avanta"');
  }
  
  // Amount validation is handled by monetary.js parseMonetaryInput
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate account data
 * @param {Object} data - Account data
 * @returns {{ valid: boolean, errors: Array<string> }}
 */
export function validateAccountData(data) {
  const errors = [];
  
  if (!data.name || typeof data.name !== 'string') {
    errors.push('Account name is required');
  } else if (data.name.length > 100) {
    errors.push('Account name must be at most 100 characters');
  }
  
  if (!['banco', 'credito'].includes(data.type)) {
    errors.push('Account type must be either "banco" or "credito"');
  }
  
  if (data.account_number && data.account_number.length > 50) {
    errors.push('Account number must be at most 50 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate pagination parameters
 * @param {number} limit - Results per page
 * @param {number} offset - Offset for pagination
 * @returns {{ valid: boolean, error: string|null, limit: number, offset: number }}
 */
export function validatePagination(limit, offset) {
  const limitValidation = validateInteger(limit || 50, 1, 1000, 'limit');
  const offsetValidation = validateInteger(offset || 0, 0, Number.MAX_SAFE_INTEGER, 'offset');
  
  if (!limitValidation.valid) {
    return { valid: false, error: limitValidation.error, limit: 50, offset: 0 };
  }
  
  if (!offsetValidation.valid) {
    return { valid: false, error: offsetValidation.error, limit: 50, offset: 0 };
  }
  
  return {
    valid: true,
    error: null,
    limit: limitValidation.value,
    offset: offsetValidation.value
  };
}

/**
 * SQL injection prevention - validate query parameters
 * @param {string} value - Value to validate
 * @returns {boolean} True if safe
 */
export function isSafeSqlValue(value) {
  if (typeof value !== 'string') return true;
  
  // Check for SQL injection patterns
  const dangerousPatterns = [
    /(\bOR\b|\bAND\b).*=.*=/i,
    /UNION.*SELECT/i,
    /DROP.*TABLE/i,
    /INSERT.*INTO/i,
    /DELETE.*FROM/i,
    /UPDATE.*SET/i,
    /EXEC(\s|\+)+(s|x)p\w+/i,
    /--/,
    /\/\*/,
    /\*\//,
    /;.*--/,
    /xp_/i
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(value));
}

/**
 * Validate sort parameters
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order (asc/desc)
 * @param {Array<string>} allowedFields - Allowed sort fields
 * @returns {{ valid: boolean, error: string|null, sortBy: string, sortOrder: string }}
 */
export function validateSort(sortBy, sortOrder, allowedFields) {
  const defaultSort = { valid: true, error: null, sortBy: allowedFields[0], sortOrder: 'desc' };
  
  if (!sortBy) return defaultSort;
  
  if (!allowedFields.includes(sortBy)) {
    return { 
      valid: false, 
      error: `Invalid sort field. Allowed: ${allowedFields.join(', ')}`,
      sortBy: allowedFields[0],
      sortOrder: 'desc'
    };
  }
  
  const order = sortOrder?.toLowerCase() || 'desc';
  if (!['asc', 'desc'].includes(order)) {
    return {
      valid: false,
      error: 'Sort order must be "asc" or "desc"',
      sortBy,
      sortOrder: 'desc'
    };
  }
  
  return { valid: true, error: null, sortBy, sortOrder: order };
}
