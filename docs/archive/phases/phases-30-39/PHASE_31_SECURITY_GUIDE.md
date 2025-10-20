# Phase 31: Backend Hardening and Security Guide

## Overview

Phase 31 implements comprehensive security, validation, error handling, and monitoring infrastructure for the Avanta Finance backend.

## Security Utilities

### 1. Input Validation (`functions/utils/validation.js`)

Comprehensive validation functions to prevent XSS, SQL injection, and invalid data entry.

#### Key Functions

```javascript
// Sanitize string input
const cleaned = sanitizeString(userInput);

// Validate email
const { valid, error } = validateEmail('user@example.com');

// Validate date
const { valid, error, date } = validateDate('2025-01-15');

// Validate enum values
const { valid, error } = validateEnum(value, ['personal', 'business'], 'category');

// Validate integer
const { valid, error, value } = validateInteger(amount, 0, 1000000, 'amount');

// Validate string length
const { valid, error } = validateStringLength(str, 1, 100, 'name');

// Validate RFC (Mexican Tax ID)
const { valid, error } = validateRFC('XAXX010101000');

// SQL injection prevention
const isSafe = isSafeSqlValue(queryParam);

// Validate transaction data
const { valid, errors } = validateTransactionData(data);

// Validate pagination
const { valid, error, limit, offset } = validatePagination(limit, offset);

// Validate sort parameters
const { valid, error, sortBy, sortOrder } = validateSort(sortBy, sortOrder, allowedFields);
```

### 2. Security Headers and CORS (`functions/utils/security.js`)

Security headers, CORS configuration, and request validation.

#### Key Functions

```javascript
// Get comprehensive security headers
const headers = getSecurityHeaders({
  allowOrigin: '*',
  allowMethods: 'GET, POST, PUT, DELETE',
  contentType: 'application/json'
});

// Get CORS headers only
const corsHeaders = getCorsHeaders('*');

// Create OPTIONS response
const response = createOptionsResponse();

// Validate request origin
const isValid = isValidOrigin(request, ['https://example.com']);

// Get client IP
const ip = getClientIp(request);

// Get request metadata
const metadata = getRequestMetadata(request);

// Check if bot request
const isBot = isBotRequest(request);

// Generate secure token
const token = generateSecureToken(32);

// Hash sensitive data
const hashed = await hashData(sensitiveData);

// Mask sensitive data
const masked = maskSensitiveData('1234567890', 4); // Returns: ******7890

// Check user role
const hasAccess = hasRole(user, ['admin', 'editor']);
```

### 3. Error Handling (`functions/utils/errors.js`)

Centralized error handling with standardized responses.

#### Error Types

- `VALIDATION_ERROR` - Input validation failures
- `AUTHENTICATION_ERROR` - Authentication failures
- `AUTHORIZATION_ERROR` - Authorization/permission failures
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflicts (duplicates, etc.)
- `DATABASE_ERROR` - Database operation errors
- `RATE_LIMIT_ERROR` - Rate limit exceeded
- `INTERNAL_SERVER_ERROR` - Server errors

#### Key Functions

```javascript
// Create error response
const response = await createErrorResponse(error, request, env);

// Create validation error
const response = createValidationErrorResponse(['Name is required']);

// Create unauthorized response
const response = createUnauthorizedResponse('Token invalid');

// Create forbidden response
const response = createForbiddenResponse('Access denied');

// Create not found response
const response = createNotFoundResponse('Transaction');

// Create rate limit response
const response = createRateLimitResponse(rateLimitInfo);

// Create database error response
const response = createDatabaseErrorResponse(error);

// Create success response
const response = createSuccessResponse(data, 200, additionalHeaders);

// Custom error class
throw new AppError('Invalid input', ErrorType.VALIDATION, HttpStatus.BAD_REQUEST, { field: 'email' });
```

### 4. Logging (`functions/utils/logging.js`)

Structured logging with multiple log levels and categories.

#### Log Levels

- `DEBUG` - Detailed debugging information
- `INFO` - General information
- `WARN` - Warning messages
- `ERROR` - Error messages
- `CRITICAL` - Critical errors requiring immediate attention

#### Log Categories

