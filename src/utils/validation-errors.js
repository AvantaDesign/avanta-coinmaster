/**
 * Validation Error Utilities
 * 
 * Phase 45: Comprehensive Error Handling & Resilience
 * 
 * Provides utilities for handling validation errors in forms and inputs.
 * Supports field-level errors, error aggregation, and user-friendly messages.
 * 
 * Features:
 * - Field-level error tracking
 * - Error aggregation for complex forms
 * - User-friendly error messages
 * - Error recovery suggestions
 * - Real-time validation support
 * 
 * Usage:
 *   import { ValidationErrorManager, formatFieldError } from './validation-errors';
 *   
 *   const validator = new ValidationErrorManager();
 *   validator.addError('email', 'Formato de email inválido');
 *   const errors = validator.getErrors();
 */

/**
 * Validation error types
 */
export const ValidationErrorType = {
  REQUIRED: 'required',
  FORMAT: 'format',
  MIN_LENGTH: 'min_length',
  MAX_LENGTH: 'max_length',
  MIN_VALUE: 'min_value',
  MAX_VALUE: 'max_value',
  PATTERN: 'pattern',
  EMAIL: 'email',
  URL: 'url',
  DATE: 'date',
  CUSTOM: 'custom'
};

/**
 * Default error messages (Spanish)
 */
export const DEFAULT_ERROR_MESSAGES = {
  required: 'Este campo es requerido',
  format: 'El formato es inválido',
  min_length: 'Debe tener al menos {min} caracteres',
  max_length: 'No debe exceder {max} caracteres',
  min_value: 'El valor mínimo es {min}',
  max_value: 'El valor máximo es {max}',
  pattern: 'El formato no coincide con el patrón esperado',
  email: 'Ingresa un correo electrónico válido',
  url: 'Ingresa una URL válida',
  date: 'Ingresa una fecha válida',
  custom: 'Valor inválido'
};

/**
 * Validation Error Manager class
 */
export class ValidationErrorManager {
  constructor() {
    this.errors = new Map();
    this.touched = new Set();
    this.validationRules = new Map();
  }
  
  /**
   * Add error for a field
   * @param {string} field - Field name
   * @param {string|Object} error - Error message or error object
   */
  addError(field, error) {
    if (typeof error === 'string') {
      this.errors.set(field, {
        message: error,
        type: ValidationErrorType.CUSTOM
      });
    } else {
      this.errors.set(field, error);
    }
  }
  
