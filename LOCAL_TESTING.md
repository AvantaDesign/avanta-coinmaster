# Local API Testing Guide

This guide explains how to test the Cloudflare Workers API endpoints locally using Wrangler.

**Important:** As of October 2025, the mock data system has been deprecated. All testing now uses real Cloudflare Workers backend with D1 database. This ensures consistency between development and production environments.

## Prerequisites

1. **Install Wrangler CLI** (if not already installed):
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare** (first time only):
   ```bash
   wrangler login
   ```

3. **Create D1 Database** (if not exists):
   ```bash
   wrangler d1 create avanta-finance
   ```
   
   Update the `database_id` in `wrangler.toml` with the output from this command.

4. **Run Database Migrations**:
   ```bash
   wrangler d1 execute avanta-finance --file=schema.sql
   ```

5. **Load Seed Data** (optional, for testing):
   ```bash
   wrangler d1 execute avanta-finance --file=seed.sql
   ```

6. **Create R2 Bucket** (if not exists):
   ```bash
   wrangler r2 bucket create avanta-receipts
   ```

## Testing Methods

### Method 1: Wrangler Pages Dev (Recommended)

This method runs both the frontend and API endpoints together.

```bash
# Build the frontend first
npm run build

# Start the Wrangler dev server with bindings
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788
```

The application will be available at: `http://localhost:8788`

**API Endpoints:**
- Dashboard: http://localhost:8788/api/dashboard
- Transactions: http://localhost:8788/api/transactions
- Accounts: http://localhost:8788/api/accounts
- Fiscal: http://localhost:8788/api/fiscal
- Invoices: http://localhost:8788/api/invoices
- Upload: http://localhost:8788/api/upload

### Method 2: Local D1 Database (Alternative)

Use a local SQLite database for faster development:

```bash
# Create local database
wrangler d1 execute avanta-finance --local --file=schema.sql

# Start dev server with local database
npx wrangler pages dev dist --d1 DB=avanta-finance --local --r2 RECEIPTS=avanta-receipts --port 8788
```

### Method 3: Frontend Separate (DEPRECATED - Not Recommended)

**Note:** This method is no longer recommended since the mock data system was removed. The frontend requires the real backend API to function.

~~Run frontend and Workers separately:~~

For development, use Method 1 (Wrangler Pages Dev) instead.

## Running the Test Script

### Basic Usage

```bash
# Make the script executable (first time only)
chmod +x test-api.sh

# Test local Wrangler server
./test-api.sh http://localhost:8788
```

### Example Output

```
============================================================================
Avanta Finance API Testing
============================================================================

Base URL: http://localhost:8788
Date: Mon Oct 14 10:30:00 UTC 2024

============================================================================
1. Dashboard API Tests
============================================================================

Testing: Get dashboard summary
  HTTP Status: 200
  Response:
    {
      "timestamp": "2024-10-14T10:30:00.000Z",
      "period": "month",
      "totalBalance": 45000.00,
      ...
    }
✓ PASSED: Dashboard endpoint accessible

...

============================================================================
Test Results Summary
============================================================================

Total Tests: 42
Passed: 42
Failed: 0

✓ All tests passed!
```

## Manual Testing with curl

### Dashboard API

```bash
# Basic dashboard
curl "http://localhost:8788/api/dashboard"

# Dashboard with all options
curl "http://localhost:8788/api/dashboard?period=year&include_categories=true&include_accounts=true&include_trends=true&recent_limit=20"
```

### Transactions API

```bash
# List all transactions
curl "http://localhost:8788/api/transactions"

# List with filters
curl "http://localhost:8788/api/transactions?category=avanta&type=gasto&limit=10"

# Search transactions
curl "http://localhost:8788/api/transactions?search=hosting"

# Get single transaction
curl "http://localhost:8788/api/transactions/1"

# Create transaction
curl -X POST "http://localhost:8788/api/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-10-14",
    "description": "Test Transaction",
    "amount": 1500.00,
    "type": "ingreso",
    "category": "avanta",
    "account": "BBVA Cuenta"
  }'

# Update transaction
curl -X PUT "http://localhost:8788/api/transactions/1" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1800.00
  }'

# Delete transaction (requires confirmation)
curl -X DELETE "http://localhost:8788/api/transactions/1?confirm=true"
```

### Accounts API