- `API` - API requests/responses
- `AUTH` - Authentication events
- `DATABASE` - Database operations
- `SECURITY` - Security events
- `PERFORMANCE` - Performance metrics
- `AUDIT` - Audit trail
- `BUSINESS` - Business events

#### Key Functions

```javascript
// Log levels
logDebug('Debug message', { detail: 'info' }, env);
logInfo('Info message', { user: 'john' });
logWarn('Warning message', { severity: 'medium' });
await logError(error, { context: 'payment' }, env);
await logCritical(error, { severity: 'critical' }, env);

// Request/response logging
logRequest(request, { endpoint: '/api/transactions' }, env);
logResponse(request, response, duration, env);

// Authentication logging
await logAuthEvent('login', { userId, ip }, env);
await logAuthEvent('failed_login', { email, reason }, env);

// Audit logging
await logAuditEvent('create', 'transaction', { userId, transactionId }, env);
await logAuditEvent('delete', 'user', { adminId, userId }, env);

// Database operation logging
logDatabaseOperation('SELECT', 'transactions', duration, { rows: 100 }, env);

// Performance metrics
logPerformanceMetric('api_response_time', 150, 'ms', { endpoint: '/api/dashboard' });

// Security events
await logSecurityEvent('suspicious_activity', { ip, reason }, env);
await logSecurityEvent('rate_limit_exceeded', { ip, endpoint }, env);

// Business events
logBusinessEvent('transaction_created', { amount, category }, env);
logBusinessEvent('invoice_generated', { invoiceId, amount }, env);
```

### 5. Rate Limiting (`functions/utils/rate-limiter.js`)

Rate limiting to prevent abuse and ensure fair usage.

#### Rate Limit Configurations

```javascript
// Available configurations
RateLimitConfig.AUTH       // 5 requests/60s (authentication endpoints)
RateLimitConfig.API        // 100 requests/60s (general API)
RateLimitConfig.READ       // 200 requests/60s (read-only endpoints)
RateLimitConfig.WRITE      // 50 requests/60s (write endpoints)
RateLimitConfig.UPLOAD     // 10 requests/60s (upload endpoints)
RateLimitConfig.REPORTS    // 20 requests/60s (report generation)
```

#### Key Functions

```javascript
// Check rate limit
const result = await checkRateLimit(request, RateLimitConfig.API, userId, env);
// Returns: { allowed: true, remaining: 95, resetAt: 1234567890, retryAfter: 0 }

// Get rate limit config for endpoint
const config = getRateLimitConfig('POST', '/api/transactions');

// Check if rate limited
const isLimited = await isRateLimited(userId, RateLimitConfig.API);

// Reset rate limit (admin function)
await resetRateLimit(userId, RateLimitConfig.API);

// Get rate limit stats
const stats = await getRateLimitStats(userId, RateLimitConfig.API);

// Detect abuse
const { isAbuse, reason } = await detectAbuse(request, env);
```

### 6. Middleware (`functions/utils/middleware.js`)

Composable middleware for API endpoints.

#### Available Middleware

```javascript
// Authentication
requireAuth()         // Require valid JWT token
optionalAuth()        // Optional authentication

// Database
requireDatabase()     // Require DB connection

// Rate limiting
rateLimit(config)     // Apply rate limiting

// Logging
requestLogger()       // Log requests/responses

// Error handling
errorHandler()        // Catch and handle errors

// Security
securityHeaders()     // Add security headers

// Validation
validatePaginationMiddleware()  // Validate pagination params
validateBody(validator)         // Validate request body
requireQueryParams(['param'])   // Require query parameters

// CORS
handleCors()          // Handle CORS preflight

// Performance
performanceMonitor()  // Monitor performance
```

#### Usage Example

```javascript
import { createApiHandler } from '../utils/middleware.js';

async function handleGet(context) {
  const { userId, env } = context;
  // Your handler logic here
  return createSuccessResponse({ data: 'result' });
}

// Export with middleware
export const onRequestGet = createApiHandler(
  { get: handleGet },
  {
    requiresAuth: true,
    requiresDb: true,
    enableRateLimit: true,
    enableLogging: true
  }
).onRequestGet;
```

## Implementation Examples

