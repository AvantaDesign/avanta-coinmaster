# Phase 8: Tax Modernization and Reconciliation

## Project Context

You are working on the Avanta Finance application, a comprehensive financial management system built with React, Vite, and Cloudflare Workers. The project is located at `/home/runner/work/avanta-coinmaster/avanta-coinmaster`.

## Implementation Plan Reference

**CRITICAL:** Always refer to the master implementation plan at `IMPLEMENTATION_PLAN_V5.md` for complete project context and progress tracking. This file contains:

✅ **Phase 1-7:** COMPLETED
🚧 **Phase 8:** CURRENT PHASE (Tax Modernization and Reconciliation)
📋 **Phase 9-10:** Future phases

**IMPORTANT:** You must update the `IMPLEMENTATION_PLAN_V5.md` file with your progress as you complete each task.

## Previous Phase Summary

Phase 7 (Advanced Financial Planning & Metadata) was successfully completed with:
- Full savings goals system with progress tracking
- Metadata support for all financial entities (accounts, credits, debts, investments)
- Relationship detection and smart insights
- Institution-based grouping and diversification analysis
- Dashboard widgets and global filter integration

## Current Task: Phase 8 - Tax Modernization and Reconciliation

### Goal
Update the fiscal module to handle historical data, dynamic tax rates, and provide tools for SAT reconciliation and compliance verification for "persona física con actividad empresarial" in Mexico.

### Context

The current fiscal system has:
- Basic ISR/IVA calculation for current period
- Hardcoded tax rates and brackets
- Limited historical data handling
- No reconciliation tools for past declarations

Phase 8 will modernize this system to:
- Support historical financial data import
- Manage dynamic tax rates across different periods
- Provide SAT reconciliation and comparison tools
- Enable accurate tax calculations for any time period

### Actionable Steps

#### 1. Historical Data Import System

**Goal:** Allow users to import bank statements and historical transactions to build complete financial history.

**Database Schema:**
- Create migration `017_add_import_history.sql`
- Create table `import_history` with columns:
  - `id` TEXT PRIMARY KEY
  - `user_id` TEXT NOT NULL (FK to users)
  - `import_date` TEXT DEFAULT CURRENT_TIMESTAMP
  - `source` TEXT NOT NULL (e.g., 'csv_bank_statement', 'manual_entry')
  - `file_name` TEXT
  - `period_start` TEXT
  - `period_end` TEXT
  - `records_imported` INTEGER DEFAULT 0
  - `records_duplicated` INTEGER DEFAULT 0
  - `records_failed` INTEGER DEFAULT 0
  - `status` TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'processing', 'completed', 'failed'))
  - `metadata` TEXT (JSON for additional info)
  - `created_at` TEXT DEFAULT CURRENT_TIMESTAMP
- Add indexes for `user_id`, `status`, `import_date`

**Backend API:**
- Create `functions/api/import.js` with endpoints:
  - `POST /api/import/csv` - Upload and parse CSV file
    - Accept file upload
    - Parse CSV with flexible column mapping
    - Detect duplicate transactions (by date, amount, description)
    - Preview data before import
    - Return validation results
  - `POST /api/import/confirm` - Confirm and execute import
    - Create transactions from parsed data
    - Handle duplicates (skip or update)
    - Create import history record
    - Return summary with counts
  - `GET /api/import/history` - List import history
    - Pagination support
    - Filter by date range, status
  - `GET /api/import/history/:id` - Get specific import details
  - `DELETE /api/import/history/:id` - Delete import and related transactions

**CSV Parser:**
- Create `src/utils/csvParser.js`
  - Parse CSV with common formats (Banco Azteca, BBVA, Banorte, etc.)
  - Flexible column mapping
  - Date format detection and normalization
  - Amount parsing (handle negative numbers, currency symbols)
  - Smart category mapping based on description
  - Duplicate detection logic

