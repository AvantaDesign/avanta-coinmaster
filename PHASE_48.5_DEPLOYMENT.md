# Phase 48.5 Deployment Guide

This guide provides step-by-step instructions for deploying the Phase 48.5 performance optimizations to production.

## Prerequisites

- Cloudflare account with Pages and D1 database access
- Wrangler CLI installed and authenticated
- Node.js 20+ installed
- Access to the production database

## Deployment Steps

### 1. Apply Database Migration

The most critical step is applying the database indexes to production.

**Local Testing First (Recommended):**
```bash
# Apply migration to local database for testing
wrangler d1 execute avanta-coinmaster --local --file=migrations/050_add_performance_indexes.sql

# Verify indexes were created
wrangler d1 execute avanta-coinmaster --local --command="SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;"

# Expected output: 59 indexes (44 existing + 15 new)
```

**Production Deployment:**
```bash
# Apply migration to production D1 database
wrangler d1 execute avanta-coinmaster --env production --file=migrations/050_add_performance_indexes.sql

# Verify indexes
wrangler d1 execute avanta-coinmaster --env production --command="SELECT COUNT(*) as total_indexes FROM sqlite_master WHERE type='index';"

# Expected output: {"total_indexes": 59}

# List new indexes
wrangler d1 execute avanta-coinmaster --env production --command="SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name;"
```

**Verification Queries:**
```sql
-- Verify transaction indexes
SELECT name, sql FROM sqlite_master 
WHERE type='index' AND tbl_name='transactions' 
ORDER BY name;

-- Test query plan to ensure index is used
EXPLAIN QUERY PLAN 
SELECT * FROM transactions 
WHERE user_id = 'test-user' AND date >= '2025-01-01';
-- Should show: SEARCH using index idx_transactions_user_date
```

### 2. Deploy Application Code

**Option A: Automatic Deployment (GitHub Actions)**
```bash
# Push to main branch
git checkout main
git merge copilot/implement-critical-performance-wins
git push origin main

# GitHub Actions will automatically deploy to Cloudflare Pages
```

**Option B: Manual Deployment**
```bash
# Build the application
npm install
npm run build

# Deploy to Cloudflare Pages
npm run deploy

# Or use wrangler directly
wrangler pages deploy dist --project-name=avanta-coinmaster
```

### 3. Verify Deployment

**Health Check:**
```bash
# Check application health
curl https://avanta-coinmaster.pages.dev/api/health

# Expected response includes database status
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-23T22:00:00.000Z"
}
```

**Cache Monitoring:**
```bash
# Get authentication token first (login to the application)
TOKEN="your-jwt-token-here"

# Check cache statistics
curl https://avanta-coinmaster.pages.dev/api/monitoring/cache \
  -H "Authorization: Bearer $TOKEN"

# Expected response:
{
  "timestamp": "2025-10-23T22:00:00.000Z",
  "cache": {
    "hits": 0,
    "misses": 0,
    "sets": 0,
    "deletes": 0,
    "errors": 0,
    "size": 0,
    "hitRate": "0.00"
  },
  "metrics": {
    "totalRequests": 0,
    "efficiency": "0.00",
    "averageHitRate": "0.00",
    "cacheUtilization": "idle"
  },
  "performance": {
    "estimatedTimeSaved": "0ms",
    "databaseLoadReduction": "0.00%"
  }
}
```

**Performance Headers:**
```bash
# Check dashboard response headers
curl -I https://avanta-coinmaster.pages.dev/api/dashboard \
  -H "Authorization: Bearer $TOKEN"

# Look for these headers:
# Cache-Control: public, max-age=300
# X-Cache: HIT or MISS
# X-Response-Time: XXms
```

**Database Query Performance:**
```bash
# Test a query that uses the new indexes
wrangler d1 execute avanta-coinmaster --env production --command="
EXPLAIN QUERY PLAN 
SELECT * FROM transactions 
WHERE user_id = 'your-user-id' 
AND date >= '2025-01-01' 
ORDER BY date DESC 
LIMIT 50;
"

# Should show index usage:
# SEARCH transactions USING INDEX idx_transactions_user_date
```

### 4. Monitor Performance

**First Hour After Deployment:**
1. Monitor cache hit rate every 15 minutes
2. Check API response times
3. Watch for any error spikes in logs
4. Verify database query performance

**Monitoring Commands:**
```bash
# View cache statistics
curl https://avanta-coinmaster.pages.dev/api/monitoring/cache \
  -H "Authorization: Bearer $TOKEN"

# View recent logs (if logging endpoint exists)
curl https://avanta-coinmaster.pages.dev/api/monitoring/logs?limit=50 \
  -H "Authorization: Bearer $TOKEN"

# Check Cloudflare Analytics Dashboard
# https://dash.cloudflare.com/
```

