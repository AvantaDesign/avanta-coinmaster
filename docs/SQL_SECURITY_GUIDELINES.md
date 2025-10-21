# SQL Security Guidelines

**Phase 43: SQL Injection Prevention & Database Security**

## Overview

This document provides comprehensive guidelines for writing secure SQL queries in the Avanta Coinmaster application. Following these guidelines is **CRITICAL** to prevent SQL injection vulnerabilities and ensure data security.

## Critical Security Rules

### 1. Always Use Parameterized Queries

**✅ CORRECT - Use Bind Parameters:**
```javascript
// Good: Use ? placeholders with .bind()
const result = await env.DB.prepare(
  'SELECT * FROM users WHERE id = ? AND email = ?'
).bind(userId, email).first();
```

**❌ INCORRECT - Never Concatenate User Input:**
```javascript
// BAD: Direct string concatenation creates SQL injection vulnerability
const query = `SELECT * FROM users WHERE id = ${userId}`;
const result = await env.DB.prepare(query).first();
```

### 2. Validate Dynamic Identifiers

Table names, column names, and ORDER BY fields cannot use bind parameters. They MUST be validated against whitelists.

**✅ CORRECT - Use Validation Utilities:**
```javascript
import { buildSafeOrderBy } from '../utils/sql-security.js';

// Validate and build safe ORDER BY clause
const orderByResult = buildSafeOrderBy('transactions', sortBy, sortOrder);
if (orderByResult.valid) {
  query += orderByResult.clause;
} else {
  // Use default sorting if validation fails
  query += ' ORDER BY created_at DESC';
}
```

**❌ INCORRECT - Direct Concatenation:**
```javascript
// BAD: User input directly concatenated into ORDER BY
query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;
```

### 3. Validate Dynamic Table Names

**✅ CORRECT - Validate Against Whitelist:**
```javascript
import { validateTableName } from '../utils/sql-security.js';

const tableValidation = validateTableName(tableName);
if (!tableValidation.valid) {
  throw new Error(`Invalid table: ${tableValidation.error}`);
}

// Use sanitized table name
const query = `SELECT * FROM ${tableValidation.sanitized} WHERE user_id = ?`;
```

**❌ INCORRECT - User Input in Table Name:**
```javascript
// BAD: Allows arbitrary table access
const query = `SELECT * FROM ${resource} WHERE user_id = ?`;
```

### 4. Detect SQL Injection Patterns

For text inputs that will be used in queries (even with bind parameters), detect malicious patterns:

**✅ CORRECT - Detect and Block:**
```javascript
import { detectSqlInjection } from '../utils/validation.js';

const injectionCheck = detectSqlInjection(userInput);
if (!injectionCheck.safe) {
  await logWarn('SQL injection attempt', {
    input: userInput,
    reason: injectionCheck.reason
  }, env);
  
  return new Response(JSON.stringify({ 
    error: 'Invalid input' 
  }), { status: 400 });
}
```

### 5. Validate LIKE Patterns

When building LIKE patterns, ensure user input is sanitized:

**✅ CORRECT - Sanitize First:**
```javascript
import { detectSqlInjection, sanitizeString } from '../utils/validation.js';

// Check for SQL injection
const injectionCheck = detectSqlInjection(searchQuery);
if (!injectionCheck.safe) {
  return error response;
}

// Sanitize the input
const safe Query = sanitizeString(searchQuery);

// Now safe to use in LIKE pattern with bind parameter
const result = await env.DB.prepare(
  'SELECT * FROM documents WHERE name LIKE ?'
).bind(`%${safeQuery}%`).all();
```

**❌ INCORRECT - Direct User Input:**
```javascript
// BAD: User input could contain SQL wildcards or malicious code
const result = await env.DB.prepare(
  'SELECT * FROM documents WHERE name LIKE ?'
).bind(`%${userInput}%`).all();
```

## SQL Security Utilities

The application provides comprehensive security utilities in `/functions/utils/sql-security.js`:

### Available Functions

#### 1. `validateTableName(tableName)`
Validates table name against whitelist of allowed tables.

```javascript
const validation = validateTableName('transactions');
if (validation.valid) {
  // Use validation.sanitized
} else {
  // Handle validation.error
}
```

#### 2. `validateSortField(tableName, sortField)`
Validates sort field against whitelist for specific table.

```javascript
const validation = validateSortField('transactions', 'date');
if (validation.valid) {
  // Use validation.sanitized
}
```

#### 3. `validateSortOrder(sortOrder)`
Validates sort order is 'asc' or 'desc'.

```javascript
const validation = validateSortOrder('desc');
// Returns sanitized lowercase value
```

#### 4. `validateFieldName(tableName, fieldName)`
Validates field name against whitelist for specific table.

```javascript
const validation = validateFieldName('transactions', 'amount');
```

#### 5. `buildSafeOrderBy(tableName, sortBy, sortOrder)`
Builds a safe ORDER BY clause with validation.

```javascript
const result = buildSafeOrderBy('transactions', 'date', 'desc');
if (result.valid) {
  query += result.clause; // Adds: ORDER BY date DESC
} else {
  console.error(result.error);
}
```

#### 6. `detectSqlInjection(input)`
Detects SQL injection patterns in user input.

```javascript
const check = detectSqlInjection(userInput);
if (!check.safe) {
  // Log security event: check.reason
}
```

#### 7. `sanitizeIdentifier(identifier)`
Removes non-alphanumeric characters from identifiers.

```javascript
const safe = sanitizeIdentifier(userInput);
// Only allows: a-z, A-Z, 0-9, _
```

#### 8. `validateLimit(limit, maxLimit)` and `validateOffset(offset)`
Validates pagination parameters.

