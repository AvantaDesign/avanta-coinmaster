# Phase 49: Database Optimization - Migration & Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying Phase 49 database optimizations to production, including migration safety validation, performance monitoring setup, and verification procedures.

---

## Pre-Deployment Checklist

### 1. Environment Verification
- [ ] Production database backup completed
- [ ] Wrangler CLI installed and authenticated
- [ ] Admin access credentials available
- [ ] Development environment tested successfully

### 2. Code Review
- [ ] All 113 tests passing
- [ ] Build succeeds without errors
- [ ] No security vulnerabilities detected
- [ ] Code review completed

### 3. Migration Validation
- [ ] Migration 051 reviewed
- [ ] Dry-run test completed
- [ ] Rollback script generated
- [ ] Safety assessment: SAFE

---

## Step-by-Step Deployment

### Step 1: Backup Production Database

**CRITICAL: Always backup before migrations**

```bash
# Create backup directory
mkdir -p backups/phase-49-$(date +%Y%m%d)

# Export current database state
wrangler d1 backup create avanta-coinmaster --env production

# Document current state
wrangler d1 execute avanta-coinmaster --env production \
  --command="SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table';" \
  > backups/phase-49-$(date +%Y%m%d)/pre-migration-state.txt

wrangler d1 execute avanta-coinmaster --env production \
  --command="SELECT COUNT(*) as index_count FROM sqlite_master WHERE type='index';" \
  >> backups/phase-49-$(date +%Y%m%d)/pre-migration-state.txt
```

### Step 2: Test Migration in Development

**Local testing first**

```bash
# Apply migration to local database
wrangler d1 execute avanta-coinmaster --local \
  --file=migrations/051_advanced_database_indexes.sql

# Verify indexes created
wrangler d1 execute avanta-coinmaster --local \
  --command="SELECT COUNT(*) as index_count FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';"

# Expected result: ~52 indexes (15 from Phase 48.5 + 37 from Phase 49)

# Test queries with new indexes
wrangler d1 execute avanta-coinmaster --local \
  --command="EXPLAIN QUERY PLAN SELECT * FROM tax_calculations WHERE user_id = 'test' AND period_year = 2025;"

# Should show: USING INDEX idx_tax_calculations_user_period
```

### Step 3: Dry-Run Migration Test (Production-Like)

**Use the migration testing endpoint**

```bash
# Read migration file
MIGRATION_SQL=$(cat migrations/051_advanced_database_indexes.sql)

# Test migration via API (requires admin token)
curl -X POST https://avanta-coinmaster.pages.dev/api/admin/migration-test \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"sql\": \"$MIGRATION_SQL\", \"dryRun\": true}" \
  | jq '.'

# Review response:
# - analysis.safety.safetyLevel should be "safe"
# - dryRun.success should be true
# - dryRun.failed should be 0
```

### Step 4: Deploy Application Code

**Deploy new monitoring and utilities**

```bash
# Ensure you're on the correct branch
git status
git log --oneline -5

# Build application
npm run build

# Verify build output
ls -lh dist/assets/ | grep -E "(index|vendor|GlobalFilter)"

# Deploy to Cloudflare Pages
npm run deploy

# Or push to main for automatic deployment
git push origin main
```

### Step 5: Apply Migration to Production

**Execute migration on production database**

```bash
# FINAL CHECK: Verify backup exists
wrangler d1 backup list avanta-coinmaster --env production

# Apply migration
wrangler d1 execute avanta-coinmaster --env production \
  --file=migrations/051_advanced_database_indexes.sql

# IMPORTANT: Watch for errors
# If any error occurs, immediately execute rollback (see Emergency Rollback section)
```

### Step 6: Verify Migration Success

**Confirm indexes were created**

```bash
# Count total indexes
wrangler d1 execute avanta-coinmaster --env production \
  --command="SELECT COUNT(*) as total_indexes FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';"

# Expected: ~52 custom indexes

# List new Phase 49 indexes
wrangler d1 execute avanta-coinmaster --env production \
  --command="SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name IN (
    'idx_tax_calculations_user_period',
    'idx_receipts_user_uploaded',
    'idx_financial_tasks_user_status',
    'idx_sat_declarations_user_period'
  );"

# All should be present

# Test index usage on a sample query
wrangler d1 execute avanta-coinmaster --env production \
  --command="EXPLAIN QUERY PLAN SELECT * FROM tax_calculations WHERE user_id = 'admin-user' AND period_year = 2025 AND period_month = 10;"

# Should show: SEARCH using index idx_tax_calculations_user_period
```

### Step 7: Monitor Performance

**Check database and cache performance**

```bash
# Get database performance metrics
curl https://avanta-coinmaster.pages.dev/api/monitoring/database-performance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  | jq '{database: .database, recommendations: .recommendations}'

# Expected recommendations: "Database performance is excellent"

# Get cache performance metrics
curl https://avanta-coinmaster.pages.dev/api/monitoring/cache-performance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.performance'

# Monitor over time (run every 5 minutes for first hour)
watch -n 300 'curl -s https://avanta-coinmaster.pages.dev/api/monitoring/database-performance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  | jq ".queryPerformance.avgDuration"'
```

