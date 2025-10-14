# D1 Quick Reference

Quick reference for common Cloudflare D1 database operations.

## Setup Commands

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

## Database Management

```bash
# List all databases
wrangler d1 list

# Create new database
wrangler d1 create avanta-finance

# Delete database (WARNING: permanent)
wrangler d1 delete avanta-finance
```

## Schema & Migrations

```bash
# Run migrations from file
wrangler d1 execute avanta-finance --file=schema.sql

# Run single command
wrangler d1 execute avanta-finance --command="SELECT * FROM transactions LIMIT 5"

# Load seed data
wrangler d1 execute avanta-finance --file=seed.sql
```

## Data Operations

### Query Data

```bash
# List all tables
wrangler d1 execute avanta-finance --command="SELECT name FROM sqlite_master WHERE type='table'"

# Count records
wrangler d1 execute avanta-finance --command="SELECT COUNT(*) FROM transactions"

# View recent transactions
wrangler d1 execute avanta-finance --command="SELECT * FROM transactions ORDER BY date DESC LIMIT 10"

# Check account balances
wrangler d1 execute avanta-finance --command="SELECT * FROM accounts"

# View invoices
wrangler d1 execute avanta-finance --command="SELECT * FROM invoices"
```

### Insert Data

```bash
# Add transaction
wrangler d1 execute avanta-finance --command="
INSERT INTO transactions (date, description, amount, type, category)
VALUES ('2025-10-14', 'Test Transaction', 1000.00, 'gasto', 'avanta')
"

# Add account
wrangler d1 execute avanta-finance --command="
INSERT INTO accounts (name, type, balance)
VALUES ('Test Account', 'banco', 5000.00)
"
```

### Update Data

```bash
# Update transaction
wrangler d1 execute avanta-finance --command="
UPDATE transactions SET is_deductible = 1 WHERE id = 1
"

# Update account balance
wrangler d1 execute avanta-finance --command="
UPDATE accounts SET balance = 10000.00 WHERE id = 1
"
```

### Delete Data

```bash
# Delete specific transaction
wrangler d1 execute avanta-finance --command="
DELETE FROM transactions WHERE id = 1
"

# Delete all test data
wrangler d1 execute avanta-finance --command="
DELETE FROM transactions WHERE description LIKE '%Test%'
"
```

## Backup & Restore

```bash
# Export database to SQL file
wrangler d1 export avanta-finance --output=backup.sql

# Export with timestamp
wrangler d1 export avanta-finance --output="backup_$(date +%Y%m%d_%H%M%S).sql"

# Restore from backup
wrangler d1 execute avanta-finance --file=backup.sql
```

## Useful Queries

### Financial Reports

```bash
# Monthly income and expenses
wrangler d1 execute avanta-finance --command="
SELECT 
  SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END) as income,
  SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END) as expenses
FROM transactions
WHERE date >= '2025-10-01' AND date <= '2025-10-31'
"

# Deductible expenses
wrangler d1 execute avanta-finance --command="
SELECT 
  SUM(amount) as total_deductible
FROM transactions
WHERE type = 'gasto' AND is_deductible = 1
"

# Total balance
wrangler d1 execute avanta-finance --command="
SELECT 
  SUM(CASE WHEN type = 'banco' THEN balance ELSE -balance END) as total_balance
FROM accounts
"
```

### Data Analysis

```bash
# Transactions by category
wrangler d1 execute avanta-finance --command="
SELECT 
  category,
  type,
  COUNT(*) as count,
  SUM(amount) as total
FROM transactions
GROUP BY category, type
"

# Monthly summary
wrangler d1 execute avanta-finance --command="
SELECT 
  strftime('%Y-%m', date) as month,
  COUNT(*) as transactions,
  SUM(CASE WHEN type = 'ingreso' THEN amount ELSE 0 END) as income,
  SUM(CASE WHEN type = 'gasto' THEN amount ELSE 0 END) as expenses
FROM transactions
GROUP BY strftime('%Y-%m', date)
ORDER BY month DESC
"

# Top expenses
wrangler d1 execute avanta-finance --command="
SELECT 
  date,
  description,
  amount,
  category
FROM transactions
WHERE type = 'gasto'
ORDER BY amount DESC
LIMIT 10
"
```

