# 🎯 Quick Reference - Real Backend Development

## ⚡ Essential Commands

### Start Development
```bash
# Build + Start with D1 and R2
npm run build && npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788
```

### Database Operations
```bash
# List databases
wrangler d1 list

# Query data
wrangler d1 execute avanta-finance --command="SELECT * FROM transactions LIMIT 5"

# Run migration
wrangler d1 execute avanta-finance --file=schema.sql

# Load seed data
wrangler d1 execute avanta-finance --file=seed.sql

# Backup database
wrangler d1 export avanta-finance --output=backup.sql
```

### Storage Operations
```bash
# List buckets
wrangler r2 bucket list

# List files
wrangler r2 object list avanta-receipts

# Create bucket
wrangler r2 bucket create avanta-receipts
```

### Testing
```bash
# Automated API tests
./test-api.sh http://localhost:8788

# Build check
npm run build

# Manual test
curl http://localhost:8788/api/dashboard | jq
```

---

## 📍 Important URLs

**Local Development:**
- Application: http://localhost:8788
- Dashboard API: http://localhost:8788/api/dashboard
- Transactions API: http://localhost:8788/api/transactions
- Fiscal API: http://localhost:8788/api/fiscal

**Production:**
- Replace `localhost:8788` with your Pages deployment URL

---

## 🔑 Key Changes

### What's Different Now
- ❌ **Removed:** Mock data system (`USE_MOCK_DATA`)
- ✅ **Now:** All API calls use real backend
- ✅ **Files:** api.js simplified (99 lines from 145)
- ✅ **Benefit:** Dev = Production behavior

### Where to Look
```
src/utils/api.js          → API client (NO MOCK DATA)
src/utils/mockData.js     → DEPRECATED (reference only)
functions/api/            → Backend endpoints (6 files)
wrangler.toml             → D1 + R2 configuration
```

---

## 🚨 Common Issues & Fixes

**Issue:** API returns 503
```bash
# Fix: Check D1 binding
npx wrangler pages dev dist --d1 DB=avanta-finance
```

**Issue:** No data shows
```bash
# Fix: Load seed data
wrangler d1 execute avanta-finance --file=seed.sql
```

**Issue:** Upload fails
```bash
# Fix: Check R2 binding
npx wrangler pages dev dist --r2 RECEIPTS=avanta-receipts
```

---

## 💡 Tax Rates (Mexican System)

```javascript
ISR = 20%  // Income tax (simplified)
IVA = 16%  // Value added tax
Due Date = 17th of next month
```

### Calculation Example
```javascript
Income:           $18,200
Deductible:       $9,900
Utilidad:         $8,300  (18200 - 9900)
ISR (20%):        $1,660  (8300 × 0.20)
IVA (16%):        $1,328  ((18200 - 9900) × 0.16)
```

---

## 📋 Quick Checklist

**Before Development:**
- [ ] Wrangler CLI installed
- [ ] Cloudflare logged in (`wrangler login`)
- [ ] D1 database created
- [ ] Database ID in wrangler.toml
- [ ] Schema migrated
- [ ] Seed data loaded
- [ ] R2 bucket created

**Start Coding:**
- [ ] `npm install`
- [ ] `npm run build`
- [ ] `npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts`
- [ ] Open http://localhost:8788
- [ ] Check browser console (no errors)

**Testing:**
- [ ] All pages load
- [ ] CRUD operations work
- [ ] Fiscal calculations correct
- [ ] File uploads work

---

## 📚 Documentation

**Essential Reads:**
1. [BACKEND_INTEGRATION_GUIDE.md](BACKEND_INTEGRATION_GUIDE.md) - Full migration guide
2. [LOCAL_TESTING.md](LOCAL_TESTING.md) - Testing procedures
3. [D1_TESTING_GUIDE.md](D1_TESTING_GUIDE.md) - Database testing
4. [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - API reference

**Quick Links:**
- Setup: [QUICKSTART.md](QUICKSTART.md)
- Deploy: [DEPLOYMENT.md](DEPLOYMENT.md)
- Architecture: [README.md](README.md)

---

## 🎯 API Endpoints Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/dashboard` | GET | Financial summary |
| `/api/transactions` | GET, POST | List/Create transactions |
| `/api/transactions/:id` | GET, PUT, DELETE | Single transaction ops |
| `/api/accounts` | GET | List accounts |
| `/api/accounts/:id` | PUT | Update balance |
| `/api/fiscal` | GET | ISR/IVA calculations |
| `/api/invoices` | GET, POST | CFDI management |
| `/api/upload` | POST, GET | File upload/download |

---

## ⚙️ Environment Variables (wrangler.toml)

```toml
[vars]
ENVIRONMENT = "production"
ISR_RATE = "0.20"  # 20%
IVA_RATE = "0.16"  # 16%
MAX_FILE_SIZE_MB = "10"
```

---

## 🎓 Remember

1. **No Mock Data:** Everything uses real backend now
2. **D1 Required:** Can't run without database
3. **Build First:** Always build before running wrangler
4. **Port 8788:** Default dev server port
5. **CORS Enabled:** All endpoints support cross-origin

---

**Last Updated:** October 2025  
**Status:** ✅ Production Ready
