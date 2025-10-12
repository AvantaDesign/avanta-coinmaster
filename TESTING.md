# Testing Checklist - Avanta Finance

Use this checklist to verify all features are working correctly after deployment or changes.

## Environment Setup

- [ ] Node.js 18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Build succeeds (`npm run build`)
- [ ] Dev server starts (`npm run dev`)

## Database (D1)

- [ ] Database created (`wrangler d1 create avanta-finance`)
- [ ] Schema applied (`wrangler d1 execute avanta-finance --file=schema.sql`)
- [ ] Tables exist (transactions, accounts, invoices, fiscal_payments)
- [ ] Seed data loaded (`wrangler d1 execute avanta-finance --file=seed.sql`)
- [ ] Can query data (`wrangler d1 execute avanta-finance --command="SELECT COUNT(*) FROM transactions"`)

## Storage (R2)

- [ ] Bucket created (`wrangler r2 bucket create avanta-receipts`)
- [ ] Bucket is accessible (`wrangler r2 bucket list`)

## Deployment

- [ ] wrangler.toml configured with correct database_id
- [ ] Application built (`npm run build`)
- [ ] Deployed to Cloudflare Pages (`wrangler pages deploy dist`)
- [ ] D1 binding configured in dashboard
- [ ] R2 binding configured in dashboard
- [ ] Deployment URL accessible

## Frontend Tests

### Navigation
- [ ] Dashboard page loads (`/`)
- [ ] Transactions page loads (`/transactions`)
- [ ] Fiscal page loads (`/fiscal`)
- [ ] Invoices page loads (`/invoices`)
- [ ] Navigation links work
- [ ] Back button works
- [ ] URL routing works

### Dashboard Page
- [ ] Balance cards display correctly
- [ ] "Balance Total" shows correct amount
- [ ] "Ingresos del Mes" shows correct amount
- [ ] "Gastos del Mes" shows correct amount
- [ ] Recent transactions table displays
- [ ] Transaction data is accurate
- [ ] Quick action buttons work
- [ ] Links to other pages work

### Transactions Page
- [ ] Transaction table loads
- [ ] Transactions display with correct data
- [ ] Date formatting is correct
- [ ] Currency formatting is correct (MXN)
- [ ] Category badges show correct colors
- [ ] Type badges show correct colors (ingreso=green, gasto=red)
- [ ] Deducible indicator works (✓)
- [ ] Filter buttons work (Todas, Personal, Avanta)
- [ ] Transaction count is accurate

#### Add Transaction Form
- [ ] Form displays when page loads
- [ ] All fields are present (date, amount, description, type, category, account, deducible)
- [ ] Date defaults to today
- [ ] Amount accepts decimal values
- [ ] Type dropdown works (ingreso/gasto)
- [ ] Category dropdown works (personal/avanta)
- [ ] Deducible checkbox works
- [ ] Submit button is enabled
- [ ] Form validation works (required fields)
- [ ] Success: Transaction is added
- [ ] Success: Form resets after submit
- [ ] Success: Table refreshes with new transaction
- [ ] Error handling displays errors

#### Transaction Actions
- [ ] Delete button appears on each row
- [ ] Delete confirmation prompt appears
- [ ] Delete removes transaction from table
- [ ] Delete refreshes the table
- [ ] Error handling for failed delete

### Fiscal Page
- [ ] Month selector displays all months
- [ ] Year selector displays years
- [ ] Defaults to current month/year
- [ ] Changing month/year updates calculations
- [ ] "Ingresos Totales" displays correctly
- [ ] "Gastos Deducibles" displays correctly
- [ ] "Utilidad" calculation is correct (income - deductible)
- [ ] "Fecha Límite" shows 17th of next month
- [ ] ISR calculation is correct (~20% of utilidad)
- [ ] IVA calculation is correct (16% cobrado - 16% pagado)
- [ ] Currency formatting is correct
- [ ] Date formatting is correct
- [ ] Note about simplified calculations displays

### Invoices Page
- [ ] Invoices table loads
- [ ] Invoices display with correct data
- [ ] UUID truncation works (shows first 20 chars)
- [ ] Date formatting is correct
- [ ] Total amount formatting is correct
- [ ] Status badge colors are correct (active=green)
- [ ] "Agregar Factura" button works
- [ ] Empty state shows when no invoices

#### Add Invoice Form
- [ ] Form appears when "Agregar Factura" clicked
- [ ] "Cancelar" button hides form
- [ ] All fields present (UUID, RFC emisor/receptor, date, subtotal, IVA, total)
- [ ] Date defaults to today
- [ ] Amount fields accept decimals
- [ ] File upload component appears
- [ ] Submit button works
- [ ] Form validation works
- [ ] Success: Invoice added to table
- [ ] Success: Form resets
- [ ] Success: Form closes
- [ ] Error handling displays errors

## API Tests

### GET /api/dashboard
- [ ] Returns 200 status
- [ ] Returns totalBalance
- [ ] Returns thisMonth.income
- [ ] Returns thisMonth.expenses
- [ ] Returns recentTransactions array
- [ ] Data is accurate

### GET /api/transactions
- [ ] Returns 200 status
- [ ] Returns array of transactions
- [ ] Filter by category works (`?category=avanta`)
- [ ] Limit works (`?limit=10`)
- [ ] Transactions are ordered by date DESC

