# Avanta Finance API Documentation

Complete documentation for all Cloudflare Workers Functions API endpoints.

## Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [CORS Support](#cors-support)
- [Endpoints](#endpoints)
  - [Dashboard API](#dashboard-api)
  - [Transactions API](#transactions-api)
  - [Accounts API](#accounts-api)
  - [Fiscal API](#fiscal-api)
  - [Invoices API](#invoices-api)
  - [Upload API](#upload-api)

---

## Overview

The Avanta Finance API provides a complete backend for managing personal and business finances for individuals operating as "persona física con actividad empresarial" in Mexico.

**Key Features:**
- RESTful API design
- JSON request/response format
- CORS enabled for cross-origin requests
- Comprehensive error handling
- Input validation and sanitization
- SQLite database (Cloudflare D1)
- Object storage (Cloudflare R2)

**Technology Stack:**
- Cloudflare Workers (Serverless Functions)
- Cloudflare D1 (Distributed SQLite)
- Cloudflare R2 (Object Storage)
- JavaScript/ES Modules

---

## Base URL

**Production:**
```
https://your-project.pages.dev/api
```

**Local Development:**
```
http://localhost:8788/api
```

**Preview (Wrangler):**
```
http://localhost:8788/api
```

---

## Authentication

Currently, the API does not require authentication. Future versions will implement:
- JWT tokens
- OAuth 2.0 (Google)
- API keys for external integrations

---

## Error Handling

All API endpoints return consistent error responses:

### Error Response Format

```json
{
  "error": "Brief error description",
  "code": "ERROR_CODE",
  "message": "Detailed error message",
  "details": ["Array of validation errors"],
  "timestamp": "2024-10-14T10:30:00.000Z"
}
```

### HTTP Status Codes

| Status Code | Description |
|------------|-------------|
| `200` | Success |
| `201` | Created |
| `204` | No Content (CORS) |
| `400` | Bad Request (validation error) |
| `404` | Not Found |
| `409` | Conflict (duplicate) |
| `500` | Internal Server Error |
| `503` | Service Unavailable (DB not configured) |

### Common Error Codes

| Code | Description |
|------|-------------|
| `DB_NOT_CONFIGURED` | Database connection unavailable |
| `INVALID_JSON` | Request body is not valid JSON |
| `VALIDATION_ERROR` | Input validation failed |
| `NOT_FOUND` | Resource not found |
| `INVALID_ID` | Invalid ID format |
| `INVALID_PARAMETER` | Invalid query parameter |
| `INTERNAL_ERROR` | Unexpected server error |
| `CONFIRMATION_REQUIRED` | Delete confirmation required |

---

## Rate Limiting

Currently not implemented. Planned for future versions:
- 100 requests per minute per IP
- 1000 requests per hour per IP

---

## CORS Support

All endpoints support CORS with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

To make preflight requests, use the `OPTIONS` method on any endpoint.

---

## Endpoints

### Dashboard API

Get comprehensive financial dashboard data including balance, income, expenses, and trends.

#### Get Dashboard Summary

```
GET /api/dashboard
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `month` | Time period: `month`, `year`, or `all` |
| `include_categories` | boolean | `true` | Include category breakdown |
| `include_accounts` | boolean | `true` | Include account summaries |
| `include_trends` | boolean | `true` | Include 6-month spending trends |
| `recent_limit` | number | `10` | Number of recent transactions (max 50) |

**Example Request:**

```bash
curl "https://your-project.pages.dev/api/dashboard?period=month&include_categories=true"
```

**Example Response (200 OK):**

```json
{
  "timestamp": "2024-10-14T10:30:00.000Z",
  "period": "month",
  "totalBalance": 45000.00,
  "thisMonth": {
    "income": 50000.00,
    "expenses": 35000.00,
    "net": 15000.00,
    "transaction_count": 42
  },
  "categoryBreakdown": [
    {
      "category": "avanta",
      "type": "ingreso",
      "total": 40000.00,
      "count": 12
    },
    {
      "category": "avanta",
      "type": "gasto",
      "total": 25000.00,
      "count": 18
    }
  ],
  "accounts": [
    {
      "id": 1,
      "name": "BBVA Cuenta",
      "type": "banco",
      "balance": 25000.00,
      "updated_at": "2024-10-14T10:00:00.000Z"
    }
  ],
  "trends": [
    {
      "month": "2024-05",
      "income": 45000.00,
      "expenses": 32000.00,
      "net": 13000.00
    }
  ],
  "recentTransactions": [
    {
      "id": 1,
      "date": "2024-10-13",
      "description": "Cliente A - Desarrollo Web",
      "amount": 15000.00,
      "type": "ingreso",
      "category": "avanta",
      "account": "BBVA Cuenta",
      "is_deductible": 0,
      "created_at": "2024-10-13T15:30:00.000Z"
    }
  ],
  "deductible": {
    "amount": 12000.00,
    "count": 8
  },
  "indicators": {
    "savingsRate": "30.00",
    "expenseRatio": "70.00",
    "isPositive": true
  }
}
```

**CORS Preflight:**

```
OPTIONS /api/dashboard
```

Response: `204 No Content` with CORS headers

---

### Transactions API

Complete CRUD operations for financial transactions with advanced filtering, searching, and pagination.

#### List Transactions

```
GET /api/transactions
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | `50` | Results per page (max 1000) |
| `offset` | number | `0` | Pagination offset |
| `category` | string | - | Filter: `personal` or `avanta` |
| `type` | string | - | Filter: `ingreso` or `gasto` |
| `account` | string | - | Filter by account name |
| `search` | string | - | Search in description |
| `date_from` | string | - | Start date (YYYY-MM-DD) |
| `date_to` | string | - | End date (YYYY-MM-DD) |
| `amount_min` | number | - | Minimum amount |
| `amount_max` | number | - | Maximum amount |
| `is_deductible` | boolean | - | Filter deductible expenses |
| `sort_by` | string | `date` | Sort field: `date`, `amount`, `description`, `created_at` |
| `sort_order` | string | `desc` | Sort order: `asc` or `desc` |
| `include_stats` | boolean | `false` | Include aggregated statistics |

**Example Request:**

```bash
curl "https://your-project.pages.dev/api/transactions?category=avanta&type=gasto&is_deductible=true&limit=20&include_stats=true"
```

**Example Response (200 OK):**

```json
{
  "data": [
    {
      "id": 15,
      "date": "2024-10-13",
      "description": "Hosting AWS - Octubre",
      "amount": 1200.00,
      "type": "gasto",
      "category": "avanta",
      "account": "Tarjeta Crédito",
      "is_deductible": 1,
      "economic_activity": "622",
      "receipt_url": "/receipts/aws-oct.pdf",
      "created_at": "2024-10-13T12:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "count": 8,
    "has_more": false,
    "total": 8,
    "total_pages": 1,
    "current_page": 1
  },
  "filters": {
    "category": "avanta",
    "type": "gasto",
    "is_deductible": "true"
  },
  "statistics": {
    "total_transactions": 8,
    "total_income": 0,
    "total_expenses": 12500.00,
    "net": -12500.00
  }
}
```

**Error Responses:**

```json
{
  "error": "Invalid category. Must be \"personal\" or \"avanta\"",
  "code": "INVALID_PARAMETER"
}
```

#### Get Single Transaction

```
GET /api/transactions/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Transaction ID |

**Example Request:**

```bash
curl "https://your-project.pages.dev/api/transactions/15"
```

**Example Response (200 OK):**

```json
{
  "id": 15,
  "date": "2024-10-13",
  "description": "Hosting AWS - Octubre",
  "amount": 1200.00,
  "type": "gasto",
  "category": "avanta",
  "account": "Tarjeta Crédito",
  "is_deductible": 1,
  "economic_activity": "622",
  "receipt_url": "/receipts/aws-oct.pdf",
  "created_at": "2024-10-13T12:00:00.000Z"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Transaction not found",
  "code": "NOT_FOUND"
}
```

#### Create Transaction

```
POST /api/transactions
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | ✓ | Date in YYYY-MM-DD format (cannot be future) |
| `description` | string | ✓ | Transaction description (max 500 chars) |
| `amount` | number | ✓ | Amount (positive, max 999,999,999.99) |
| `type` | string | ✓ | `ingreso` or `gasto` |
| `category` | string | ✓ | `personal` or `avanta` |
| `account` | string | - | Account name |
| `is_deductible` | boolean | - | Is tax deductible (default: false) |
| `economic_activity` | string | - | SAT economic activity code |
| `receipt_url` | string | - | URL to receipt file |

**Example Request:**

```bash
curl -X POST "https://your-project.pages.dev/api/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-10-14",
    "description": "Cliente B - Consultoría",
    "amount": 8500.00,
    "type": "ingreso",
    "category": "avanta",
    "account": "BBVA Cuenta",
    "is_deductible": false
  }'
```

**Example Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": 48,
    "date": "2024-10-14",
    "description": "Cliente B - Consultoría",
    "amount": 8500.00,
    "type": "ingreso",
    "category": "avanta",
    "account": "BBVA Cuenta",
    "is_deductible": 0,
    "economic_activity": null,
    "receipt_url": null,
    "created_at": "2024-10-14T10:30:00.000Z"
  },
  "message": "Transaction created successfully"
}
```

**Validation Error Response (400 Bad Request):**

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    "date is required",
    "amount must be greater than 0",
    "type must be either \"ingreso\" or \"gasto\""
  ]
}
```

#### Update Transaction

```
PUT /api/transactions/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Transaction ID |

**Request Body:**

All fields are optional. Only provided fields will be updated.

| Field | Type | Description |
|-------|------|-------------|
| `date` | string | Date in YYYY-MM-DD format |
| `description` | string | Transaction description |
| `amount` | number | Amount |
| `type` | string | `ingreso` or `gasto` |
| `category` | string | `personal` or `avanta` |
| `account` | string | Account name |
| `is_deductible` | boolean | Is tax deductible |
| `economic_activity` | string | SAT economic activity code |
| `receipt_url` | string | URL to receipt file |

**Example Request:**

```bash
curl -X PUT "https://your-project.pages.dev/api/transactions/48" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 9000.00,
    "receipt_url": "/receipts/cliente-b-factura.pdf"
  }'
```

**Example Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": 48,
    "date": "2024-10-14",
    "description": "Cliente B - Consultoría",
    "amount": 9000.00,
    "type": "ingreso",
    "category": "avanta",
    "account": "BBVA Cuenta",
    "is_deductible": 0,
    "economic_activity": null,
    "receipt_url": "/receipts/cliente-b-factura.pdf",
    "created_at": "2024-10-14T10:30:00.000Z"
  },
  "message": "Transaction updated successfully"
}
```

**Error Response (404 Not Found):**

```json
{
  "error": "Transaction not found",
  "code": "NOT_FOUND"
}
```

#### Delete Transaction

```
DELETE /api/transactions/:id?confirm=true
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Transaction ID |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `confirm` | boolean | ✓ | Must be `true` for safety |

**Example Request:**

```bash
curl -X DELETE "https://your-project.pages.dev/api/transactions/48?confirm=true"
```

**Example Response (200 OK):**

```json
{
  "success": true,
  "message": "Transaction deleted successfully",
  "deleted": {
    "id": 48,
    "date": "2024-10-14",
    "description": "Cliente B - Consultoría",
    "amount": 9000.00,
    "type": "ingreso",
    "category": "avanta"
  }
}
```

**Error Response (400 Bad Request) - Missing Confirmation:**

```json
{
  "error": "Delete confirmation required",
  "code": "CONFIRMATION_REQUIRED",
  "message": "Add ?confirm=true to the request to confirm deletion"
}
```

#### CORS Preflight

```
OPTIONS /api/transactions
```

Response: `204 No Content` with CORS headers

---

### Accounts API

Manage bank accounts and credit cards.

#### List Accounts

```
GET /api/accounts
```

**Example Request:**

```bash
curl "https://your-project.pages.dev/api/accounts"
```

**Example Response (200 OK):**

```json
[
  {
    "id": 1,
    "name": "BBVA Cuenta",
    "type": "banco",
    "balance": 25000.00,
    "updated_at": "2024-10-14T10:00:00.000Z"
  },
  {
    "id": 2,
    "name": "Banco Azteca",
    "type": "banco",
    "balance": 15000.00,
    "updated_at": "2024-10-13T15:30:00.000Z"
  },
  {
    "id": 3,
    "name": "Tarjeta Crédito",
    "type": "credito",
    "balance": 5000.00,
    "updated_at": "2024-10-12T12:00:00.000Z"
  }
]
```

#### Update Account Balance

```
PUT /api/accounts/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | number | Account ID |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `balance` | number | ✓ | New balance amount |

**Example Request:**

```bash
curl -X PUT "https://your-project.pages.dev/api/accounts/1" \
  -H "Content-Type: application/json" \
  -d '{
    "balance": 28500.00
  }'
```

**Example Response (200 OK):**

```json
{
  "success": true
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "Balance is required"
}
```

---

### Fiscal API

Calculate Mexican taxes (ISR and IVA) for a specific month.

#### Get Tax Calculations

```
GET /api/fiscal
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `month` | number | Current month | Month (1-12) |
| `year` | number | Current year | Year (YYYY) |

**Example Request:**

```bash
curl "https://your-project.pages.dev/api/fiscal?month=10&year=2024"
```

**Example Response (200 OK):**

```json
{
  "month": 10,
  "year": 2024,
  "income": 50000.00,
  "deductible": 25000.00,
  "utilidad": 25000.00,
  "isr": 5000.00,
  "iva": 4000.00,
  "dueDate": "2024-11-17"
}
```

**Field Descriptions:**

| Field | Description |
|-------|-------------|
| `income` | Total income from Avanta category |
| `deductible` | Total deductible expenses from Avanta category |
| `utilidad` | Profit (income - deductible) |
| `isr` | Income tax (20% of utilidad) |
| `iva` | Value-added tax (16% of income - 16% of deductible) |
| `dueDate` | Payment due date (17th of next month) |

---

### Invoices API

Manage CFDI invoices (Mexican electronic invoices).

#### List Invoices

```
GET /api/invoices
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | `recibido` or `emitido` (currently not used) |

**Example Request:**

```bash
curl "https://your-project.pages.dev/api/invoices"
```

**Example Response (200 OK):**

```json
[
  {
    "id": 1,
    "uuid": "12345678-ABCD-1234-ABCD-123456789012",
    "rfc_emisor": "XAXX010101000",
    "rfc_receptor": "REYM850101ABC",
    "date": "2024-10-13",
    "subtotal": 8620.69,
    "iva": 1379.31,
    "total": 10000.00,
    "xml_url": "/receipts/cfdi-12345.xml",
    "status": "active",
    "created_at": "2024-10-13T10:00:00.000Z"
  }
]
```

#### Create Invoice

```
POST /api/invoices
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uuid` | string | ✓ | CFDI UUID |
| `rfc_emisor` | string | ✓ | Issuer's RFC |
| `rfc_receptor` | string | ✓ | Receiver's RFC |
| `date` | string | ✓ | Invoice date (YYYY-MM-DD) |
| `subtotal` | number | ✓ | Subtotal amount |
| `iva` | number | ✓ | IVA amount |
| `total` | number | ✓ | Total amount |
| `xml_url` | string | - | URL to XML file |

**Example Request:**

```bash
curl -X POST "https://your-project.pages.dev/api/invoices" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "12345678-ABCD-1234-ABCD-123456789012",
    "rfc_emisor": "XAXX010101000",
    "rfc_receptor": "REYM850101ABC",
    "date": "2024-10-14",
    "subtotal": 7758.62,
    "iva": 1241.38,
    "total": 9000.00,
    "xml_url": "/receipts/cfdi-67890.xml"
  }'
```

**Example Response (201 Created):**

```json
{
  "id": 2,
  "success": true
}
```

**Validation Error Response (400 Bad Request):**

```json
{
  "error": "Missing required fields"
}
```

---

### Upload API

Upload files to R2 storage (receipts, invoices, documents).

#### Upload File

```
POST /api/upload
```

**Request Body:**

`multipart/form-data` with file field

**Example Request (using curl):**

```bash
curl -X POST "https://your-project.pages.dev/api/upload" \
  -F "file=@/path/to/receipt.pdf"
```

**Example Request (using JavaScript):**

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.url); // File URL
```

**Example Response (201 Created):**

```json
{
  "url": "/receipts/1729849200000-receipt.pdf",
  "success": true
}
```

**Error Response (400 Bad Request):**

```json
{
  "error": "No file provided"
}
```

**Supported File Types:**

- Images: JPEG, PNG, GIF
- Documents: PDF
- XML: CFDI invoices

**File Size Limit:**

- Maximum: 10 MB (configurable in wrangler.toml)

---

## Testing

### Using curl

Test any endpoint using curl:

```bash
# Get dashboard
curl "http://localhost:8788/api/dashboard"

# List transactions with filters
curl "http://localhost:8788/api/transactions?category=avanta&limit=10"

# Create transaction
curl -X POST "http://localhost:8788/api/transactions" \
  -H "Content-Type: application/json" \
  -d '{"date":"2024-10-14","description":"Test","amount":100,"type":"gasto","category":"personal"}'
```

### Using Test Script

Run the comprehensive test script:

```bash
./test-api.sh
./test-api.sh http://localhost:8788
./test-api.sh https://your-project.pages.dev
```

### Using Postman

Import the endpoints into Postman:

1. Create a new collection
2. Add environment variables for base URL
3. Import requests from this documentation
4. Run tests

---

## Examples

### Complete Transaction Workflow

```bash
# 1. Create a new transaction
curl -X POST "http://localhost:8788/api/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-10-14",
    "description": "New Client Project",
    "amount": 15000,
    "type": "ingreso",
    "category": "avanta",
    "account": "BBVA Cuenta"
  }'

# Response: {"success":true,"data":{"id":50,...}}

# 2. Update the transaction
curl -X PUT "http://localhost:8788/api/transactions/50" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 16500,
    "description": "New Client Project - Updated"
  }'

# 3. Get the transaction
curl "http://localhost:8788/api/transactions/50"

# 4. Delete the transaction
curl -X DELETE "http://localhost:8788/api/transactions/50?confirm=true"
```

### Monthly Fiscal Report

```bash
# 1. Get fiscal calculations for October 2024
curl "http://localhost:8788/api/fiscal?month=10&year=2024"

# 2. Get deductible expenses
curl "http://localhost:8788/api/transactions?category=avanta&type=gasto&is_deductible=true&date_from=2024-10-01&date_to=2024-10-31&include_stats=true"

# 3. Get income
curl "http://localhost:8788/api/transactions?category=avanta&type=ingreso&date_from=2024-10-01&date_to=2024-10-31&include_stats=true"
```

### Dashboard with All Options

```bash
curl "http://localhost:8788/api/dashboard?period=year&include_categories=true&include_accounts=true&include_trends=true&recent_limit=20"
```

---

## Best Practices

### 1. Error Handling

Always check the HTTP status code and error response:

```javascript
try {
  const response = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.code, error.details);
    throw new Error(error.error);
  }
  
  const result = await response.json();
  return result.data;
} catch (error) {
  console.error('Request failed:', error);
  throw error;
}
```

### 2. Pagination

For large datasets, use pagination:

```javascript
async function fetchAllTransactions() {
  const limit = 100;
  let offset = 0;
  let allTransactions = [];
  let hasMore = true;
  
  while (hasMore) {
    const response = await fetch(
      `/api/transactions?limit=${limit}&offset=${offset}`
    );
    const data = await response.json();
    
    allTransactions = allTransactions.concat(data.data);
    hasMore = data.pagination.has_more;
    offset += limit;
  }
  
  return allTransactions;
}
```

### 3. Filtering and Searching

Combine filters for precise queries:

```javascript
const params = new URLSearchParams({
  category: 'avanta',
  type: 'gasto',
  is_deductible: 'true',
  date_from: '2024-01-01',
  date_to: '2024-12-31',
  search: 'hosting',
  sort_by: 'amount',
  sort_order: 'desc',
  include_stats: 'true'
});

const response = await fetch(`/api/transactions?${params}`);
```

### 4. Validation

Always validate input before sending:

```javascript
function validateTransaction(data) {
  const errors = [];
  
  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push('Invalid date format');
  }
  
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }
  
  if (!data.amount || data.amount <= 0) {
    errors.push('Amount must be positive');
  }
  
  return errors.length > 0 ? errors : null;
}
```

---

## Support

For issues or questions:

1. Check the [README.md](README.md) for general information
2. Review the [DEPLOYMENT.md](DEPLOYMENT.md) for deployment issues
3. See [TESTING.md](TESTING.md) for testing guidelines
4. Open an issue on GitHub

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-10-14 | Initial API release with all endpoints |

---

Built with ❤️ for Avanta Design
