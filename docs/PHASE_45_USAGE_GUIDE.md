# Phase 45: Error Handling & Resilience - Usage Guide

## Overview

This guide demonstrates how to use the comprehensive error handling and resilience features implemented in Phase 45.

## Table of Contents

1. [Frontend Error Boundaries](#frontend-error-boundaries)
2. [API Client with Resilience](#api-client-with-resilience)
3. [Retry Logic](#retry-logic)
4. [Circuit Breakers](#circuit-breakers)
5. [Validation Errors](#validation-errors)
6. [Database Resilience](#database-resilience)
7. [Transaction Management](#transaction-management)
8. [Best Practices](#best-practices)

---

## Frontend Error Boundaries

### Global Error Boundary

The global error boundary is already configured in `App.jsx`:

```jsx
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary context="app-root">
      {/* Your app content */}
    </ErrorBoundary>
  );
}
```

### Route-Specific Error Boundaries

Add error boundaries around specific routes or components:

```jsx
import ErrorBoundary from '../components/ErrorBoundary';

function TransactionsPage() {
  return (
    <ErrorBoundary context="transactions-page">
      <div>
        {/* Transactions content */}
      </div>
    </ErrorBoundary>
  );
}
```

### Custom Error Fallback

Create custom fallback UIs for specific contexts:

```jsx
import ErrorBoundary from '../components/ErrorBoundary';
import CustomFallback from '../components/CustomFallback';

<ErrorBoundary 
  context="critical-section"
  fallback={CustomFallback}
  onError={(error, errorInfo) => {
    // Custom error handling logic
    console.error('Custom error handler:', error);
  }}
  onReset={() => {
    // Custom reset logic
    console.log('Error boundary reset');
  }}
>
  {/* Content */}
</ErrorBoundary>
```

---

## API Client with Resilience

### Basic Usage

The enhanced API client automatically handles retries and circuit breakers:

```jsx
import apiClient from '../utils/api-client';

// GET request with automatic retry
const data = await apiClient.get('/api/transactions');

// POST request
const result = await apiClient.post('/api/transactions', {
  amount: 100,
  description: 'Payment'
});

// With custom retry policy
import { RetryPolicies } from '../utils/retry-utils';

apiClient.config.retryPolicy = RetryPolicies.AGGRESSIVE;
const data = await apiClient.get('/api/critical-data');
```

### Custom Configuration

Create a custom API client instance:

```jsx
import { ApiClient } from '../utils/api-client';
import { RetryPolicies } from '../utils/retry-utils';

const customClient = new ApiClient({
  baseURL: '/api',
  timeout: 60000,
  retryPolicy: RetryPolicies.PATIENT,
  useCircuitBreaker: true,
  circuitBreakerConfig: {
    failureThreshold: 3,
    timeout: 30000
  }
});

const data = await customClient.get('/slow-endpoint');
```

### Interceptors

Add custom interceptors for request/response/error handling:

```jsx
// Request interceptor
apiClient.addRequestInterceptor(async (config) => {
  // Add custom headers
  config.headers = {
    ...config.headers,
    'X-Custom-Header': 'value'
  };
  return config;
});

// Response interceptor
apiClient.addResponseInterceptor(async (response) => {
  // Transform response
  return response;
});

// Error interceptor
apiClient.addErrorInterceptor(async (error) => {
  // Custom error handling
  if (error.code === 'AUTH_REQUIRED') {
    // Handle authentication error
  }
  return error;
});
```

---

## Retry Logic

### Basic Retry

```jsx
import { retry } from '../utils/retry-utils';

const result = await retry(
  async () => {
    return await fetch('/api/data');
  },
  {
    maxAttempts: 3,
    baseDelay: 1000
  }
);
```

### Retry Policies

Use predefined retry policies:

```jsx
import { retry, RetryPolicies } from '../utils/retry-utils';

// Fast retry for quick operations
await retry(operation, RetryPolicies.FAST);

// Standard retry
await retry(operation, RetryPolicies.STANDARD);

// Aggressive retry for critical operations
await retry(operation, RetryPolicies.AGGRESSIVE);

// Patient retry for long-running operations
await retry(operation, RetryPolicies.PATIENT);

// No retry - fail fast
await retry(operation, RetryPolicies.NO_RETRY);
```

### Conditional Retry

```jsx
import { retryIf } from '../utils/retry-utils';

await retryIf(
  operation,
  (error, attempt) => {
    // Only retry on specific errors
    return error.code === 'NETWORK_ERROR' && attempt < 3;
  },
  { maxAttempts: 5 }
);
```

---

## Circuit Breakers

### Create Circuit Breaker

```jsx
import { createCircuitBreaker } from '../utils/circuit-breaker';

const breaker = createCircuitBreaker('external-api', {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60000
});

// Execute with circuit breaker
const result = await breaker.execute(async () => {
  return await fetch('https://external-api.com/data');
});
```

### With Fallback

```jsx
breaker.fallback((error) => {
  // Return cached data or default value
  return getCachedData();
});

const result = await breaker.execute(operation);
```

### Event Listeners

```jsx
breaker.on('open', () => {
  console.log('Circuit opened - too many failures');
});

breaker.on('close', () => {
  console.log('Circuit closed - service recovered');
});

breaker.on('halfOpen', () => {
  console.log('Circuit half-open - testing recovery');
});
```

### Get Circuit Breaker Stats

```jsx
const stats = breaker.getStats();
console.log(stats);
// {
//   totalRequests: 100,
//   totalSuccesses: 95,
//   totalFailures: 5,
//   currentState: 'CLOSED',
//   ...
// }
```

---

## Validation Errors

### Validation Error Manager

```jsx
import { ValidationErrorManager, Validators } from '../utils/validation-errors';

const validator = new ValidationErrorManager();

// Add validation rules
validator.addRule('email', Validators.required());
validator.addRule('email', Validators.email());
validator.addRule('name', Validators.minLength(3));
validator.addRule('age', Validators.minValue(18));

// Validate fields
const isValid = validator.validateField('email', 'user@example.com');

// Validate all
const allValid = validator.validateAll({
  email: 'user@example.com',
  name: 'John',
  age: 25
});

// Get errors
const errors = validator.getErrors();
const emailError = validator.getError('email');
```

### FormField Component

```jsx
import FormField from '../components/FormField';

function MyForm() {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };
  
  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };
  
  return (
    <form>
      <FormField
        label="Email"
        name="email"
        type="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.email}
        touched={touched.email}
        required
        helpText="Ingresa tu correo electrónico"
      />
      
      <FormField
        label="Contraseña"
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
        error={errors.password}
        touched={touched.password}
        required
      />
    </form>
  );
}
```

### Real-time Validation

```jsx
import { createDebouncedValidator } from '../utils/validation-errors';

const validateEmail = createDebouncedValidator(async (email) => {
  const response = await fetch(`/api/validate-email?email=${email}`);
  return response.json();
}, 300); // 300ms debounce

// Use in onChange handler
const handleEmailChange = (e) => {
  const email = e.target.value;
  setEmail(email);
  validateEmail(email);
};
```

---

## Database Resilience

### Execute Query with Resilience

```js
import { withDatabaseResilience, executeQuery } from './utils/database-resilience';

// In an API endpoint
export async function onRequestGet(context) {
  const { env, request } = context;
  
  const result = await executeQuery(
    env.DB,
    'SELECT * FROM transactions WHERE user_id = ?',
    [userId],
    { all: true },
    env
  );
  
  return new Response(JSON.stringify(result));
}
```

### With Fallback

```js
import { withFallback } from './utils/database-resilience';

const getTransactions = withFallback(
  async (db) => {
    return await db.prepare('SELECT * FROM transactions').all();
  },
  (error) => {
    // Return cached or default data
    return { results: [] };
  }
);

const data = await getTransactions(env.DB);
```

### Health Check

```js
import { healthCheck } from './utils/database-resilience';

const isHealthy = await healthCheck(env.DB);
if (!isHealthy) {
  return new Response('Database unavailable', { status: 503 });
}
```

---

## Transaction Management

### Basic Transaction

```js
import { withTransaction } from './utils/transaction-manager';

const result = await withTransaction(env.DB, async (tx) => {
  // All operations within transaction
  tx.prepare('INSERT INTO accounts (name) VALUES (?)').bind('Account 1');
  tx.prepare('INSERT INTO transactions (amount) VALUES (?)').bind(100);
  
  return { success: true };
}, {}, env);
```

### With Retry on Deadlock

```js
import { withRetryableTransaction } from './utils/transaction-manager';

const result = await withRetryableTransaction(
  env.DB,
  async (tx) => {
    // Transaction operations
    tx.prepare('UPDATE balances SET amount = ? WHERE id = ?').bind(1000, 1);
    return { updated: true };
  },
  {
    maxRetries: 3,
    retryOnDeadlock: true
  },
  env
);
```

### Series Operations

```js
import { withSeriesTransaction } from './utils/transaction-manager';

const results = await withSeriesTransaction(
  env.DB,
  [
    async (tx) => tx.prepare('INSERT INTO table1 ...').run(),
    async (tx) => tx.prepare('UPDATE table2 ...').run(),
    async (tx) => tx.prepare('DELETE FROM table3 ...').run()
  ],
  {},
  env
);
```

---

## Best Practices

### 1. Always Use Error Boundaries

Wrap components that may throw errors:

```jsx
<ErrorBoundary context="component-name">
  <YourComponent />
</ErrorBoundary>
```

### 2. Use Appropriate Retry Policies

Choose retry policies based on operation criticality:

- **FAST**: UI interactions, non-critical data
- **STANDARD**: Regular API calls
- **AGGRESSIVE**: Critical operations, payments
- **PATIENT**: Long-running operations, reports

### 3. Implement Circuit Breakers for External Services

```jsx
const breaker = createCircuitBreaker('payment-gateway', {
  failureThreshold: 3,
  timeout: 60000
});

breaker.fallback(() => {
  return { status: 'queued' }; // Queue for later processing
});
```

### 4. Provide User-Friendly Error Messages

Use error codes to show localized messages:

```js
import { getErrorMessage } from './utils/error-codes';

const message = getErrorMessage('DB_CONNECTION_FAILED', 'es');
// "Error de conexión con la base de datos. Por favor, intenta nuevamente."
```

### 5. Log Errors for Monitoring

```js
import { logger, ErrorMonitor } from './utils/errorMonitoring';

try {
  await operation();
} catch (error) {
  logger.error('Operation failed', error, { context: 'myOperation' });
  ErrorMonitor.track(error, { operation: 'myOperation' });
  throw error;
}
```

### 6. Handle Validation Errors Gracefully

```jsx
try {
  await apiClient.post('/api/data', formData);
} catch (error) {
  if (error.code === 'VAL_INVALID_INPUT') {
    const errors = parseApiValidationErrors(error.data);
    setFormErrors(errors);
  }
}
```

### 7. Test Error Scenarios

```jsx
// Simulate error for testing
if (import.meta.env.DEV && testErrorBoundary) {
  throw new Error('Test error boundary');
}
```

---

## Error Monitoring

### View Error Statistics

```js
import { ErrorMonitor } from './utils/errorMonitoring';

const stats = ErrorMonitor.getStats();
console.log(stats);
// {
//   totalErrors: 10,
//   errorsByLevel: { ERROR: 8, CRITICAL: 2 },
//   topErrors: [...]
// }
```

### Get Recent Errors

```js
const recentErrors = ErrorMonitor.getRecentErrors(5);
```

### Clear Error Store

```js
ErrorMonitor.clear();
```

---

## Summary

Phase 45 provides comprehensive error handling and resilience features:

- ✅ **Error Boundaries**: Catch React errors gracefully
- ✅ **Retry Logic**: Automatic retry with exponential backoff
- ✅ **Circuit Breakers**: Prevent cascade failures
- ✅ **Validation**: Field-level error display and recovery
- ✅ **Database Resilience**: Connection retry and transaction management
- ✅ **API Client**: Enhanced with retry and circuit breaker
- ✅ **Error Codes**: Standardized, localized error messages
- ✅ **Error Recovery**: User-friendly recovery actions

For questions or issues, refer to the inline documentation in each utility file.
