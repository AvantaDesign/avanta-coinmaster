# Avanta Coinmaster API Developer Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [API Endpoints Overview](#api-endpoints-overview)
5. [Common Patterns](#common-patterns)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Pagination](#pagination)
9. [Filtering and Sorting](#filtering-and-sorting)
10. [Code Examples](#code-examples)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

Welcome to the Avanta Coinmaster API Developer Guide. This comprehensive guide will help you integrate with our financial management API designed specifically for individuals with business activities in Mexico.

### What is Avanta Coinmaster?

Avanta Coinmaster is a complete financial management platform that provides:

- **Transaction Management**: Track income and expenses with detailed categorization
- **Tax Calculations**: Automated ISR and IVA calculations for Mexican fiscal requirements
- **CFDI Management**: Handle invoices and CFDI documents with SAT integration
- **Bank Reconciliation**: Automated reconciliation of bank statements
- **Financial Analytics**: Comprehensive reporting and analytics dashboards
- **Multi-Currency Support**: Manage transactions in MXN, USD, and EUR

### API Capabilities

Our RESTful API provides:

- **78+ Endpoints**: Comprehensive coverage of all platform features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: User, admin, and demo roles
- **Real-Time Data**: Instant access to financial data
- **Bulk Operations**: Efficient batch processing
- **Webhooks**: Event-driven notifications (coming soon)

### Base URLs

- **Production**: `https://avanta-coinmaster.pages.dev`
- **Local Development**: `http://localhost:8788`

---

## Getting Started

### Prerequisites

- Basic understanding of REST APIs
- HTTP client (curl, Postman, or programming language HTTP library)
- Valid email address for registration

### Quick Start (5 minutes)

#### 1. Register a New Account

```bash
curl -X POST https://avanta-coinmaster.pages.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "password": "SecurePass123!",
    "name": "Developer Account"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1729584000000_abc123",
    "email": "developer@example.com",
    "name": "Developer Account",
    "role": "user",
    "created_at": "2025-10-22T08:00:00.000Z"
  }
}
```

#### 2. Save Your Token

The `token` in the response is your API key. Save it securely - you'll need it for all API requests.

#### 3. Make Your First API Call

```bash
curl https://avanta-coinmaster.pages.dev/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. Create Your First Transaction

```bash
curl -X POST https://avanta-coinmaster.pages.dev/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "amount": "1234.56",
    "date": "2025-10-22",
    "description": "Office supplies purchase",
    "is_deductible": true
  }'
```

Congratulations! You've successfully integrated with the Avanta Coinmaster API.

---

## Authentication

### Overview

All API endpoints (except `/api/auth/*` and `/api/health`) require authentication using JWT (JSON Web Tokens).

### Authentication Flow

```
┌─────────┐                                    ┌─────────┐
│         │  1. POST /api/auth/register        │         │
│ Client  │ ──────────────────────────────────>│   API   │
│         │  {email, password, name}           │         │
│         │                                    │         │
│         │  2. Response with JWT token        │         │
│         │ <──────────────────────────────────│         │
│         │  {token, user}                     │         │
│         │                                    │         │
│         │  3. Include token in requests      │         │
│         │ ──────────────────────────────────>│         │
│         │  Authorization: Bearer <token>     │         │
│         │                                    │         │
│         │  4. Token expires after 24h        │         │
│         │  POST /api/auth/refresh            │         │
│         │ ──────────────────────────────────>│         │
│         │                                    │         │
└─────────┘                                    └─────────┘
```

### Token Management

#### Getting a Token

**Option 1: Register**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Option 2: Login**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Option 3: Google OAuth**
```bash
POST /api/auth/google
Content-Type: application/json

{
  "credential": "google_jwt_credential_here"
}
```

#### Using a Token

Include the token in the `Authorization` header of every request:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Refreshing a Token

Tokens expire after 24 hours. Refresh before expiry:

```bash
POST /api/auth/refresh
Authorization: Bearer YOUR_CURRENT_TOKEN
```

#### Token Security Best Practices

- ✅ Store tokens securely (never in localStorage for web apps)
- ✅ Use HTTPS for all API requests
- ✅ Refresh tokens before expiry
- ✅ Never commit tokens to version control
- ✅ Implement token rotation in production
- ❌ Never share tokens between users
- ❌ Never log tokens in application logs

---

## API Endpoints Overview

### Endpoint Categories

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Authentication** | 5 | User registration, login, token management |
| **Transactions** | 12 | CRUD operations for financial transactions |
| **Accounts** | 8 | Bank account management |
| **Categories** | 6 | Transaction categories |
| **Tax Calculations** | 10 | ISR/IVA calculations |
| **Invoices** | 15 | CFDI and invoice management |
| **SAT Integration** | 8 | Mexican tax authority integration |
| **Bank Reconciliation** | 6 | Statement reconciliation |
| **Reports** | 5 | Financial reports and analytics |
| **Budget Management** | 4 | Budget planning and tracking |
| **Dashboard** | 2 | Analytics and summaries |
| **Settings** | 3 | User preferences |
| **Health** | 3 | System monitoring |
| **Admin** | 5 | Administrative functions |

### Complete Endpoint List

#### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info

#### Transactions (`/api/transactions`)

- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/:id` - Get single transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/bulk` - Bulk create transactions
- `DELETE /api/transactions/bulk` - Bulk delete transactions
- `GET /api/transactions/stats` - Transaction statistics
- `GET /api/transactions/export` - Export transactions
- `POST /api/transactions/import` - Import transactions

#### Accounts (`/api/accounts`)

- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Create account
- `GET /api/accounts/:id` - Get account details
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `GET /api/accounts/:id/balance` - Get account balance
- `GET /api/accounts/:id/transactions` - Get account transactions

#### Categories (`/api/categories`)

- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/:id` - Get category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

#### Tax Calculations (`/api/tax-calculations`)

- `GET /api/tax-calculations` - List calculations
- `POST /api/tax-calculations` - Calculate taxes
- `GET /api/tax-calculations/:id` - Get calculation
- `PUT /api/tax-calculations/:id` - Update calculation
- `DELETE /api/tax-calculations/:id` - Delete calculation
- `POST /api/tax-calculations/simulate` - Simulate taxes
- `GET /api/tax-calculations/summary` - Tax summary

#### Dashboard (`/api/dashboard`)

- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/widgets` - Get widget data

#### Health (`/api/health`)

- `GET /api/health` - Health check
- `GET /api/health/ready` - Readiness check
- `GET /api/health/live` - Liveness check

---

## Common Patterns

### Request/Response Format

All requests and responses use JSON format.

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN
```

**Success Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2025-10-22T08:00:00.000Z"
}
```

**Error Response Format:**
```json
{
  "error": "Error title",
  "message": "Detailed error description",
  "code": "ERROR_CODE",
  "timestamp": "2025-10-22T08:00:00.000Z"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT/DELETE |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE (no body) |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing/invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | System unavailable |

### Data Types

#### Monetary Values

All monetary values are **decimal strings** to avoid floating-point precision issues:

```json
{
  "amount": "1234.56",
  "iva_amount": "197.53",
  "total": "1432.09"
}
```

**Never use:**
```json
{
  "amount": 1234.56  // ❌ Number - loses precision
}
```

#### Dates

ISO 8601 format:

- **Date only**: `"2025-10-22"`
- **DateTime**: `"2025-10-22T08:00:00.000Z"`

#### IDs

All IDs are strings with a prefix:

```json
{
  "user_id": "user_1729584000000_abc123",
  "transaction_id": "txn_1729584000000_xyz789",
  "account_id": "acc_1729584000000_def456"
}
```

---

## Error Handling

### Error Response Structure

```json
{
  "error": "Validation failed",
  "message": "The 'amount' field must be a positive number",
  "code": "VALIDATION_ERROR",
  "timestamp": "2025-10-22T08:00:00.000Z",
  "details": {
    "field": "amount",
    "value": "-100",
    "constraint": "positive"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `AUTH_REQUIRED` | 401 | Missing or invalid token | Include valid Bearer token |
| `VALIDATION_ERROR` | 400 | Request validation failed | Check request body format |
| `NOT_FOUND` | 404 | Resource not found | Verify resource ID |
| `USER_EXISTS` | 409 | User already registered | Use login instead |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password | Check credentials |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait and retry |
| `DB_ERROR` | 500 | Database operation failed | Retry or contact support |
| `INVALID_TOKEN` | 401 | Token expired or invalid | Refresh or login again |

### Error Handling Best Practices

#### 1. Always Check HTTP Status

```javascript
const response = await fetch('/api/transactions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(transaction)
});

if (!response.ok) {
  const error = await response.json();
  console.error('API Error:', error.code, error.message);
  // Handle error appropriately
}
```

#### 2. Implement Retry Logic

```javascript
async function apiRequestWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = response.headers.get('Retry-After') || 60;
        await sleep(retryAfter * 1000);
        continue;
      }
      
      if (response.status >= 500) {
        // Server error - retry with backoff
        await sleep(Math.pow(2, i) * 1000);
        continue;
      }
      
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

#### 3. Handle Token Expiration

```javascript
async function makeAuthenticatedRequest(url, options = {}) {
  let token = getStoredToken();
  
  options.headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  
  let response = await fetch(url, options);
  
  if (response.status === 401) {
    // Token expired - refresh
    token = await refreshToken();
    options.headers['Authorization'] = `Bearer ${token}`;
    response = await fetch(url, options);
  }
  
  return response;
}
```

---

## Rate Limiting

### Rate Limit Tiers

| Operation Type | Limit | Window |
|----------------|-------|--------|
| Authentication | 10 requests | per minute |
| Read Operations (GET) | 1000 requests | per hour |
| Write Operations (POST/PUT/DELETE) | 100 requests | per hour |
| Bulk Operations | 10 requests | per hour |

### Rate Limit Headers

Every response includes rate limit information:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1729584000
```

### Handling Rate Limits

```javascript
async function checkRateLimit(response) {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  
  if (parseInt(remaining) < 10) {
    console.warn('Approaching rate limit!');
    // Slow down requests
  }
  
  if (response.status === 429) {
    const resetTime = new Date(parseInt(reset) * 1000);
    const waitTime = resetTime - new Date();
    console.log(`Rate limited. Retry after ${waitTime}ms`);
    await sleep(waitTime);
  }
}
```

### Best Practices

- ✅ Cache responses when possible
- ✅ Use bulk operations for multiple items
- ✅ Implement exponential backoff
- ✅ Monitor rate limit headers
- ✅ Use webhooks instead of polling (when available)
- ❌ Don't make unnecessary requests
- ❌ Don't retry immediately on 429

---

## Pagination

### Offset-Based Pagination

List endpoints support pagination using `offset` and `limit`:

```bash
GET /api/transactions?limit=50&offset=0
```

**Parameters:**
- `limit`: Number of items to return (default: 50, max: 1000)
- `offset`: Number of items to skip (default: 0)

**Response:**
```json
{
  "data": [
    { "id": "txn_1", ... },
    { "id": "txn_2", ... }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Pagination Example

```javascript
async function getAllTransactions() {
  const allTransactions = [];
  let offset = 0;
  const limit = 100;
  
  while (true) {
    const response = await fetch(
      `/api/transactions?limit=${limit}&offset=${offset}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    const data = await response.json();
    allTransactions.push(...data.data);
    
    if (!data.pagination.hasMore) break;
    
    offset += limit;
  }
  
  return allTransactions;
}
```

---

## Filtering and Sorting

### Filtering

Most list endpoints support filtering via query parameters:

```bash
# Filter transactions by type
GET /api/transactions?type=expense

# Filter by date range
GET /api/transactions?start_date=2025-01-01&end_date=2025-12-31

# Filter by category
GET /api/transactions?category_id=cat_food

# Multiple filters
GET /api/transactions?type=expense&is_deductible=true&start_date=2025-10-01
```

### Sorting

Use `sort` and `order` parameters:

```bash
# Sort by date descending (newest first)
GET /api/transactions?sort=date&order=desc

# Sort by amount ascending
GET /api/transactions?sort=amount&order=asc

# Sort by creation time
GET /api/transactions?sort=created_at&order=desc
```

### Search

Full-text search across relevant fields:

```bash
# Search in description
GET /api/transactions?search=office supplies

# Search in multiple fields
GET /api/invoices?search=client name
```

### Combined Example

```bash
GET /api/transactions?
  type=expense&
  is_deductible=true&
  start_date=2025-01-01&
  end_date=2025-12-31&
  category_id=cat_office&
  sort=amount&
  order=desc&
  limit=50&
  offset=0
```

---

## Code Examples

### JavaScript/TypeScript

#### Setup

```javascript
const API_BASE_URL = 'https://avanta-coinmaster.pages.dev';
let authToken = null;

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken && !endpoint.startsWith('/api/auth')) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`API Error: ${error.message}`);
  }
  
  return response.json();
}
```

#### Authentication

```javascript
// Register
async function register(email, password, name) {
  const data = await apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name })
  });
  
  authToken = data.token;
  return data;
}

// Login
async function login(email, password) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  
  authToken = data.token;
  return data;
}

// Get current user
async function getCurrentUser() {
  return apiRequest('/api/auth/me');
}
```

#### Transactions

```javascript
// List transactions
async function getTransactions(filters = {}) {
  const params = new URLSearchParams(filters);
  return apiRequest(`/api/transactions?${params}`);
}

// Create transaction
async function createTransaction(transaction) {
  return apiRequest('/api/transactions', {
    method: 'POST',
    body: JSON.stringify(transaction)
  });
}

// Update transaction
async function updateTransaction(id, updates) {
  return apiRequest(`/api/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
}

// Delete transaction
async function deleteTransaction(id) {
  return apiRequest(`/api/transactions/${id}`, {
    method: 'DELETE'
  });
}
```

#### Complete Example

```javascript
async function example() {
  // 1. Register
  await register('dev@example.com', 'SecurePass123!', 'Developer');
  
  // 2. Create an account
  const account = await apiRequest('/api/accounts', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Main Checking',
      type: 'checking',
      currency: 'MXN',
      initial_balance: '10000.00'
    })
  });
  
  // 3. Create a transaction
  const transaction = await createTransaction({
    type: 'expense',
    amount: '1234.56',
    date: '2025-10-22',
    description: 'Office supplies',
    account_id: account.id,
    is_deductible: true
  });
  
  // 4. Get dashboard
  const dashboard = await apiRequest('/api/dashboard');
  console.log('Total balance:', dashboard.totalBalance);
  
  // 5. List transactions
  const transactions = await getTransactions({
    type: 'expense',
    limit: 50
  });
  console.log(`Found ${transactions.data.length} transactions`);
}
```

### Python

```python
import requests
from typing import Dict, Optional

class AvantaAPI:
    def __init__(self, base_url: str = 'https://avanta-coinmaster.pages.dev'):
        self.base_url = base_url
        self.token: Optional[str] = None
    
    def _request(self, method: str, endpoint: str, **kwargs) -> Dict:
        url = f"{self.base_url}{endpoint}"
        headers = kwargs.pop('headers', {})
        
        if self.token and not endpoint.startswith('/api/auth'):
            headers['Authorization'] = f'Bearer {self.token}'
        
        headers.setdefault('Content-Type', 'application/json')
        
        response = requests.request(method, url, headers=headers, **kwargs)
        response.raise_for_status()
        
        return response.json()
    
    def register(self, email: str, password: str, name: str) -> Dict:
        data = self._request('POST', '/api/auth/register', json={
            'email': email,
            'password': password,
            'name': name
        })
        self.token = data['token']
        return data
    
    def login(self, email: str, password: str) -> Dict:
        data = self._request('POST', '/api/auth/login', json={
            'email': email,
            'password': password
        })
        self.token = data['token']
        return data
    
    def get_transactions(self, **filters) -> Dict:
        return self._request('GET', '/api/transactions', params=filters)
    
    def create_transaction(self, transaction: Dict) -> Dict:
        return self._request('POST', '/api/transactions', json=transaction)

# Usage
api = AvantaAPI()
api.login('user@example.com', 'password')

transactions = api.get_transactions(type='expense', limit=50)
print(f"Found {len(transactions['data'])} transactions")
```

### cURL Examples

```bash
# Register
curl -X POST https://avanta-coinmaster.pages.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"SecurePass123!","name":"Developer"}'

# Login
curl -X POST https://avanta-coinmaster.pages.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"SecurePass123!"}'

# Get transactions
curl https://avanta-coinmaster.pages.dev/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create transaction
curl -X POST https://avanta-coinmaster.pages.dev/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "amount": "1234.56",
    "date": "2025-10-22",
    "description": "Office supplies"
  }'

# Update transaction
curl -X PUT https://avanta-coinmaster.pages.dev/api/transactions/txn_123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Updated description"}'

# Delete transaction
curl -X DELETE https://avanta-coinmaster.pages.dev/api/transactions/txn_123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Best Practices

### 1. Security

- ✅ Always use HTTPS in production
- ✅ Store tokens securely (use secure HTTP-only cookies)
- ✅ Implement CSRF protection
- ✅ Validate all input data
- ✅ Use environment variables for secrets
- ❌ Never commit tokens or credentials
- ❌ Never log sensitive data

### 2. Performance

- ✅ Cache responses when appropriate
- ✅ Use pagination for large datasets
- ✅ Implement request debouncing
- ✅ Use bulk operations when possible
- ✅ Compress requests and responses
- ❌ Don't fetch more data than needed
- ❌ Don't make redundant requests

### 3. Error Handling

- ✅ Always check HTTP status codes
- ✅ Implement retry logic with exponential backoff
- ✅ Handle token expiration gracefully
- ✅ Provide user-friendly error messages
- ✅ Log errors for debugging
- ❌ Don't ignore errors
- ❌ Don't retry infinitely

### 4. Data Management

- ✅ Validate data before sending
- ✅ Use decimal strings for monetary values
- ✅ Use ISO 8601 for dates
- ✅ Normalize data formats
- ✅ Handle null/undefined values
- ❌ Don't use floats for money
- ❌ Don't assume data formats

---

## Troubleshooting

### Common Issues

#### 1. 401 Unauthorized

**Problem**: API returns 401 error

**Solutions**:
- Verify token is included in `Authorization` header
- Check token hasn't expired (24 hour lifetime)
- Ensure token format is `Bearer TOKEN`
- Try refreshing the token
- Login again if refresh fails

```javascript
// Check if token is expired
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
}
```

#### 2. 400 Validation Error

**Problem**: Request validation fails

**Solutions**:
- Check request body matches schema
- Verify all required fields are present
- Ensure data types are correct
- Check field value constraints
- Review API documentation for endpoint

#### 3. 429 Rate Limit Exceeded

**Problem**: Too many requests

**Solutions**:
- Implement exponential backoff
- Cache responses when possible
- Use bulk operations
- Respect `Retry-After` header
- Monitor rate limit headers

#### 4. 500 Internal Server Error

**Problem**: Server error

**Solutions**:
- Retry the request (may be temporary)
- Check API status page
- Verify request is valid
- Contact support if persists
- Check for known issues

### Debugging Tips

#### Enable Request Logging

```javascript
async function debugApiRequest(endpoint, options) {
  console.log('Request:', {
    url: `${API_BASE_URL}${endpoint}`,
    method: options.method || 'GET',
    headers: options.headers,
    body: options.body
  });
  
  const response = await apiRequest(endpoint, options);
  
  console.log('Response:', response);
  
  return response;
}
```

#### Validate Request Data

```javascript
function validateTransaction(transaction) {
  const required = ['type', 'amount', 'date', 'description'];
  const missing = required.filter(field => !transaction[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (!['income', 'expense'].includes(transaction.type)) {
    throw new Error('Invalid transaction type');
  }
  
  if (parseFloat(transaction.amount) <= 0) {
    throw new Error('Amount must be positive');
  }
  
  return true;
}
```

#### Test API Health

```bash
# Check if API is healthy
curl https://avanta-coinmaster.pages.dev/api/health

# Expected response:
# {
#   "status": "healthy",
#   "checks": {
#     "database": "healthy",
#     "storage": "healthy"
#   }
# }
```

### Getting Help

- **Documentation**: https://avanta-coinmaster.pages.dev/docs
- **API Status**: Check health endpoint
- **Issues**: GitHub Issues
- **Support**: support@avanta-coinmaster.com

---

## Appendix

### HTTP Methods Summary

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve data | ✅ | ✅ |
| POST | Create resource | ❌ | ❌ |
| PUT | Update resource | ✅ | ❌ |
| DELETE | Delete resource | ✅ | ❌ |
| PATCH | Partial update | ❌ | ❌ |
| OPTIONS | CORS preflight | ✅ | ✅ |

### Content Types

- **Request**: `application/json`
- **Response**: `application/json`
- **File Upload**: `multipart/form-data`

### Useful Tools

- **API Testing**: Postman, Insomnia, HTTPie
- **CLI**: curl, httpie
- **Libraries**: axios, fetch, requests (Python)
- **SDK Generation**: OpenAPI Generator

---

**Last Updated**: October 2025  
**API Version**: 1.0.0  
**Document Version**: 1.0.0