  /**
   * Remove error for a field
   * @param {string} field - Field name
   */
  removeError(field) {
    this.errors.delete(field);
  }
  
  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors.clear();
  }
  
  /**
   * Get error for a field
   * @param {string} field - Field name
   * @returns {Object|null} Error object or null
   */
  getError(field) {
    return this.errors.get(field) || null;
  }
  
  /**
   * Get all errors
   * @returns {Object} Errors object
   */
  getErrors() {
    const errorsObj = {};
    this.errors.forEach((error, field) => {
      errorsObj[field] = error;
    });
    return errorsObj;
  }
  
  /**
   * Get error message for a field
   * @param {string} field - Field name
   * @returns {string|null} Error message or null
   */
  getErrorMessage(field) {
    const error = this.errors.get(field);
    return error ? error.message : null;
  }
  
  /**
   * Check if field has error
   * @param {string} field - Field name
   * @returns {boolean} True if has error
   */
  hasError(field) {
    return this.errors.has(field);
  }
  
  /**
   * Check if any errors exist
   * @returns {boolean} True if has errors
   */
  hasErrors() {
    return this.errors.size > 0;
  }
  
  /**
   * Get error count
   * @returns {number} Number of errors
   */
  getErrorCount() {
    return this.errors.size;
  }
  
  /**
   * Mark field as touched
   * @param {string} field - Field name
   */
  touch(field) {
    this.touched.add(field);
  }
  
  /**
   * Check if field is touched
   * @param {string} field - Field name
   * @returns {boolean} True if touched
   */
  isTouched(field) {
    return this.touched.has(field);
  }
  
  /**
   * Should show error for field (has error and is touched)
   * @param {string} field - Field name
   * @returns {boolean} True if should show error
   */
  shouldShowError(field) {
    return this.hasError(field) && this.isTouched(field);
  }
  
  /**
   * Add validation rule for a field
   * @param {string} field - Field name
   * @param {Function} validator - Validator function
   */
  addRule(field, validator) {
    if (!this.validationRules.has(field)) {
      this.validationRules.set(field, []);
    }
    this.validationRules.get(field).push(validator);
  }
  
  /**
   * Validate field
   * @param {string} field - Field name
   * @param {*} value - Field value
   * @returns {boolean} True if valid
   */
  validateField(field, value) {
    const rules = this.validationRules.get(field) || [];
    
    // Remove existing error
    this.removeError(field);
    
    // Run validators
    for (const validator of rules) {
      const error = validator(value);
      if (error) {
        this.addError(field, error);
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Validate all fields
   * @param {Object} values - Field values
   * @returns {boolean} True if all valid
   */
  validateAll(values) {
    let isValid = true;
    
    this.validationRules.forEach((rules, field) => {
      const value = values[field];
      if (!this.validateField(field, value)) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  /**
   * Get validation summary
   * @returns {Object} Validation summary
   */
  getSummary() {
    const errors = Array.from(this.errors.entries()).map(([field, error]) => ({
      field,
      ...error
    }));
    
    return {
      isValid: !this.hasErrors(),
      errorCount: this.getErrorCount(),
      errors
    };
  }
}

/**
 * Format field error with context
 * @param {Object} error - Error object
 * @param {Object} context - Context data
 * @returns {string} Formatted error message
 */
export function formatFieldError(error, context = {}) {
  if (typeof error === 'string') {
    return error;
  }
  
  let message = error.message || DEFAULT_ERROR_MESSAGES[error.type] || DEFAULT_ERROR_MESSAGES.custom;
  
  // Replace placeholders with context values
  Object.keys(context).forEach(key => {
    message = message.replace(`{${key}}`, context[key]);
  });
  
  return message;
}

/**
 * Create validation error object
 * @param {string} type - Error type
 * @param {string} message - Error message
 * @param {Object} context - Additional context
 * @returns {Object} Error object
 */
export function createValidationError(type, message = null, context = {}) {
  return {
    type,
    message: message || DEFAULT_ERROR_MESSAGES[type] || DEFAULT_ERROR_MESSAGES.custom,
    ...context
  };
}

/**
 * Common validators
 */
export const Validators = {
  /**
   * Required field validator
   */
  required: (message = null) => (value) => {
    if (value === null || value === undefined || value === '') {
      return createValidationError(ValidationErrorType.REQUIRED, message);
    }
    return null;
  },
  
  /**
   * Minimum length validator
   */
  minLength: (min, message = null) => (value) => {
    if (value && value.length < min) {
      return createValidationError(
        ValidationErrorType.MIN_LENGTH,
        message,
        { min }
      );
    }
    return null;
  },
  
  /**
   * Maximum length validator
   */
  maxLength: (max, message = null) => (value) => {
    if (value && value.length > max) {
      return createValidationError(
        ValidationErrorType.MAX_LENGTH,
        message,
        { max }
      );
    }
    return null;
  },
  
  /**
   * Minimum value validator
   */
  minValue: (min, message = null) => (value) => {
    if (value !== null && value !== undefined && Number(value) < min) {
      return createValidationError(
        ValidationErrorType.MIN_VALUE,
        message,
        { min }
      );
    }
    return null;
  },
  
  /**
   * Maximum value validator
   */
  maxValue: (max, message = null) => (value) => {
    if (value !== null && value !== undefined && Number(value) > max) {
      return createValidationError(
        ValidationErrorType.MAX_VALUE,
        message,
        { max }
      );
    }
    return null;
  },
  
  /**
   * Email validator
   */
  email: (message = null) => (value) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return createValidationError(ValidationErrorType.EMAIL, message);
    }
    return null;
  },
  
  /**
   * URL validator
   */
  url: (message = null) => (value) => {
    if (value) {
      try {
        new URL(value);
      } catch {
        return createValidationError(ValidationErrorType.URL, message);
      }
    }
    return null;
  },
  
  /**
   * Pattern validator
   */
  pattern: (regex, message = null) => (value) => {
    if (value && !regex.test(value)) {
      return createValidationError(ValidationErrorType.PATTERN, message);
    }
    return null;
  },
  
  /**
   * Custom validator
   */
  custom: (validatorFn, message = null) => (value) => {
    if (!validatorFn(value)) {
      return createValidationError(ValidationErrorType.CUSTOM, message);
    }
    return null;
  }
};

/**
 * Parse API validation errors
 * @param {Object} apiError - API error response
 * @returns {Object} Parsed errors object
 */
export function parseApiValidationErrors(apiError) {
  const errors = {};
  
  if (apiError.errors && Array.isArray(apiError.errors)) {
    // Array of error strings
    apiError.errors.forEach((error, index) => {
      errors[`field_${index}`] = {
        message: error,
        type: ValidationErrorType.CUSTOM
      };
    });
  } else if (apiError.errors && typeof apiError.errors === 'object') {
    // Object with field-specific errors
    Object.entries(apiError.errors).forEach(([field, error]) => {
      errors[field] = {
        message: typeof error === 'string' ? error : error.message,
        type: ValidationErrorType.CUSTOM
      };
    });
  } else if (apiError.message) {
    // Single error message
    errors.general = {
      message: apiError.message,
      type: ValidationErrorType.CUSTOM
    };
  }
  
  return errors;
}

/**
 * Debounce function for real-time validation
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Create debounced validator
 * @param {Function} validator - Validator function
 * @param {number} delay - Debounce delay
 * @returns {Function} Debounced validator
 */
export function createDebouncedValidator(validator, delay = 300) {
  return debounce(validator, delay);
}

export default {
  ValidationErrorManager,
  ValidationErrorType,
  DEFAULT_ERROR_MESSAGES,
  formatFieldError,
  createValidationError,
  Validators,
  parseApiValidationErrors,
  debounce,
  createDebouncedValidator
};
