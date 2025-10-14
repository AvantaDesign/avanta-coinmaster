# 🚀 Production Deployment Guide - Avanta Finance

## 📋 Overview

This comprehensive guide walks you through deploying Avanta Finance to production on Cloudflare Pages with full D1 database, R2 storage, and Workers Functions integration.

**Target Infrastructure:**
- ☁️ Cloudflare Pages for frontend hosting
- 🗄️ D1 Database for SQLite at the edge
- 📦 R2 Storage for receipts and documents
- ⚡ Workers Functions for serverless API
- 🌍 Global edge network for low latency

**Estimated Time:** 30-45 minutes
**Cost:** $0 (using Cloudflare free tier)

---

## 🎯 Prerequisites

### Required Accounts & Tools
- [ ] Cloudflare account (sign up at https://dash.cloudflare.com/sign-up)
- [ ] Node.js 18+ installed (check: `node --version`)
- [ ] Git installed (check: `git --version`)
- [ ] Terminal/command line access

### Optional (Recommended)
- [ ] GitHub account for CI/CD automation
- [ ] Custom domain (can be added later)
- [ ] n8n instance for workflow automation

---

## 📝 Pre-Deployment Checklist

Before deploying, ensure:

### Code Quality
- [ ] Application builds without errors (`npm run build`)
- [ ] No console errors in development mode
- [ ] All API endpoints tested locally
- [ ] Database schema is finalized
- [ ] Tax calculations verified (ISR 20%, IVA 16%)

### Configuration
- [ ] `wrangler.toml` reviewed
- [ ] Environment variables configured
- [ ] Feature flags set appropriately
- [ ] Database and R2 bucket names decided

### Documentation
- [ ] README.md is up to date
- [ ] API documentation reviewed
- [ ] User manual available
- [ ] Deployment guide (this document) reviewed

---

## 🔧 Step-by-Step Deployment

### Step 1: Install Wrangler CLI

Install Cloudflare's Wrangler CLI globally:

```bash
npm install -g wrangler
```

Verify installation:
```bash
wrangler --version
```

You should see something like `3.x.x` or higher.

### Step 2: Authenticate with Cloudflare

Login to your Cloudflare account:

```bash
wrangler login
```

This will:
1. Open a browser window
2. Ask you to authorize Wrangler
3. Redirect you back with confirmation

Verify authentication:
```bash
wrangler whoami
```

You should see your account email and account ID.

### Step 3: Create D1 Database

Create the production database:

```bash
wrangler d1 create avanta-finance
```

**Expected Output:**
```
✅ Successfully created DB 'avanta-finance'
Created your database using D1's new storage backend.

[[d1_databases]]
binding = "DB"
database_name = "avanta-finance"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**Important:** Copy the `database_id` from the output.

### Step 4: Update wrangler.toml

Open `wrangler.toml` and update the database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "avanta-finance"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # ← Your actual ID here
```

Save the file.

### Step 5: Run Database Migrations

Apply the schema to create tables:

```bash
wrangler d1 execute avanta-finance --file=schema.sql
```

**Expected Output:**
```
🌀 Executing on remote database avanta-finance (database-id):
🌀 To execute on your local development database, pass the --local flag.
🚣 Executed 4 commands in 0.5s
```

Verify tables were created:
```bash
wrangler d1 execute avanta-finance --command="SELECT name FROM sqlite_master WHERE type='table'"
```

**Expected Output:**
```
┌──────────────────┐
│ name             │
├──────────────────┤
│ transactions     │
│ accounts         │
│ invoices         │
│ fiscal_payments  │
└──────────────────┘
```

### Step 6: Load Seed Data (Optional)

For testing purposes, you can load sample data:

```bash
wrangler d1 execute avanta-finance --file=seed.sql
```

**Note:** Skip this for a clean production start.

### Step 7: Create R2 Bucket

Create the storage bucket for receipts:

```bash
wrangler r2 bucket create avanta-receipts
```

**Expected Output:**
```
✅ Created bucket 'avanta-receipts' with default storage class set to Standard.
```

Verify bucket creation:
```bash
wrangler r2 bucket list
```

**Expected Output:**
```
┌───────────────────┬──────────────────────┐
│ name              │ creation_date        │
├───────────────────┼──────────────────────┤
│ avanta-receipts   │ 2025-10-14T05:00:00Z │
└───────────────────┴──────────────────────┘
```

### Step 8: Install Dependencies

```bash
npm install
```

This installs all required packages for building the application.

### Step 9: Build the Application

Build the production-ready frontend:

```bash
npm run build
```

**Expected Output:**
```
vite v5.4.20 building for production...
transforming...
✓ 51 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.49 kB │ gzip:  0.31 kB
dist/assets/index-XXXXXX.css     17.08 kB │ gzip:  3.83 kB
dist/assets/index-XXXXXX.js     227.75 kB │ gzip: 68.95 kB
✓ built in X.XXs
```

Verify the `dist/` directory was created:
```bash
ls -la dist/
```

### Step 10: Deploy to Cloudflare Pages

Deploy the application:

```bash
wrangler pages deploy dist
```

**First Time Deployment:**
You'll be prompted to create a new project:

```
? Enter the name of your new project: › avanta-finance
? Enter the production branch name: › main
```

**Expected Output:**
```
✨ Compiled Worker successfully
✨ Uploading...
✨ Deployment complete!

https://avanta-finance.pages.dev
https://abc123.avanta-finance.pages.dev
```

**Important:** Save your production URL!

### Step 11: Configure Bindings in Dashboard

Bindings connect your Workers Functions to D1 and R2.

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages**
3. Click on your project (`avanta-finance`)
4. Go to **Settings** → **Functions**
5. Scroll to **Bindings** section

#### Add D1 Database Binding:
- Click **Add binding**
- **Type:** D1 database
- **Variable name:** `DB`
- **D1 database:** Select `avanta-finance`
- Click **Save**

#### Add R2 Bucket Binding:
- Click **Add binding**
- **Type:** R2 bucket
- **Variable name:** `RECEIPTS`
- **R2 bucket:** Select `avanta-receipts`
- Click **Save**

### Step 12: Configure Environment Variables (Optional)

If you need to customize environment variables:

1. In **Settings** → **Environment variables**
2. Add variables for both **Production** and **Preview**:

```
ENABLE_ANALYTICS = true
ENABLE_DEBUG_LOGS = false
ISR_RATE = 0.20
IVA_RATE = 0.16
```

3. Click **Save**

### Step 13: Verify Deployment

Visit your production URL (e.g., `https://avanta-finance.pages.dev`)

#### Manual Verification Checklist:
- [ ] Homepage loads correctly
- [ ] Dashboard displays with balance cards
- [ ] Can navigate between pages (Home, Transactions, Fiscal, Invoices)
- [ ] Can create a new transaction
- [ ] Transaction appears in the list
- [ ] Can edit a transaction
- [ ] Can delete a transaction
- [ ] Fiscal calculations display correctly (ISR 20%, IVA 16%)
- [ ] Can upload a receipt (test with a small image)
- [ ] No console errors in browser DevTools

#### Automated Verification (Optional):
Run the test script against production:

```bash
./test-api.sh https://avanta-finance.pages.dev
```

---

## 🌐 Custom Domain Setup (Optional)

### Add a Custom Domain

1. In Cloudflare Dashboard → Workers & Pages → Your project
2. Go to **Custom domains**
3. Click **Set up a custom domain**
4. Enter your domain (e.g., `finance.yourdomain.com`)
5. Follow the DNS setup instructions

### DNS Configuration

If your domain is on Cloudflare:
- DNS records are automatically configured
- SSL certificate is automatically provisioned

If your domain is external:
- Add a CNAME record pointing to your Pages URL
- Wait for DNS propagation (5-60 minutes)

### Verify Custom Domain

Once configured:
```bash
curl -I https://finance.yourdomain.com
```

Expected: HTTP 200 status code

---

## 🔄 Continuous Deployment with GitHub Actions

### Setup GitHub Actions

1. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: avanta-finance
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

2. Add secrets to GitHub repository:

Go to **Settings** → **Secrets and variables** → **Actions**

Add these secrets:

**CLOUDFLARE_API_TOKEN:**
- Go to Cloudflare Dashboard → Profile → API Tokens
- Click **Create Token**
- Use template: **Edit Cloudflare Workers**
- Or create custom with: `Account.Cloudflare Pages:Edit`
- Copy the token

**CLOUDFLARE_ACCOUNT_ID:**
- Go to Cloudflare Dashboard → Workers & Pages
- Copy the Account ID from the right sidebar

3. Commit and push:

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions deployment"
git push origin main
```

Now every push to `main` triggers automatic deployment! 🎉

---

## 📊 Production Monitoring

### Cloudflare Analytics

1. Go to **Workers & Pages** → Your project
2. Click on **Analytics** tab

You'll see:
- Requests per second
- CPU time
- Bandwidth usage
- Error rates
- Geographic distribution

### Real-time Logs

View live logs:
```bash
wrangler pages deployment tail
```

Filter by status:
```bash
wrangler pages deployment tail --status error
```

### Custom Analytics

The application includes built-in analytics tracking:
- Page views
- User interactions
- Transaction operations
- Error tracking

See `ANALYTICS_MONITORING.md` for details.

---

## 🔍 Troubleshooting

### Issue: "Database not found"

**Solution:**
```bash
wrangler d1 list
wrangler d1 execute avanta-finance --command="SELECT 1"
```

Verify bindings in Cloudflare Dashboard.

### Issue: "R2 bucket not accessible"

**Solution:**
```bash
wrangler r2 bucket list
```

Verify R2 binding in Cloudflare Dashboard.

### Issue: "Functions not working"

**Solution:**
- Check bindings are configured in Dashboard
- Verify D1 database_id in wrangler.toml
- Check deployment logs: `wrangler pages deployment tail`

### Issue: "Build fails"

**Solution:**
```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Issue: "Deployment fails"

**Solution:**
```bash
# Check Wrangler authentication
wrangler whoami

# Re-login if needed
wrangler login

# Try deploying with verbose output
wrangler pages deploy dist --verbose
```

### Issue: "API returns 500 errors"

**Solution:**
- Check live logs: `wrangler pages deployment tail`
- Verify database has tables: `wrangler d1 execute avanta-finance --command="SELECT name FROM sqlite_master WHERE type='table'"`
- Check bindings configuration in Dashboard

### Issue: "File upload fails"

**Solution:**
- Verify R2 bucket exists: `wrangler r2 bucket list`
- Check file size (max 10MB)
- Check file type (JPEG, PNG, GIF, PDF, XML)
- Verify RECEIPTS binding in Dashboard

---

## 🎯 Production Checklist

Use this checklist before going live:

### Infrastructure
- [ ] D1 database created and migrated
- [ ] R2 bucket created
- [ ] wrangler.toml updated with correct database_id
- [ ] Application builds successfully
- [ ] Deployed to Cloudflare Pages
- [ ] Bindings configured (DB and RECEIPTS)
- [ ] Environment variables set (if needed)

### Functionality
- [ ] All pages load correctly
- [ ] Dashboard displays accurate data
- [ ] Can create transactions
- [ ] Can edit transactions
- [ ] Can delete transactions
- [ ] Can upload files
- [ ] Fiscal calculations accurate (ISR 20%, IVA 16%)
- [ ] Can create invoices
- [ ] Navigation works between pages

### Performance
- [ ] Page load time < 3 seconds
- [ ] No console errors
- [ ] Images/files load correctly
- [ ] API responses < 1 second
- [ ] Mobile responsive

### Security
- [ ] No sensitive data in client code
- [ ] CORS configured properly
- [ ] File upload validation working
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React escapes by default)

