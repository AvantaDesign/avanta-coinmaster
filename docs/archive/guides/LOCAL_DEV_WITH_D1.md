# Local Development with D1 Database

Complete guide for developing Avanta Finance locally with Cloudflare D1 database.

## Overview

This guide covers setting up and working with D1 database during local development. It includes setup, testing, debugging, and best practices.

## Prerequisites

- Node.js 18+ installed
- Wrangler CLI installed (`npm install -g wrangler`)
- Cloudflare account (free tier works)
- Git (for version control)

## Initial Setup

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/AvantaDesign/avanta-coinmaster.git
cd avanta-coinmaster

# Install dependencies
npm install

# Install Wrangler globally (if not done)
npm install -g wrangler
```

### 2. Authenticate with Cloudflare

```bash
# Login to Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

### 3. Create D1 Database

**Option A: Automated Setup (Recommended)**

```bash
# Make script executable
chmod +x test-d1-database.sh

# Run automated setup
./test-d1-database.sh setup
```

This will:
- Create the D1 database
- Run schema migrations
- Display the database ID
- Verify table structure

**Option B: Manual Setup**

```bash
# Create database
wrangler d1 create avanta-finance

# Copy the database_id from output
# Update wrangler.toml with the ID

# Run migrations
wrangler d1 execute avanta-finance --file=schema.sql

# Verify tables created
wrangler d1 execute avanta-finance --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### 4. Update Configuration

Edit `wrangler.toml` and replace the placeholder database_id:

```toml
[[d1_databases]]
binding = "DB"
database_name = "avanta-finance"
database_id = "your-actual-database-id-here"  # Replace this
```

### 5. Load Sample Data

```bash
# Using automation script
./test-d1-database.sh seed

# Or manually
wrangler d1 execute avanta-finance --file=seed.sql
```

### 6. Verify Setup

```bash
# Verify database structure
./test-d1-database.sh verify

# Check data loaded
wrangler d1 execute avanta-finance --command="SELECT COUNT(*) FROM transactions"
```

## Development Workflow

### Starting the Dev Server

There are two modes for local development:

#### Mode 1: Frontend Only (Quick Preview)

```bash
# Start Vite dev server
npm run dev
```

- Opens at `http://localhost:5173`
- Fast hot reload for frontend changes
- Uses mock data (no D1 connection)
- Good for UI/UX work

#### Mode 2: Full Stack with D1 (Recommended for Testing)

```bash
# Build frontend
npm run build

# Start Wrangler with D1 and R2 bindings
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788
```

- Opens at `http://localhost:8788`
- Full API functionality with D1
- R2 storage for file uploads
- Simulates production environment
- Required for testing database operations

### Development Commands

```bash
# Build frontend
npm run build

# Start frontend dev server (no D1)
npm run dev

# Start full stack with D1
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788

# Run D1 tests
./test-d1-database.sh test

# Run API tests
./test-api.sh http://localhost:8788
```

## Working with D1 Database

### Common Development Tasks

#### 1. Query Data While Developing

```bash
# Check recent transactions
wrangler d1 execute avanta-finance --command="SELECT * FROM transactions ORDER BY date DESC LIMIT 5"

# View account balances
wrangler d1 execute avanta-finance --command="SELECT * FROM accounts"

# Check fiscal data
wrangler d1 execute avanta-finance --command="SELECT * FROM fiscal_payments"
```

#### 2. Add Test Data

```bash
# Add a test transaction
wrangler d1 execute avanta-finance --command="
INSERT INTO transactions (date, description, amount, type, category, is_deductible)
VALUES ('2025-10-14', 'Development Test', 1000.00, 'gasto', 'avanta', 1)
"

# Verify it was added
wrangler d1 execute avanta-finance --command="SELECT * FROM transactions WHERE description = 'Development Test'"
```

#### 3. Clean Up Test Data

```bash
# Delete test transactions
wrangler d1 execute avanta-finance --command="
DELETE FROM transactions WHERE description LIKE '%Test%' OR description LIKE '%test%'
"

# Reset to original seed data
wrangler d1 execute avanta-finance --file=seed.sql
```