### POST /api/transactions
- [ ] Returns 201 status on success
- [ ] Creates transaction in database
- [ ] Returns transaction ID
- [ ] Required field validation works
- [ ] Returns 400 for invalid data

### DELETE /api/transactions/:id
- [ ] Returns 200 status on success
- [ ] Removes transaction from database
- [ ] Returns success: true
- [ ] Returns 404 for non-existent ID

### GET /api/accounts
- [ ] Returns 200 status
- [ ] Returns array of accounts
- [ ] Accounts ordered by type and name

### PUT /api/accounts/:id
- [ ] Returns 200 status on success
- [ ] Updates account balance
- [ ] Returns success: true
- [ ] Validation works (requires balance)

### GET /api/fiscal
- [ ] Returns 200 status
- [ ] Accepts month parameter
- [ ] Accepts year parameter
- [ ] Returns income, deductible, utilidad
- [ ] Returns ISR calculation
- [ ] Returns IVA calculation
- [ ] Returns dueDate
- [ ] Calculations are accurate

### GET /api/invoices
- [ ] Returns 200 status
- [ ] Returns array of invoices
- [ ] Invoices ordered by date DESC

### POST /api/invoices
- [ ] Returns 201 status on success
- [ ] Creates invoice in database
- [ ] Returns invoice ID
- [ ] Required field validation works
- [ ] UUID uniqueness enforced

### POST /api/upload
- [ ] Returns 201 status on success
- [ ] Accepts file upload
- [ ] Stores file in R2
- [ ] Returns file URL
- [ ] Returns 400 if no file provided

## Responsive Design

### Desktop (1920px)
- [ ] Navigation bar displays correctly
- [ ] All pages display full width
- [ ] Tables fit without scrolling
- [ ] Forms display in grid layout

### Tablet (768px)
- [ ] Navigation collapses appropriately
- [ ] Cards stack vertically if needed
- [ ] Tables scroll horizontally if needed
- [ ] Forms remain usable

### Mobile (375px)
- [ ] Navigation is mobile-friendly
- [ ] Cards stack vertically
- [ ] Tables scroll horizontally
- [ ] Forms are single-column
- [ ] Buttons are touch-friendly
- [ ] All text is readable

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Performance

- [ ] Initial page load < 3 seconds
- [ ] Navigation is instant
- [ ] API responses < 1 second
- [ ] Build size is reasonable (< 500KB JS)
- [ ] No console errors
- [ ] No console warnings (important ones)

## Security

- [ ] HTTPS enabled (Cloudflare)
- [ ] No sensitive data in URLs
- [ ] No sensitive data in console
- [ ] No API keys exposed in frontend
- [ ] CORS configured correctly

## Error Handling

- [ ] Network errors display user-friendly messages
- [ ] API errors display user-friendly messages
- [ ] Loading states show "Loading..." or spinner
- [ ] Empty states show appropriate messages
- [ ] Form validation errors are clear
- [ ] 404 page (if configured)

## Data Accuracy

### Fiscal Calculations
- [ ] ISR = (income - deductible) * 0.20
- [ ] IVA = (income * 0.16) - (deductible * 0.16)
- [ ] Only "avanta" category transactions count
- [ ] Only deductible=1 transactions count for deductions
- [ ] Date range is correct for month

### Currency Formatting
- [ ] Shows "MXN" or "$" symbol
- [ ] Two decimal places
- [ ] Thousands separator (comma)
- [ ] Example: $1,234.56

### Date Formatting
- [ ] Spanish format (e.g., "12 oct 2025")
- [ ] Correct timezone handling
- [ ] ISO format in API (YYYY-MM-DD)

## Accessibility (Basic)

- [ ] All buttons have visible labels
- [ ] Form inputs have labels
- [ ] Color contrast is sufficient
- [ ] Keyboard navigation works
- [ ] Tables are readable with screen readers

## Documentation

- [ ] README.md is accurate
- [ ] DEPLOYMENT.md steps work
- [ ] DEVELOPMENT.md is accurate
- [ ] QUICKSTART.md steps work
- [ ] Code comments are helpful

## GitHub Actions (if configured)

- [ ] Workflow file exists (`.github/workflows/deploy.yml`)
- [ ] Secrets configured (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID)
- [ ] Push to main triggers deploy
- [ ] Build succeeds in CI
- [ ] Deploy succeeds in CI
- [ ] Deployed URL is updated

## Known Limitations (MVP)

These are expected and documented:
- [ ] No authentication (single user)
- [ ] No edit transaction (only delete/re-add)
- [ ] No CSV import yet (Semana 2)
- [ ] No XML parser yet (Semana 2)
- [ ] No export to Excel/PDF yet (Semana 2)
- [ ] No charts on dashboard (placeholder)
- [ ] Simplified fiscal calculations
- [ ] No audit logs

---

## Test Report Template

```
Date: ___________
Tester: ___________
Environment: [ ] Local [ ] Staging [ ] Production
Build Version: ___________

Passed: ___ / Total: ___
Failed: ___

Issues Found:
1. 
2. 
3. 

Notes:
```

---

## Regression Testing

Run this checklist after:
- [ ] Major feature additions
- [ ] API changes
- [ ] Database schema changes
- [ ] Dependency updates
- [ ] Before production deployment

---

**Last Updated:** 2025-10-12