### Example 1: Enhanced API Endpoint

```javascript
// categories.js - Enhanced with Phase 31 security
import { createApiHandler } from '../utils/middleware.js';
import { createSuccessResponse, createErrorResponse, createValidationErrorResponse } from '../utils/errors.js';
import { validateEnum, validateStringLength, sanitizeString } from '../utils/validation.js';
import { logAuditEvent } from '../utils/logging.js';

async function handleGet(context) {
  const { env, request, userId } = context;
  
  try {
    const url = new URL(request.url);
    const categoryType = url.searchParams.get('category_type');
    
    // Validate input
    if (categoryType) {
      const validation = validateEnum(categoryType, ['personal', 'business']);
      if (!validation.valid) {
        return createValidationErrorResponse(validation.error);
      }
    }
    
    // Query database
    const result = await env.DB.prepare(
      'SELECT * FROM categories WHERE user_id = ?'
    ).bind(userId).all();
    
    return createSuccessResponse({ data: result.results });
  } catch (error) {
    return createErrorResponse(error, request, env);
  }
}

// Export with middleware
export const onRequestGet = createApiHandler(
  { get: handleGet },
  { requiresAuth: true, requiresDb: true, enableRateLimit: true }
).onRequestGet;
```

### Example 2: Custom Validation

```javascript
function validateTransactionInput(data) {
  const errors = [];
  
  // Validate description
  const descValidation = validateStringLength(data.description, 1, 500, 'description');
  if (!descValidation.valid) {
    errors.push(descValidation.error);
  }
  
  // Validate type
  const typeValidation = validateEnum(data.type, ['ingreso', 'gasto'], 'type');
  if (!typeValidation.valid) {
    errors.push(typeValidation.error);
  }
  
  // Validate amount using monetary utilities
  const { value, error } = parseMonetaryInput(data.amount, 'amount', true);
  if (error) {
    errors.push(error);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    validatedData: { ...data, amount: value }
  };
}

// Use in handler
async function handlePost(context) {
  const { request, env, userId } = context;
  const data = await request.json();
  
  const validation = validateTransactionInput(data);
  if (!validation.valid) {
    return createValidationErrorResponse(validation.errors);
  }
  
  // Use validatedData for database insert
  // ...
}
```

### Example 3: Audit Logging

```javascript
async function handleDelete(context) {
  const { env, userId, request } = context;
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  
  // Get resource before deletion
  const resource = await env.DB.prepare(
    'SELECT * FROM transactions WHERE id = ? AND user_id = ?'
  ).bind(id, userId).first();
  
  if (!resource) {
    return createNotFoundResponse('Transaction');
  }
  
  // Delete
  await env.DB.prepare(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?'
  ).bind(id, userId).run();
  
  // Log audit event
  await logAuditEvent('delete', 'transaction', {
    userId,
    transactionId: id,
    amount: resource.amount,
    description: resource.description
  }, env);
  
  return createSuccessResponse({ success: true });
}
```

## Security Best Practices

### 1. Input Validation

- **Always validate and sanitize user input**
- Use validation functions before database operations
- Validate data types, lengths, formats
- Use enum validation for fixed values
- Check for SQL injection patterns

### 2. Authentication & Authorization

- Require authentication for sensitive endpoints
- Use JWT tokens with proper validation
- Verify user ownership of resources
- Implement role-based access control
- Log authentication events

### 3. Error Handling

- Use centralized error handling
- Never expose sensitive information in errors
- Log errors for monitoring
- Return user-friendly error messages
- Use appropriate HTTP status codes

### 4. Rate Limiting

- Apply rate limiting to all endpoints
- Use stricter limits for authentication
- Use moderate limits for writes
- Use generous limits for reads
- Monitor and alert on rate limit abuse

### 5. Logging

- Log all authentication events
- Log all sensitive operations (audit trail)
- Log errors with context
- Use structured logging
- Sanitize sensitive data before logging

### 6. Database Security

- Always use prepared statements (D1 does this automatically)
- Validate query parameters
- Implement proper indexing
- Use transactions for multi-step operations
- Verify user ownership in queries

## Performance Considerations

### 1. Rate Limiting