#### 4. Reset Database

```bash
# Drop all tables (WARNING: deletes all data)
wrangler d1 execute avanta-finance --command="
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS fiscal_payments;
"

# Recreate schema
wrangler d1 execute avanta-finance --file=schema.sql

# Load seed data
wrangler d1 execute avanta-finance --file=seed.sql
```

### Testing API Endpoints

#### Manual Testing with curl

```bash
# Make sure dev server is running with D1
# npx wrangler pages dev dist --d1 DB=avanta-finance --port 8788

# Test dashboard
curl http://localhost:8788/api/dashboard | jq .

# Test transactions list
curl http://localhost:8788/api/transactions | jq .

# Test specific transaction
curl http://localhost:8788/api/transactions/1 | jq .

# Create new transaction
curl -X POST http://localhost:8788/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-14",
    "description": "Test from curl",
    "amount": 500,
    "type": "gasto",
    "category": "avanta",
    "is_deductible": true
  }' | jq .

# Update transaction
curl -X PUT http://localhost:8788/api/transactions/1 \
  -H "Content-Type: application/json" \
  -d '{"amount": 1500}' | jq .

# Delete transaction
curl -X DELETE "http://localhost:8788/api/transactions/1?confirm=true" | jq .
```

#### Automated Testing

```bash
# Run comprehensive API tests
./test-api.sh http://localhost:8788
```

## Debugging

### Enable Debug Logs

In `wrangler.toml`, set:

```toml
[vars]
ENABLE_DEBUG_LOGS = "true"
```

Then restart the dev server.

### View Logs

```bash
# Wrangler shows logs in the terminal
# Watch for:
# - SQL queries being executed
# - Error messages
# - Request/response data

# Check browser console (F12) for frontend errors
```

### Common Issues and Solutions

#### Issue: "Database not found"

```bash
# Check if database exists
wrangler d1 list

# Verify database name in wrangler.toml matches
# Create if missing
wrangler d1 create avanta-finance
```

#### Issue: "Table does not exist"

```bash
# Run migrations
wrangler d1 execute avanta-finance --file=schema.sql

# Verify tables
wrangler d1 execute avanta-finance --command="SELECT name FROM sqlite_master WHERE type='table'"
```

#### Issue: "No data returned"

```bash
# Check if data exists
wrangler d1 execute avanta-finance --command="SELECT COUNT(*) FROM transactions"

# If zero, load seed data
./test-d1-database.sh seed
```

#### Issue: API returns 503

This means the D1 binding is not available. Check:

1. Is dev server running with `--d1 DB=avanta-finance`?
2. Is `wrangler.toml` configured correctly?
3. Does the database exist? (`wrangler d1 list`)

```bash
# Correct dev server command
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788
```

#### Issue: CORS errors

CORS is already configured in all API endpoints. If you see CORS errors:

1. Check browser console for exact error
2. Verify API is returning correct headers
3. Restart dev server

### Database Schema Changes

When you modify `schema.sql`:

```bash
# 1. Backup current data
./test-d1-database.sh backup

# 2. Drop existing tables
wrangler d1 execute avanta-finance --command="DROP TABLE IF EXISTS transactions"
# Repeat for other tables if needed

# 3. Apply new schema
wrangler d1 execute avanta-finance --file=schema.sql

# 4. Restore data or reload seed
./test-d1-database.sh seed
```

## Development Best Practices

### 1. Always Use Test Data

- Use seed.sql for consistent test data
- Don't rely on production data locally
- Clean up test records regularly

### 2. Test Database Operations

Before committing API changes:

```bash
# Run D1 tests
./test-d1-database.sh test

# Run API tests
./test-api.sh http://localhost:8788

# Test in browser
# Open http://localhost:8788
```

### 3. Keep Schema Updated

- Update schema.sql for any table changes
- Document changes in comments
- Test migrations before committing

### 4. Use Prepared Statements

