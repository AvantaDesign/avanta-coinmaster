# D1 Database Testing Guide

This guide provides comprehensive instructions for setting up, testing, and verifying the Cloudflare D1 database for Avanta Finance.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Running Migrations](#running-migrations)
4. [Loading Sample Data](#loading-sample-data)
5. [Testing Database Operations](#testing-database-operations)
6. [Verifying Data Integrity](#verifying-data-integrity)
7. [Troubleshooting](#troubleshooting)
8. [Database Backup & Restore](#database-backup--restore)

---

## Prerequisites

### Required Tools

- **Node.js 18+** - JavaScript runtime
- **Wrangler CLI** - Cloudflare command-line tool
- **Cloudflare Account** - Free tier is sufficient

### Installation

```bash
# Install Wrangler globally
npm install -g wrangler

# Verify installation
wrangler --version

# Login to Cloudflare
wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

---

## Database Setup

### Automated Setup (Recommended)

Use the provided testing script for automated setup:

```bash
# Make script executable (first time only)
chmod +x test-d1-database.sh

# Run complete setup
./test-d1-database.sh setup
```

This will:
1. Create the D1 database
2. Run schema migrations
3. Verify table structure
4. Display the database ID to update in `wrangler.toml`

### Manual Setup

If you prefer manual setup:

#### Step 1: Create D1 Database

```bash
wrangler d1 create avanta-finance
```

Output will look like:
```
✅ Successfully created DB 'avanta-finance'
database_id = "abc123-def456-ghi789-012345"
```

#### Step 2: Update Configuration

Copy the `database_id` and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "avanta-finance"
database_id = "abc123-def456-ghi789-012345"  # Replace with your actual ID
```

#### Step 3: Verify Database

```bash
# List all databases
wrangler d1 list

# Should show avanta-finance in the list
```

---

## Running Migrations

### Apply Schema

Run the schema.sql file to create all tables:

```bash
wrangler d1 execute avanta-finance --file=schema.sql
```

### Verify Tables Created

```bash
wrangler d1 execute avanta-finance --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
```

Expected output:
- accounts
- fiscal_payments
- invoices
- transactions

### Verify Indexes

```bash
wrangler d1 execute avanta-finance --command="SELECT name FROM sqlite_master WHERE type='index' ORDER BY name"
```

Expected indexes:
- idx_transactions_date
- idx_transactions_category
- idx_transactions_type
- idx_invoices_date
- idx_fiscal_payments_year_month

---

## Loading Sample Data

### Load Seed Data

```bash
# Using the test script
./test-d1-database.sh seed

# Or manually
wrangler d1 execute avanta-finance --file=seed.sql
```

### Verify Data Loaded

```bash
# Check transaction count
wrangler d1 execute avanta-finance --command="SELECT COUNT(*) as count FROM transactions"

# Check account balances
wrangler d1 execute avanta-finance --command="SELECT * FROM accounts"

# View recent transactions
wrangler d1 execute avanta-finance --command="SELECT * FROM transactions ORDER BY date DESC LIMIT 5"
```

---

## Testing Database Operations

### Automated Testing

Run comprehensive database tests:

```bash
./test-d1-database.sh test
```

This tests:
- ✅ SELECT queries
- ✅ INSERT operations
- ✅ UPDATE operations
- ✅ DELETE operations
- ✅ Aggregations (SUM, COUNT)
- ✅ Date range queries
- ✅ Index performance
- ✅ Data constraints
- ✅ Foreign key behavior

### Manual CRUD Tests

#### Test 1: Create (INSERT)

```bash
wrangler d1 execute avanta-finance --command="
INSERT INTO transactions (date, description, amount, type, category, is_deductible)
VALUES ('2025-10-14', 'Test Transaction', 1000.00, 'gasto', 'avanta', 1)
"
```

#### Test 2: Read (SELECT)

```bash
# Simple query
wrangler d1 execute avanta-finance --command="SELECT * FROM transactions LIMIT 5"

# With filtering
wrangler d1 execute avanta-finance --command="
SELECT * FROM transactions 
WHERE category = 'avanta' 
AND type = 'ingreso'
ORDER BY date DESC
"

# With aggregation
wrangler d1 execute avanta-finance --command="
SELECT 
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
GROUP BY type
"
```

#### Test 3: Update (UPDATE)

```bash
wrangler d1 execute avanta-finance --command="
UPDATE transactions 
SET is_deductible = 1 
WHERE id = 1
"
```

#### Test 4: Delete (DELETE)

```bash
wrangler d1 execute avanta-finance --command="
DELETE FROM transactions 
WHERE description = 'Test Transaction'
"
```

### Test Fiscal Calculations

```bash
# Monthly income and expenses
wrangler d1 execute avanta-finance --command="
SELECT 
  SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END) as income,
  SUM(CASE WHEN type = 'gasto' AND is_deductible = 1 THEN amount ELSE 0 END) as deductible_expenses,
  SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END) as total_expenses
FROM transactions
WHERE date >= '2025-10-01' AND date <= '2025-10-31'
"
```

### Test Account Balances

```bash
# Total balance (banks - credit cards)
wrangler d1 execute avanta-finance --command="
SELECT 
  SUM(CASE WHEN type = 'banco' THEN balance ELSE -balance END) as total_balance
FROM accounts
"
```

### Test Invoice Queries

```bash
# Active invoices
wrangler d1 execute avanta-finance --command="
SELECT * FROM invoices 
WHERE status = 'active'
ORDER BY date DESC
"

# Invoice totals
wrangler d1 execute avanta-finance --command="
SELECT 
  COUNT(*) as count,
  SUM(total) as total_amount,
  SUM(iva) as total_iva
FROM invoices
WHERE status = 'active'
"
```

---

## Verifying Data Integrity

### Check Constraints

#### Type Constraint (should fail)
```bash
wrangler d1 execute avanta-finance --command="
INSERT INTO transactions (date, description, amount, type, category)
VALUES ('2025-10-14', 'Invalid', 100, 'invalid_type', 'personal')
"
# Expected: Error - constraint failed
```

#### Category Constraint (should fail)
```bash
wrangler d1 execute avanta-finance --command="
INSERT INTO transactions (date, description, amount, type, category)
VALUES ('2025-10-14', 'Invalid', 100, 'gasto', 'invalid_category')
"
# Expected: Error - constraint failed
```

#### Unique UUID Constraint (should fail on duplicate)
```bash
wrangler d1 execute avanta-finance --command="
INSERT INTO invoices (uuid, rfc_emisor, rfc_receptor, date, subtotal, iva, total)
VALUES ('12345678-1234-1234-1234-123456789012', 'TEST123', 'TEST456', '2025-10-14', 100, 16, 116)
"
# Expected: Error - UNIQUE constraint failed (if UUID already exists)
```

### Verify Index Usage

Check that date queries use indexes:

```bash
wrangler d1 execute avanta-finance --command="
EXPLAIN QUERY PLAN
SELECT * FROM transactions 
WHERE date >= '2025-10-01' AND date <= '2025-10-31'
"
# Should show: SEARCH transactions USING INDEX idx_transactions_date
```

---

## Troubleshooting

### Database Connection Issues

**Problem:** `Error: Database not found`

**Solution:**
```bash
# List databases
wrangler d1 list

# Verify the database name matches
# Check wrangler.toml has correct database_name and database_id
```

**Problem:** `Error: Cannot connect to D1`

**Solution:**
```bash
# Re-authenticate
wrangler login

# Verify authentication
wrangler whoami
```

### Migration Failures

**Problem:** `Error: table already exists`

**Solution:**
```bash
# Drop and recreate (WARNING: deletes all data)
wrangler d1 execute avanta-finance --command="DROP TABLE IF EXISTS transactions"
wrangler d1 execute avanta-finance --command="DROP TABLE IF EXISTS accounts"
wrangler d1 execute avanta-finance --command="DROP TABLE IF EXISTS invoices"
wrangler d1 execute avanta-finance --command="DROP TABLE IF EXISTS fiscal_payments"

# Rerun schema
wrangler d1 execute avanta-finance --file=schema.sql
```

### Data Issues

**Problem:** No data returned from queries

**Solution:**
```bash
# Check if tables exist
wrangler d1 execute avanta-finance --command="SELECT name FROM sqlite_master WHERE type='table'"

# Check row counts
wrangler d1 execute avanta-finance --command="SELECT COUNT(*) FROM transactions"

# If empty, reload seed data
./test-d1-database.sh seed
```

### Performance Issues

**Problem:** Slow queries

**Solution:**
```bash
# Verify indexes exist
wrangler d1 execute avanta-finance --command="SELECT name FROM sqlite_master WHERE type='index'"

# Analyze query plan
wrangler d1 execute avanta-finance --command="EXPLAIN QUERY PLAN SELECT * FROM transactions WHERE date >= '2025-01-01'"

# Recreate indexes if missing
wrangler d1 execute avanta-finance --file=schema.sql
```

---

## Database Backup & Restore

### Create Backup

```bash
# Using test script
./test-d1-database.sh backup

# Or manually with timestamp
wrangler d1 export avanta-finance --output="backup_$(date +%Y%m%d_%H%M%S).sql"
```

### Restore from Backup

```bash
# Restore data
wrangler d1 execute avanta-finance --file=backup_20251014_120000.sql
```

### Scheduled Backups

Add to cron (Linux/Mac):
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/avanta-finance && wrangler d1 export avanta-finance --output="backups/backup_$(date +\%Y\%m\%d).sql"
```

---

## Testing Checklist

Use this checklist to verify your D1 setup:

### Infrastructure
- [ ] Wrangler CLI installed
- [ ] Authenticated with Cloudflare
- [ ] D1 database created
- [ ] Database ID in wrangler.toml

### Schema
- [ ] Schema migrations run successfully
- [ ] All 4 tables created (transactions, accounts, invoices, fiscal_payments)
- [ ] All 5 indexes created
- [ ] Default accounts inserted

### Data Operations
- [ ] Can INSERT transactions
- [ ] Can SELECT transactions
- [ ] Can UPDATE transactions
- [ ] Can DELETE transactions
- [ ] Constraints enforced (type, category)
- [ ] Indexes improve query performance

### Business Logic
- [ ] Income/expense aggregations work
- [ ] Account balance calculations correct
- [ ] Date range filtering works
- [ ] Category filtering works
- [ ] Fiscal calculations accurate (ISR, IVA)

### Integration
- [ ] API endpoints can connect to D1
- [ ] Frontend can read data via API
- [ ] File uploads work with R2
- [ ] Error handling works properly

---

## Performance Benchmarks

Expected query performance on D1:

| Operation | Records | Time |
|-----------|---------|------|
| SELECT * (no filter) | 1,000 | ~50ms |
| SELECT with date index | 1,000 | ~30ms |
| Aggregation (SUM) | 1,000 | ~60ms |
| INSERT single row | 1 | ~20ms |
| UPDATE by ID | 1 | ~25ms |
| DELETE by ID | 1 | ~25ms |

For 10,000+ records, consider:
- Adding more specific indexes
- Implementing pagination
- Using computed columns
- Caching frequently accessed data

---

## Advanced Testing

### Load Testing

```bash
# Insert 1000 test transactions
for i in {1..1000}; do
  wrangler d1 execute avanta-finance --command="
  INSERT INTO transactions (date, description, amount, type, category)
  VALUES ('2025-10-14', 'Test $i', $(($RANDOM % 10000 + 100)), 'gasto', 'personal')
  "
done

# Measure query performance
time wrangler d1 execute avanta-finance --command="SELECT COUNT(*) FROM transactions"
```

### Concurrent Operations

Test handling of simultaneous queries (requires API running):

```bash
# Run multiple API requests concurrently
for i in {1..10}; do
  curl http://localhost:8788/api/transactions &
done
wait
```

---

## Database Limits (Cloudflare Free Tier)

- **Storage:** 5 GB
- **Reads:** 5 million per day
- **Writes:** 100,000 per day
- **Queries per second:** 1,000

For most personal/small business use cases, free tier is sufficient.

---

## Next Steps

After setting up and testing D1:

1. **Deploy to Production**
   - Follow DEPLOYMENT.md
   - Configure bindings in Cloudflare Dashboard

2. **Set up Monitoring**
   - Enable D1 analytics in dashboard
   - Set up alerts for query failures

3. **Optimize Performance**
   - Review slow queries
   - Add indexes as needed
   - Implement caching strategy

4. **Data Migration**
   - Import existing data
   - Set up automated backups
   - Document data retention policy

---

## Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Avanta Finance DEPLOYMENT.md](./DEPLOYMENT.md)
- [Avanta Finance DEVELOPMENT.md](./DEVELOPMENT.md)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section above
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md)
3. Open an issue on GitHub
4. Check Cloudflare Community Forums

---

**Last Updated:** 2025-10-14  
**Version:** 1.0.0
