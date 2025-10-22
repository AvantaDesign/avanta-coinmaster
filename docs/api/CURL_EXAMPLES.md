# Avanta Coinmaster API - cURL Examples

Quick reference for all common API operations using cURL.

## Setup

Set your base URL and token as environment variables:

```bash
export BASE_URL="https://avanta-coinmaster.pages.dev"
export TOKEN="your_jwt_token_here"
```

## Authentication

### Register New User
```bash
curl -X POST "${BASE_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "password": "SecurePass123!",
    "name": "Developer Account"
  }'
```

### Login
```bash
curl -X POST "${BASE_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@example.com",
    "password": "SecurePass123!"
  }' | jq -r '.token' > token.txt

# Save token to environment
export TOKEN=$(cat token.txt)
```

### Get Current User
```bash
curl "${BASE_URL}/api/auth/me" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Refresh Token
```bash
curl -X POST "${BASE_URL}/api/auth/refresh" \
  -H "Authorization: Bearer ${TOKEN}"
```

## Health Check

### System Health
```bash
curl "${BASE_URL}/api/health"
```

## Transactions

### List Transactions
```bash
# Basic list
curl "${BASE_URL}/api/transactions" \
  -H "Authorization: Bearer ${TOKEN}"

# With filters
curl "${BASE_URL}/api/transactions?type=expense&limit=50&start_date=2025-01-01&end_date=2025-12-31" \
  -H "Authorization: Bearer ${TOKEN}"

# With search
curl "${BASE_URL}/api/transactions?search=office&sort=date&order=desc" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Create Transaction
```bash
curl -X POST "${BASE_URL}/api/transactions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "amount": "1234.56",
    "date": "2025-10-22",
    "description": "Office supplies purchase",
    "is_deductible": true,
    "iva_amount": "197.53",
    "notes": "Invoice #12345"
  }'
```

### Get Single Transaction
```bash
curl "${BASE_URL}/api/transactions/txn_123456" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Update Transaction
```bash
curl -X PUT "${BASE_URL}/api/transactions/txn_123456" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated office supplies",
    "amount": "1500.00"
  }'
```

### Delete Transaction
```bash
curl -X DELETE "${BASE_URL}/api/transactions/txn_123456" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Get Transaction Statistics
```bash
curl "${BASE_URL}/api/transactions/stats?start_date=2025-10-01&end_date=2025-10-31" \
  -H "Authorization: Bearer ${TOKEN}"
```

## Accounts

### List Accounts
```bash
curl "${BASE_URL}/api/accounts" \
  -H "Authorization: Bearer ${TOKEN}"

# Filter by active status
curl "${BASE_URL}/api/accounts?is_active=true" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Create Account
```bash
curl -X POST "${BASE_URL}/api/accounts" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Checking Account",
    "type": "checking",
    "currency": "MXN",
    "initial_balance": "10000.00",
    "bank_name": "BBVA México",
    "account_number": "1234",
    "color": "#0066CC"
  }'
```

### Get Account
```bash
curl "${BASE_URL}/api/accounts/acc_123456" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Update Account
```bash
curl -X PUT "${BASE_URL}/api/accounts/acc_123456" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Account Name",
    "color": "#FF6600"
  }'
```

### Delete Account
```bash
curl -X DELETE "${BASE_URL}/api/accounts/acc_123456" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Get Account Balance
```bash
curl "${BASE_URL}/api/accounts/acc_123456/balance" \
  -H "Authorization: Bearer ${TOKEN}"
```

## Categories

### List Categories
```bash
curl "${BASE_URL}/api/categories" \
  -H "Authorization: Bearer ${TOKEN}"

# Filter by type
curl "${BASE_URL}/api/categories?type=expense" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Create Category
```bash
curl -X POST "${BASE_URL}/api/categories" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Office Expenses",
    "type": "expense",
    "is_deductible": true,
    "deduction_percentage": 100,
    "color": "#4CAF50",
    "icon": "briefcase"
  }'
```

### Get Category
```bash
curl "${BASE_URL}/api/categories/cat_123456" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Update Category
```bash
curl -X PUT "${BASE_URL}/api/categories/cat_123456" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Category Name",
    "deduction_percentage": 80
  }'
```

### Delete Category
```bash
curl -X DELETE "${BASE_URL}/api/categories/cat_123456" \
  -H "Authorization: Bearer ${TOKEN}"
```

## Tax Calculations

### List Tax Calculations
```bash
curl "${BASE_URL}/api/tax-calculations" \
  -H "Authorization: Bearer ${TOKEN}"

# Filter by year and month
curl "${BASE_URL}/api/tax-calculations?year=2025&month=10" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Calculate Taxes
```bash
curl -X POST "${BASE_URL}/api/tax-calculations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "period_type": "monthly",
    "period_year": 2025,
    "period_month": 10
  }'
```