Always use prepared statements in API code (already implemented):

```javascript
// Good ✓
await env.DB.prepare('SELECT * FROM transactions WHERE id = ?')
  .bind(id)
  .first();

// Bad ✗ (SQL injection risk)
await env.DB.prepare(`SELECT * FROM transactions WHERE id = ${id}`)
  .first();
```

### 5. Handle Errors Gracefully

All API endpoints should handle D1 errors:

```javascript
try {
  const result = await env.DB.prepare('SELECT * FROM transactions').all();
  return new Response(JSON.stringify(result.results), { status: 200 });
} catch (error) {
  console.error('Database error:', error);
  return new Response(
    JSON.stringify({ error: 'Database error', message: error.message }), 
    { status: 500 }
  );
}
```

### 6. Test Edge Cases

- Empty database
- Invalid input
- Constraint violations
- Large datasets
- Concurrent operations

## Performance Optimization

### Use Indexes

Indexes are already configured in schema.sql:

```sql
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_type ON transactions(type);
```

### Verify Index Usage

```bash
wrangler d1 execute avanta-finance --command="
EXPLAIN QUERY PLAN
SELECT * FROM transactions WHERE date >= '2025-10-01'
"
# Should show: SEARCH transactions USING INDEX idx_transactions_date
```

### Optimize Queries

```javascript
// Good ✓ - Use indexes
SELECT * FROM transactions WHERE date >= ? ORDER BY date DESC LIMIT 10

// Good ✓ - Aggregate efficiently
SELECT SUM(amount) FROM transactions WHERE type = 'ingreso'

// Bad ✗ - Full table scan
SELECT * FROM transactions WHERE description LIKE '%test%'
```

## Hot Reload Workflow

For efficient development:

1. **Frontend changes (HTML, CSS, JS):**
   - Edit files in `src/`
   - Vite auto-reloads (if using `npm run dev`)
   - Or rebuild: `npm run build`

2. **API changes (functions/):**
   - Edit files in `functions/api/`
   - Restart Wrangler dev server
   - Test with curl or browser

3. **Database schema changes:**
   - Edit `schema.sql`
   - Drop and recreate tables
   - Reload seed data
   - Test thoroughly

## Collaboration

### Sharing Database State

To share your database state with team members:

```bash
# Export your database
wrangler d1 export avanta-finance --output=my-test-data.sql

# Share the SQL file
git add my-test-data.sql
git commit -m "Add test data for feature X"

# Team members can import
wrangler d1 execute avanta-finance --file=my-test-data.sql
```

### Environment Consistency

All developers should:
1. Use the same seed.sql
2. Have identical schema.sql
3. Use same Wrangler version
4. Follow same local setup steps

## Testing Checklist

Before committing code, verify:

- [ ] Frontend builds without errors
- [ ] Dev server starts successfully
- [ ] D1 database tests pass
- [ ] API tests pass
- [ ] Browser loads without errors
- [ ] CRUD operations work
- [ ] Fiscal calculations accurate
- [ ] Error handling works
- [ ] Performance acceptable

## Next Steps

After mastering local development:

1. **Learn Deployment:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
2. **Understand Architecture:** See [DEVELOPMENT.md](./DEVELOPMENT.md)
3. **API Reference:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
4. **Testing Guide:** See [D1_TESTING_GUIDE.md](./D1_TESTING_GUIDE.md)

## Quick Reference

```bash
# Start dev server with D1
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788

# Query database
wrangler d1 execute avanta-finance --command="SELECT * FROM transactions LIMIT 5"

# Run tests
./test-d1-database.sh test
./test-api.sh http://localhost:8788

# Reset database
./test-d1-database.sh setup
./test-d1-database.sh seed
```

## Support

For issues or questions:
- Check [D1_TESTING_GUIDE.md](./D1_TESTING_GUIDE.md)
- Check [DEPLOYMENT.md](./DEPLOYMENT.md)
- Open an issue on GitHub
- Check Cloudflare D1 docs

---

**Happy Developing!** 🚀
