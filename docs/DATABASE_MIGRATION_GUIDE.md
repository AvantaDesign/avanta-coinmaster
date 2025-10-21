# Database Migration Safety Guide

**Phase 43: SQL Injection Prevention & Database Security**

## Overview

This guide provides best practices for safely managing database migrations in Avanta Coinmaster, ensuring data integrity and minimizing downtime risks.

## Migration Workflow

### 1. Planning Phase

Before creating a migration:

- [ ] Document the schema change requirement
- [ ] Identify affected tables and relationships
- [ ] Plan for data transformation if needed
- [ ] Estimate migration duration
- [ ] Identify rollback strategy
- [ ] Test in development environment

### 2. Creating Migrations

Migrations are created using Wrangler D1:

```bash
# Create a new migration
wrangler d1 migrations create avanta-finance "migration_description"
```

This creates a new SQL file in the `migrations/` directory with a timestamp prefix.

### 3. Writing Safe Migrations

#### Always Include:

1. **Comments**: Document what the migration does and why
2. **Defensive checks**: Use `IF NOT EXISTS` and `IF EXISTS`
3. **Data validation**: Verify data integrity before and after
4. **Rollback instructions**: Document how to reverse the change

#### Example Safe Migration:

```sql
-- Migration: Add email_verified column to users table
-- Purpose: Support email verification feature
-- Rollback: Remove email_verified column

-- Add new column with safe defaults
ALTER TABLE users 
ADD COLUMN email_verified INTEGER DEFAULT 0 CHECK (email_verified IN (0, 1));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified 
ON users(email_verified);

-- Update existing users (admin users are verified by default)
UPDATE users 
SET email_verified = 1 
WHERE role = 'admin';
```

### 4. Migration Safety Checklist

Before applying a migration:

- [ ] Migration file is syntactically correct SQL
- [ ] All new tables use `IF NOT EXISTS`
- [ ] All dropped tables use `IF EXISTS`
- [ ] Default values are provided for new NOT NULL columns
- [ ] Foreign key relationships are maintained
- [ ] Indexes are created for new searchable columns
- [ ] Data transformations are tested
- [ ] Rollback procedure is documented
- [ ] Backup is created before applying

### 5. Testing Migrations

#### Test in Local Development:

```bash
# Apply migration to local D1
wrangler d1 migrations apply avanta-finance --local

# Verify schema
wrangler d1 execute avanta-finance --local --command "SELECT sql FROM sqlite_master WHERE type='table';"

# Test rollback procedure
```

#### Test with Sample Data:

```bash
# Load sample data
wrangler d1 execute avanta-finance --local --file seed.sql

# Apply migration
wrangler d1 migrations apply avanta-finance --local

# Verify data integrity
wrangler d1 execute avanta-finance --local --command "SELECT COUNT(*) FROM table_name;"
```

### 6. Applying Migrations

#### To Production (Remote):

```bash
# List pending migrations
wrangler d1 migrations list avanta-finance

# Apply all pending migrations
wrangler d1 migrations apply avanta-finance

# Verify application
wrangler d1 execute avanta-finance --command "SELECT COUNT(*) FROM _cf_KV;"
```

#### Dry Run (Recommended):

Always review the migration plan before applying:

```bash
# Show what would be applied
wrangler d1 migrations list avanta-finance --local
```

### 7. Rollback Procedures

#### Immediate Rollback:

If a migration fails or causes issues immediately after application:

1. **Create a rollback migration** (preferred):
   ```bash
   wrangler d1 migrations create avanta-finance "rollback_migration_name"
   ```

2. **Write the reverse operations**:
   ```sql
   -- Rollback: Remove email_verified column
   ALTER TABLE users DROP COLUMN email_verified;
   DROP INDEX IF EXISTS idx_users_email_verified;
   ```

3. **Apply the rollback**:
   ```bash
   wrangler d1 migrations apply avanta-finance
   ```

#### Manual Rollback:

For complex rollbacks requiring data restoration:

```bash
# Restore from backup (requires backup restoration process)
# Note: Cloudflare D1 backups are managed automatically
```

## Common Migration Patterns

### Adding a Column

```sql
-- Safe: Provides default value
ALTER TABLE table_name 
ADD COLUMN column_name TEXT DEFAULT '';

-- Unsafe: No default for NOT NULL
-- ALTER TABLE table_name ADD COLUMN column_name TEXT NOT NULL;
```

### Removing a Column

```sql
-- SQLite limitation: Cannot drop columns directly
-- Workaround: Create new table without the column

-- Create new table structure
CREATE TABLE table_name_new (
  id TEXT PRIMARY KEY,
  column1 TEXT,
  column2 INTEGER
  -- column3 removed
);

-- Copy data
INSERT INTO table_name_new (id, column1, column2)
SELECT id, column1, column2 FROM table_name;

-- Drop old table
DROP TABLE table_name;

-- Rename new table
ALTER TABLE table_name_new RENAME TO table_name;

-- Recreate indexes
CREATE INDEX idx_table_name_column1 ON table_name(column1);
```

### Renaming a Column

```sql
-- SQLite limitation: Cannot rename columns directly in older versions
-- Use the column removal pattern above
```

### Adding an Index

```sql
-- Safe: Uses IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_table_column 
ON table_name(column_name);

-- For unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_table_column_unique 
ON table_name(column_name);
```

### Modifying Data

```sql
-- Safe: Uses WHERE clause to prevent accidental mass updates
UPDATE table_name 
SET status = 'active' 
WHERE status IS NULL AND created_at > '2024-01-01';

-- Count affected rows first
SELECT COUNT(*) FROM table_name 
WHERE status IS NULL AND created_at > '2024-01-01';
```

