# Phase 20: Bank Reconciliation

## Project Context

You are working on the Avanta Finance application, a comprehensive financial management system built with React, Vite, and Cloudflare Workers. The project is located at D:\AVANTA DESIGN CODE\avanta-coinmaster.

## Implementation Plan Reference

**CRITICAL**: Always refer to the master implementation plan at `IMPLEMENTATION_PLAN_V7.md` for complete project context and progress tracking. This file contains:

- ✅ **Phases 1-19**: COMPLETED (Comprehensive financial management system including Income Module, CFDI Control & Validation, and Core Tax Calculation Engine)
- 🚧 **Phase 20**: CURRENT PHASE (Bank Reconciliation)
- 📋 **Phases 21-29**: Future phases

**IMPORTANT**: You must update the `IMPLEMENTATION_PLAN_V7.md` file with your progress as you complete each task.

## Current Task: Phase 20 - Bank Reconciliation

**Goal**: Automate the verification of the "pago efectivamente realizado" requirement by reconciling bank statements with system transactions.

## Context from Previous Phases

Phase 19 successfully implemented:
- ✅ Core tax calculation engine for ISR and IVA
- ✅ Monthly provisional ISR calculations with tariff tables
- ✅ Definitive IVA calculations with balance carry-forward
- ✅ Tax reports and declaration summaries
- ✅ Complete tax calculation UI with history and reporting

The system now needs bank reconciliation to:
1. Verify that transactions recorded in the system match actual bank movements
2. Ensure compliance with the "pago efectivamente realizado" requirement for deductibility
3. Identify discrepancies between system records and bank statements
4. Automate the matching process to save time and reduce errors

## Actionable Steps

### 1. Database Schema - Bank Reconciliation

**Create Migration**: `migrations/027_add_bank_reconciliation.sql`

Create `bank_statements` table:
- id (PRIMARY KEY)
- user_id (INTEGER, foreign key)
- account_id (INTEGER, foreign key to accounts table)
- statement_date (TEXT)
- file_name (TEXT)
- file_url (TEXT) - for R2 storage
- total_credits (DECIMAL)
- total_debits (DECIMAL)
- opening_balance (DECIMAL)
- closing_balance (DECIMAL)
- status (uploaded, processing, reconciled, error)
- created_at, updated_at

Create `bank_movements` table:
- id (PRIMARY KEY)
- statement_id (INTEGER, foreign key)
- user_id (INTEGER, foreign key)
- movement_date (TEXT)
- description (TEXT)
- reference (TEXT)
- amount (DECIMAL)
- type (credit, debit)
- balance (DECIMAL)
- transaction_id (INTEGER, foreign key to transactions) - NULL if unmatched
- match_status (unmatched, matched, suggested, manual, ignored)
- match_confidence (DECIMAL 0-1)
- created_at, updated_at

Create `reconciliation_rules` table:
- id (PRIMARY KEY)
- user_id (INTEGER, foreign key)
- rule_name (TEXT)
- description_pattern (TEXT) - regex pattern
- amount_tolerance (DECIMAL) - acceptable difference
- date_tolerance (INTEGER) - days before/after
- auto_match (BOOLEAN)
- priority (INTEGER)
- is_active (BOOLEAN)
- created_at, updated_at

### 2. Backend API Development

**Create** `functions/api/bank-statements.js`:
- GET: List bank statements with filtering
- POST: Upload and parse bank statement CSV
- PUT: Update statement status
- DELETE: Delete statement and movements
- GET `/api/bank-statements/:id/movements`: Get movements for a statement

**Create** `functions/api/bank-reconciliation.js`:
- POST `/api/bank-reconciliation/match`: Run automatic matching
- GET `/api/bank-reconciliation/suggestions/:movement_id`: Get match suggestions
- POST `/api/bank-reconciliation/link`: Manually link movement to transaction
- POST `/api/bank-reconciliation/unlink`: Unlink a matched pair
- GET `/api/bank-reconciliation/summary/:statement_id`: Get reconciliation summary

