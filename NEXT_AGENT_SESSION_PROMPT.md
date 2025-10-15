# 🤖 GitHub Copilot Agent Session Prompt - Avanta Finance
## Phase 1: Business vs Personal Logic (Foundational Priority)

## Project Context
You are working on **Avanta Finance**, a financial management application for Personas Físicas con Actividad Empresarial (PFAE) in Mexico. We're implementing a comprehensive plan to evolve the system into a robust, secure, and scalable financial platform.

## Current Status
- ✅ **Phase 0: COMPLETE** - Security and authentication implemented
- ✅ **Multi-tenancy:** All data properly isolated by user_id
- ✅ **Authentication:** JWT-based auth with Google OAuth and email/password
- ✅ **Production Ready:** React frontend + Cloudflare Workers backend + D1 database + R2 storage
- ✅ **Deployed:** Live at Cloudflare Pages with full functionality
- ❌ **Phase 1: NOT IMPLEMENTED** - Business vs Personal classification missing

## This Session: Phase 1 - Business vs Personal Logic (FOUNDATIONAL PRIORITY)

**Objective:** Implement the ability to classify transactions as "Business" or "Personal" to enable correct fiscal calculations and clear financial vision.

**CRITICAL:** This phase is foundational - it enables proper tax calculations and financial reporting for PFAE users.

### Tasks to Implement (4 total):

#### 1.1. Modify Database Schema
- **Action:** Add `classification` column to `transactions` table
- **Schema Change:**
  ```sql
  ALTER TABLE transactions ADD COLUMN classification TEXT NOT NULL DEFAULT 'personal' CHECK(classification IN ('business', 'personal'));
  ```
- **Action:** Create migration in `/migrations` to apply this change

#### 1.2. Update Backend API
- **Endpoints:** `POST /api/transactions`, `PUT /api/transactions/:id`
- **Action:** Modify endpoints to accept and validate the new `classification` field
- **Validation:** Ensure classification is either 'business' or 'personal'

#### 1.3. Update Frontend UI
- **Component:** `AddTransaction.jsx`
- **Action:** Add ToggleButton or Select for user to choose "Personal" or "Business" when creating/editing transactions
- **Component:** `TransactionTable.jsx`
- **Action:** Add column or visual indicator (e.g., color label) to show classification
- **Action:** Add filter control for user to view "All", "Personal", or "Business" transactions

#### 1.4. Adapt Calculation and Reporting Logic
- **Components:** `FiscalCalculator.jsx`, `FinancialDashboard.jsx`, `AdvancedReports.jsx`
- **Action:** Modify data retrieval and processing logic to use `classification` filter
- **Example:** `FiscalCalculator` should ONLY use transactions with `classification = 'business'` for calculating ISR taxable base and creditable/transferred IVA

### Files to Create/Modify:

#### Database Schema:
- `schema.sql` - Add `classification` column to transactions table
- **NEW:** `migrations/005_add_transaction_classification.sql` - Classification migration

#### Backend APIs (2):
- `functions/api/transactions.js` - Add classification field handling
- `functions/api/reports.js` - Add classification-based filtering

#### Frontend Components (4):
- `src/components/AddTransaction.jsx` - Add classification selector
- `src/components/TransactionTable.jsx` - Add classification display and filtering
- `src/components/FiscalCalculator.jsx` - Use business-only transactions for tax calculations
- `src/components/FinancialDashboard.jsx` - Add classification-based views

#### Enhanced Components (2):
- `src/components/AdvancedReports.jsx` - Add classification filtering
- `src/pages/Transactions.jsx` - Add classification filter controls

#### New Utilities (1):
- **NEW:** `src/utils/classification.js` - Classification helpers and validation

## Implementation Plan

### Step 1: Database Schema Update (500 lines)
- Add `classification` column to transactions table
- Create migration script for existing data
- Update database indexes for performance
- Handle data migration for existing transactions

### Step 2: Backend API Enhancement (800 lines)
- Update transaction endpoints to handle classification
- Add classification validation
- Update report endpoints with classification filtering
- Add business/personal transaction filtering

### Step 3: Frontend UI Updates (1,200 lines)
- Add classification selector to AddTransaction component
- Update TransactionTable with classification display
- Add classification filtering controls
- Implement visual indicators for classification

### Step 4: Calculation Logic Updates (1,000 lines)
- Update FiscalCalculator to use business-only transactions
- Modify FinancialDashboard for classification-based views
- Update AdvancedReports with classification filtering
- Add business vs personal financial summaries

### Step 5: Integration and Testing (500 lines)
- Integrate all components with classification logic
- Add comprehensive testing for classification features
- Update documentation and user guides
- Ensure backward compatibility

## Key Files to Know - READ THESE FIRST

