# Phase 35: Centralized Settings Panel - Deployment Guide

**Status:** Ready for Deployment  
**Date:** January 20, 2025  
**Prerequisites:** Wrangler CLI, Cloudflare account with D1 and R2 access

---

## 🎯 Pre-Deployment Checklist

Before deploying Phase 35, ensure:

- [x] ✅ All code changes committed and pushed
- [x] ✅ Build verification passed (no errors)
- [x] ✅ Documentation complete
- [ ] ⏳ Database migration tested on preview environment
- [ ] ⏳ Application tested on preview deployment
- [ ] ⏳ Production database backup created
- [ ] ⏳ Production deployment planned

---

## 📋 Step-by-Step Deployment

### Step 1: Backup Production Database (CRITICAL)

Before applying any migration to production, create a backup:

```bash
# Export production database
npx wrangler d1 export avanta-coinmaster \
  --output=backups/backup-before-phase35-$(date +%Y%m%d-%H%M%S).sql

# Verify backup file exists
ls -lh backups/
```

**⚠️ IMPORTANT:** Do not proceed without a verified backup!

---

### Step 2: Deploy to Preview Environment

#### 2.1 Apply Migration to Preview Database

```bash
# Apply migration to preview database
npx wrangler d1 execute avanta-coinmaster-preview \
  --file=migrations/039_add_settings_tables.sql

# Verify tables were created
npx wrangler d1 execute avanta-coinmaster-preview \
  --command="SELECT name FROM sqlite_master WHERE type='table' AND name IN ('user_settings', 'fiscal_certificates')"
```

**Expected Output:**
```
name
user_settings
fiscal_certificates
```

#### 2.2 Build and Deploy to Preview

```bash
# Build the application
npm run build

# Deploy to Cloudflare Pages (preview)
npx wrangler pages deploy dist --project-name=avanta-coinmaster
```

#### 2.3 Test Preview Deployment

1. **Access Preview URL** (provided by Wrangler after deployment)
2. **Login to application**
3. **Navigate to Settings** (⚙️ Configuración in menu)
4. **Test each tab:**
   - [ ] Profile tab loads
   - [ ] Can change theme/language
   - [ ] Settings save successfully
   - [ ] Fiscal tab loads
   - [ ] Can upload certificate (test file)
   - [ ] Certificate appears in list
   - [ ] Can delete certificate
   - [ ] Other tabs load correctly

5. **Check browser console** for any errors
6. **Verify API responses** in Network tab

---

### Step 3: Deploy to Production

#### 3.1 Apply Migration to Production Database

**⚠️ CRITICAL:** Only proceed if preview testing was successful!

```bash
# Apply migration to production database
npx wrangler d1 execute avanta-coinmaster \
  --file=migrations/039_add_settings_tables.sql

# Verify tables were created
npx wrangler d1 execute avanta-coinmaster \
  --command="SELECT name FROM sqlite_master WHERE type='table' AND name IN ('user_settings', 'fiscal_certificates')"
```

#### 3.2 Deploy Application to Production

```bash
# Ensure latest build
npm run build

# Deploy to production
npm run deploy
```

Or use GitHub Actions workflow if configured:
```bash
# Push to main branch to trigger automatic deployment
git checkout main
git merge copilot/implement-centralized-settings-panel-again
git push origin main
```

---

### Step 4: Post-Deployment Verification

#### 4.1 Verify Database Tables

```bash
# Check user_settings table structure
npx wrangler d1 execute avanta-coinmaster \
  --command="PRAGMA table_info(user_settings)"

# Check fiscal_certificates table structure
npx wrangler d1 execute avanta-coinmaster \
  --command="PRAGMA table_info(fiscal_certificates)"

# Verify indexes
npx wrangler d1 execute avanta-coinmaster \
  --command="SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_user_settings%'"
```

#### 4.2 Test Production Application

1. **Access production URL**
2. **Login with test account**
3. **Navigate to Settings page**
4. **Test all functionality:**

   **Profile Tab:**
   - [ ] User information displays correctly
   - [ ] Theme changes apply immediately
   - [ ] Language selection works
   - [ ] Regional settings save

   **Fiscal Tab:**
   - [ ] Upload PDF certificate
   - [ ] Upload JPG/PNG image
   - [ ] View certificate list
   - [ ] View certificate details
   - [ ] Delete certificate
   - [ ] Check R2 storage

   **Other Tabs:**
   - [ ] Accounts tab shows info and link
   - [ ] Categories tab shows info and link
   - [ ] Rules tab shows links
   - [ ] Security tab shows notification settings

#### 4.3 Monitor Error Logs

```bash
# Stream production logs
npx wrangler pages deployment tail --project-name=avanta-coinmaster

# Watch for:
# - API errors
# - Database errors
# - R2 storage errors
# - Authentication issues
```

---

## 🔍 Verification Queries

### Check Default Settings

```bash
# Query default settings for a user
npx wrangler d1 execute avanta-coinmaster \
  --command="SELECT * FROM user_settings WHERE user_id = 'test-user-id' LIMIT 10"
```

