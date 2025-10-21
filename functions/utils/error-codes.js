/**
 * Error Codes Taxonomy
 * 
 * Phase 45: Comprehensive Error Handling & Resilience
 * 
 * Standardized error codes for consistent error handling across the application.
 * Each error code includes:
 * - code: Unique identifier
 * - message: User-friendly message (Spanish)
 * - messageEn: English message for developers
 * - httpStatus: HTTP status code
 * - severity: Error severity level
 * - recoverable: Whether the error can be recovered
 * - retryable: Whether the operation can be retried
 */

import { HttpStatus, ErrorType } from './errors.js';

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error codes catalog
 */
export const ErrorCodes = {
  // Authentication & Authorization Errors (AUTH_*)
  AUTH_REQUIRED: {
    code: 'AUTH_REQUIRED',
    message: 'Se requiere autenticación. Por favor, inicia sesión.',
    messageEn: 'Authentication required. Please log in.',
    httpStatus: HttpStatus.UNAUTHORIZED,
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    retryable: false
  },
  AUTH_INVALID_TOKEN: {
    code: 'AUTH_INVALID_TOKEN',
    message: 'Token de autenticación inválido. Por favor, inicia sesión nuevamente.',
    messageEn: 'Invalid authentication token. Please log in again.',
    httpStatus: HttpStatus.UNAUTHORIZED,
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    retryable: false
  },
  AUTH_TOKEN_EXPIRED: {
    code: 'AUTH_TOKEN_EXPIRED',
    message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    messageEn: 'Your session has expired. Please log in again.',
    httpStatus: HttpStatus.UNAUTHORIZED,
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    retryable: false
  },
  AUTH_INSUFFICIENT_PERMISSIONS: {
    code: 'AUTH_INSUFFICIENT_PERMISSIONS',
    message: 'No tienes permisos suficientes para realizar esta acción.',
    messageEn: 'Insufficient permissions for this action.',
    httpStatus: HttpStatus.FORBIDDEN,
    type: ErrorType.AUTHORIZATION,
    severity: ErrorSeverity.MEDIUM,
    recoverable: false,
    retryable: false
  },

  // Validation Errors (VAL_*)
  VAL_INVALID_INPUT: {
    code: 'VAL_INVALID_INPUT',
    message: 'Los datos ingresados son inválidos. Por favor, verifica la información.',
    messageEn: 'Invalid input data. Please check the information.',
    httpStatus: HttpStatus.BAD_REQUEST,
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    recoverable: true,
    retryable: false
  },
  VAL_REQUIRED_FIELD: {
    code: 'VAL_REQUIRED_FIELD',
    message: 'Campo requerido faltante.',
    messageEn: 'Required field missing.',
    httpStatus: HttpStatus.BAD_REQUEST,
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    recoverable: true,
    retryable: false
  },
  VAL_INVALID_FORMAT: {
    code: 'VAL_INVALID_FORMAT',
    message: 'El formato de los datos es incorrecto.',
    messageEn: 'Invalid data format.',
    httpStatus: HttpStatus.BAD_REQUEST,
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    recoverable: true,
    retryable: false
  },
  VAL_OUT_OF_RANGE: {
    code: 'VAL_OUT_OF_RANGE',
    message: 'El valor está fuera del rango permitido.',
    messageEn: 'Value out of allowed range.',
    httpStatus: HttpStatus.BAD_REQUEST,
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    recoverable: true,
    retryable: false
  },

  // Database Errors (DB_*)
  DB_CONNECTION_FAILED: {
    code: 'DB_CONNECTION_FAILED',
    message: 'Error de conexión con la base de datos. Por favor, intenta nuevamente.',
    messageEn: 'Database connection failed. Please try again.',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    type: ErrorType.DATABASE,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    retryable: true
  },
  DB_QUERY_FAILED: {
    code: 'DB_QUERY_FAILED',
    message: 'Error al procesar tu solicitud. Por favor, intenta nuevamente.',
    messageEn: 'Database query failed. Please try again.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorType.DATABASE,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    retryable: true
  },
  DB_TRANSACTION_FAILED: {
    code: 'DB_TRANSACTION_FAILED',
    message: 'Error al guardar los cambios. Por favor, intenta nuevamente.',
    messageEn: 'Transaction failed. Please try again.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorType.DATABASE,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    retryable: true
  },
  DB_CONSTRAINT_VIOLATION: {
    code: 'DB_CONSTRAINT_VIOLATION',
    message: 'Los datos violan las restricciones del sistema.',
    messageEn: 'Data constraint violation.',
    httpStatus: HttpStatus.CONFLICT,
    type: ErrorType.DATABASE,
    severity: ErrorSeverity.MEDIUM,
    recoverable: false,
    retryable: false
  },
  DB_NOT_CONFIGURED: {
    code: 'DB_NOT_CONFIGURED',
    message: 'Base de datos no disponible. Por favor, contacta soporte.',
    messageEn: 'Database not configured.',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    type: ErrorType.DATABASE,
    severity: ErrorSeverity.CRITICAL,
    recoverable: false,
    retryable: false
  },

  // Resource Errors (RES_*)
  RES_NOT_FOUND: {
    code: 'RES_NOT_FOUND',
    message: 'El recurso solicitado no fue encontrado.',
    messageEn: 'Resource not found.',
    httpStatus: HttpStatus.NOT_FOUND,
    type: ErrorType.NOT_FOUND,
    severity: ErrorSeverity.LOW,
    recoverable: false,
    retryable: false
  },
  RES_ALREADY_EXISTS: {
    code: 'RES_ALREADY_EXISTS',
    message: 'El recurso ya existe.',
    messageEn: 'Resource already exists.',
    httpStatus: HttpStatus.CONFLICT,
    type: ErrorType.CONFLICT,
    severity: ErrorSeverity.LOW,
    recoverable: false,
    retryable: false
  },
  RES_DELETED: {
    code: 'RES_DELETED',
    message: 'El recurso ha sido eliminado.',
    messageEn: 'Resource has been deleted.',
    httpStatus: HttpStatus.GONE,
    type: ErrorType.NOT_FOUND,
    severity: ErrorSeverity.LOW,
    recoverable: false,
    retryable: false
  },

  // Rate Limiting Errors (RATE_*)
  RATE_LIMIT_EXCEEDED: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Has excedido el límite de solicitudes. Por favor, espera un momento e intenta nuevamente.',
    messageEn: 'Rate limit exceeded. Please wait and try again.',
    httpStatus: HttpStatus.TOO_MANY_REQUESTS,
    type: ErrorType.RATE_LIMIT,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    retryable: true
  },

  // External Service Errors (EXT_*)
  EXT_SERVICE_UNAVAILABLE: {
    code: 'EXT_SERVICE_UNAVAILABLE',
    message: 'Servicio externo no disponible. Por favor, intenta más tarde.',
    messageEn: 'External service unavailable. Please try later.',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    type: ErrorType.EXTERNAL_SERVICE,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    retryable: true
  },
  EXT_SERVICE_TIMEOUT: {
    code: 'EXT_SERVICE_TIMEOUT',
    message: 'El servicio externo no respondió a tiempo. Por favor, intenta nuevamente.',
    messageEn: 'External service timeout. Please try again.',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    type: ErrorType.EXTERNAL_SERVICE,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    retryable: true
  },
  EXT_SERVICE_ERROR: {
    code: 'EXT_SERVICE_ERROR',
    message: 'Error en servicio externo. Por favor, intenta más tarde.',
    messageEn: 'External service error. Please try later.',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    type: ErrorType.EXTERNAL_SERVICE,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    retryable: true
  },

  // Network Errors (NET_*)
  NET_CONNECTION_FAILED: {
    code: 'NET_CONNECTION_FAILED',
    message: 'Error de conexión de red. Por favor, verifica tu conexión e intenta nuevamente.',
    messageEn: 'Network connection failed. Please check your connection and try again.',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    type: ErrorType.SERVER,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    retryable: true
  },
  NET_TIMEOUT: {
    code: 'NET_TIMEOUT',
    message: 'La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.',
    messageEn: 'Request timeout. Please try again.',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    type: ErrorType.SERVER,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    retryable: true
  },

  // Server Errors (SRV_*)
  SRV_INTERNAL_ERROR: {
    code: 'SRV_INTERNAL_ERROR',
    message: 'Error interno del servidor. Por favor, intenta más tarde o contacta soporte.',
    messageEn: 'Internal server error. Please try later or contact support.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorType.SERVER,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    retryable: true
  },
  SRV_UNAVAILABLE: {
    code: 'SRV_UNAVAILABLE',
    message: 'El servicio no está disponible temporalmente. Por favor, intenta más tarde.',
    messageEn: 'Service temporarily unavailable. Please try later.',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    type: ErrorType.SERVER,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    retryable: true
  },
  SRV_MAINTENANCE: {
    code: 'SRV_MAINTENANCE',
    message: 'El sistema está en mantenimiento. Por favor, intenta más tarde.',
    messageEn: 'System under maintenance. Please try later.',
    httpStatus: HttpStatus.SERVICE_UNAVAILABLE,
    type: ErrorType.SERVER,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    retryable: true
  },

  // Business Logic Errors (BIZ_*)
  BIZ_OPERATION_FAILED: {
    code: 'BIZ_OPERATION_FAILED',
    message: 'La operación no pudo completarse. Por favor, verifica los datos e intenta nuevamente.',
    messageEn: 'Operation failed. Please verify data and try again.',
    httpStatus: HttpStatus.UNPROCESSABLE_ENTITY,
    type: ErrorType.BAD_REQUEST,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    retryable: false
  },
  BIZ_INVALID_STATE: {
    code: 'BIZ_INVALID_STATE',
    message: 'La operación no es válida en el estado actual.',
    messageEn: 'Invalid operation for current state.',
    httpStatus: HttpStatus.CONFLICT,
    type: ErrorType.CONFLICT,
    severity: ErrorSeverity.MEDIUM,
    recoverable: false,
    retryable: false
  },

  // Unknown/Generic Error
  UNKNOWN_ERROR: {
    code: 'UNKNOWN_ERROR',
    message: 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
    messageEn: 'An unexpected error occurred. Please try again.',
    httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    type: ErrorType.SERVER,
    severity: ErrorSeverity.HIGH,
    recoverable: true,
    retryable: true
  }
};

