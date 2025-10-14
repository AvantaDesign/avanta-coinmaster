# Phase 1: Advanced Transaction Classification - Testing Guide

## Test Date: October 14, 2025
## Version: Phase 1 - Complete Implementation

---

## Overview

This document provides comprehensive testing procedures for Phase 1: Advanced Transaction Classification features. These features extend the transaction model with advanced classification options, soft delete functionality, and improved data organization.

---

## Features to Test

### 1. Database Schema Changes
- New `transaction_type` field (business/personal/transfer)
- New `category_id` field (link to categories)
- New `linked_invoice_id` field (link to invoices/CFDIs)
- New `notes` field (up to 1000 characters)
- New `is_deleted` field (soft delete flag)

### 2. Backend API Enhancements
- POST endpoint accepts new fields
- PATCH endpoint for partial updates
- DELETE endpoint performs soft delete
- POST /:id/restore endpoint for restoration
- GET endpoint filters soft-deleted by default

### 3. Frontend Integration
- Transaction type selector in creation form
- Category and invoice dropdowns
- Notes textarea with character counter
- Visual indicators in transaction table
- Soft delete/restore functionality

---

## Test Procedures

### A. Database Migration Tests

#### A1. Apply Migration
```bash
# Option 1: Using wrangler CLI (for production D1)
wrangler d1 execute avanta-finance --file=migrations/002_add_advanced_transaction_classification.sql

# Option 2: Using local D1 database
npx wrangler d1 execute avanta-finance --local --file=migrations/002_add_advanced_transaction_classification.sql
```

**Expected Result:**
- All 5 new columns added successfully
- Indexes created without errors
- Existing transactions updated with default values

#### A2. Verify Schema
```bash
wrangler d1 execute avanta-finance --command="PRAGMA table_info(transactions);"
```

**Expected Columns:**
- transaction_type (TEXT)
- category_id (INTEGER)
- linked_invoice_id (INTEGER)
- notes (TEXT)
- is_deleted (INTEGER)

---

### B. API Endpoint Tests

#### B1. POST /api/transactions - Create with New Fields

**Test Case 1: Create Business Transaction**
```bash
curl -X POST http://localhost:8788/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-14",
    "description": "Consultoría cliente ABC",
    "amount": 10000,
    "type": "ingreso",
    "category": "avanta",
    "transaction_type": "business",
    "category_id": 1,
    "notes": "Proyecto de desarrollo web"
  }'
```

**Expected Response:**
- Status: 201 Created
- Response includes all fields including new ones
- transaction_type = "business"

**Test Case 2: Create Transfer Transaction**
```bash
curl -X POST http://localhost:8788/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-14",
    "description": "Transferencia entre cuentas",
    "amount": 5000,
    "type": "gasto",
    "category": "personal",
    "transaction_type": "transfer",
    "notes": "De BBVA a Azteca"
  }'
```

**Expected Response:**
- Status: 201 Created
- transaction_type = "transfer"

#### B2. GET /api/transactions - List with Filters

**Test Case 1: Filter by Transaction Type**
```bash
curl "http://localhost:8788/api/transactions?transaction_type=business"
```

**Expected Response:**
- Only business transactions returned
- Soft-deleted transactions excluded by default

**Test Case 2: Include Statistics**
```bash
curl "http://localhost:8788/api/transactions?include_stats=true"
```

**Expected Response:**
- Response includes statistics object
- Statistics exclude soft-deleted transactions

**Test Case 3: Include Deleted Transactions**
```bash
curl "http://localhost:8788/api/transactions?include_deleted=true"
```

**Expected Response:**
- All transactions returned including soft-deleted ones

#### B3. PATCH /api/transactions/:id - Update Transaction

**Test Case: Update Transaction Type and Notes**
```bash
curl -X PATCH http://localhost:8788/api/transactions/1 \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_type": "business",
    "notes": "Actualizado con nueva clasificación",
    "linked_invoice_id": 5
  }'
```

**Expected Response:**
- Status: 200 OK
- Only specified fields updated
- Other fields remain unchanged

#### B4. DELETE /api/transactions/:id - Soft Delete

**Test Case: Soft Delete Transaction**
```bash
curl -X DELETE "http://localhost:8788/api/transactions/1?confirm=true"
```

**Expected Response:**
- Status: 200 OK
- is_deleted set to 1
- Transaction data preserved

**Test Case: Hard Delete (Permanent)**
```bash
curl -X DELETE "http://localhost:8788/api/transactions/1?confirm=true&permanent=true"
```