**Expected Performance Improvements:**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Dashboard API (first request) | ~200ms | ~50ms | 75% faster |
| Dashboard API (cached) | ~200ms | ~5ms | 97% faster |
| Transaction list (1000 rows) | ~100ms | ~20ms | 80% faster |
| Category breakdown | ~80ms | ~25ms | 69% faster |

### 5. Rollback Plan (If Needed)

If issues are detected after deployment:

**Rollback Code:**
```bash
# Revert to previous deployment
git revert HEAD~2..HEAD  # Revert last 2 commits
git push origin main

# Or deploy previous version
wrangler pages deployment list --project-name=avanta-coinmaster
wrangler pages deployment rollback <deployment-id>
```

**Remove Indexes (Only if causing issues):**
```bash
# Drop the new indexes (not recommended unless critical issue)
wrangler d1 execute avanta-coinmaster --env production --command="
DROP INDEX IF EXISTS idx_transactions_user_date;
DROP INDEX IF EXISTS idx_transactions_user_category;
DROP INDEX IF EXISTS idx_transactions_user_type_date;
DROP INDEX IF EXISTS idx_transactions_user_deductible;
DROP INDEX IF EXISTS idx_invoices_user_date;
DROP INDEX IF EXISTS idx_invoices_user_status;
DROP INDEX IF EXISTS idx_cfdi_metadata_user_date;
DROP INDEX IF EXISTS idx_accounts_user_active;
DROP INDEX IF EXISTS idx_categories_user_active;
DROP INDEX IF EXISTS idx_fiscal_payments_user_year_month;
DROP INDEX IF EXISTS idx_credit_movements_credit_date;
DROP INDEX IF EXISTS idx_budgets_user_active;
DROP INDEX IF EXISTS idx_audit_log_user_timestamp;
"
```

**Note:** Indexes should NOT cause issues. Only use rollback if there's a critical production problem.

## Post-Deployment Checklist

- [ ] Database migration applied successfully
- [ ] All 59 indexes verified in production
- [ ] Application deployed to Cloudflare Pages
- [ ] Health check endpoint responding
- [ ] Cache monitoring endpoint accessible
- [ ] Cache headers present in API responses (Cache-Control, X-Cache, X-Response-Time)
- [ ] No errors in application logs
- [ ] Dashboard loads successfully
- [ ] Transactions load successfully
- [ ] Cache hit rate begins accumulating
- [ ] Performance improvements visible

## Ongoing Monitoring

**Daily (First Week):**
- Check cache statistics daily
- Monitor API response times
- Review error logs
- Verify cache hit rate is increasing

**Weekly:**
- Review cache hit rate trends (target: >80%)
- Analyze slow queries (should be minimal)
- Check for any performance regressions
- Update cache TTLs if needed

**Monthly:**
- Review overall performance metrics
- Optimize cache strategies based on usage patterns
- Consider additional indexes for new query patterns
- Document any performance improvements

## Troubleshooting

### Cache Not Working

**Symptoms:**
- X-Cache header always shows "MISS"
- Cache hit rate is 0%

**Solutions:**
1. Verify cache utility is imported correctly
2. Check that cache keys are being generated
3. Ensure cache TTL is set properly
4. Review logs for cache errors

### Slow Queries Despite Indexes

**Symptoms:**
- Queries still taking 100ms+
- No performance improvement

**Solutions:**
1. Verify indexes were created:
   ```sql
   SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%';
   ```
2. Check query plan is using indexes:
   ```sql
   EXPLAIN QUERY PLAN SELECT ...
   ```
3. Ensure query filters match index columns
4. Consider additional indexes for specific queries

### High Memory Usage

**Symptoms:**
- Application running out of memory
- Cache size growing too large

**Solutions:**
1. Check cache size:
   ```bash
   curl /api/monitoring/cache
   ```
2. Reduce cache TTLs if needed
3. Implement cache size limits
4. Clear cache manually if necessary

## Support

For issues or questions:
1. Check `PHASE_48.5_SUMMARY.md` for detailed documentation
2. Review `IMPLEMENTATION_PLAN_V9.md` for context
3. Contact development team with specific error messages
4. Include cache statistics and performance metrics in reports

## Success Metrics

After 24 hours of production traffic, you should see:

- ✅ Cache hit rate: >80%
- ✅ Average API response time: <100ms
- ✅ Dashboard load time: <2 seconds
- ✅ Database load reduction: >70%
- ✅ Zero performance-related errors

If metrics don't meet targets, investigate and optimize as needed.

---

**Deployment Date:** _____________________  
**Deployed By:** _____________________  
**Verified By:** _____________________  
**Production Status:** ⏳ PENDING → ✅ COMPLETE