```javascript
const limitValidation = validateLimit(userLimit, 1000);
const offsetValidation = validateOffset(userOffset);
```

#### 9. `buildSafeQuery(options)`
Builds complete safe query with ORDER BY, LIMIT, OFFSET.

```javascript
const { query, error } = buildSafeQuery({
  baseQuery: 'SELECT * FROM transactions WHERE user_id = ?',
  tableName: 'transactions',
  sortBy: 'date',
  sortOrder: 'desc',
  limit: 50,
  offset: 0
});
```

## Common Vulnerabilities and Fixes

### Vulnerability 1: ORDER BY with User Input

**Problem:**
```javascript
query += ` ORDER BY ${sortBy} ${sortOrder}`;
```

**Fix:**
```javascript
import { buildSafeOrderBy } from '../utils/sql-security.js';

const orderBy = buildSafeOrderBy('table_name', sortBy, sortOrder);
if (orderBy.valid) {
  query += orderBy.clause;
} else {
  query += ' ORDER BY created_at DESC'; // default
}
```

### Vulnerability 2: Dynamic Table Names

**Problem:**
```javascript
const query = `SELECT * FROM ${tableName} WHERE id = ?`;
```

**Fix:**
```javascript
import { validateTableName } from '../utils/sql-security.js';

const validation = validateTableName(tableName);
if (!validation.valid) {
  throw new Error(validation.error);
}
const query = `SELECT * FROM ${validation.sanitized} WHERE id = ?`;
```

### Vulnerability 3: Dynamic Field Names

**Problem:**
```javascript
const query = `SELECT ${fieldName} FROM table WHERE id = ?`;
```

**Fix:**
```javascript
import { validateFieldName } from '../utils/sql-security.js';

const validation = validateFieldName('table_name', fieldName);
if (!validation.valid) {
  throw new Error(validation.error);
}
const query = `SELECT ${validation.sanitized} FROM table WHERE id = ?`;
```

### Vulnerability 4: Search with LIKE

**Problem:**
```javascript
const results = await env.DB.prepare(
  'SELECT * FROM docs WHERE name LIKE ?'
).bind(`%${userInput}%`).all();
```

**Fix:**
```javascript
import { detectSqlInjection, sanitizeString } from '../utils/validation.js';

const check = detectSqlInjection(userInput);
if (!check.safe) {
  return error;
}

const safe = sanitizeString(userInput);
const results = await env.DB.prepare(
  'SELECT * FROM docs WHERE name LIKE ?'
).bind(`%${safe}%`).all();
```

## Allowed Tables Whitelist

The following tables are allowed for dynamic queries:

- `users`
- `transactions`
- `accounts`
- `invoices`
- `receipts`
- `budgets`
- `categories`
- `analytics_events`
- `audit_log`
- `audit_trail`
- `debts`
- `investments`
- `savings_goals`
- `fiscal_certificates`
- `sat_declarations`
- `annual_declarations`
- `transaction_invoice_map`
- `deductibility_rules`
- `recurring_transactions`
- `bank_statements`
- `tasks`
- `task_progress`
- `notifications`
- `documents`

To add a new table, update the `ALLOWED_TABLES` array in `/functions/utils/sql-security.js`.

## Allowed Sort Fields by Table

Each table has a whitelist of allowed sort fields. Update `ALLOWED_SORT_FIELDS` in `/functions/utils/sql-security.js` when adding new sortable fields.

Example:
```javascript
transactions: ['date', 'amount', 'description', 'created_at', 'type', 'category_id']
```

## Security Testing Checklist

Before deploying code that interacts with the database:

- [ ] All user inputs are validated
- [ ] SQL injection patterns are detected and blocked
- [ ] Parameterized queries (bind parameters) are used for all values
- [ ] Dynamic identifiers are validated against whitelists
- [ ] Search queries are sanitized
- [ ] ORDER BY clauses use `buildSafeOrderBy()`
- [ ] Table names use `validateTableName()`
- [ ] Field names use `validateFieldName()`
- [ ] Security events are logged for suspicious activity
- [ ] Error messages don't reveal database structure

## Logging Security Events

Always log SQL injection attempts:

```javascript
import { logWarn, logError } from '../utils/logging.js';

if (!injectionCheck.safe) {
  await logWarn('SQL injection attempt detected', {
    endpoint: request.url,
    input: userInput,
    reason: injectionCheck.reason,
    userId
  }, env);
}
```

## Database Permissions

Follow the principle of least privilege:

1. **Read-only operations**: Use read-only database connections where possible
2. **Admin operations**: Require role-based authorization
3. **Sensitive tables**: Add additional authorization checks
4. **Audit logging**: Log all access to sensitive tables

## Code Review Requirements

All code that constructs SQL queries must be reviewed for:

1. Use of bind parameters for user input
2. Validation of dynamic identifiers
3. Proper error handling
4. Security logging
5. No information disclosure in error messages

## Additional Resources

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Cloudflare D1 Best Practices](https://developers.cloudflare.com/d1/)
- SQLite Security Documentation

## Phase 43 Implementation Summary

### Files Fixed for SQL Injection:
1. ✅ `audit-log.js` - ORDER BY validation
2. ✅ `transactions.js` - ORDER BY validation
3. ✅ `deductibility-rules.js` - ORDER BY validation
4. ✅ `task-engine.js` - Table and field name validation
5. ✅ `digital-archive.js` - Search input sanitization

### New Security Utilities:
- ✅ `sql-security.js` - Comprehensive SQL security utilities
- ✅ Enhanced `validation.js` - SQL injection detection

### Documentation Created:
- ✅ This SQL Security Guidelines document

---

**Last Updated**: Phase 43 - SQL Injection Prevention & Database Security  
**Status**: All critical vulnerabilities fixed and documented