**CSV Parsing Logic**:
- Support multiple CSV formats (detect automatically or with templates)
- Parse common Mexican bank formats (Banamex, BBVA, Santander, etc.)
- Handle different date formats (dd/mm/yyyy, mm/dd/yyyy, etc.)
- Extract: date, description, reference, amount, type, balance
- Validate data integrity

**Automatic Matching Algorithm**:
1. **Exact Match**: Same date, same amount, similar description
2. **Fuzzy Match**: Date within tolerance, amount exact or within tolerance
3. **Smart Match**: Pattern recognition (invoice numbers, references)
4. **Confidence Scoring**: Calculate match probability (0-1 scale)
5. **Multi-criteria**: Use reconciliation rules for custom matching

**Matching Criteria**:
- Date proximity (exact, ±1 day, ±3 days, ±7 days)
- Amount exact match or within tolerance (e.g., ±$1 for fees)
- Description similarity (fuzzy string matching)
- Reference number matching (CFDI UUID, invoice numbers)
- Transaction type alignment (credit/debit vs income/expense)

### 3. Frontend UI - Bank Reconciliation

**Create** `src/components/BankReconciliation.jsx`:

**Main Interface**:
- Statement upload area (drag & drop or file picker)
- CSV format selector / template manager
- Statement list with summary info
- Reconciliation dashboard

**Upload Workflow**:
1. Select bank account
2. Upload CSV file
3. Preview parsed data
4. Confirm and import
5. Automatic matching starts

**Reconciliation Interface**:
- Three-column layout:
  - **Left**: Unmatched bank movements
  - **Center**: Suggestions and actions
  - **Right**: System transactions
- Match status indicators (matched, suggested, unmatched)
- Confidence scores for suggestions
- Manual linking interface (drag & drop or click-to-link)
- Bulk actions (approve suggestions, ignore movements)

**Summary Dashboard**:
- Total movements processed
- Matched count and percentage
- Unmatched movements (bank and system)
- Suggested matches pending review
- Discrepancies and potential issues
- Export reconciliation report

**CSV Format Templates**:
- Built-in templates for major Mexican banks
- Custom template creator
- Column mapping interface
- Date format selector
- Amount format handling (negative for debits, separate columns, etc.)

### 4. Reconciliation Rules Management

**Create** `src/components/ReconciliationRules.jsx`:
- List of active rules
- Create/edit rule interface
- Rule testing with sample data
- Priority ordering (drag to reorder)
- Enable/disable rules

**Rule Configuration**:
- Description pattern (regex or simple text match)
- Amount tolerance (fixed amount or percentage)
- Date tolerance (days)
- Auto-match toggle
- Custom matching logic

### 5. Integration & Automation

**Bank Statement Auto-Import**:
- API integration foundation for bank APIs (future)
- Scheduled imports (future with n8n)
- Email parsing for bank statements (future)

**Transaction Validation**:
- Mark transactions as "bank verified" when matched
- Update transaction payment_date with actual bank date
- Flag discrepancies for review
- Audit trail for all matching decisions

**Tax Calculation Integration**:
- Only count "bank verified" transactions for deductions (optional rule)
- Enhance tax calculations with verified payment dates
- Generate compliance reports for SAT

### 6. Data Visualization

**Reconciliation Charts**:
- Match rate over time
- Unmatched items trend
- Most common discrepancies
- Processing time metrics

## Verification Steps

1. ✅ Run `npm run build` to ensure the application compiles without errors
2. ✅ Test CSV upload with sample bank statements
3. ✅ Verify automatic matching algorithm with different scenarios
4. ✅ Test manual linking and unlinking
5. ✅ Test reconciliation rules creation and application
6. ✅ Verify summary calculations and reporting
7. ✅ Test with statements from multiple banks
8. ✅ Test date and amount tolerance settings
9. ✅ Verify mobile responsiveness
10. ✅ Test dark mode appearance

## Progress Tracking