- Current implementation uses in-memory storage
- For production, use Cloudflare KV or Durable Objects
- Consider caching rate limit checks

### 2. Logging

- Avoid excessive logging in hot paths
- Use debug logs only in development
- Consider log aggregation services
- Implement log rotation

### 3. Validation

- Validate early to fail fast
- Cache validation results when possible
- Use efficient validation patterns

## Monitoring and Alerts

### 1. Error Monitoring

- Set up webhooks for critical errors
- Monitor error rates and patterns
- Alert on authentication failures
- Track error trends

### 2. Security Monitoring

- Monitor rate limit violations
- Track suspicious activities
- Alert on abuse patterns
- Monitor authentication failures

### 3. Performance Monitoring

- Track API response times
- Monitor database query performance
- Track memory usage
- Alert on slow requests

## Configuration

### Environment Variables

```toml
# wrangler.toml
[vars]
ENABLE_DEBUG_LOGS = "false"           # Enable debug logging
ENABLE_RATE_LIMITING = "true"         # Enable rate limiting
ERROR_ALERT_WEBHOOK = "..."           # Webhook for error alerts
ENVIRONMENT = "production"            # Environment name
```

### Rate Limit Configuration

Customize rate limits in `functions/utils/rate-limiter.js`:

```javascript
export const RateLimitConfig = {
  API: {
    maxRequests: 100,      // Increase for higher traffic
    windowSeconds: 60,     // Adjust window size
    namespace: 'api'
  }
};
```

## Testing

### Unit Testing Validation

```javascript
// Test validation functions
const { valid, error } = validateEmail('invalid-email');
console.assert(!valid, 'Should reject invalid email');

const { valid: validRFC } = validateRFC('XAXX010101000');
console.assert(validRFC, 'Should accept valid RFC');
```

### Integration Testing

```javascript
// Test API endpoint with validation
const response = await fetch('/api/categories', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ name: '', category_type: 'invalid' })
});

const data = await response.json();
console.assert(response.status === 400, 'Should return 400 for validation error');
console.assert(data.errors.length > 0, 'Should return validation errors');
```

### Rate Limit Testing

```javascript
// Test rate limiting
const requests = [];
for (let i = 0; i < 110; i++) {
  requests.push(fetch('/api/transactions', {
    headers: { 'Authorization': 'Bearer ' + token }
  }));
}

const responses = await Promise.all(requests);
const rateLimited = responses.filter(r => r.status === 429);
console.assert(rateLimited.length > 0, 'Should rate limit after 100 requests');
```

## Migration Guide

### Updating Existing Endpoints

1. **Add imports**:
```javascript
import { createApiHandler } from '../utils/middleware.js';
import { createSuccessResponse, createErrorResponse } from '../utils/errors.js';
import { validateStringLength, sanitizeString } from '../utils/validation.js';
```

2. **Extract handler logic**:
```javascript
async function handleGet(context) {
  const { env, userId } = context; // userId provided by middleware
  // Your logic here
}
```

3. **Export with middleware**:
```javascript
export const onRequestGet = createApiHandler(
  { get: handleGet },
  { requiresAuth: true, requiresDb: true }
).onRequestGet;
```

4. **Add validation**:
```javascript
// Before database operations
const validation = validateStringLength(data.name, 1, 100);
if (!validation.valid) {
  return createValidationErrorResponse(validation.error);
}
```

5. **Add audit logging** (for sensitive operations):
```javascript
await logAuditEvent('create', 'transaction', { userId, transactionId }, env);
```

## Troubleshooting

### Common Issues

1. **Rate limiting not working**: Check `ENABLE_RATE_LIMITING` environment variable
2. **Logs not appearing**: Check `ENABLE_DEBUG_LOGS` for debug logs
3. **Validation errors**: Check error response for specific validation failures
4. **Authentication failures**: Verify JWT token and `getUserIdFromToken` function

## Next Steps

1. **Phase 31B**: Implement caching strategies
2. **Phase 31C**: Add performance monitoring dashboards
3. **Phase 31D**: Implement advanced security features (2FA, API keys)
4. **Phase 31E**: Add automated security testing

## Resources

- [Cloudflare Workers Security](https://developers.cloudflare.com/workers/platform/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