/**
 * Get error code definition by code string
 * @param {string} code - Error code
 * @returns {Object|null} Error code definition or null
 */
export function getErrorCode(code) {
  return ErrorCodes[code] || null;
}

/**
 * Get error message by code
 * @param {string} code - Error code
 * @param {string} language - Language ('es' or 'en')
 * @returns {string} Error message
 */
export function getErrorMessage(code, language = 'es') {
  const errorCode = getErrorCode(code);
  if (!errorCode) return ErrorCodes.UNKNOWN_ERROR.message;
  
  return language === 'en' ? errorCode.messageEn : errorCode.message;
}

/**
 * Check if error is retryable
 * @param {string} code - Error code
 * @returns {boolean} True if retryable
 */
export function isRetryableError(code) {
  const errorCode = getErrorCode(code);
  return errorCode ? errorCode.retryable : false;
}

/**
 * Check if error is recoverable
 * @param {string} code - Error code
 * @returns {boolean} True if recoverable
 */
export function isRecoverableError(code) {
  const errorCode = getErrorCode(code);
  return errorCode ? errorCode.recoverable : true;
}

/**
 * Get error severity
 * @param {string} code - Error code
 * @returns {string} Severity level
 */
export function getErrorSeverity(code) {
  const errorCode = getErrorCode(code);
  return errorCode ? errorCode.severity : ErrorSeverity.HIGH;
}

