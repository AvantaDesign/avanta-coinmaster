# 🤖 GitHub Copilot Agent Session Prompt - Avanta Finance
## Phase 4: Advanced Features (Comprehensive Implementation)

## Project Context
You are working on **Avanta Finance**, a financial management application for Personas Físicas con Actividad Empresarial (PFAE) in Mexico. We're implementing a comprehensive plan to evolve the system into a robust, secure, and scalable financial platform.

## Current Status
- ✅ **Phase 0: COMPLETE** - Security and authentication implemented
- ✅ **Phase 1: COMPLETE** - Business vs Personal classification implemented
- ✅ **Phase 2: COMPLETE** - Credits and debts module implemented
- ✅ **Phase 3: COMPLETE** - Technical improvements and scalability implemented
- ✅ **Multi-tenancy:** All data properly isolated by user_id
- ✅ **Authentication:** JWT-based auth with Google OAuth and email/password
- ✅ **Classification:** Business/personal transaction filtering and tax calculations
- ✅ **Credits Module:** Complete credit management with payments and movements
- ✅ **State Management:** Zustand stores for transactions, accounts, and credits
- ✅ **Performance:** TanStack Virtual for large table rendering
- ✅ **Production Ready:** React frontend + Cloudflare Workers backend + D1 database + R2 storage
- ✅ **Deployed:** Live at Cloudflare Pages with full functionality
- ❌ **Phase 4: NOT IMPLEMENTED** - Advanced features missing

## This Session: Phase 4 - Advanced Features (COMPREHENSIVE IMPLEMENTATION)

**Objective:** Add features that complete the 360° financial system vision.

**CRITICAL:** This is the final phase that completes the comprehensive financial management system.

### Tasks to Implement (3 total):

#### 4.1. Budgeting Module
- **Database:** Create `budgets` table (`id`, `user_id`, `category_id`, `classification`, `amount`, `period`)
- **API:** Create endpoints `GET /api/budgets` and `POST /api/budgets`
- **UI:** Create page `src/pages/Budgets.jsx` to define monthly budgets by category (personal and business)
- **UI:** Integrate visualizations (e.g., progress bars) in dashboard and reports to compare actual vs. budgeted spending

#### 4.2. Fiscal Module Improvements
- **UI:** Create "Fiscal Configuration" section where user can update ISR tax tables annually
- **Database/API/UI:** Add `is_deductible` flag to `categories` table. UI should show suggestions when categorizing business expenses
- **UI:** Create "Fiscal Simulation" tool that projects annual tax based on current data and income/expense projections

#### 4.3. Invoice Reconciliation (CFDI)
- **Database:** Create junction table `transaction_invoice_map` (`transaction_id`, `invoice_id`)
- **UI:** In transaction view, allow user to "link" one or more invoices (CFDIs) to that payment/collection transaction
- **Component:** Improve `ReconciliationManager.jsx` to use this explicit relationship

### Files to Create/Modify:

#### Database Schema:
- `schema.sql` - Add `budgets` and `transaction_invoice_map` tables, update `categories` table
- **NEW:** `migrations/007_add_advanced_features.sql` - Advanced features migration

#### Backend APIs (3):
- **NEW:** `functions/api/budgets.js` - Budget management API
- **NEW:** `functions/api/fiscal-config.js` - Fiscal configuration API
- **NEW:** `functions/api/invoice-reconciliation.js` - Invoice reconciliation API

#### Frontend Pages (1):
- **NEW:** `src/pages/Budgets.jsx` - Budget management page

#### Frontend Components (6):
- **NEW:** `src/components/BudgetCard.jsx` - Budget display component
- **NEW:** `src/components/BudgetForm.jsx` - Budget creation/editing form
- **NEW:** `src/components/FiscalConfiguration.jsx` - Fiscal settings component
- **NEW:** `src/components/FiscalSimulation.jsx` - Tax projection tool
- **NEW:** `src/components/InvoiceLinker.jsx` - Invoice linking component
- **ENHANCED:** `src/components/ReconciliationManager.jsx` - Improved reconciliation

