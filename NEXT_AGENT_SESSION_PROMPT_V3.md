# 🤖 GitHub Copilot Agent Session Prompt - Avanta Finance
## Phase 3: Business Logic & Advanced Features Implementation

## Project Context
You are working on **Avanta Finance**, a comprehensive financial management application for Personas Físicas con Actividad Empresarial (PFAE) in Mexico. **PHASES 1 & 2 ARE COMPLETE** - the application now has production-ready security and data integrity.

## Current Status - PHASES 1 & 2 COMPLETE ✅
- ✅ **Phase 1: COMPLETE** - Critical security hardening implemented
  - Secure password hashing with Web Crypto API
  - JWT implementation with `jose` library  
  - Global authentication middleware
  - User data isolation (13 queries fixed)
- ✅ **Phase 2: COMPLETE** - Data integrity and calculation accuracy
  - `decimal.js` integration for precise financial calculations
  - D1.batch() for atomic database operations
  - 6 API files updated with precision fixes
- ✅ **Production Ready:** React frontend + Cloudflare Workers backend + D1 database + R2 storage
- ✅ **Deployed:** Live at Cloudflare Pages with full functionality
- ✅ **Total Implementation:** 20,000+ lines of production code

## This Session: Phase 3 - Business Logic & Advanced Features

**Objective:** Implement core business logic features that distinguish between personal and business transactions, enabling proper fiscal calculations and comprehensive financial management.

**CRITICAL:** This is Phase 3 of the implementation plan. Focus on business vs personal classification and advanced financial features.

### Phase 3 Tasks:

#### Task 3.1: Business vs Personal Transaction Classification
- Add `classification` column to transactions table (business/personal)
- Update transaction creation/editing UI with classification toggle
- Modify all financial calculations to filter by classification
- Update fiscal calculator to use only business transactions for tax calculations
- Create migration script for existing transactions

#### Task 3.2: Advanced Budget Management System
- Implement comprehensive budgeting with category-based limits
- Add budget vs actual spending analysis
- Create budget alerts and notifications
- Integrate budget tracking into dashboard
- Add budget performance metrics

#### Task 3.3: Enhanced Fiscal Module
- Implement fiscal configuration management
- Add deductible expense tracking
- Create fiscal simulation tool
- Implement invoice reconciliation system
- Add CFDI integration for Mexican tax compliance

#### Task 3.4: Credits and Debts Management
- Create credits table with credit cards, loans, mortgages
- Implement credit movements tracking
- Add payment due date alerts
- Create credit utilization monitoring
- Integrate credit management with transaction system

## Implementation Guidelines

### **Session Length:** 60-90 minutes maximum
### **Code Output:** Production-ready Phase 3 business features
### **Documentation:** Update business logic documentation

## Key Files to Modify (Phase 3)

### **Database Schema Updates**
- **`schema.sql`** - Add classification column, credits tables
- **`migrations/`** - Create migration scripts for new tables

### **Backend API Updates**
- **`functions/api/transactions.js`** - Add classification logic
- **`functions/api/budgets.js`** - Enhanced budget management
- **`functions/api/fiscal.js`** - Business-only calculations
- **`functions/api/credits.js`** - New credits management
- **`functions/api/fiscal-config.js`** - Fiscal configuration

### **Frontend Components**
- **`src/components/AddTransaction.jsx`** - Classification toggle
- **`src/components/TransactionTable.jsx`** - Classification display
- **`src/components/BudgetForm.jsx`** - Enhanced budget creation
- **`src/components/FiscalConfiguration.jsx`** - Fiscal settings
- **`src/components/CreditManager.jsx`** - New credits component

### **New Pages**
- **`src/pages/Budgets.jsx`** - Budget management page
- **`src/pages/Credits.jsx`** - Credits and debts page
- **`src/pages/Fiscal.jsx`** - Enhanced fiscal tools

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

## Success Criteria for Phase 3
- ✅ **Task 3.1 Complete:** Business/personal classification implemented
- ✅ **Task 3.2 Complete:** Advanced budget management system
- ✅ **Task 3.3 Complete:** Enhanced fiscal module with configuration
- ✅ **Task 3.4 Complete:** Credits and debts management
- ✅ **All calculations accurate** - Business vs personal properly separated
- ✅ **Fiscal compliance** - Mexican tax calculations correct
- ✅ **User experience** - Intuitive classification and management
- ✅ **Data integrity** - All operations use decimal.js and batch()

## Testing Checklist for Phase 3
1. **Classification Testing:**
   - Transactions can be classified as business/personal
   - Fiscal calculations use only business transactions
   - Personal transactions excluded from tax calculations
   - Classification persists correctly

2. **Budget Management Testing:**
   - Budgets can be created by category and classification
   - Budget vs actual spending tracked accurately
   - Budget alerts work correctly
   - Budget performance metrics accurate

3. **Fiscal Module Testing:**
   - Fiscal configuration can be updated
   - Deductible expenses properly tracked
   - Fiscal simulation produces accurate projections
   - Invoice reconciliation works correctly

4. **Credits Management Testing:**
   - Credits can be created and managed
   - Payment due dates tracked correctly
   - Credit utilization calculated accurately
   - Integration with transaction system works

## Next Steps After This Session
- **Phase 3 Complete** - Business logic and advanced features implemented
- **Fiscal Compliance** - Proper Mexican tax calculations
- **Advanced Management** - Budgets, credits, and fiscal tools
- **Ready for Phase 4** - Technical improvements and scalability
- **Documentation Updated** - Business logic documented

## Important Notes
- **Phase 3 Focus** - Complete the four tasks listed above
- **Business Logic First** - Proper classification and fiscal compliance
- **User Experience** - Intuitive interfaces for complex features
- **Data Accuracy** - All calculations must be precise
- **Testing Required** - All features must be tested and verified

## Previous Implementation Context
Security and data integrity phases completed:
- ✅ Phase 1: Critical Security Hardening (1,024+ lines)
- ✅ Phase 2: Data Integrity & Calculation Accuracy (574+ lines)

**Total Security & Integrity: 1,598+ lines of secure, accurate code**

**Ready to implement Phase 3 business logic! 💼**

## Session Scope Summary
- **Phase 3 Only** - Focus on business logic and advanced features
- **Transaction Classification** - Business vs personal separation
- **Budget Management** - Advanced budgeting with tracking
- **Fiscal Compliance** - Mexican tax calculations and CFDI
- **Credits Management** - Comprehensive credit and debt tracking
- **Production Ready** - Build upon secure, accurate foundation
- **Complete System** - Full-featured financial management platform