### Monitoring
- [ ] Analytics tracking enabled
- [ ] Error monitoring initialized
- [ ] Cloudflare Analytics accessible
- [ ] Can view deployment logs

### Documentation
- [ ] README.md updated
- [ ] User manual available
- [ ] API documentation current
- [ ] Deployment guide reviewed

### Optional Enhancements
- [ ] Custom domain configured
- [ ] GitHub Actions setup
- [ ] n8n workflows configured
- [ ] Backup strategy defined
- [ ] Team access configured

---

## 📈 Performance Optimization

### Caching Strategy

The application automatically uses:
- **Static assets:** Cached on CDN (1 year)
- **API responses:** Cached when appropriate
- **Database queries:** Optimized with indexes

### Geographic Distribution

Your app is deployed globally on Cloudflare's edge network:
- 310+ cities worldwide
- Automatic routing to nearest server
- Sub-100ms latency for most users

### Monitoring Performance

Check Web Vitals:
```javascript
// In browser console
PerformanceObserver.supportedEntryTypes
```

Target metrics:
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

---

## 💰 Cost Estimates

### Cloudflare Free Tier

**Included:**
- D1: 5 GB storage, 5M reads/day, 100K writes/day
- R2: 10 GB storage, 10M reads/month, 1M writes/month
- Pages: Unlimited static requests, 100K function invocations/day
- Bandwidth: Unlimited
- SSL: Free automatic certificate