**Frontend Components:**
- Create `src/components/ImportWizard.jsx`
  - Step 1: File upload with drag-and-drop
  - Step 2: Column mapping interface
    - Auto-detect common columns
    - Manual mapping for unrecognized columns
    - Preview of mapped data
  - Step 3: Data preview and validation
    - Show parsed transactions
    - Highlight potential duplicates
    - Allow manual corrections
  - Step 4: Import confirmation and progress
    - Show import statistics
    - Handle errors gracefully
  - Step 5: Success summary
    - Display records imported/skipped/failed
    - Link to view imported transactions

- Create `src/components/ImportHistory.jsx`
  - List all past imports
  - Show statistics per import
  - View details of specific import
  - Rollback functionality (delete import)

- Add route `/import` in `App.jsx`
- Add navigation menu item under "Datos" or new section

**Integration Points:**
- Transactions should respect global filter (personal/business)
- Auto-assign categories based on description patterns
- Link to existing accounts if possible
- Support for savings goal linking

#### 2. SAT Reconciliation Tool

**Goal:** Help users compare their app data with SAT declarations and identify discrepancies.

**Research Required:**
- Study SAT regulations for "persona física con actividad empresarial" as of October 2025
- Understand monthly declaration requirements (ISR, IVA, DIOT)
- Identify common discrepancies and how to resolve them
- Research SAT APIs or formats for downloading declarations (if available)

**Database Schema:**
- Create migration `018_add_sat_declarations.sql`
- Create table `sat_declarations` with columns:
  - `id` TEXT PRIMARY KEY
  - `user_id` TEXT NOT NULL (FK to users)
  - `year` INTEGER NOT NULL
  - `month` INTEGER NOT NULL (1-12)
  - `declaration_type` TEXT CHECK(declaration_type IN ('isr', 'iva', 'diot', 'annual'))
  - `declared_income` REAL DEFAULT 0
  - `declared_expenses` REAL DEFAULT 0
  - `declared_isr` REAL DEFAULT 0
  - `declared_iva` REAL DEFAULT 0
  - `declaration_date` TEXT
  - `status` TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'filed', 'accepted', 'rejected', 'amended'))
  - `sat_acknowledgment` TEXT
  - `notes` TEXT
  - `metadata` TEXT (JSON)
  - `created_at` TEXT DEFAULT CURRENT_TIMESTAMP
  - `updated_at` TEXT DEFAULT CURRENT_TIMESTAMP
- Add indexes for `user_id`, `year`, `month`, `declaration_type`, `status`
- UNIQUE constraint on (user_id, year, month, declaration_type)

**Backend API:**
- Create `functions/api/sat-reconciliation.js` with endpoints:
  - `GET /api/sat-reconciliation/:year/:month` - Get reconciliation data
    - Calculate actual income/expenses from transactions
    - Retrieve SAT declaration data
    - Compare and identify discrepancies
    - Return detailed comparison
  - `POST /api/sat-reconciliation/declaration` - Save SAT declaration data
    - Store declaration information
    - Auto-calculate discrepancies
  - `PUT /api/sat-reconciliation/declaration/:id` - Update declaration
  - `GET /api/sat-reconciliation/discrepancies` - List all discrepancies
    - Filter by year, month, severity
    - Pagination support

**Reconciliation Logic:**
- Create `src/utils/satReconciliation.js`
  - Compare app data vs SAT declaration
  - Calculate discrepancies in:
    - Total income (declared vs actual)
    - Total expenses (declared vs actual)
    - ISR amount (declared vs calculated)
    - IVA amount (declared vs calculated)
  - Categorize discrepancies by severity (critical, warning, minor)
  - Generate suggested corrections
  - Identify missing transactions or invoices

**Frontend Components:**
- Create `src/components/SATReconciliation.jsx`
  - Period selector (year/month)
  - Side-by-side comparison view:
    - Left: App calculated values
    - Right: SAT declared values
    - Center: Discrepancies highlighted
  - Discrepancy details:
    - Amount difference
    - Percentage difference
    - Possible causes
    - Suggested actions
  - Drill-down to transaction level
  - Export reconciliation report