- **MANDATORY**: Update `IMPLEMENTATION_PLAN_V7.md` with checkmarks (✅) as you complete each task
- **MANDATORY**: Create a completion summary document `PHASE_20_BANK_RECONCILIATION_SUMMARY.md` when finished
- Commit your changes with descriptive messages
- Mark Phase 20 as completed when all tasks are done

## Technical Considerations

### CSV Parsing
- Handle different encodings (UTF-8, ISO-8859-1, Windows-1252)
- Support different delimiters (comma, semicolon, tab)
- Handle quoted fields with embedded delimiters
- Skip header rows intelligently
- Validate data types (dates, numbers)

### Matching Algorithm
- Use Levenshtein distance for description similarity
- Implement date range queries efficiently
- Cache matching results for performance
- Handle edge cases (same amount/date, different transactions)
- Provide explanation for match confidence scores

### Performance
- Process large CSV files efficiently (thousands of rows)
- Implement pagination for movement lists
- Use database indexes for date and amount queries
- Consider background processing for large imports
- Show progress indicators during processing

### Security
- Validate uploaded files (CSV only, size limits)
- Sanitize CSV data before database insert
- Store bank statements securely in R2
- Audit all reconciliation actions
- Implement proper access controls

### Data Integrity
- Use database transactions for atomic operations
- Validate balance calculations
- Prevent duplicate movement imports
- Handle statement updates/corrections
- Maintain reconciliation history

## Mexican Banking Context

### Common Bank Statement Formats
- **Banamex**: Date, Description, Withdrawal, Deposit, Balance
- **BBVA**: Date, Reference, Concept, Amount, Balance
- **Santander**: Date, Description, Debit, Credit, Balance
- **Banorte**: Date, Concept, Charge, Payment, Balance

### Typical Issues
- Different date formats (dd/mm/yyyy vs yyyy-mm-dd)
- Amount formats (1,234.56 vs 1.234,56)
- Multiple currencies in same statement
- Bank fees not recorded in system
- Timing differences (transaction vs settlement date)

### Compliance Requirements
- "Pago efectivamente realizado" verification
- Proof of payment for deductions
- Bank statement archiving (5+ years)
- Reconciliation documentation for audits

## User Experience Goals

1. **Simplicity**: Upload CSV, review suggestions, confirm matches
2. **Transparency**: Show why matches were suggested (confidence, criteria)
3. **Control**: Allow users to override automatic matches
4. **Speed**: Process statements in seconds, not minutes
5. **Accuracy**: High confidence in automatic matches (>95%)
6. **Flexibility**: Support custom rules and bank formats
7. **Feedback**: Clear status indicators and progress tracking

## Database Indexes

Create appropriate indexes for:
- bank_movements (statement_id, movement_date, amount, match_status)
- bank_movements (user_id, match_status, movement_date)
- bank_statements (user_id, account_id, statement_date)
- reconciliation_rules (user_id, is_active, priority)

## Error Handling

- CSV parsing errors (malformed data)
- Duplicate statement uploads
- Missing columns in CSV
- Invalid date/amount formats
- Network errors during upload
- Database constraint violations
- Matching algorithm failures

## Future Enhancements (Not in Phase 20)

- API integration with bank systems
- Machine learning for matching improvement
- OCR for PDF bank statements
- Multi-currency reconciliation
- Automated email statement parsing
- Mobile app for quick reconciliation
- Real-time bank feed integration

## Next Step

Upon successful completion and verification of all Phase 20 tasks, generate and output the complete, self-contained prompt for **Phase 21: Advanced Declarations (DIOT & Contabilidad Electrónica)**, following this same instructional format and referencing the updated implementation plan.

---

**Phase 20 Status**: 🚧 PENDING  
**Prerequisites**: Phase 19 (Tax Calculation Engine) - ✅ COMPLETED  
**Estimated Complexity**: High (CSV parsing, matching algorithms, UI complexity)  
**Priority**: High (Essential for tax compliance)