#### Enhanced Components (3):
- `src/pages/Home.jsx` - Add budget progress widgets
- `src/components/FinancialDashboard.jsx` - Add budget visualizations
- `src/components/AdvancedReports.jsx` - Add budget vs actual reports

#### New Utilities (2):
- **NEW:** `src/utils/budgets.js` - Budget calculation helpers
- **NEW:** `src/utils/fiscal.js` - Fiscal calculation utilities

## Implementation Plan

### Step 1: Database Schema and Migration (400 lines)
- Add `budgets` table with proper relationships
- Add `transaction_invoice_map` junction table
- Update `categories` table with `is_deductible` flag
- Create comprehensive migration script
- Add proper indexes for performance

### Step 2: Backend API Development (1,200 lines)
- Create budgets API with CRUD operations
- Create fiscal configuration API
- Create invoice reconciliation API
- Add proper validation and error handling
- Implement budget calculations and projections

### Step 3: Budgeting Module (1,500 lines)
- Create Budgets page with full functionality
- Build BudgetCard and BudgetForm components
- Implement budget progress tracking
- Add budget vs actual visualizations
- Integrate with dashboard and reports

### Step 4: Fiscal Improvements (1,000 lines)
- Create FiscalConfiguration component
- Build FiscalSimulation tool
- Add is_deductible suggestions
- Implement tax projections
- Update fiscal calculations

### Step 5: Invoice Reconciliation (800 lines)
- Create InvoiceLinker component
- Improve ReconciliationManager
- Implement transaction-invoice mapping
- Add CFDI integration features
- Update reconciliation workflows

### Step 6: Integration and Testing (600 lines)
- Integrate all components with existing system
- Add comprehensive testing
- Update documentation
- Ensure backward compatibility
- Performance optimization

## Key Files to Know - READ THESE FIRST

### **CRITICAL: Official Implementation Plan**
- **`docs/IMPLEMENTATION_PLAN.md`** - THE OFFICIAL PLAN (read this first!)
  - Phase 4 focuses on advanced features
  - Follow only what's explicitly stated in the plan
  - Do NOT add features not in this plan

### **Current Project Status**
- **`PHASE_3_IMPLEMENTATION_SUMMARY.md`** - Phase 3 implementation details
- **`PHASE_2_IMPLEMENTATION_SUMMARY.md`** - Phase 2 implementation details
- **`SESSION_SUMMARY.md`** - Phase 1 implementation details
- **`docs/PHASE_0_SUMMARY.md`** - Phase 0 implementation details
- **`README.md`** - Current project overview

### **Code Files**
- `src/pages/Home.jsx` - Needs budget widgets
- `src/components/FinancialDashboard.jsx` - Needs budget visualizations
- `src/components/AdvancedReports.jsx` - Needs budget reports
- `schema.sql` - Needs budgets and invoice mapping tables

## Session Guidelines

### **Session Length:** 50 minutes maximum
### **Code Output:** 5,500+ lines of production-ready code
### **Documentation:** Update implementation summary after completion

## Development Commands
```bash
# Local development
npm run dev

# Build for production
npm run build

# Test with Cloudflare backend
npx wrangler pages dev dist --d1 DB=avanta-finance --r2 RECEIPTS=avanta-receipts --port 8788

# Run tests
./scripts/test-production.sh https://avanta-finance.pages.dev
```

## Success Criteria
- ✅ `budgets` and `transaction_invoice_map` tables created
- ✅ `is_deductible` flag added to categories table
- ✅ Complete budgets API with all endpoints working
- ✅ Budgets page with full functionality
- ✅ Budget progress tracking and visualizations
- ✅ Fiscal configuration and simulation tools
- ✅ Invoice reconciliation with CFDI linking
- ✅ Enhanced ReconciliationManager component
- ✅ Budget vs actual reports and dashboards
- ✅ All existing functionality preserved
- ✅ Complete 360° financial system vision achieved

## Testing Checklist
1. **Database Schema:**
   - Test budgets table creation
   - Test transaction_invoice_map table creation
   - Test categories table updates
   - Test migration script