- Create `src/components/DeclarationManager.jsx`
  - List all SAT declarations
  - Add/Edit declaration data
  - Import declaration from SAT (if possible)
  - Status tracking (pending, filed, accepted)
  - Notes and attachments

- Add route `/sat-reconciliation` in `App.jsx`
- Add navigation menu item under "Fiscal"

**Reports:**
- Reconciliation summary report (PDF/Excel)
- Discrepancy report with details
- Month-by-month comparison chart
- Annual summary for tax year

#### 3. Dynamic Fiscal Variables

**Goal:** Make tax rates and fiscal parameters configurable by period instead of hardcoded, enabling accurate historical calculations.

**Database Schema:**
- Create migration `019_add_fiscal_parameters.sql`
- Create table `fiscal_parameters` with columns:
  - `id` TEXT PRIMARY KEY
  - `parameter_type` TEXT NOT NULL CHECK(parameter_type IN ('isr_bracket', 'iva_rate', 'iva_retention', 'diot_threshold', 'uma_value', 'minimum_wage', 'other'))
  - `period_type` TEXT NOT NULL CHECK(period_type IN ('monthly', 'annual', 'permanent'))
  - `effective_from` TEXT NOT NULL (YYYY-MM-DD or YYYY)
  - `effective_to` TEXT (NULL for current)
  - `value` TEXT NOT NULL (JSON for complex structures like brackets)
  - `description` TEXT
  - `source` TEXT (e.g., 'SAT', 'DOF', 'IMSS')
  - `is_active` INTEGER DEFAULT 1 CHECK(is_active IN (0, 1))
  - `created_at` TEXT DEFAULT CURRENT_TIMESTAMP
  - `updated_at` TEXT DEFAULT CURRENT_TIMESTAMP
- Add indexes for `parameter_type`, `effective_from`, `effective_to`, `is_active`

**Seed Data:**
- Create `seed_fiscal_parameters.sql` with:
  - ISR brackets for recent years (2023, 2024, 2025)
  - IVA rates (16%, 0%, exempt)
  - IVA retention rates (10.67%)
  - DIOT thresholds
  - UMA values by year
  - Minimum wage by year

**Backend API:**
- Update `functions/api/fiscal.js` to use dynamic parameters:
  - Refactor ISR calculation to query fiscal_parameters
  - Refactor IVA calculation to use period-specific rates
  - Add parameter lookup by date
  - Cache frequently used parameters
- Create `functions/api/fiscal-parameters.js` with endpoints:
  - `GET /api/fiscal-parameters` - List all parameters
    - Filter by type, period, date range
    - Pagination
  - `GET /api/fiscal-parameters/:type/:date` - Get parameters for specific date
  - `POST /api/fiscal-parameters` - Create new parameter
  - `PUT /api/fiscal-parameters/:id` - Update parameter
  - `DELETE /api/fiscal-parameters/:id` - Soft delete parameter

**Parameter Service:**
- Create `src/utils/fiscalParameterService.js`
  - `getISRBrackets(date)` - Get ISR brackets for date
  - `getIVARate(date)` - Get IVA rate for date
  - `getIVARetentionRate(date)` - Get retention rate
  - `getDIOTThreshold(date)` - Get DIOT threshold
  - `getUMAValue(date)` - Get UMA value
  - `getMinimumWage(date)` - Get minimum wage
  - Cache mechanism for performance

**Frontend Components:**
- Create `src/components/FiscalParametersManager.jsx`
  - List all fiscal parameters
  - Add/Edit parameters
  - Set effective date ranges
  - View parameter history
  - Import parameters from official sources
  - Validation of parameter values

- Update `src/components/FiscalCalculator.jsx`
  - Add period selector for historical calculations
  - Show which parameters were used
  - Display parameter values in calculation details
  - Compare calculations across different periods