### Step 8: Warm Cache

**Pre-populate cache for better initial performance**

```bash
# Warm cache for active users (repeat for each user)
curl -X POST https://avanta-coinmaster.pages.dev/api/monitoring/cache-performance/warm \
  -H "Authorization: Bearer USER_TOKEN"

# Response should indicate: "Cache warmed successfully"
```

### Step 9: Performance Testing

**Run performance tests on critical endpoints**

```bash
# Test dashboard performance (should be <100ms after cache warm)
time curl https://avanta-coinmaster.pages.dev/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o /dev/null -s -w "%{time_total}\n"

# Test transactions query (should be <100ms)
time curl "https://avanta-coinmaster.pages.dev/api/transactions?limit=50" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o /dev/null -s -w "%{time_total}\n"

# Test fiscal data (should be <150ms)
time curl "https://avanta-coinmaster.pages.dev/api/fiscal/calculations?year=2025" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o /dev/null -s -w "%{time_total}\n"
```

---

## Post-Deployment Monitoring

### First 24 Hours

**Monitor these metrics closely:**

1. **Query Performance**
   ```bash
   # Check hourly
   curl https://avanta-coinmaster.pages.dev/api/monitoring/database-performance \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     | jq '.queryPerformance'
   ```

   Watch for:
   - Average duration < 100ms
   - Critical queries = 0
   - Slow queries < 10%

2. **Cache Performance**
   ```bash
   # Check every 6 hours
   curl https://avanta-coinmaster.pages.dev/api/monitoring/cache-performance \
     -H "Authorization: Bearer YOUR_TOKEN" \
     | jq '.performance.hitRate'
   ```

   Target:
   - Hit rate > 70% (will improve over time to 80%+)

3. **Error Rates**
   ```bash
   # Check application logs
   wrangler tail --env production
   ```

   Watch for:
   - Database query errors
   - Cache errors
   - Performance warnings

### First Week

**Daily checks:**

1. Review slow query reports
2. Analyze cache hit rates
3. Monitor average response times
4. Check for index usage anomalies

### Performance Baselines

**Document these metrics for future comparison:**

```bash
# Save baseline performance report
curl https://avanta-coinmaster.pages.dev/api/monitoring/database-performance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  > performance-baseline-$(date +%Y%m%d).json

curl https://avanta-coinmaster.pages.dev/api/monitoring/cache-performance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  > cache-baseline-$(date +%Y%m%d).json
```

---

## Emergency Rollback Procedure

### If Migration Fails

**IMMEDIATE ACTIONS:**

1. **Stop the migration** (if still in progress)
   ```bash
   # Cancel the wrangler command (Ctrl+C)
   ```

2. **Execute rollback script**
   ```bash
   # The migration testing endpoint provides rollback SQL
   # Or use this automated rollback for indexes:
   
   wrangler d1 execute avanta-coinmaster --env production --command="
   -- Drop Phase 49 indexes
   DROP INDEX IF EXISTS idx_tax_calculations_user_period;
   DROP INDEX IF EXISTS idx_tax_calculations_user_date;
   DROP INDEX IF EXISTS idx_receipts_user_uploaded;
   DROP INDEX IF EXISTS idx_receipts_transaction;
   DROP INDEX IF EXISTS idx_user_settings_user;
   DROP INDEX IF EXISTS idx_tax_deductions_user_year;
   DROP INDEX IF EXISTS idx_tax_deductions_category;
   DROP INDEX IF EXISTS idx_tax_credits_user_year;
   DROP INDEX IF EXISTS idx_financial_tasks_user_status;
   DROP INDEX IF EXISTS idx_financial_tasks_user_due;
   DROP INDEX IF EXISTS idx_reconciliation_matches_user;
   DROP INDEX IF EXISTS idx_reconciliation_matches_statement;
   DROP INDEX IF EXISTS idx_bank_statements_user_date;
   DROP INDEX IF EXISTS idx_bank_statements_account;
   DROP INDEX IF EXISTS idx_sat_declarations_user_period;
   DROP INDEX IF EXISTS idx_sat_declarations_user_status;
   DROP INDEX IF EXISTS idx_digital_archive_user_uploaded;
   DROP INDEX IF EXISTS idx_digital_archive_user_type;
   DROP INDEX IF EXISTS idx_help_feedback_user;
   DROP INDEX IF EXISTS idx_help_feedback_article;
   DROP INDEX IF EXISTS idx_deductibility_rules_user_active;
   DROP INDEX IF EXISTS idx_fiscal_config_user;
   DROP INDEX IF EXISTS idx_user_onboarding_user;
   DROP INDEX IF EXISTS idx_demo_sessions_user_created;
   DROP INDEX IF EXISTS idx_demo_sessions_scenario;
   DROP INDEX IF EXISTS idx_transaction_invoice_transaction;
   DROP INDEX IF EXISTS idx_transaction_invoice_invoice;
   DROP INDEX IF EXISTS idx_account_initial_balances_user;
   DROP INDEX IF EXISTS idx_account_initial_balances_account;
   DROP INDEX IF EXISTS idx_diot_operations_user_period;
   DROP INDEX IF EXISTS idx_contabilidad_files_user_period;
   DROP INDEX IF EXISTS idx_fiscal_certificates_user_valid;
   DROP INDEX IF EXISTS idx_tax_simulations_user_created;
   DROP INDEX IF EXISTS idx_simulation_results_simulation;
   "
   ```