### **CRITICAL: Official Implementation Plan**
- **`docs/IMPLEMENTATION_PLAN.md`** - THE OFFICIAL PLAN (read this first!)
  - Phase 1 is foundational priority
  - Follow only what's explicitly stated in the plan
  - Do NOT add features not in this plan

### **Current Project Status**
- **`docs/PHASE_0_SUMMARY.md`** - Phase 0 implementation details
- **`README.md`** - Current project overview

### **Code Files**
- `src/components/AddTransaction.jsx` - Needs classification selector
- `src/components/TransactionTable.jsx` - Needs classification display
- `functions/api/transactions.js` - Needs classification handling
- `schema.sql` - Needs classification column

## Session Guidelines

### **Session Length:** 50 minutes maximum
### **Code Output:** 4,000+ lines of production-ready code
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
- ✅ `classification` column added to transactions table
- ✅ Migration script created and tested
- ✅ Backend API accepts and validates classification field
- ✅ Frontend UI has classification selector
- ✅ Transaction table shows classification with visual indicators
- ✅ Classification filtering works correctly
- ✅ FiscalCalculator uses business-only transactions
- ✅ FinancialDashboard shows classification-based views
- ✅ AdvancedReports supports classification filtering
- ✅ All existing functionality preserved
- ✅ User can easily switch between business/personal views

## Testing Checklist
1. **Database Schema:**
   - Test classification column addition
   - Test migration of existing data
   - Test classification constraints
   - Test database performance

2. **Backend API:**
   - Test classification field validation
   - Test transaction creation with classification
   - Test transaction updates with classification
   - Test classification-based filtering

3. **Frontend UI:**
   - Test classification selector in AddTransaction
   - Test classification display in TransactionTable
   - Test classification filtering controls
   - Test visual indicators for classification

4. **Calculation Logic:**
   - Test FiscalCalculator with business-only transactions
   - Test FinancialDashboard classification views
   - Test AdvancedReports classification filtering
   - Test business vs personal summaries

## Database Schema Changes Required

### Add classification to transactions table:
```sql
-- Add classification column to transactions table
ALTER TABLE transactions ADD COLUMN classification TEXT NOT NULL DEFAULT 'personal' CHECK(classification IN ('business', 'personal'));

-- Update indexes for performance
CREATE INDEX idx_transactions_classification ON transactions(classification);
CREATE INDEX idx_transactions_user_classification ON transactions(user_id, classification);

-- Migration for existing data
UPDATE transactions SET classification = 'personal' WHERE classification IS NULL;
```

## Frontend UI Features

### Classification Selector
- Toggle button or dropdown in AddTransaction
- Default to 'personal' for new transactions
- Clear visual distinction between options
- Validation and error handling

### Transaction Table Enhancements
- Classification column with visual indicators
- Color-coded labels (e.g., blue for business, green for personal)
- Filter controls (All, Business, Personal)
- Sort by classification option

### Dashboard Views
- Business-only financial summary
- Personal-only financial summary
- Combined view with clear separation
- Classification-based charts and graphs

## Backend API Features

### Transaction Endpoints
- Accept classification field in POST/PUT requests
- Validate classification values
- Return classification in GET responses
- Support classification-based filtering

### Report Endpoints
- Business-only transaction reports
- Personal-only transaction reports
- Combined reports with classification breakdown
- Classification-based analytics

## Fiscal Calculation Updates

### Business-Only Calculations
- ISR taxable base calculation using business transactions only
- IVA creditable/transferred calculation using business transactions only
- Business expense deductions
- Business income reporting

### Personal Calculations
- Personal expense tracking
- Personal income reporting
- Personal financial health metrics
- Personal budget management

## Next Steps After This Session
- **Phase 2:** Credits and debts module
- **Phase 3:** Technical improvements and scalability
- **Phase 4:** Advanced features (budgets, fiscal improvements)

## Important Notes
- **Foundational Priority** - This phase enables proper tax calculations
- **PFAE Focus** - Essential for Persona Física con Actividad Empresarial
- **Tax Compliance** - Enables correct Mexican tax calculations
- **User Experience** - Clear separation of business vs personal finances
- **Performance** - Maintain performance with classification filtering
- **Documentation** - Update all relevant documentation

## Previous Implementation Context
Phase 0 implemented:
- ✅ Complete authentication system
- ✅ Multi-tenant architecture
- ✅ JWT-based security
- ✅ User data isolation
- ✅ Protected routes and API security

**Ready to implement business vs personal classification as the foundation for proper tax calculations! 🚀**

## Session Scope Summary
- **4 Official Tasks** from the plan
- **1 New Migration** to create
- **6 Existing Components** to enhance
- **2 Backend APIs** to update
- **1 New Utility** to create
- **4,000+ Lines** of code expected
- **Complete Phase 1** implementation
- **Foundational classification** for all fiscal calculations