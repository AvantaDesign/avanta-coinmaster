# API Troubleshooting Guide

Complete troubleshooting guide for common issues when using the Avanta Coinmaster API.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Request Errors](#request-errors)
3. [Database Errors](#database-errors)
4. [Performance Issues](#performance-issues)
5. [Deployment Issues](#deployment-issues)
6. [Development Environment](#development-environment)

---

## Authentication Issues

### 401 Unauthorized - Token Missing

**Problem**: API returns 401 with "AUTH_REQUIRED" error

**Symptoms**:
```json
{
  "error": "Unauthorized",
  "message": "Valid authentication token required",
  "code": "AUTH_REQUIRED"
}
```

**Solutions**:

1. **Verify token is included in header**:
```bash
# Correct
curl https://avanta-coinmaster.pages.dev/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Wrong - missing Authorization header
curl https://avanta-coinmaster.pages.dev/api/transactions
```

2. **Check token format**:
```javascript
// Correct
headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}

// Wrong - missing "Bearer" prefix
headers: {
  'Authorization': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

3. **Verify token is not empty**:
```javascript
const token = localStorage.getItem('token');
if (!token) {
  console.error('No token found - user needs to login');
  // Redirect to login
}
```

### 401 Unauthorized - Token Expired

**Problem**: Token has expired (24-hour lifetime)

**Solutions**:

1. **Check token expiration**:
```javascript
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    return now >= expiryTime;
  } catch (e) {
    return true;
  }
}
```

2. **Refresh token before expiry**:
```javascript
async function refreshTokenIfNeeded(token) {
  if (isTokenExpired(token)) {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.token;
    } else {
      // Token can't be refreshed - user must login again
      throw new Error('Please login again');
    }
  }
  return token;
}
```

3. **Implement automatic token refresh**:
```javascript
setInterval(async () => {
  const token = localStorage.getItem('token');
  if (token && !isTokenExpired(token)) {
    // Refresh 1 hour before expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const timeUntilExpiry = expiryTime - Date.now();
    
    if (timeUntilExpiry < 3600000) { // Less than 1 hour
      const newToken = await refreshTokenIfNeeded(token);
      localStorage.setItem('token', newToken);
    }
  }
}, 600000); // Check every 10 minutes
```

### 401 Invalid Credentials

**Problem**: Wrong email or password during login

**Solutions**:

1. **Verify credentials**:
```javascript
// Check for typos
const email = document.getElementById('email').value.trim();
const password = document.getElementById('password').value;

// Validate email format
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  alert('Invalid email format');
  return;
}
```

2. **Handle login errors gracefully**:
```javascript
async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      if (error.code === 'INVALID_CREDENTIALS') {
        throw new Error('Invalid email or password');
      } else if (error.code === 'USER_NOT_FOUND') {
        throw new Error('Account not found. Please register.');
      }
      
      throw new Error(error.message);
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
}
```

---

## Request Errors

### 400 Validation Error

**Problem**: Request data fails validation

**Common Causes**:

1. **Missing required fields**:
```json
{
  "error": "Validation failed",
  "message": "The 'amount' field is required",
  "code": "VALIDATION_ERROR"
}
```

Solution:
```javascript
// Validate before sending
function validateTransaction(transaction) {
  const required = ['type', 'amount', 'date', 'description'];
  const missing = required.filter(field => !transaction[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Validate types
  if (!['income', 'expense'].includes(transaction.type)) {
    throw new Error('Invalid transaction type');
  }
  
  if (parseFloat(transaction.amount) <= 0) {
    throw new Error('Amount must be positive');
  }
  
  return true;
}
```

2. **Invalid data types**:
```javascript
// Wrong - amount as number
{
  "amount": 1234.56  // ❌
}

// Correct - amount as string
{
  "amount": "1234.56"  // ✅
}
```

3. **Invalid date format**:
```javascript
// Wrong
"date": "10/22/2025"  // ❌

// Correct
"date": "2025-10-22"  // ✅
```

### 404 Not Found

**Problem**: Resource doesn't exist

**Solutions**:

1. **Verify resource ID**:
```javascript
async function getTransaction(id) {
  if (!id || id.trim() === '') {
    throw new Error('Transaction ID is required');
  }
  
  const response = await fetch(`/api/transactions/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.status === 404) {
    throw new Error('Transaction not found');
  }
  
  return response.json();
}
```

2. **Check endpoint path**:
```bash
# Wrong
/api/transaction/123  # ❌ (singular)

# Correct
/api/transactions/123  # ✅ (plural)
```

### 409 Conflict

**Problem**: Resource already exists

**Example**: User already registered

```javascript
async function register(email, password, name) {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    if (response.status === 409) {
      // User exists - redirect to login
      throw new Error('Email already registered. Please login instead.');
    }
    
    return response.json();
  } catch (error) {
    console.error('Registration error:', error.message);
    throw error;
  }
}
```

### 429 Rate Limit Exceeded

**Problem**: Too many requests

**Solutions**:

1. **Implement exponential backoff**:
```javascript
async function apiRequestWithRetry(url, options, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      
      console.warn(`Rate limited. Waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
      await sleep(delay);
      continue;
    }
    
    return response;
  }
  
  throw new Error('Max retries exceeded');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

2. **Monitor rate limits**:
```javascript
function checkRateLimit(response) {
  const limit = response.headers.get('X-RateLimit-Limit');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  console.log(`Rate limit: ${remaining}/${limit} remaining`);
  
  if (parseInt(remaining) < 10) {
    console.warn('Approaching rate limit!');
  }
  
  return {
    limit: parseInt(limit),
    remaining: parseInt(remaining),
    reset: new Date(parseInt(reset) * 1000)
  };
}
```

3. **Implement caching**:
```javascript
const cache = new Map();

async function getCachedData(endpoint, maxAge = 60000) {
  const cached = cache.get(endpoint);
  
  if (cached && Date.now() - cached.timestamp < maxAge) {
    console.log('Returning cached data');
    return cached.data;
  }
  
  const response = await fetch(endpoint, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await response.json();
  
  cache.set(endpoint, {
    data,
    timestamp: Date.now()
  });
  
  return data;
}
```

---

## Database Errors

### 500 Database Error

**Problem**: Database operation failed

**Common Causes**:

1. **Database not configured**:
```json
{
  "error": "Database not available",
  "code": "DB_NOT_CONFIGURED"
}
```

Solution: Verify `wrangler.toml` has correct D1 binding

2. **SQL constraint violation**:
```javascript
// Foreign key constraint
try {
  await db.prepare(
    'INSERT INTO transactions (id, user_id, category_id) VALUES (?, ?, ?)'
  ).bind(txnId, userId, 'invalid_category').run();
} catch (error) {
  if (error.message.includes('FOREIGN KEY constraint')) {
    throw new Error('Invalid category ID');
  }
  throw error;
}
```

3. **Database timeout**:
```javascript
// Add timeout handling
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch('/api/transactions', {
    signal: controller.signal,
    headers: { 'Authorization': `Bearer ${token}` }
  });
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('Request timed out');
  }
} finally {
  clearTimeout(timeoutId);
}
```

---

## Performance Issues

### Slow API Responses

**Solutions**:

1. **Use pagination**:
```javascript
// Bad - fetch all transactions
const transactions = await fetch('/api/transactions');

// Good - use pagination
const transactions = await fetch('/api/transactions?limit=50&offset=0');
```

2. **Optimize filters**:
```javascript
// Use specific filters to reduce dataset
const transactions = await fetch(
  '/api/transactions?type=expense&start_date=2025-10-01&end_date=2025-10-31'
);
```

3. **Implement client-side caching**:
```javascript
// Cache transactions for 5 minutes
const cachedTransactions = getCachedData('/api/transactions', 300000);
```

### Large Response Payloads

**Solutions**:

1. **Use field selection** (if supported):
```bash
# Future feature - select specific fields
/api/transactions?fields=id,amount,date,description
```

2. **Reduce page size**:
```javascript
// Instead of limit=1000
const transactions = await fetch('/api/transactions?limit=50');
```

---

## Deployment Issues

### Environment Variables Not Set

**Problem**: Secrets not configured in production

**Solution**:
```bash
# Set secrets via Wrangler
wrangler secret put JWT_SECRET
wrangler secret put DB_CONNECTION_STRING
```

### CORS Errors in Production

**Problem**: Cross-origin requests blocked

**Symptoms**:
```
Access to fetch at 'https://api.example.com' from origin 'https://app.example.com' 
has been blocked by CORS policy
```

**Solution**: Verify CORS headers in API responses (already configured in all endpoints)

---

## Development Environment

### Port Already in Use

```bash
# Find and kill process
lsof -ti:8788 | xargs kill -9

# Use different port
npm run dev -- --port 3000
```

### Module Not Found

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force
```

### Hot Reload Not Working

**Solutions**:

1. Restart dev server
2. Clear browser cache
3. Check file watchers limit (Linux):
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## Debugging Tips

### Enable Request Logging

```javascript
// Log all requests
const originalFetch = window.fetch;
window.fetch = function(...args) {
  console.log('Fetch request:', args);
  return originalFetch.apply(this, args)
    .then(response => {
      console.log('Fetch response:', response);
      return response;
    });
};
```

### Check API Health

```bash
curl https://avanta-coinmaster.pages.dev/api/health | jq
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-22T08:00:00.000Z",
  "checks": {
    "database": "healthy",
    "storage": "healthy"
  }
}
```

### Inspect Network Traffic

Use browser DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "Fetch/XHR"
4. Click request to see:
   - Request headers
   - Request payload
   - Response headers
   - Response body
   - Timing information

### Test with cURL

```bash
# Test endpoint directly
curl -v https://avanta-coinmaster.pages.dev/api/transactions \
  -H "Authorization: Bearer $TOKEN"

# Verbose output shows:
# - Request headers
# - Response headers
# - Status code
# - Response body
```

---

## Getting Help

If you're still experiencing issues:

1. **Check the [API Guide](API_GUIDE.md)** for detailed documentation
2. **Search existing issues** on GitHub
3. **Create a new issue** with:
   - Error message
   - Request/response details
   - Steps to reproduce
   - Environment information
4. **Contact support**: support@avanta-coinmaster.com

## Useful Commands

```bash
# Check API health
curl https://avanta-coinmaster.pages.dev/api/health

# Test authentication
curl -X POST https://avanta-coinmaster.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# View database tables
wrangler d1 execute avanta-coinmaster --command="SELECT name FROM sqlite_master WHERE type='table'"

# Check rate limits
curl -i https://avanta-coinmaster.pages.dev/api/transactions | grep RateLimit
```

---

**Last Updated**: October 2025  
**Version**: 1.0.0