**Estimated Usage (Personal Use):**
- Transactions: ~1,000 per month = ~2K DB operations
- File uploads: ~50 per month = ~50 R2 writes
- Page views: ~500 per month = ~500 function invocations

**Monthly Cost: $0** (well within free tier)

### Usage Monitoring

Check current usage:
- Dashboard → D1 → Usage
- Dashboard → R2 → Usage  
- Dashboard → Pages → Analytics

Set up alerts:
- Dashboard → Notifications
- Create alert when approaching limits

---

## 🔐 Security Best Practices

### 1. Environment Variables

Never commit secrets to Git:
```bash
# Add sensitive values as secrets
wrangler secret put N8N_WEBHOOK_SECRET
wrangler secret put API_KEY
```

### 2. CORS Configuration

Restrict API access in production:
```javascript
// functions/api/_middleware.js
const ALLOWED_ORIGINS = [
  'https://yourdomain.com',
  'https://avanta-finance.pages.dev'
];
```

### 3. Rate Limiting

Enable rate limiting in wrangler.toml:
```toml
[vars]
ENABLE_RATE_LIMITING = "true"
```

### 4. File Upload Security

Enforced by default:
- File type validation
- File size limits (10MB)
- Filename sanitization
- MIME type checking

### 5. Database Security

Protected by:
- Parameterized queries (prevents SQL injection)
- Input validation
- Type checking
- Cloudflare's zero-trust network

