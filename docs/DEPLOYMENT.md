# Deployment Guide - Avanta Finance

This guide walks you through deploying Avanta Finance to Cloudflare Pages with D1 database and R2 storage.

**Implementation Plan V9 Status:** Phase 46 - Integration Testing & Quality Assurance  
**Database:** 43 tables + 7 views | **API Endpoints:** 78+ | **Components:** 114+

## Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier works)
- Git installed

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

## Step 3: Create D1 Database

```bash
wrangler d1 create avanta-coinmaster
```

You'll see output like:
```
✅ Successfully created DB 'avanta-coinmaster'
database_id = "abc123-def456-ghi789"
```

Copy the `database_id` and update it in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "avanta-coinmaster"
database_id = "your-database-id-here"  # Replace with your ID
```

## Step 4: Run Database Migrations

```bash
# Apply main schema
wrangler d1 execute avanta-coinmaster --file=schema.sql

# Apply all 46 migrations in order
wrangler d1 execute avanta-coinmaster --file=migrations/001_initial_schema.sql
wrangler d1 execute avanta-coinmaster --file=migrations/002_add_users.sql
# ... continue with all 46 migrations
```

Verify the tables were created (should show 43 tables):
```bash
wrangler d1 execute avanta-coinmaster --command="SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table'"
```

Verify the views were created (should show 7 views):
```bash
wrangler d1 execute avanta-coinmaster --command="SELECT COUNT(*) as view_count FROM sqlite_master WHERE type='view'"
```

## Step 5: Create R2 Bucket

```bash
wrangler r2 bucket create avanta-receipts
```

The bucket name in `wrangler.toml` should already match:
```toml
[[r2_buckets]]
binding = "RECEIPTS"
bucket_name = "avanta-receipts"
```

## Step 6: Build the Application

```bash
npm install
npm run build
```

This creates a `dist/` folder with your production-ready frontend.

## Step 7: Deploy to Cloudflare Pages

```bash
wrangler pages deploy dist
```

Follow the prompts:
- Project name: `avanta-finance` (or your preferred name)
- Production branch: `main`

After deployment, you'll get a URL like:
```
https://avanta-finance.pages.dev
```

## Step 8: Configure Bindings in Cloudflare Dashboard

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → Your project
3. Go to **Settings** → **Functions** → **Bindings**
4. Add D1 database binding:
   - Variable name: `DB`
   - D1 database: Select `avanta-finance`
5. Add R2 bucket binding:
   - Variable name: `RECEIPTS`
   - R2 bucket: Select `avanta-receipts`
6. Click **Save**

## Step 9: Verify Deployment

Visit your deployed URL and test:
- ✅ Dashboard loads
- ✅ Can add transactions
- ✅ Fiscal calculations work
- ✅ Database health check: `curl https://avanta-coinmaster.pages.dev/api/health`
- ✅ All 78+ API endpoints functional
- ✅ All 114+ React components working

## Continuous Deployment with GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
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

Add secrets to your GitHub repository:
- `CLOUDFLARE_API_TOKEN`: Get from Cloudflare Dashboard → Profile → API Tokens
- `CLOUDFLARE_ACCOUNT_ID`: Get from Cloudflare Dashboard → Workers & Pages → Account ID

## Local Development

To run the app locally:

```bash
# Frontend only (without Workers)
npm run dev

# With Cloudflare Workers (requires Wrangler)
npm run build
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts
```

## Troubleshooting

### Database not found
```bash
wrangler d1 list
wrangler d1 execute avanta-finance --command="SELECT COUNT(*) FROM transactions"
```

### R2 bucket not accessible
```bash
wrangler r2 bucket list
```

### Functions not working
Check bindings in Cloudflare Dashboard:
- Workers & Pages → Your project → Settings → Functions → Bindings

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## Production Checklist

- [ ] D1 database created and migrated (43 tables + 7 views)
- [ ] R2 bucket created
- [ ] wrangler.toml updated with correct IDs
- [ ] Application builds successfully (114+ components)
- [ ] Deployed to Cloudflare Pages
- [ ] Bindings configured in dashboard
- [ ] All pages load correctly
- [ ] All 78+ API endpoints working
- [ ] File uploads working
- [ ] Database health check passing
- [ ] Implementation Plan V9 Phase 46 requirements met

## Costs

With Cloudflare's free tier:
- **D1**: 5 GB storage, 5M reads/day, 100K writes/day
- **R2**: 10 GB storage, 10M reads/month, 1M writes/month
- **Pages**: Unlimited static requests, 100K function invocations/day

**Total monthly cost: $0** for most personal use cases.

## Next Steps

- Set up custom domain (optional)
- Configure GitHub Actions for auto-deploy
- Set up monitoring and analytics
- Implement backup strategy
- Add authentication (Fase 2)

---

For support, check the [README.md](README.md) or open an issue on GitHub.
