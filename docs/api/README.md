# Avanta Coinmaster API Documentation

Complete API documentation for the Avanta Coinmaster financial management platform.

## 📚 Documentation Index

### Getting Started
- **[Quick Start Guide](#quick-start)** - Get up and running in 5 minutes
- **[API Guide](API_GUIDE.md)** - Comprehensive developer guide (50+ pages)
- **[Interactive Documentation](index.html)** - Swagger UI with try-it-out functionality

### Code Examples
- **[JavaScript SDK](examples/javascript-sdk.js)** - Ready-to-use SDK
- **[cURL Examples](CURL_EXAMPLES.md)** - Command-line examples
- **[Postman Collection](postman-collection.json)** - Import into Postman

### Reference
- **[OpenAPI Specification](openapi.yaml)** - Complete API spec (OpenAPI 3.0)
- **[Error Codes](#error-codes)** - Common error codes and solutions
- **[Rate Limits](#rate-limits)** - API rate limiting information

## Quick Start

### 1. Register an Account

```bash
curl -X POST https://avanta-coinmaster.pages.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "YourSecurePassword123!",
    "name": "Your Name"
  }'
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1729584000000_abc123",
    "email": "your@email.com",
    "name": "Your Name",
    "role": "user"
  }
}
```

### 2. Save Your Token

The `token` from the response is your API key. Include it in all subsequent requests:

```bash
export TOKEN="your_token_here"
```

### 3. Make Your First Request

```bash
curl https://avanta-coinmaster.pages.dev/api/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Create a Transaction

```bash
curl -X POST https://avanta-coinmaster.pages.dev/api/transactions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "amount": "1234.56",
    "date": "2025-10-22",
    "description": "Office supplies",
    "is_deductible": true
  }'
```

## 🔐 Authentication

All API endpoints require authentication using JWT tokens (except `/api/auth/*` and `/api/health`).

### How It Works

1. **Register** or **Login** to get a JWT token
2. Include the token in the `Authorization` header: `Bearer YOUR_TOKEN`
3. Tokens expire after 24 hours - use `/api/auth/refresh` to get a new one

### Example

```javascript
const response = await fetch('https://avanta-coinmaster.pages.dev/api/transactions', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN_HERE',
    'Content-Type': 'application/json'
  }
});
```

## 📊 API Endpoints

### Core Endpoints

| Category | Endpoints | Description |
|----------|-----------|-------------|
| **Authentication** | 5 | User registration, login, token management |
| **Transactions** | 12 | Financial transaction CRUD operations |
| **Accounts** | 8 | Bank account management |
| **Categories** | 6 | Transaction categories |
| **Tax Calculations** | 10 | ISR/IVA tax calculations |
| **Invoices** | 15 | CFDI invoice management |
| **Dashboard** | 2 | Analytics and summaries |
| **Health** | 3 | System health monitoring |

**Total: 78+ endpoints**

### Popular Endpoints

- `POST /api/auth/login` - User login
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/dashboard` - Get dashboard data
- `POST /api/tax-calculations` - Calculate taxes
- `GET /api/health` - Health check

## 🎯 Common Use Cases

### Transaction Management

```javascript
// List transactions with filters
const transactions = await fetch(
  'https://avanta-coinmaster.pages.dev/api/transactions?type=expense&start_date=2025-01-01',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

// Create a transaction
const newTransaction = await fetch(
  'https://avanta-coinmaster.pages.dev/api/transactions',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      type: 'expense',
      amount: '1234.56',
      date: '2025-10-22',
      description: 'Office supplies'
    })
  }
).then(r => r.json());
```

### Tax Calculations

```javascript
// Calculate monthly taxes
const taxes = await fetch(
  'https://avanta-coinmaster.pages.dev/api/tax-calculations',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      period_type: 'monthly',
      period_year: 2025,
      period_month: 10
    })
  }
).then(r => r.json());

console.log('ISR:', taxes.isr_amount);
console.log('IVA Balance:', taxes.iva_balance);
```

### Dashboard Data

```javascript
// Get comprehensive dashboard data
const dashboard = await fetch(
  'https://avanta-coinmaster.pages.dev/api/dashboard',
  { headers: { 'Authorization': `Bearer ${token}` } }
).then(r => r.json());

console.log('Total Balance:', dashboard.totalBalance);
console.log('Monthly Income:', dashboard.totalIncome);
console.log('Monthly Expenses:', dashboard.totalExpenses);
```

## Error Codes

| Code | HTTP Status | Description | Solution |
|------|-------------|-------------|----------|
| `AUTH_REQUIRED` | 401 | Missing/invalid token | Include valid Bearer token |
| `VALIDATION_ERROR` | 400 | Invalid request data | Check request body format |
| `NOT_FOUND` | 404 | Resource not found | Verify resource ID |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests | Wait and retry |
| `DB_ERROR` | 500 | Database error | Retry or contact support |

### Error Response Format

```json
{
  "error": "Validation failed",
  "message": "The 'amount' field must be a positive number",
  "code": "VALIDATION_ERROR",
  "timestamp": "2025-10-22T08:00:00.000Z"
}
```

## Rate Limits

| Operation Type | Limit | Window |
|----------------|-------|--------|
| Authentication | 10 requests | per minute |
| Read Operations | 1000 requests | per hour |
| Write Operations | 100 requests | per hour |

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1729584000
```

## 📦 SDKs & Tools

### JavaScript/TypeScript SDK

```javascript
import AvantaClient from './javascript-sdk.js';

const client = new AvantaClient({
  baseURL: 'https://avanta-coinmaster.pages.dev'
});

await client.auth.login('user@example.com', 'password');
const transactions = await client.transactions.list();
```

### Postman Collection

1. Download [postman-collection.json](postman-collection.json)
2. Import into Postman
3. Set environment variables:
   - `baseURL`: `https://avanta-coinmaster.pages.dev`
   - `token`: Your JWT token

### OpenAPI/Swagger

- **Spec File**: [openapi.yaml](openapi.yaml)
- **Interactive Docs**: [index.html](index.html)
- Use with Swagger UI, Redoc, or any OpenAPI-compatible tool

## 🌐 Base URLs

- **Production**: `https://avanta-coinmaster.pages.dev`
- **Local Development**: `http://localhost:8788`

## 💡 Best Practices

### 1. Security
- ✅ Always use HTTPS in production
- ✅ Store tokens securely (never in localStorage)
- ✅ Implement token refresh before expiry
- ✅ Never commit tokens to version control

### 2. Performance
- ✅ Cache responses when appropriate
- ✅ Use pagination for large datasets
- ✅ Implement request debouncing
- ✅ Use bulk operations when possible

### 3. Error Handling
- ✅ Always check HTTP status codes
- ✅ Implement retry logic with exponential backoff
- ✅ Handle token expiration gracefully
- ✅ Provide user-friendly error messages

### 4. Data Management
- ✅ Use decimal strings for monetary values
- ✅ Use ISO 8601 for dates
- ✅ Validate data before sending
- ✅ Handle null/undefined values

## 🔧 Troubleshooting

### Common Issues

**401 Unauthorized**
- Check token is included in `Authorization` header
- Verify token hasn't expired (24-hour lifetime)
- Try refreshing the token or logging in again

**400 Validation Error**
- Review request body matches API schema
- Ensure all required fields are present
- Verify data types are correct

**429 Rate Limit**
- Implement exponential backoff
- Cache responses when possible
- Monitor rate limit headers

**500 Server Error**
- Retry the request (may be temporary)
- Check API health: `GET /api/health`
- Contact support if persists

## 📞 Support

- **Documentation**: This repository
- **API Status**: `GET https://avanta-coinmaster.pages.dev/api/health`
- **Issues**: GitHub Issues
- **Email**: support@avanta-coinmaster.com

## 📄 License

MIT License - see [LICENSE](../../LICENSE) file for details

## 🗂️ File Structure

```
docs/api/
├── README.md                    # This file
├── API_GUIDE.md                 # Comprehensive developer guide
├── CURL_EXAMPLES.md             # cURL command examples
├── openapi.yaml                 # OpenAPI 3.0 specification
├── postman-collection.json      # Postman collection
├── index.html                   # Interactive Swagger UI
└── examples/
    └── javascript-sdk.js        # JavaScript/TypeScript SDK
```

## 🚀 Next Steps

1. **Read the [API Guide](API_GUIDE.md)** for comprehensive documentation
2. **Try the [Interactive Documentation](index.html)** with Swagger UI
3. **Import the [Postman Collection](postman-collection.json)** for easy testing
4. **Use the [JavaScript SDK](examples/javascript-sdk.js)** for quick integration
5. **Check [cURL Examples](CURL_EXAMPLES.md)** for command-line usage

---

**Last Updated**: October 2025  
**API Version**: 1.0.0  
**Total Endpoints**: 78+