---

## 🆘 Emergency Procedures

### Rollback Deployment

If you need to rollback to a previous version:

1. Go to Dashboard → Workers & Pages → Your project
2. Go to **Deployments** tab
3. Find the last working deployment
4. Click **︙** (three dots) → **Rollback to this deployment**

Or via CLI:
```bash
wrangler pages deployment list
wrangler pages deployment rollback [deployment-id]
```

### Database Backup

Export database:
```bash
wrangler d1 export avanta-finance --output=backup.sql
```

Restore database:
```bash
wrangler d1 execute avanta-finance --file=backup.sql
```

### R2 Bucket Backup

List objects:
```bash
wrangler r2 object list avanta-receipts
```

Download object:
```bash
wrangler r2 object get avanta-receipts/filename.pdf --file=backup/filename.pdf
```

### Contact Support

- Cloudflare Community: https://community.cloudflare.com/
- Cloudflare Support: https://dash.cloudflare.com/?to=/:account/support
- GitHub Issues: https://github.com/AvantaDesign/avanta-coinmaster/issues

---

## 🎓 Next Steps

After successful deployment:

1. **User Testing**
   - Invite team members to test
   - Gather feedback
   - Iterate on features

2. **Documentation**
   - Share user manual with users
   - Create video tutorials
   - Set up help documentation

3. **Monitoring**
   - Set up alerting for errors
   - Monitor usage patterns
   - Track performance metrics

4. **Enhancements**
   - Add authentication (Fase 2)
   - Implement multi-user support
   - Add advanced reporting
   - Integrate n8n workflows

5. **Maintenance**
   - Weekly check of analytics
   - Monthly database review
   - Quarterly dependency updates
   - Annual security audit

---

## 📚 Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [R2 Storage Docs](https://developers.cloudflare.com/r2/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

## ✅ Success Criteria

Your deployment is successful when:

- ✅ Application is accessible via HTTPS
- ✅ All pages load without errors
- ✅ Transactions can be created, read, updated, deleted
- ✅ Files can be uploaded to R2
- ✅ Fiscal calculations are accurate
- ✅ No console errors in browser
- ✅ API responses are fast (< 1 second)
- ✅ Mobile responsive
- ✅ Analytics tracking works
- ✅ Error monitoring captures issues

---

**Congratulations!** 🎉 You've successfully deployed Avanta Finance to production!

Your application is now running on a global edge network, completely serverless, and at $0 cost (free tier).

For ongoing support, refer to the documentation or open an issue on GitHub.

**Built with ❤️ by Mateo Reyes González / Avanta Design**