**Expected Response:**
- Status: 200 OK
- Transaction permanently removed from database

#### B5. POST /api/transactions/:id/restore - Restore Deleted

**Test Case: Restore Soft-Deleted Transaction**
```bash
curl -X POST http://localhost:8788/api/transactions/1/restore \
  -H "Content-Type: application/json"
```

**Expected Response:**
- Status: 200 OK
- is_deleted set to 0
- Transaction visible in normal queries

**Test Case: Restore Non-Deleted Transaction (Error)**
```bash
curl -X POST http://localhost:8788/api/transactions/2/restore \
  -H "Content-Type: application/json"
```

**Expected Response:**
- Status: 400 Bad Request
- Error: "Transaction is not deleted"

---

### C. Frontend Integration Tests

#### C1. Transaction Creation Form

**Test Steps:**
1. Navigate to Transactions page
2. Scroll to "Agregar Transacción" form
3. Fill in basic fields (date, amount, description)
4. Scroll to "Clasificación Avanzada" section

**Expected UI:**
- New section header: "Clasificación Avanzada"
- Transaction Type dropdown with 3 options:
  - Personal
  - Negocio
  - Transferencia
- Category dropdown (populated from categories table)
- Invoice dropdown (populated from invoices table)
- Notes textarea with character counter (0/1000)

**Test Case 1: Create Business Transaction**
- Select "Negocio" as transaction type
- Select a category
- Add notes
- Submit form

**Expected Result:**
- Success notification
- Form resets
- Transaction appears in table with 💼 icon

**Test Case 2: Test Notes Character Limit**
- Enter more than 1000 characters in notes field
- Submit form

**Expected Result:**
- Character counter shows correct count
- Validation prevents submission if over 1000 chars

#### C2. Transaction Table Display

**Test Steps:**
1. Navigate to Transactions page
2. View transaction table

**Expected UI:**
- New "Clasificación" column added
- Visual indicators for transaction types:
  - 💼 Negocio (purple badge)
  - 🔄 Transfer (yellow badge)
  - 👤 Personal (gray badge)
- 📄 icon for transactions with linked invoices
- 📝 icon for transactions with notes (hover to see notes)

**Test Case: Hover Over Icons**
- Hover over 📝 icon

**Expected Result:**
- Tooltip shows transaction notes

#### C3. Inline Editing

**Test Steps:**
1. Click edit icon (✏️) on a transaction
2. Edit mode activates

**Expected UI:**
- All fields editable including transaction_type
- Transaction type dropdown shows with emojis
- Save and Cancel buttons visible

**Test Case: Edit Transaction Type**
- Change from "Personal" to "Negocio"
- Click save

**Expected Result:**
- Success notification
- Badge updates to 💼 Negocio
- Edit mode closes

#### C4. Soft Delete and Restore

**Test Case 1: Soft Delete Transaction**
1. Click delete icon (🗑️) on a transaction
2. Confirm deletion dialog

**Expected Result:**
- Dialog says "Se puede restaurar después"
- Success notification: "eliminada exitosamente (soft delete)"
- Transaction disappears from list
- Transaction still in database with is_deleted=1

**Test Case 2: View Deleted Transactions**
- Apply filter to show deleted transactions
- OR query API with include_deleted=true

**Expected Result:**
- Deleted transactions visible with indicator
- Restore button available

**Test Case 3: Restore Transaction**
- Click restore button on deleted transaction

**Expected Result:**
- Success notification: "restaurada exitosamente"
- Transaction reappears in normal list
- All data preserved

#### C5. Mobile Responsive Design

**Test Steps:**
1. Resize browser to mobile width (< 768px)
2. View transaction cards

**Expected UI:**
- All new badges visible in mobile view
- Transaction type badge shows with emoji
- Linked invoice and notes badges present
- Badges wrap properly in flex-wrap layout

---

### D. Validation Tests

#### D1. API Validation

**Test Case 1: Invalid Transaction Type**
```bash
curl -X POST http://localhost:8788/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-14",
    "description": "Test",
    "amount": 100,
    "type": "ingreso",
    "category": "personal",
    "transaction_type": "invalid"
  }'
```

**Expected Response:**
- Status: 400 Bad Request
- Error: "transaction_type must be business, personal, or transfer"

**Test Case 2: Invalid Category ID**
```bash
curl -X POST http://localhost:8788/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-14",
    "description": "Test",
    "amount": 100,
    "type": "ingreso",
    "category": "personal",
    "category_id": "abc"
  }'
```

**Expected Response:**
- Status: 400 Bad Request
- Error: "category_id must be a positive integer"