## Data Integrity Checks

### Before Migration:

```sql
-- Count total records
SELECT COUNT(*) as total_records FROM table_name;

-- Check for NULL values in critical columns
SELECT COUNT(*) as null_values 
FROM table_name 
WHERE critical_column IS NULL;

-- Verify foreign key relationships
SELECT COUNT(*) as orphaned_records
FROM child_table c
LEFT JOIN parent_table p ON c.parent_id = p.id
WHERE p.id IS NULL;
```

### After Migration:

```sql
-- Verify record count matches
SELECT COUNT(*) as total_records FROM table_name;

-- Check new column has expected values
SELECT column_name, COUNT(*) 
FROM table_name 
GROUP BY column_name;

-- Verify indexes were created
SELECT name, sql 
FROM sqlite_master 
WHERE type = 'index' AND tbl_name = 'table_name';
```

## Schema Version Tracking

Cloudflare D1 automatically tracks applied migrations in the `_cf_KV` table.

### Check Migration Status:

```bash
# List all migrations
wrangler d1 migrations list avanta-finance

# Check applied migrations
wrangler d1 execute avanta-finance --command "SELECT * FROM _cf_KV WHERE key LIKE 'migration_%';"
```

### Migration Naming Convention:

Use descriptive names with timestamps:
```
YYYY-MM-DD-HHMM_description.sql
```

Example:
```
2025-01-15-1430_add_email_verification.sql
```

## Backup Strategy

### Automated Backups:

Cloudflare D1 provides automatic backups (point-in-time recovery for paid plans).

### Manual Backups:

```bash
# Export entire database
wrangler d1 execute avanta-finance --command ".dump" > backup.sql

# Export specific table
wrangler d1 execute avanta-finance --command "SELECT * FROM table_name;" --json > table_backup.json
```

### Restore from Backup:

```bash
# Import from SQL dump
wrangler d1 execute avanta-finance --file backup.sql
```

## Migration Best Practices

### DO:

✅ **Use transactions** (D1 uses implicit transactions per request)
✅ **Add comments** explaining the purpose of each change
✅ **Test migrations** in local and staging environments first
✅ **Create indexes** for new columns that will be queried
✅ **Provide default values** for new NOT NULL columns
✅ **Document rollback procedures** in migration comments
✅ **Verify data integrity** before and after migrations
✅ **Use defensive SQL** with IF EXISTS/IF NOT EXISTS
✅ **Keep migrations small** and focused on single changes
✅ **Version control** all migration files

### DON'T:

❌ **Don't concatenate user input** in migration scripts
❌ **Don't skip testing** in development first
❌ **Don't modify old migrations** after they've been applied
❌ **Don't forget to backup** before major schema changes
❌ **Don't drop tables** without verifying they're unused
❌ **Don't use SELECT \*** in production migrations
❌ **Don't make breaking changes** without a deprecation period
❌ **Don't forget indexes** on foreign key columns
❌ **Don't ignore warnings** during migration application

## Emergency Procedures

### Migration Fails Mid-Application:

1. **Check D1 logs** for error details
2. **Verify database state**:
   ```bash
   wrangler d1 execute avanta-finance --command "PRAGMA integrity_check;"
   ```
3. **Create rollback migration** to restore previous state
4. **Contact Cloudflare support** if database is corrupted

### Data Loss Prevention:

1. **Always backup** before major migrations
2. **Test thoroughly** in development
3. **Apply migrations** during low-traffic periods
4. **Monitor application** closely after migration
5. **Have rollback plan** ready

## Migration Monitoring

### Post-Migration Checks:

```bash
# Check table structure
wrangler d1 execute avanta-finance --command "PRAGMA table_info(table_name);"

# Verify indexes
wrangler d1 execute avanta-finance --command "PRAGMA index_list(table_name);"

# Check constraints
wrangler d1 execute avanta-finance --command "SELECT sql FROM sqlite_master WHERE name = 'table_name';"

# Query performance
wrangler d1 execute avanta-finance --command "EXPLAIN QUERY PLAN SELECT * FROM table_name WHERE column = 'value';"
```

### Application Health Check:

After applying migrations:

1. Test critical API endpoints
2. Verify data is accessible
3. Check application logs for errors
4. Monitor response times
5. Test user workflows

## Migration Security

### Secure Migration Practices:

1. **Limit access**: Only admins should apply migrations
2. **Audit trail**: Log all migration activities
3. **Code review**: Require review of all migrations
4. **Principle of least privilege**: Migrations should have minimal permissions
5. **No sensitive data**: Don't include real data in migration files

### SQL Injection Prevention:

Even in migrations, avoid string concatenation:

```sql
-- Bad: Vulnerable to injection if parameterized
-- UPDATE users SET role = 'admin' WHERE email = '${email}';

-- Good: Migrations should only use hardcoded values
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## Cloudflare D1 Specific Notes

### Limitations:

- No support for stored procedures
- Limited ALTER TABLE operations (can't drop/rename columns easily)
- No explicit transaction control in Workers
- No triggers or views

### Best Practices for D1:

1. Keep migrations simple and declarative
2. Use workarounds for unsupported operations (recreate table pattern)
3. Leverage D1's automatic migration tracking
4. Use Wrangler CLI for all migration operations
5. Test locally with `--local` flag first

## Resources

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [SQLite ALTER TABLE](https://www.sqlite.org/lang_altertable.html)
- [Database Migration Best Practices](https://www.prisma.io/dataguide/types/relational/migration-strategies)

---

**Last Updated**: Phase 43 - SQL Injection Prevention & Database Security  
**Status**: Migration safety procedures established
