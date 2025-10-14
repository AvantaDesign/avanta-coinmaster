# Changelog

All notable changes to Avanta Finance will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-10-14 - Backend Integration Update

### 🔄 Changed
- **BREAKING:** Removed mock data system - all environments now require real backend
- Simplified `src/utils/api.js` from 145 to 99 lines (-46 lines)
- Development and production now use identical code paths

### ✨ Added
- `BACKEND_INTEGRATION_GUIDE.md` - Comprehensive migration documentation (450+ lines)
- `QUICK_REFERENCE.md` - Developer quick reference guide (150+ lines)
- Safety confirmation parameter for delete operations (`?confirm=true`)

### 📝 Updated
- `IMPLEMENTATION_SUMMARY.md` - Added migration section with benefits
- `README.md` - Updated Implementation Status with backend notes
- `TESTING_PLAN.md` - Marked mock data as deprecated
- `LOCAL_TESTING.md` - Updated with deprecation notices
- `src/utils/mockData.js` - Added deprecation notice (kept for reference)

### 🐛 Fixed
- Consistent behavior between development and production environments
- Eliminated dual code paths that could cause integration issues

### ✅ Verified
- Build successful: 192.49 kB bundle (59.51 kB gzipped)
- Mexican tax calculations intact: ISR 20%, IVA 16%
- All 6 API endpoints functional with D1 database
- No breaking changes to API contracts

### 📊 Statistics
- Total files modified: 8
- Code improvements: -46 lines in api.js
- New documentation: +600 lines
- Build modules: 45 (optimized)

---

## [1.0.0] - 2025-10-12

### Added - Initial Release (Semana 1 MVP)

#### Infrastructure
- Cloudflare Pages deployment configuration
- Cloudflare D1 database setup
- Cloudflare R2 storage for receipts
- Vite build configuration with React and Tailwind CSS
- GitHub Actions workflow for continuous deployment

#### Backend (Cloudflare Workers Functions)
- `GET /api/dashboard` - Dashboard summary endpoint
- `GET /api/transactions` - List transactions with filters
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `GET /api/accounts` - List bank accounts
- `PUT /api/accounts/:id` - Update account balance
- `GET /api/fiscal` - Calculate ISR and IVA for a month
- `GET /api/invoices` - List CFDI invoices
- `POST /api/invoices` - Create new invoice
- `POST /api/upload` - Upload files to R2 storage

#### Database Schema
- `transactions` table - Financial transactions
- `accounts` table - Bank accounts and credit cards
- `invoices` table - CFDI invoices
- `fiscal_payments` table - Tax payment tracking
- Indexes for optimized queries
- Default accounts seeding

#### Frontend (React)
- Dashboard page with balance cards and recent transactions
- Transactions page with CRUD operations
- Fiscal page with ISR/IVA calculations
- Invoices page with CFDI management
- Responsive navigation with React Router
- Tailwind CSS styling

#### Components
- `AddTransaction` - Form to add new transactions
- `TransactionTable` - Display transactions with actions
- `BalanceCard` - Display financial summaries
- `MonthlyChart` - Visualize income/expenses over time
- `FileUpload` - Upload files to R2

#### Utilities
- API client functions for all endpoints
- Fiscal calculation helpers (ISR, IVA)
- Currency and date formatting
- Mexican peso (MXN) formatting

#### Documentation
- Comprehensive README with project overview
- DEPLOYMENT.md with step-by-step deployment guide
- DEVELOPMENT.md with development guidelines
- Inline code comments

#### Features Implemented
- ✅ Schema base de datos
- ✅ Frontend React básico
- ✅ API Workers Functions
- ✅ Dashboard principal
- ✅ CRUD transacciones
- ✅ Cálculo fiscal simple
- ✅ Upload archivos
- ✅ Deploy Cloudflare Pages

### Technical Details
- React 18.2.0
- Vite 5.0.8
- Tailwind CSS 3.3.6
- React Router 6.20.0
- SQLite (via Cloudflare D1)
- Zero-cost hosting on Cloudflare free tier

### Notes
- Fiscal calculations are simplified for personal tracking
- No authentication in MVP (single user)
- Mobile-responsive UI
- All data stored in Cloudflare D1 (SQLite)
- File storage in Cloudflare R2

## [Planned] - Semana 2

### To Be Added
- [ ] Import CSV from banks (BBVA, Azteca)
- [ ] Parser for CFDI XML files
- [ ] n8n workflow integrations
- [ ] Enhanced charts and graphs
- [ ] Excel/PDF export functionality
- [ ] Improved mobile responsive design

## [Future] - Fase 2

### Planned Features
- [ ] Bank API integrations (BBVA, Azteca)
- [ ] AI-powered transaction classification
- [ ] Advanced dashboard with Chart.js
- [ ] Multi-user support with authentication
- [ ] React Native mobile app
- [ ] Automatic backup system
- [ ] Transition to "persona moral" (corporate entity)
- [ ] OAuth Google authentication
- [ ] Encrypted sensitive fields
- [ ] Audit logs
- [ ] Automated tax filing integration

---

## Version History

- **1.0.0** - Initial MVP release (Semana 1 complete)
- **0.0.0** - Project planning and README creation