**Test Case 3: Notes Too Long**
```bash
# Create a string longer than 1000 characters
curl -X POST http://localhost:8788/api/transactions \
  -H "Content-Type: application/json" \
  -d "{
    \"date\": \"2025-10-14\",
    \"description\": \"Test\",
    \"amount\": 100,
    \"type\": \"ingreso\",
    \"category\": \"personal\",
    \"notes\": \"$(python3 -c 'print("a" * 1001)')\"
  }"
```

**Expected Response:**
- Status: 400 Bad Request
- Error: "notes must be 1000 characters or less"

---

### E. Backward Compatibility Tests

#### E1. Existing Transactions

**Test Case: Query Old Transactions**
```bash
curl "http://localhost:8788/api/transactions"
```

**Expected Result:**
- All existing transactions returned
- New fields have default values:
  - transaction_type = "personal"
  - category_id = null
  - linked_invoice_id = null
  - notes = null or ""
  - is_deleted = 0
- No errors or missing data

#### E2. Old API Calls Still Work

**Test Case: Create Transaction Without New Fields**
```bash
curl -X POST http://localhost:8788/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-10-14",
    "description": "Old style transaction",
    "amount": 500,
    "type": "gasto",
    "category": "personal"
  }'
```

**Expected Response:**
- Status: 201 Created
- Transaction created successfully
- New fields auto-populated with defaults

---

## Performance Tests

### F1. Query Performance with New Indexes

**Test Case: Query by Transaction Type**
```bash
# Time the query
time curl "http://localhost:8788/api/transactions?transaction_type=business&limit=1000"
```

**Expected Result:**
- Query completes in < 100ms
- Index on transaction_type used efficiently

### F2. Soft Delete Impact

**Test Case: Query Performance with Many Deleted Transactions**
1. Create 1000 transactions
2. Soft delete 500 of them
3. Query all active transactions

**Expected Result:**
- Query performance not significantly degraded
- Index on is_deleted used for filtering

---

## Integration Tests

### G1. End-to-End Workflow

**Scenario: Complete Transaction Lifecycle**
1. Create new business transaction with all fields
2. Link it to an invoice
3. Add notes
4. View in transaction table
5. Edit transaction type
6. Soft delete transaction
7. Restore transaction
8. Hard delete transaction

**Expected Result:**
- All steps complete successfully
- Data integrity maintained throughout
- No errors or data loss

---

## Known Issues & Limitations

### Current Limitations
1. Foreign key constraints not enforced at database level (D1 limitation)
2. Validation of category_id and linked_invoice_id happens at application level
3. Restore button not yet visible in UI (needs filter to show deleted transactions)

### Future Enhancements
- Add UI filter to view deleted transactions
- Add restore button in transaction table
- Add bulk operations for new fields
- Add audit log for transaction changes

---

## Test Checklist

Use this checklist to track testing progress:

- [ ] A1. Database migration applied successfully
- [ ] A2. Schema verified with all new columns
- [ ] B1. POST endpoint with new fields tested
- [ ] B2. GET endpoint with new filters tested
- [ ] B3. PATCH endpoint tested
- [ ] B4. DELETE soft delete tested
- [ ] B5. Restore endpoint tested
- [ ] C1. Transaction form displays new fields
- [ ] C2. Transaction table shows new columns
- [ ] C3. Inline editing works with new fields
- [ ] C4. Soft delete/restore functionality works
- [ ] C5. Mobile view renders correctly
- [ ] D1. API validation prevents invalid data
- [ ] E1. Backward compatibility maintained
- [ ] E2. Old API calls still work
- [ ] F1. Query performance acceptable
- [ ] G1. End-to-end workflow successful

---

## Reporting Issues

If you encounter any issues during testing:

1. Note the exact steps to reproduce
2. Record the expected vs actual behavior
3. Capture error messages or screenshots
4. Check browser console for errors
5. Verify API responses with curl/Postman

---

## Success Criteria

Phase 1 implementation is considered successful if:

✅ All database migrations complete without errors
✅ All API endpoints function as documented
✅ Frontend displays and saves new fields correctly
✅ Soft delete preserves data integrity
✅ Restore functionality works reliably
✅ Backward compatibility maintained
✅ No breaking changes to existing features
✅ Mobile responsive design preserved
✅ Performance impact is minimal

---

## Next Steps After Testing

Once all tests pass:
1. Update IMPLEMENTATION_SUMMARY.md
2. Deploy to staging environment
3. Perform user acceptance testing
4. Deploy to production
5. Monitor for issues
6. Begin Phase 2 planning
