# 🤖 GitHub Copilot Agent Session Prompt - Avanta CoinMaster 2.0
## Phase 1: Advanced Transaction Classification (Official Plan)

## Project Context
You are working on **Avanta CoinMaster 2.0**, a financial management application for Personas Físicas con Actividad Empresarial (PFAE) in Mexico. We're transforming it from a basic transaction aggregator into an intelligent financial assistant.

## Current Status
- ✅ **Phase 0: COMPLETE** - All usability improvements implemented
- ✅ **Production Ready:** React frontend + Cloudflare Workers backend + D1 database + R2 storage
- ✅ **Deployed:** Live at Cloudflare Pages with full functionality

## This Session: Phase 1 - Advanced Transaction Classification

**Objective:** Allow users to differentiate granularly between personal and business transactions, and link expenses to their fiscal receipts.

### Tasks to Implement (2 total):

#### 1.1. Update Data Model
**Task:** Modify the database schema to support the new logic.
**File:** `schema.sql`
**Changes:**
1. In the `transactions` table, add the following columns:
   - `type` TEXT CHECK(type IN ('business', 'personal', 'transfer')) NOT NULL DEFAULT 'personal';
   - `category_id` INTEGER; -- FK to categories table
   - `linked_invoice_id` INTEGER; -- FK to invoices/CFDIs table
   - `notes` TEXT;
   - `is_deleted` BOOLEAN DEFAULT FALSE;

#### 1.2. Extend Transactions API
**Task:** Update backend endpoints to handle the new fields.
**File:** `functions/api/transactions.js`
**Changes:**
1. Modify the `POST` endpoint to accept the new fields.
2. Create a `PATCH /:id` endpoint for editing.
3. Modify the `DELETE /:id` endpoint to perform logical deletion (set `is_deleted` to `true`).
4. Create a `POST /:id/restore` endpoint to revert logical deletion.

### Files to Create/Modify:

#### Database Schema:
- `schema.sql` - Add new transaction columns

#### Backend API:
- `functions/api/transactions.js` - Extend with new fields and endpoints

#### Frontend Components (as needed):
- Update existing transaction components to handle new fields
- Add UI for transaction type selection (business/personal/transfer)
- Add UI for linking transactions to invoices
- Add UI for soft delete/restore functionality

## Implementation Plan

### Step 1: Database Schema Update (300 lines)
- Add new columns to transactions table
- Ensure proper constraints and defaults
- Update existing data with default values

### Step 2: Backend API Extension (1,500 lines)
- Modify POST endpoint for new fields
- Create PATCH endpoint for updates
- Implement soft delete (DELETE sets is_deleted = true)
- Create restore endpoint (POST /:id/restore)
- Handle new field validation

### Step 3: Frontend Integration (1,200 lines)
- Update transaction forms to include new fields
- Add transaction type selection UI
- Add invoice linking interface
- Add soft delete/restore functionality
- Update transaction display to show new fields

### Step 4: Testing & Validation (500 lines)
- Test all new API endpoints
- Verify database schema changes
- Test frontend integration
- Validate soft delete functionality

## Key Files to Know
- `docs/IMPLEMENTATION_PLAN.md` - Official implementation plan
- `IMPLEMENTATION_SUMMARY.md` - Current project status
- `schema.sql` - Database schema
- `functions/api/transactions.js` - Transactions API
- `src/components/AddTransaction.jsx` - Transaction creation
- `src/components/TransactionTable.jsx` - Transaction display

## Session Guidelines

### **Session Length:** 50 minutes maximum
### **Code Output:** 3,500+ lines of production-ready code
### **Documentation:** Update `IMPLEMENTATION_SUMMARY.md` after completion

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
- ✅ Database schema updated with new transaction fields
- ✅ POST endpoint accepts new fields
- ✅ PATCH endpoint for transaction updates
- ✅ Soft delete functionality (DELETE sets is_deleted = true)
- ✅ Restore endpoint (POST /:id/restore)
- ✅ Frontend integration with new fields
- ✅ Transaction type selection UI
- ✅ Invoice linking interface
- ✅ Soft delete/restore UI
- ✅ No breaking changes to existing functionality

## Testing Checklist
1. **Database Schema:**
   - Verify new columns are added
   - Test constraints work properly
   - Verify default values

2. **API Endpoints:**
   - Test POST with new fields
   - Test PATCH for updates
   - Test soft delete functionality
   - Test restore functionality

3. **Frontend Integration:**
   - Test transaction creation with new fields
   - Test transaction editing
   - Test soft delete/restore
   - Test invoice linking

## Database Schema Changes Required

```sql
-- Add new columns to transactions table
ALTER TABLE transactions ADD COLUMN type TEXT CHECK(type IN ('business', 'personal', 'transfer')) NOT NULL DEFAULT 'personal';
ALTER TABLE transactions ADD COLUMN category_id INTEGER;
ALTER TABLE transactions ADD COLUMN linked_invoice_id INTEGER;
ALTER TABLE transactions ADD COLUMN notes TEXT;
ALTER TABLE transactions ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;
```

## API Endpoints to Implement

### POST /api/transactions
- Accept new fields: type, category_id, linked_invoice_id, notes
- Validate transaction type
- Handle foreign key relationships

### PATCH /api/transactions/:id
- Update existing transaction with new fields
- Validate changes
- Return updated transaction

### DELETE /api/transactions/:id
- Set is_deleted = true (soft delete)
- Don't actually delete the record
- Return success confirmation

### POST /api/transactions/:id/restore
- Set is_deleted = false
- Restore soft-deleted transaction
- Return restored transaction

## Frontend Integration Points

### Transaction Creation Form
- Add transaction type selector (business/personal/transfer)
- Add category selection (if category_id is used)
- Add invoice linking field
- Add notes field

### Transaction Display
- Show transaction type with visual indicators
- Show linked invoice information
- Show notes if present
- Add soft delete/restore buttons

### Transaction Editing
- Allow editing of new fields
- Maintain data integrity
- Show edit history

## Next Steps After This Session
- **Phase 2:** Fiscal module and reconciliation
- **Phase 3:** Automation and accounts receivable/payable
- **Phase 4:** Advanced analytics and UX improvements

## Important Notes
- **Follow Official Plan** - Only implement what's explicitly stated in the plan
- **Database Migration** - Update schema.sql with new columns
- **Backward Compatibility** - Ensure existing data works with new schema
- **Soft Delete** - Implement logical deletion, not physical deletion
- **Foreign Keys** - Handle category_id and linked_invoice_id relationships
- **Validation** - Ensure transaction type constraints are enforced

## Previous Session Context
The previous session completed Phase 0 with:
- ✅ CSV import with column mapping
- ✅ Export system (CSV/Excel)
- ✅ Toast notifications
- ✅ Smart category suggestions
- ✅ Complete usability improvements

**Ready to implement Phase 1 according to the official plan! 🚀**

## Session Scope Summary
- **2 Official Tasks** from the plan
- **Database schema update** with 5 new columns
- **4 API endpoints** to implement/modify
- **Frontend integration** for new fields
- **3,500+ Lines** of code expected
- **Complete Phase 1** implementation