```bash
# List accounts
curl "http://localhost:8788/api/accounts"

# Update account balance
curl -X PUT "http://localhost:8788/api/accounts/1" \
  -H "Content-Type: application/json" \
  -d '{
    "balance": 25000.00
  }'
```

### Fiscal API

```bash
# Get current month taxes
curl "http://localhost:8788/api/fiscal"

# Get specific month
curl "http://localhost:8788/api/fiscal?month=10&year=2024"
```

### Invoices API

```bash
# List invoices
curl "http://localhost:8788/api/invoices"

# Create invoice
curl -X POST "http://localhost:8788/api/invoices" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "12345678-ABCD-1234-ABCD-123456789012",
    "rfc_emisor": "XAXX010101000",
    "rfc_receptor": "REYM850101ABC",
    "date": "2024-10-14",
    "subtotal": 8620.69,
    "iva": 1379.31,
    "total": 10000.00
  }'
```

### Upload API

```bash
# Upload a file
curl -X POST "http://localhost:8788/api/upload" \
  -F "file=@/path/to/receipt.pdf"
```

## Testing with Postman

1. **Import Collection:**
   - Create a new collection called "Avanta Finance API"
   - Add environment variable: `base_url` = `http://localhost:8788`

2. **Add Requests:**
   - Copy the curl examples above
   - Import them into Postman using "Import" → "Raw Text" → paste curl command

3. **Run Tests:**
   - Execute individual requests
   - Or create a Collection Runner to test all endpoints

## Testing with HTTPie (Alternative to curl)

If you prefer HTTPie for prettier output:

```bash
# Install HTTPie
brew install httpie  # macOS
apt-get install httpie  # Ubuntu

# Examples
http GET http://localhost:8788/api/dashboard
http GET http://localhost:8788/api/transactions category==avanta
http POST http://localhost:8788/api/transactions date=2024-10-14 description="Test" amount:=1500 type=ingreso category=avanta
```

## Debugging

### View Wrangler Logs

Wrangler displays logs in real-time. Look for:
- Request URLs
- HTTP status codes
- Error messages
- Console.log outputs

### Check Database Contents

```bash
# List all transactions
wrangler d1 execute avanta-finance --command="SELECT * FROM transactions LIMIT 10"

# Count transactions
wrangler d1 execute avanta-finance --command="SELECT COUNT(*) FROM transactions"

# Check accounts
wrangler d1 execute avanta-finance --command="SELECT * FROM accounts"
```

### Check R2 Bucket

```bash
# List uploaded files
wrangler r2 object list avanta-receipts

# Download a file
wrangler r2 object get avanta-receipts/filename.pdf --file=downloaded.pdf
```

### Common Issues

#### Database Not Found
```bash
# Verify database exists
wrangler d1 list

# Verify database_id in wrangler.toml matches
```

#### Binding Errors
```bash
# Make sure you specify bindings in the dev command
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts
```

#### Port Already in Use
```bash
# Use a different port
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8789
```

#### CORS Errors (when testing from frontend)
- Ensure both frontend and API are on the same origin, or
- Use the Wrangler dev server for both (Method 1)

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install Apache Bench
brew install httpd  # macOS
apt-get install apache2-utils  # Ubuntu

# Test dashboard endpoint
ab -n 100 -c 10 http://localhost:8788/api/dashboard

# Test transactions list
ab -n 100 -c 10 http://localhost:8788/api/transactions
```

### Load Testing with wrk

```bash
# Install wrk
brew install wrk  # macOS

# Test for 30 seconds with 10 connections
wrk -t10 -c10 -d30s http://localhost:8788/api/dashboard
```

## Next Steps

1. ✅ Test all endpoints locally
2. ✅ Verify validation works correctly
3. ✅ Check CORS headers
4. ✅ Test error handling
5. ✅ Verify database operations
6. ✅ Test file uploads
7. 🚀 Deploy to production

## Production Testing

Once deployed to Cloudflare Pages:

```bash
# Update test script URL
./test-api.sh https://your-project.pages.dev

# Or test manually
curl "https://your-project.pages.dev/api/dashboard"
```

## Continuous Testing

Add the test script to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Test API
  run: |
    npm install
    npm run build
    npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788 &
    sleep 10
    ./test-api.sh http://localhost:8788
```

---

For more information, see:
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - Complete API reference
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions
- [TESTING.md](TESTING.md) - General testing checklist
