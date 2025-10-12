# Quick Start Guide - Avanta Finance

Get Avanta Finance up and running in 5 minutes!

## Prerequisites

- [Node.js 18+](https://nodejs.org/) installed
- [Git](https://git-scm.com/) installed
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)

## Local Development (No Cloudflare required)

Perfect for testing the UI and frontend functionality:

```bash
# 1. Clone the repository
git clone https://github.com/AvantaDesign/avanta-coinmaster.git
cd avanta-coinmaster

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Visit **http://localhost:5173** in your browser.

**Note:** API calls will fail in local dev mode without Cloudflare setup. The UI will still work, but no data will be saved.

## Production Deployment

For full functionality with database and file storage:

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Create D1 Database

```bash
wrangler d1 create avanta-finance
```

Copy the `database_id` from the output and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "avanta-finance"
database_id = "paste-your-database-id-here"
```

### 4. Run Database Migration

```bash
wrangler d1 execute avanta-finance --file=schema.sql
```

### 5. Create R2 Bucket

```bash
wrangler r2 bucket create avanta-receipts
```

### 6. Build and Deploy

```bash
npm run build
wrangler pages deploy dist
```

Follow the prompts and note your deployment URL!

### 7. Configure Bindings

Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → Your project → **Settings** → **Functions** → **Bindings**

Add:
- **D1 Binding**: Variable `DB`, Database `avanta-finance`
- **R2 Binding**: Variable `RECEIPTS`, Bucket `avanta-receipts`

Save and redeploy if needed.

## Verify Deployment

Visit your Cloudflare Pages URL (e.g., `https://avanta-finance.pages.dev`) and test:

1. ✅ Dashboard loads
2. ✅ Add a transaction
3. ✅ View fiscal calculations
4. ✅ Add an invoice

## Next Steps

- 📖 Read [DEVELOPMENT.md](DEVELOPMENT.md) for development guidelines
- 🚀 Read [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment info
- 🤝 Read [CONTRIBUTING.md](CONTRIBUTING.md) to contribute
- 🎨 Customize the app for your needs

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Wrangler (Cloudflare)
wrangler d1 list                              # List databases
wrangler d1 execute avanta-finance --command="SELECT * FROM transactions LIMIT 5"
wrangler r2 bucket list                       # List R2 buckets
wrangler pages deploy dist                    # Deploy to Pages
```

## Troubleshooting

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Can't connect to D1
```bash
wrangler d1 list
wrangler d1 execute avanta-finance --command="SELECT COUNT(*) FROM transactions"
```

### Need help?
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guides
- Open an [issue](https://github.com/AvantaDesign/avanta-coinmaster/issues)

## Architecture Overview

```
┌─────────────┐
│   React     │  Frontend (Vite + Tailwind)
│  Frontend   │  http://localhost:5173
└──────┬──────┘
       │
       ↓
┌─────────────┐
│  Cloudflare │  Serverless Functions
│   Workers   │  /api/dashboard, /api/transactions, etc.
└──────┬──────┘
       │
       ├──→ ┌──────────────┐
       │    │ Cloudflare   │  SQLite Database
       │    │   D1         │  transactions, accounts, invoices
       │    └──────────────┘
       │
       └──→ ┌──────────────┐
            │ Cloudflare   │  File Storage
            │   R2         │  Receipts, XMLs, PDFs
            └──────────────┘
```

## Tech Stack Summary

- **Frontend**: React 18, Tailwind CSS, Vite
- **Backend**: Cloudflare Workers (Serverless)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Hosting**: Cloudflare Pages
- **CI/CD**: GitHub Actions

## Cost

**$0/month** with Cloudflare's free tier:
- D1: 5 GB storage, 5M reads/day
- R2: 10 GB storage, 10M reads/month
- Pages: Unlimited static requests
- Workers: 100K invocations/day

---

🎉 **You're ready to manage your finances with Avanta Finance!**

For questions or issues, check out the [documentation](README.md) or open an [issue](https://github.com/AvantaDesign/avanta-coinmaster/issues).