- Add route `/fiscal-parameters` in `App.jsx`
- Add navigation menu item under "Fiscal" → "Configuración"

**Migration of Existing Code:**
- Update all fiscal calculation functions to use dynamic parameters
- Ensure backward compatibility
- Test with historical dates
- Document parameter structure

#### 4. Enhanced Fiscal Dashboard

**Frontend Components:**
- Update `src/pages/Fiscal.jsx`
  - Add historical period navigation (month/year selector)
  - Show reconciliation status indicators
  - Link to import wizard
  - Display SAT compliance status
  - Quick access to parameter settings

- Add fiscal health indicators:
  - Compliance score (0-100)
  - Unreconciled periods count
  - Missing declarations alert
  - Tax optimization suggestions

#### 5. Integration & Testing

**Integration Points:**
- Historical imports update fiscal calculations
- SAT reconciliation uses fiscal parameters
- Transaction linking to declarations
- Savings goals tax implications
- Business/personal separation in tax calculations

**Testing Requirements:**
- Test CSV import with various bank formats
- Test duplicate detection
- Test SAT reconciliation calculations
- Test historical fiscal calculations
- Test parameter lookup by date
- Test with different periods (2023, 2024, 2025)
- Verify tax bracket changes
- Test rollback functionality

**Data Validation:**
- Ensure imported data integrity
- Validate declaration amounts
- Check parameter value ranges
- Verify calculation accuracy

### Verification Steps

1. Run all migrations (`017`, `018`, `019`) successfully
2. Seed fiscal parameters for 2023-2025
3. Import sample CSV bank statement
4. Map columns and preview data
5. Confirm import and verify transactions created
6. Add SAT declaration for a month
7. Run reconciliation and review discrepancies
8. Create fiscal parameter for new period
9. Calculate taxes for historical period
10. Verify correct parameters used
11. Test on mobile devices
12. Ensure all builds complete without errors

### Progress Tracking

**MANDATORY:** Update `IMPLEMENTATION_PLAN_V5.md` with checkmarks (✅) as you complete each task.

Mark subtasks complete:
- [ ] Historical data import system
  - [ ] Database migration
  - [ ] CSV parser utility
  - [ ] Backend API
  - [ ] Import wizard UI
  - [ ] Import history view
- [ ] SAT reconciliation tool
  - [ ] Database migration
  - [ ] Reconciliation logic
  - [ ] Backend API
  - [ ] Reconciliation UI
  - [ ] Declaration manager
- [ ] Dynamic fiscal variables
  - [ ] Database migration
  - [ ] Seed fiscal parameters
  - [ ] Backend API updates
  - [ ] Parameter service
  - [ ] Parameter manager UI
- [ ] Enhanced fiscal dashboard
- [ ] Integration & testing

Mark Phase 8 as completed when all tasks are done.

### Technical Considerations