### Check Certificates

```bash
# Query fiscal certificates
npx wrangler d1 execute avanta-coinmaster \
  --command="SELECT id, filename, status, uploaded_at FROM fiscal_certificates LIMIT 10"
```

### Check R2 Storage

```bash
# List fiscal certificates in R2
npx wrangler r2 object list avanta-receipts --prefix=fiscal-certificates/
```

---

## 🚨 Rollback Procedure (If Needed)

If issues are encountered during deployment:

### Rollback Database Migration

```bash
# Restore from backup
npx wrangler d1 execute avanta-coinmaster \
  --file=backups/backup-before-phase35-YYYYMMDD-HHMMSS.sql

# Or manually drop tables
npx wrangler d1 execute avanta-coinmaster \
  --command="DROP TABLE IF EXISTS fiscal_certificates; DROP TABLE IF EXISTS user_settings;"
```

### Rollback Application

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or deploy previous version
git checkout <previous-commit>
npm run build
npm run deploy
```

---

## 📊 Monitoring After Deployment

### Key Metrics to Monitor

1. **API Performance:**
   - Settings API response times
   - Certificate upload success rate
   - Error rates

2. **Database Performance:**
   - Query execution times
   - Connection errors
   - Lock timeouts

3. **Storage:**
   - R2 upload success rate
   - Storage usage
   - File deletion success

4. **User Experience:**
   - Page load times
   - Settings save success rate
   - Navigation errors

### Recommended Monitoring Tools

- Cloudflare Analytics Dashboard
- Cloudflare Logs (Real-time tail)
- Browser Developer Tools (for client-side issues)
- Custom error tracking (if implemented)

---

## ⚙️ Configuration Verification

### Environment Variables

Verify these are set in Cloudflare Pages settings:

```bash
# Check wrangler.toml configuration
cat wrangler.toml | grep -A 5 "d1_databases\|r2_buckets"
```

**Required bindings:**
- ✅ DB (D1 Database)
- ✅ RECEIPTS (R2 Bucket)

### R2 Bucket Setup

Verify R2 bucket exists and is accessible:

```bash
# List R2 buckets
npx wrangler r2 bucket list

# Should show: avanta-receipts
```

---

## 🔧 Troubleshooting Common Issues

### Issue: Migration Fails

**Symptom:** Error when applying migration
**Solution:**
```bash
# Check if tables already exist
npx wrangler d1 execute avanta-coinmaster \
  --command="SELECT name FROM sqlite_master WHERE type='table'"

# If tables exist, migration may have already been applied
```

### Issue: Settings Not Saving

**Symptom:** Settings changes don't persist
**Possible Causes:**
1. Database connection issue
2. Authentication problem
3. Validation error

**Debug:**
```bash
# Check logs
npx wrangler pages deployment tail

# Check database
npx wrangler d1 execute avanta-coinmaster \
  --command="SELECT * FROM user_settings WHERE user_id = 'your-user-id'"
```

### Issue: File Upload Fails

**Symptom:** Certificate upload returns error
**Possible Causes:**
1. R2 bucket not accessible
2. File size exceeds limit
3. Invalid file type

**Debug:**
```bash
# Check R2 binding
npx wrangler r2 bucket list

# Check logs for specific error
npx wrangler pages deployment tail | grep -i "fiscal-certificates"
```

---

## 📝 Post-Deployment Tasks

After successful deployment:

- [ ] Update project documentation
- [ ] Notify team of new feature availability
- [ ] Create user guide for settings panel
- [ ] Monitor for 24-48 hours
- [ ] Gather user feedback
- [ ] Plan Phase 36 implementation

---

## 📚 Additional Resources

- **Implementation Guide:** `PHASE_35_IMPLEMENTATION_GUIDE.md`
- **Completion Summary:** `PHASE_35_COMPLETION_SUMMARY.md`
- **Verification Report:** `PHASE_35_VERIFICATION_REPORT.md`
- **Visual Summary:** `PHASE_35_VISUAL_SUMMARY.md`

- **Cloudflare D1 Docs:** https://developers.cloudflare.com/d1/
- **Cloudflare R2 Docs:** https://developers.cloudflare.com/r2/
- **Cloudflare Pages Docs:** https://developers.cloudflare.com/pages/

---

## ✅ Deployment Checklist Summary

### Pre-Deployment
- [x] Code committed and pushed
- [x] Build verification passed
- [x] Documentation complete
- [ ] Preview environment tested
- [ ] Production backup created

### Deployment
- [ ] Preview migration applied
- [ ] Preview deployment tested
- [ ] Production migration applied
- [ ] Production deployment completed
- [ ] Post-deployment verification passed

### Post-Deployment
- [ ] All features working
- [ ] No critical errors in logs
- [ ] User testing completed
- [ ] Team notified
- [ ] Monitoring active

---

**Deployment prepared by:** GitHub Copilot Agent  
**Deployment date:** January 20, 2025  
**Phase status:** ✅ Ready for Deployment

**Next Phase:** Phase 36 - Task System Redesign as Interactive Guide