### Get Tax Calculation
```bash
curl "${BASE_URL}/api/tax-calculations/tax_123456" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Simulate Taxes
```bash
curl -X POST "${BASE_URL}/api/tax-calculations/simulate" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "period_type": "monthly",
    "period_year": 2025,
    "period_month": 10,
    "estimated_income": "50000.00",
    "estimated_expenses": "15000.00"
  }'
```

## Dashboard

### Get Dashboard Data
```bash
curl "${BASE_URL}/api/dashboard" \
  -H "Authorization: Bearer ${TOKEN}"
```

## Invoices (CFDI)

### List Invoices
```bash
curl "${BASE_URL}/api/invoices" \
  -H "Authorization: Bearer ${TOKEN}"

# With filters
curl "${BASE_URL}/api/invoices?status=active&start_date=2025-01-01" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Create Invoice
```bash
curl -X POST "${BASE_URL}/api/invoices" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "folio": "A-001",
    "client_name": "Cliente SA de CV",
    "client_rfc": "ABC123456789",
    "subtotal": "10000.00",
    "iva": "1600.00",
    "total": "11600.00",
    "issue_date": "2025-10-22",
    "status": "active"
  }'
```

## Bank Reconciliation

### List Reconciliations
```bash
curl "${BASE_URL}/api/bank-reconciliation" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Start Reconciliation
```bash
curl -X POST "${BASE_URL}/api/bank-reconciliation" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "acc_123456",
    "period_start": "2025-10-01",
    "period_end": "2025-10-31"
  }'
```

## Reports

### Generate Financial Report
```bash
curl -X POST "${BASE_URL}/api/reports" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "report_type": "income_statement",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31"
  }'
```

### Export Data
```bash
# Export transactions to CSV
curl "${BASE_URL}/api/transactions/export?format=csv&start_date=2025-01-01&end_date=2025-12-31" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o transactions.csv
```

## Settings

### Get User Settings
```bash
curl "${BASE_URL}/api/settings" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Update Settings
```bash
curl -X PUT "${BASE_URL}/api/settings" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "MXN",
    "timezone": "America/Mexico_City",
    "language": "es"
  }'
```

## Advanced Examples

### Pagination - Get All Transactions
```bash
#!/bin/bash
OFFSET=0
LIMIT=100
HAS_MORE=true

while [ "$HAS_MORE" = "true" ]; do
  RESPONSE=$(curl -s "${BASE_URL}/api/transactions?limit=${LIMIT}&offset=${OFFSET}" \
    -H "Authorization: Bearer ${TOKEN}")
  
  echo "$RESPONSE" | jq -r '.data[]'
  
  HAS_MORE=$(echo "$RESPONSE" | jq -r '.pagination.hasMore')
  OFFSET=$((OFFSET + LIMIT))
done
```

### Rate Limit Check
```bash
curl -i "${BASE_URL}/api/transactions" \
  -H "Authorization: Bearer ${TOKEN}" \
  | grep -i "X-RateLimit"
```

### Bulk Operations
```bash
# Bulk create transactions
curl -X POST "${BASE_URL}/api/transactions/bulk" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "transactions": [
      {
        "type": "expense",
        "amount": "100.00",
        "date": "2025-10-01",
        "description": "Transaction 1"
      },
      {
        "type": "expense",
        "amount": "200.00",
        "date": "2025-10-02",
        "description": "Transaction 2"
      }
    ]
  }'
```

### Error Handling
```bash
# Capture HTTP status code
HTTP_STATUS=$(curl -s -o response.json -w "%{http_code}" \
  "${BASE_URL}/api/transactions" \
  -H "Authorization: Bearer ${TOKEN}")

if [ $HTTP_STATUS -eq 200 ]; then
  echo "Success!"
  cat response.json | jq
elif [ $HTTP_STATUS -eq 401 ]; then
  echo "Unauthorized - check your token"
elif [ $HTTP_STATUS -eq 429 ]; then
  echo "Rate limit exceeded"
  RETRY_AFTER=$(cat response.json | jq -r '.retry_after')
  echo "Retry after ${RETRY_AFTER} seconds"
else
  echo "Error: HTTP ${HTTP_STATUS}"
  cat response.json | jq
fi
```

## Tips & Tricks

### Pretty Print JSON
```bash
curl "${BASE_URL}/api/dashboard" \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq '.'
```

### Save Response to File
```bash
curl "${BASE_URL}/api/transactions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -o transactions.json
```

### Verbose Output
```bash
curl -v "${BASE_URL}/api/health"
```

### Include Response Headers
```bash
curl -i "${BASE_URL}/api/dashboard" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Silent Mode (No Progress)
```bash
curl -s "${BASE_URL}/api/health" | jq '.'
```

### Follow Redirects
```bash
curl -L "${BASE_URL}/api/dashboard" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Set Timeout
```bash
curl --max-time 30 "${BASE_URL}/api/transactions" \
  -H "Authorization: Bearer ${TOKEN}"
```

---

**Note**: These examples use `jq` for JSON parsing. Install it with:
- macOS: `brew install jq`
- Ubuntu/Debian: `sudo apt-get install jq`
- Windows: Download from https://stedolan.github.io/jq/