**CSV Parsing:**
- Handle various date formats (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- Parse amounts with different decimal separators (. vs ,)
- Handle currency symbols (MXN, $, USD)
- Detect and skip header rows
- Handle multi-line descriptions
- Support different encodings (UTF-8, Latin-1)

**Duplicate Detection:**
- Match by date + amount + description similarity
- Use fuzzy matching for descriptions
- Allow user to override duplicate detection
- Consider time window (±2 days)

**Parameter Management:**
- Validate date ranges don't overlap
- Ensure at least one active parameter per type
- Handle parameter transitions (effective_from/to)
- Support retroactive parameter changes
- Maintain audit trail

**Tax Calculations:**
- Always use parameters valid for the transaction date
- Cache parameter lookups for performance
- Handle parameter changes mid-period
- Support what-if scenarios with different parameters

**Security:**
- Validate CSV file size and type
- Sanitize imported data
- Prevent CSV injection attacks
- Secure parameter updates (admin only)
- Audit all declaration changes

**Performance:**
- Optimize CSV parsing for large files (>10,000 rows)
- Batch transaction creation
- Use database transactions for imports
- Cache fiscal parameters
- Lazy load import history

**User Experience:**
- Show import progress for large files
- Allow canceling imports in progress
- Preview before final import
- Clear error messages with suggestions
- Undo/rollback functionality
- Export reconciliation reports

### Research Requirements

Before implementing SAT reconciliation:
1. Study current SAT regulations (October 2025)
2. Review monthly declaration requirements
3. Understand DIOT filing rules
4. Research SAT API availability
5. Analyze common compliance issues
6. Document calculation formulas
7. Identify official data sources

### Database Considerations

**Import History:**
- Store enough metadata to recreate import
- Link to created transactions for rollback
- Track duplicate handling decisions
- Support partial import failure recovery

**SAT Declarations:**
- Store original filed amounts
- Track amendments and corrections
- Link to supporting documents
- Maintain status history

**Fiscal Parameters:**
- Version control for parameter changes
- Support multiple parameter sets (what-if scenarios)
- Efficient date range queries
- Handle parameter inheritance/defaults

### UI/UX Considerations

**Import Wizard:**
- Intuitive step-by-step flow
- Clear progress indicators
- Helpful column mapping suggestions
- Visual data preview
- Error highlighting and correction
- Success summary with actions

**Reconciliation View:**
- Clear visual comparison
- Color-coded discrepancies
- Expandable detail views
- Quick navigation to related data
- Export functionality
- Print-friendly format

**Parameter Manager:**
- Timeline view of parameter changes
- Easy date range selection
- Visual indication of current parameters
- Warning for gaps or overlaps
- Bulk import from official sources

### Success Criteria

Phase 8 is complete when:
- ✅ CSV import system fully functional
- ✅ Duplicate detection working accurately
- ✅ Import history tracked and rollback possible
- ✅ SAT declaration data can be stored and managed
- ✅ Reconciliation calculation logic implemented
- ✅ Discrepancies identified and categorized
- ✅ Fiscal parameters stored in database
- ✅ Historical tax calculations use correct parameters
- ✅ Parameter manager UI functional
- ✅ Enhanced fiscal dashboard integrated
- ✅ All migrations successful
- ✅ Application builds without errors
- ✅ Mobile responsive design
- ✅ IMPLEMENTATION_PLAN_V5.md updated

### Next Phase Preview

Upon successful completion of Phase 8, Phase 9 will focus on:
- **Advanced Features & Mobile Polish**
  - Receipt upload and OCR processing
  - Mobile responsiveness audit and fixes
  - Performance optimization
  - Advanced search and filtering

## Files to Reference

- `IMPLEMENTATION_PLAN_V5.md` - Master plan
- `PHASE_7_COMPLETION_SUMMARY.md` - Previous phase context
- `schema.sql` - Current database schema
- `migrations/` - All migration files
- `functions/api/fiscal.js` - Current fiscal calculations
- `src/pages/Fiscal.jsx` - Current fiscal page
- `src/utils/api.js` - API utilities

## Important Notes

1. **Research First**: Before implementing SAT reconciliation, thoroughly research current regulations
2. **Test with Real Data**: Use actual bank statements for testing imports
3. **Backup Strategy**: Implement robust rollback for imports
4. **Performance**: Optimize for large CSV files and many transactions
5. **Security**: Validate and sanitize all imported data
6. **Compliance**: Ensure calculations match SAT requirements exactly
7. **Documentation**: Document parameter structures and calculation formulas

## Support Resources

- SAT Official Website: https://www.sat.gob.mx/
- Diario Oficial de la Federación (DOF): https://www.dof.gob.mx/
- IMSS: https://www.imss.gob.mx/
- ISR Tax Tables: Available from SAT annually
- UMA Values: Published by INEGI

---

**Ready to Begin Phase 8!**

Follow the implementation plan systematically, update progress regularly, and ensure all success criteria are met before proceeding to Phase 9.