2. **Backend APIs:**
   - Test budgets API CRUD operations
   - Test fiscal configuration API
   - Test invoice reconciliation API
   - Test validation and error handling

3. **Frontend Components:**
   - Test Budgets page functionality
   - Test budget progress tracking
   - Test fiscal simulation tool
   - Test invoice linking functionality

4. **Integration:**
   - Test dashboard integration
   - Test report integration
   - Test reconciliation workflows
   - Test budget vs actual comparisons

## Database Schema Changes Required

### Add budgets table:
```sql
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category_id INTEGER,
    classification TEXT NOT NULL CHECK(classification IN ('business', 'personal')),
    amount REAL NOT NULL,
    period TEXT NOT NULL CHECK(period IN ('monthly', 'quarterly', 'yearly')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(category_id) REFERENCES categories(id)
);
```

### Add transaction_invoice_map table:
```sql
CREATE TABLE IF NOT EXISTS transaction_invoice_map (
    id TEXT PRIMARY KEY,
    transaction_id INTEGER NOT NULL,
    invoice_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(transaction_id) REFERENCES transactions(id),
    FOREIGN KEY(invoice_id) REFERENCES invoices(id),
    UNIQUE(transaction_id, invoice_id)
);
```

### Update categories table:
```sql
ALTER TABLE categories ADD COLUMN is_deductible INTEGER DEFAULT 0 CHECK(is_deductible IN (0, 1));
```

## Frontend UI Features

### Budgeting Module
- Budget creation and editing forms
- Monthly budget tracking
- Progress bars and visualizations
- Budget vs actual comparisons
- Category-based budget management

### Fiscal Improvements
- Fiscal configuration interface
- Tax rate management
- Fiscal simulation tool
- Deductible expense suggestions
- Tax projection calculations

### Invoice Reconciliation
- Transaction-invoice linking interface
- CFDI integration features
- Enhanced reconciliation workflows
- Invoice matching suggestions
- Reconciliation status tracking

## Backend API Features

### Budgets API
- `GET /api/budgets` - List all budgets
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget
- `GET /api/budgets/progress` - Get budget progress

### Fiscal Configuration API
- `GET /api/fiscal-config` - Get fiscal configuration
- `PUT /api/fiscal-config` - Update fiscal configuration
- `POST /api/fiscal-config/simulate` - Run fiscal simulation

### Invoice Reconciliation API
- `GET /api/invoice-reconciliation` - Get reconciliation data
- `POST /api/invoice-reconciliation/link` - Link transaction to invoice
- `DELETE /api/invoice-reconciliation/link` - Unlink transaction from invoice

## Integration Features

### Dashboard Integration
- Budget progress widgets
- Fiscal simulation results
- Invoice reconciliation status
- Budget vs actual summaries

### Report Integration
- Budget performance reports
- Fiscal projection reports
- Invoice reconciliation reports
- Comprehensive financial summaries

## Next Steps After This Session
- **Project Complete** - All phases implemented
- **Production Ready** - Full-featured financial management system
- **Future Enhancements** - Additional features based on user feedback

## Important Notes
- **Final Phase** - Completes the comprehensive financial system
- **360° Vision** - Full financial management capabilities
- **PFAE Focus** - Complete solution for Mexican tax requirements
- **User Experience** - Intuitive and comprehensive interface
- **Performance** - Maintain performance with all features
- **Documentation** - Update all relevant documentation

## Previous Implementation Context
Phase 3 implemented:
- ✅ Zustand state management for all data
- ✅ TanStack Virtual for large table performance
- ✅ Prop drilling elimination
- ✅ Performance optimization
- ✅ 1,620+ lines of production-ready code

**Ready to implement the final advanced features for complete 360° financial management! 🚀**

## Session Scope Summary
- **3 Official Tasks** from the plan
- **1 New Migration** to create
- **3 New Backend APIs** to create
- **1 New Page** to create
- **6 New Components** to create
- **3 Existing Components** to enhance
- **2 New Utilities** to create
- **5,500+ Lines** of code expected
- **Complete Phase 4** implementation
- **Complete 360° financial system** vision achieved