## Performance & Optimization

```bash
# Check index usage
wrangler d1 execute avanta-finance --command="
EXPLAIN QUERY PLAN
SELECT * FROM transactions WHERE date >= '2025-10-01'
"

# List all indexes
wrangler d1 execute avanta-finance --command="
SELECT name, sql FROM sqlite_master WHERE type='index'
"

# Analyze query performance
wrangler d1 execute avanta-finance --command="
ANALYZE
"
```

## Troubleshooting

```bash
# Check database info
wrangler d1 info avanta-finance

# View database schema
wrangler d1 execute avanta-finance --command="
SELECT sql FROM sqlite_master WHERE type='table' AND name='transactions'
"

# Check for errors
wrangler d1 execute avanta-finance --command="
PRAGMA integrity_check
"

# View database size
wrangler d1 execute avanta-finance --command="
SELECT 
  (SELECT COUNT(*) FROM transactions) as transactions_count,
  (SELECT COUNT(*) FROM accounts) as accounts_count,
  (SELECT COUNT(*) FROM invoices) as invoices_count,
  (SELECT COUNT(*) FROM fiscal_payments) as fiscal_payments_count
"
```

## Local Development

```bash
# Start local dev server with D1
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788

# Test API with D1
curl http://localhost:8788/api/transactions

# Test dashboard
curl http://localhost:8788/api/dashboard
```

## Automation Scripts

```bash
# Setup database (automated)
./test-d1-database.sh setup

# Run all tests
./test-d1-database.sh test

# Load seed data
./test-d1-database.sh seed

# Verify structure
./test-d1-database.sh verify

# Create backup
./test-d1-database.sh backup
```

## Environment-Specific Commands

### Production

```bash
# Query production database
wrangler d1 execute avanta-finance --command="SELECT COUNT(*) FROM transactions"

# Create production backup
wrangler d1 export avanta-finance --output=prod_backup.sql
```

### Preview/Staging

```bash
# Use preview database (if configured)
wrangler d1 execute avanta-finance-preview --command="SELECT * FROM transactions LIMIT 5"
```

## Common Patterns

### Add Monthly Transactions

```bash
# Add multiple transactions in one command
wrangler d1 execute avanta-finance --command="
BEGIN TRANSACTION;

INSERT INTO transactions (date, description, amount, type, category, is_deductible)
VALUES ('2025-10-01', 'Client Payment', 15000, 'ingreso', 'avanta', 0);

INSERT INTO transactions (date, description, amount, type, category, is_deductible)
VALUES ('2025-10-05', 'Office Rent', 5000, 'gasto', 'avanta', 1);

INSERT INTO transactions (date, description, amount, type, category, is_deductible)
VALUES ('2025-10-10', 'Equipment', 8500, 'gasto', 'avanta', 1);

COMMIT;
"
```

### Reset Database

```bash
# WARNING: This deletes all data!

# Drop all tables
wrangler d1 execute avanta-finance --command="
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS fiscal_payments;
"

# Recreate from schema
wrangler d1 execute avanta-finance --file=schema.sql

# Load seed data
wrangler d1 execute avanta-finance --file=seed.sql
```

## Tips & Best Practices

1. **Use prepared statements** in API code (already implemented)
2. **Always backup** before major changes
3. **Test queries** in D1 CLI before adding to code
4. **Use indexes** for frequently queried columns (already configured)
5. **Monitor query performance** with EXPLAIN QUERY PLAN
6. **Keep migrations versioned** (schema.sql in git)
7. **Use transactions** for multiple related operations
8. **Validate data** both in frontend and backend

## Resources

- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [D1_TESTING_GUIDE.md](./D1_TESTING_GUIDE.md) - Complete testing guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions

---

**Quick Help:** `./test-d1-database.sh help` or `wrangler d1 --help`
