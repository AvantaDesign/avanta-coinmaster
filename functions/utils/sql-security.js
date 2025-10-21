/**
 * SQL Security Utilities
 * Phase 43: SQL Injection Prevention & Database Security
 * 
 * Provides utilities to prevent SQL injection attacks and ensure
 * safe database operations.
 */

/**
 * Whitelist of allowed table names for dynamic queries
 * Only tables in this whitelist can be used in dynamic queries
 */
const ALLOWED_TABLES = [
  'users',
  'transactions',
  'accounts',
  'invoices',
  'receipts',
  'budgets',
  'categories',
  'analytics_events',
  'audit_log',
  'audit_trail',
  'debts',
  'investments',
  'savings_goals',
  'fiscal_certificates',
  'sat_declarations',
  'annual_declarations',
  'transaction_invoice_map',
  'deductibility_rules',
  'recurring_transactions',
  'bank_statements',
  'tasks',
  'task_progress',
  'notifications',
  'documents'
];

/**
 * Whitelist of allowed sort fields per table
 * Prevents SQL injection through ORDER BY clauses
 */
const ALLOWED_SORT_FIELDS = {
  audit_log: ['timestamp', 'action_type', 'severity', 'user_id', 'entity_type', 'created_at'],
  transactions: ['date', 'amount', 'description', 'created_at', 'type', 'category_id'],
  deductibility_rules: ['priority', 'name', 'created_at', 'is_active'],
  invoices: ['date', 'total', 'uuid', 'status', 'created_at'],
  receipts: ['date', 'amount', 'vendor', 'created_at'],
  budgets: ['month', 'amount', 'category', 'created_at'],
  accounts: ['name', 'balance', 'type', 'created_at'],
  debts: ['name', 'amount', 'due_date', 'created_at'],
  investments: ['name', 'amount', 'date', 'created_at'],
  savings_goals: ['name', 'target_amount', 'deadline', 'created_at'],
  tasks: ['title', 'due_date', 'priority', 'status', 'created_at'],
  annual_declarations: ['fiscal_year', 'declaration_type', 'status', 'created_at']
};

/**
 * Whitelist of allowed field names for dynamic field access
 */
const ALLOWED_FIELDS = {
  transactions: ['id', 'date', 'amount', 'description', 'type', 'category_id', 'is_reconciled', 'created_at'],
  invoices: ['id', 'date', 'total', 'uuid', 'status', 'created_at'],
  receipts: ['id', 'date', 'amount', 'vendor', 'status', 'created_at'],
  budgets: ['id', 'month', 'amount', 'category', 'created_at'],
  tasks: ['id', 'title', 'status', 'priority', 'due_date', 'created_at']
};

/**
 * Validate table name against whitelist
 * @param {string} tableName - Table name to validate
 * @returns {{ valid: boolean, error: string|null, sanitized: string|null }}
 */
export function validateTableName(tableName) {
  if (!tableName || typeof tableName !== 'string') {
    return { valid: false, error: 'Table name is required', sanitized: null };
  }
  
  const normalized = tableName.toLowerCase().trim();
  
  if (!ALLOWED_TABLES.includes(normalized)) {
    return { 
      valid: false, 
      error: `Invalid table name: ${tableName}. Only whitelisted tables are allowed.`,
      sanitized: null 
    };
  }
  
  return { valid: true, error: null, sanitized: normalized };
}

/**
 * Validate sort field against whitelist for a specific table
 * @param {string} tableName - Table name
 * @param {string} sortField - Field to sort by
 * @returns {{ valid: boolean, error: string|null, sanitized: string|null }}
 */
export function validateSortField(tableName, sortField) {
  if (!sortField || typeof sortField !== 'string') {
    return { valid: false, error: 'Sort field is required', sanitized: null };
  }
  
  const normalized = sortField.toLowerCase().trim();
  const tableNormalized = tableName?.toLowerCase().trim();
  
  const allowedFields = ALLOWED_SORT_FIELDS[tableNormalized];
  if (!allowedFields) {
    return { 
      valid: false, 
      error: `No sort fields configured for table: ${tableName}`,
      sanitized: null 
    };
  }
  
  if (!allowedFields.includes(normalized)) {
    return { 
      valid: false, 
      error: `Invalid sort field: ${sortField}. Allowed fields: ${allowedFields.join(', ')}`,
      sanitized: null 
    };
  }
  
  return { valid: true, error: null, sanitized: normalized };
}

/**
 * Validate sort order
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {{ valid: boolean, error: string|null, sanitized: string|null }}
 */