/**
 * Create standardized error object
 * @param {string} code - Error code
 * @param {Object} context - Additional context
 * @returns {Object} Standardized error object
 */
export function createStandardError(code, context = {}) {
  const errorCode = getErrorCode(code) || ErrorCodes.UNKNOWN_ERROR;
  
  return {
    error: true,
    code: errorCode.code,
    message: errorCode.message,
    type: errorCode.type,
    severity: errorCode.severity,
    recoverable: errorCode.recoverable,
    retryable: errorCode.retryable,
    timestamp: new Date().toISOString(),
    ...context
  };
}

/**
 * Map HTTP status to error code
 * @param {number} status - HTTP status code
 * @returns {string} Error code
 */
export function mapHttpStatusToErrorCode(status) {
  switch (status) {
    case 400: return 'VAL_INVALID_INPUT';
    case 401: return 'AUTH_REQUIRED';
    case 403: return 'AUTH_INSUFFICIENT_PERMISSIONS';
    case 404: return 'RES_NOT_FOUND';
    case 409: return 'RES_ALREADY_EXISTS';
    case 422: return 'VAL_INVALID_FORMAT';
    case 429: return 'RATE_LIMIT_EXCEEDED';
    case 500: return 'SRV_INTERNAL_ERROR';
    case 503: return 'SRV_UNAVAILABLE';
    default: return 'UNKNOWN_ERROR';
  }
}

/**
 * Map error type to error code
 * @param {string} errorName - Error name/type
 * @returns {string} Error code
 */
export function mapErrorTypeToErrorCode(errorName) {
  const mappings = {
    'ValidationError': 'VAL_INVALID_INPUT',
    'AuthenticationError': 'AUTH_REQUIRED',
    'AuthorizationError': 'AUTH_INSUFFICIENT_PERMISSIONS',
    'NotFoundError': 'RES_NOT_FOUND',
    'ConflictError': 'RES_ALREADY_EXISTS',
    'DatabaseError': 'DB_QUERY_FAILED',
    'NetworkError': 'NET_CONNECTION_FAILED',
    'TimeoutError': 'NET_TIMEOUT',
    'RateLimitError': 'RATE_LIMIT_EXCEEDED'
  };
  
  return mappings[errorName] || 'UNKNOWN_ERROR';
}