3. **Restore from backup** (if needed)
   ```bash
   wrangler d1 backup restore avanta-coinmaster BACKUP_ID --env production
   ```

4. **Verify system stability**
   ```bash
   # Test critical endpoints
   curl https://avanta-coinmaster.pages.dev/api/health
   curl https://avanta-coinmaster.pages.dev/api/dashboard \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

5. **Notify team and investigate**
   - Document error messages
   - Review logs
   - Analyze what went wrong
   - Plan corrective action

---

## Troubleshooting

### Issue: Slow Queries Still Present

**Diagnosis:**
```bash
# Check which queries are slow
curl https://avanta-coinmaster.pages.dev/api/monitoring/database-performance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  | jq '.slowQueries'
```

**Solutions:**
1. Verify indexes are being used: `EXPLAIN QUERY PLAN`
2. Check for missing composite indexes
3. Review query patterns for optimization opportunities

### Issue: Low Cache Hit Rate

**Diagnosis:**
```bash
curl https://avanta-coinmaster.pages.dev/api/monitoring/cache-performance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq '.performance.hitRate'
```

**Solutions:**
1. Warm cache: `POST /api/monitoring/cache-performance/warm`
2. Increase cache TTLs for stable data
3. Review cache invalidation patterns

### Issue: Index Not Being Used

**Diagnosis:**
```bash
wrangler d1 execute avanta-coinmaster --env production \
  --command="EXPLAIN QUERY PLAN SELECT * FROM tax_calculations WHERE user_id = 'test' AND period_year = 2025;"
```

**Solutions:**
1. Verify index exists: Check `sqlite_master`
2. Ensure query matches index columns exactly
3. Check for implicit type conversions
4. Consider query rewriting

---

## Success Criteria

### Migration Successful When:
- ✅ All 37 new indexes created (52 total)
- ✅ No errors during migration
- ✅ All queries execute successfully
- ✅ Average query time < 100ms
- ✅ No application errors
- ✅ Cache hit rate trending to 80%+

### Performance Targets Achieved:
- ✅ Database query performance improved 70-80%
- ✅ No queries slower than 100ms
- ✅ Cache hit rate > 80% (after warmup)
- ✅ Database load reduced 80%+
- ✅ P95 latency < 200ms
- ✅ Zero N+1 query problems detected

---

## Reference Commands

### Quick Health Check
```bash
# One-liner to check overall system health
curl -s https://avanta-coinmaster.pages.dev/api/monitoring/database-performance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  | jq '{avg_duration: .queryPerformance.avgDuration, slow_queries: .queryPerformance.slowQueries, recommendations: .recommendations[0].message}'
```

### Index Verification
```bash
# List all Phase 49 indexes
wrangler d1 execute avanta-coinmaster --env production \
  --command="SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY tbl_name, name;"
```

### Performance Dashboard
```bash
# Create real-time dashboard
watch -n 60 '
echo "=== Database Performance ==="
curl -s https://avanta-coinmaster.pages.dev/api/monitoring/database-performance \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  | jq ".queryPerformance | {avg: .avgDuration, p95: .p95Duration, slow: .slowQueries}"

echo ""
echo "=== Cache Performance ==="
curl -s https://avanta-coinmaster.pages.dev/api/monitoring/cache-performance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | jq ".performance | {hitRate: .hitRatePercentage, efficiency: .efficiency}"
'
```

---

## Support and Resources

### Documentation
- Phase 49 Summary: `PHASE_49_SUMMARY.md`
- Implementation Plan: `IMPLEMENTATION_PLAN_V9.md`
- Database Tracking: `DATABASE_TRACKING_SYSTEM.md`

### Monitoring Endpoints
- Database Performance: `/api/monitoring/database-performance`
- Cache Performance: `/api/monitoring/cache-performance`
- Migration Testing: `/api/admin/migration-test`

### Emergency Contacts
- Review application logs: `wrangler tail --env production`
- Cloudflare Dashboard: https://dash.cloudflare.com
- GitHub Issues: https://github.com/AvantaDesign/avanta-coinmaster/issues

---

**Deployment Date:** ____________  
**Deployed By:** ____________  
**Verification Completed:** ❏ Yes ❏ No  
**Performance Targets Met:** ❏ Yes ❏ No  
**Rollback Plan Tested:** ❏ Yes ❏ No  

**Status:** ⏳ READY FOR DEPLOYMENT