export function validateSortOrder(sortOrder) {
  if (!sortOrder || typeof sortOrder !== 'string') {
    return { valid: false, error: 'Sort order is required', sanitized: null };
  }
  
  const normalized = sortOrder.toLowerCase().trim();
  
  if (!['asc', 'desc'].includes(normalized)) {
    return { 
      valid: false, 
      error: 'Sort order must be "asc" or "desc"',
      sanitized: null 
    };
  }
  
  return { valid: true, error: null, sanitized: normalized };
}

/**
 * Validate field name against whitelist for a specific table
 * @param {string} tableName - Table name
 * @param {string} fieldName - Field name to validate
 * @returns {{ valid: boolean, error: string|null, sanitized: string|null }}
 */
export function validateFieldName(tableName, fieldName) {
  if (!fieldName || typeof fieldName !== 'string') {
    return { valid: false, error: 'Field name is required', sanitized: null };
  }
  
  const normalized = fieldName.toLowerCase().trim();
  const tableNormalized = tableName?.toLowerCase().trim();
  
  const allowedFields = ALLOWED_FIELDS[tableNormalized];
  if (!allowedFields) {
    return { 
      valid: false, 
      error: `No fields configured for table: ${tableName}`,
      sanitized: null 
    };
  }
  
  if (!allowedFields.includes(normalized)) {
    return { 
      valid: false, 
      error: `Invalid field name: ${fieldName}. Allowed fields: ${allowedFields.join(', ')}`,
      sanitized: null 
    };
  }
  
  return { valid: true, error: null, sanitized: normalized };
}

/**
 * Build safe ORDER BY clause
 * @param {string} tableName - Table name for field validation
 * @param {string} sortBy - Field to sort by
 * @param {string} sortOrder - Sort order (asc/desc)
 * @returns {{ valid: boolean, error: string|null, clause: string|null }}
 */
export function buildSafeOrderBy(tableName, sortBy, sortOrder = 'desc') {
  // Validate sort field
  const fieldValidation = validateSortField(tableName, sortBy);
  if (!fieldValidation.valid) {
    return { valid: false, error: fieldValidation.error, clause: null };
  }
  
  // Validate sort order
  const orderValidation = validateSortOrder(sortOrder);
  if (!orderValidation.valid) {
    return { valid: false, error: orderValidation.error, clause: null };
  }
  
  // Build safe ORDER BY clause using validated values
  const clause = ` ORDER BY ${fieldValidation.sanitized} ${orderValidation.sanitized.toUpperCase()}`;
  
  return { valid: true, error: null, clause };
}

/**
 * Detect SQL injection patterns in input
 * @param {string} input - User input to check
 * @returns {{ safe: boolean, reason: string|null }}
 */
export function detectSqlInjection(input) {
  if (typeof input !== 'string') {
    return { safe: true, reason: null };
  }
  
  // Common SQL injection patterns
  const dangerousPatterns = [
    { pattern: /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/i, reason: 'Boolean-based SQL injection detected' },
    { pattern: /UNION\s+(ALL\s+)?SELECT/i, reason: 'UNION-based SQL injection detected' },
    { pattern: /DROP\s+(TABLE|DATABASE|SCHEMA)/i, reason: 'DROP statement detected' },
    { pattern: /INSERT\s+INTO/i, reason: 'INSERT statement detected' },
    { pattern: /DELETE\s+FROM/i, reason: 'DELETE statement detected' },
    { pattern: /UPDATE\s+\w+\s+SET/i, reason: 'UPDATE statement detected' },
    { pattern: /EXEC(\s|\+)+(s|x)p\w+/i, reason: 'Stored procedure execution detected' },
    { pattern: /--\s*$/m, reason: 'SQL comment detected' },
    { pattern: /\/\*.*\*\//s, reason: 'SQL comment block detected' },
    { pattern: /;\s*(DROP|DELETE|UPDATE|INSERT)/i, reason: 'Statement chaining detected' },
    { pattern: /xp_cmdshell/i, reason: 'Command execution attempt detected' },
    { pattern: /SLEEP\s*\(/i, reason: 'Time-based injection detected' },
    { pattern: /BENCHMARK\s*\(/i, reason: 'Time-based injection detected' },
    { pattern: /WAITFOR\s+DELAY/i, reason: 'Time-based injection detected' }
  ];
  
  for (const { pattern, reason } of dangerousPatterns) {
    if (pattern.test(input)) {
      return { safe: false, reason };
    }
  }
  
  return { safe: true, reason: null };
}

/**
 * Sanitize identifier (table/column name) for safe use in queries
 * Only allows alphanumeric characters and underscores
 * @param {string} identifier - Identifier to sanitize
 * @returns {string} Sanitized identifier
 */
export function sanitizeIdentifier(identifier) {
  if (typeof identifier !== 'string') {
    return '';
  }
  
  // Remove any characters that are not alphanumeric or underscore
  return identifier.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

/**
 * Validate and sanitize LIMIT value
 * @param {any} limit - Limit value from user input
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {{ valid: boolean, error: string|null, value: number }}
 */
export function validateLimit(limit, maxLimit = 1000) {
  const parsed = parseInt(limit, 10);
  
  if (isNaN(parsed) || parsed < 1) {
    return { valid: false, error: 'Limit must be a positive integer', value: 50 };
  }
  
  if (parsed > maxLimit) {
    return { valid: false, error: `Limit cannot exceed ${maxLimit}`, value: maxLimit };
  }
  
  return { valid: true, error: null, value: parsed };
}

/**
 * Validate and sanitize OFFSET value
 * @param {any} offset - Offset value from user input
 * @returns {{ valid: boolean, error: string|null, value: number }}
 */
export function validateOffset(offset) {
  const parsed = parseInt(offset, 10);
  
  if (isNaN(parsed) || parsed < 0) {
    return { valid: false, error: 'Offset must be a non-negative integer', value: 0 };
  }
  
  return { valid: true, error: null, value: parsed };
}

/**
 * Build safe query with validated parameters
 * @param {Object} options - Query options
 * @param {string} options.baseQuery - Base SQL query
 * @param {string} options.tableName - Table name for validation
 * @param {string} options.sortBy - Sort field
 * @param {string} options.sortOrder - Sort order
 * @param {number} options.limit - Result limit
 * @param {number} options.offset - Result offset
 * @returns {{ query: string, error: string|null }}
 */
export function buildSafeQuery({ baseQuery, tableName, sortBy, sortOrder, limit, offset }) {
  let query = baseQuery;
  let error = null;
  
  // Add ORDER BY if provided
  if (sortBy) {
    const orderBy = buildSafeOrderBy(tableName, sortBy, sortOrder);
    if (!orderBy.valid) {
      error = orderBy.error;
    } else {
      query += orderBy.clause;
    }
  }
  
  // Add LIMIT if provided
  if (limit !== undefined) {
    const limitValidation = validateLimit(limit);
    if (!limitValidation.valid) {
      error = error || limitValidation.error;
    } else {
      query += ` LIMIT ${limitValidation.value}`;
    }
  }
  
  // Add OFFSET if provided
  if (offset !== undefined) {
    const offsetValidation = validateOffset(offset);
    if (!offsetValidation.valid) {
      error = error || offsetValidation.error;
    } else {
      query += ` OFFSET ${offsetValidation.value}`;
    }
  }
  
  return { query, error };
}

/**
 * Security guidelines for database operations
 */
export const SQL_SECURITY_GUIDELINES = {
  title: 'SQL Security Guidelines',
  rules: [
    {
      rule: 'Always use parameterized queries',
      description: 'Use ? placeholders and .bind() for all user inputs',
      example: 'env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId)'
    },
    {
      rule: 'Never concatenate user input into SQL',
      description: 'String concatenation with user input creates SQL injection vulnerabilities',
      bad: 'SELECT * FROM users WHERE name = "' + 'userName' + '"',
      good: 'env.DB.prepare("SELECT * FROM users WHERE name = ?").bind(userName)'
    },
    {
      rule: 'Validate dynamic identifiers against whitelists',
      description: 'Table names, column names, and ORDER BY fields must be validated',
      example: 'Use validateSortField() before building ORDER BY clauses'
    },
    {
      rule: 'Use the SQL security utilities',
      description: 'Import and use functions from sql-security.js for all dynamic SQL',
      example: 'import { buildSafeOrderBy } from "../utils/sql-security.js"'
    },
    {
      rule: 'Validate and sanitize all user inputs',
      description: 'Check for SQL injection patterns before using any user input',
      example: 'const check = detectSqlInjection(userInput); if (!check.safe) return error;'
    },
    {
      rule: 'Use LIMIT and OFFSET validation',
      description: 'Always validate pagination parameters to prevent resource exhaustion',
      example: 'Use validateLimit() and validateOffset() utilities'
    },
    {
      rule: 'Implement least privilege',
      description: 'Database connections should have minimal necessary permissions',
      example: 'Read-only operations should not have write access'
    },
    {
      rule: 'Log security events',
      description: 'Log all SQL injection attempts and security violations',
      example: 'Use logSecurityEvent() for suspicious activity'
    }
  ]
};

/**
 * Export all utilities
 */
export default {
  validateTableName,
  validateSortField,
  validateSortOrder,
  validateFieldName,
  buildSafeOrderBy,
  detectSqlInjection,
  sanitizeIdentifier,
  validateLimit,
  validateOffset,
  buildSafeQuery,
  SQL_SECURITY_GUIDELINES
};
