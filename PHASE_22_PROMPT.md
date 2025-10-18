# Phase 22: Annual Declaration & Advanced Analytics

## Project Context

You are working on the Avanta Finance application, a comprehensive financial management system built with React, Vite, and Cloudflare Workers. The project is located at the repository root.

## Implementation Plan Reference

**CRITICAL:** Always refer to the master implementation plan at `IMPLEMENTATION_PLAN_V7.md` for complete project context and progress tracking. This file contains:

✅ **Phases 1-21: COMPLETED** (Comprehensive financial management system including:)
- Phase 1-16: Core financial management, tax logic, and deductibility
- Phase 17: Income Module & Fiscal Foundations
- Phase 18: CFDI Control & Validation Module
- Phase 19: Core Tax Calculation Engine (ISR/IVA)
- Phase 20: Bank Reconciliation
- Phase 21: Advanced Declarations (DIOT & Contabilidad Electrónica) **COMPLETED**

🚧 **Phase 22: CURRENT PHASE** (Annual Declaration & Advanced Analytics)

📋 **Phases 23-29:** Future phases

**IMPORTANT:** You must update the `IMPLEMENTATION_PLAN_V7.md` file with your progress as you complete each task.

---

## Current Task: Phase 22 - Annual Declaration & Advanced Analytics

### Goal

Implement the annual tax calculation engine and build high-level fiscal dashboards for comprehensive tax planning and compliance.

### Context from Previous Phases

Phase 21 successfully implemented:
- ✅ DIOT (Declaración Informativa de Operaciones con Terceros) generation
- ✅ Contabilidad Electrónica XML generation (4 file types)
- ✅ Declaration lifecycle tracking (draft → generated → submitted → accepted)
- ✅ XML file generation and download functionality
- ✅ Comprehensive declaration management interface
- ✅ Integration with transaction data, CFDI metadata, and SAT accounts catalog

The system now has complete monthly tax calculations (ISR/IVA) and official declaration generation. Phase 22 builds upon this foundation to implement annual tax declarations and advanced fiscal analytics.

---

## Actionable Steps

### 1. Database Schema - Annual Declarations & Personal Deductions

**Create Migration:** `migrations/029_add_annual_declarations.sql`

#### Annual Declarations Table
```sql
CREATE TABLE annual_declarations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    fiscal_year INTEGER NOT NULL,
    declaration_type TEXT DEFAULT 'anual' CHECK(declaration_type IN ('anual', 'definitiva', 'complementaria')),
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'calculating', 'generated', 'submitted', 'accepted', 'rejected', 'error')),
    
    -- Income Summary
    total_income REAL DEFAULT 0,
    exempt_income REAL DEFAULT 0,
    taxable_income REAL DEFAULT 0,
    
    -- Deductions Summary
    total_deductions REAL DEFAULT 0,
    business_deductions REAL DEFAULT 0,
    personal_deductions REAL DEFAULT 0,
    
    -- Tax Calculations
    isr_base REAL DEFAULT 0,
    isr_calculated REAL DEFAULT 0,
    isr_payments REAL DEFAULT 0,
    isr_retentions REAL DEFAULT 0,
    isr_balance REAL DEFAULT 0,
    
    -- IVA Summary
    iva_collected REAL DEFAULT 0,
    iva_paid REAL DEFAULT 0,
    iva_balance REAL DEFAULT 0,
    
    -- Metadata
    xml_content TEXT,
    file_path TEXT,
    submission_date TEXT,
    sat_response TEXT,
    calculation_metadata TEXT,
    notes TEXT,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, fiscal_year, declaration_type)
);
```

#### Personal Deductions Table
```sql
CREATE TABLE personal_deductions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    declaration_id INTEGER,
    fiscal_year INTEGER NOT NULL,
    
    -- Deduction Categories (Art. 151 LISR)
    deduction_type TEXT NOT NULL CHECK(deduction_type IN (
        'medical_expenses',           -- Gastos médicos
        'funeral_expenses',           -- Gastos funerarios
        'education',                  -- Colegiaturas
        'mortgage_interest',          -- Intereses hipotecarios
        'retirement_contributions',   -- Aportaciones voluntarias a retiro
        'medical_insurance',          -- Primas de seguros de gastos médicos
        'transportation',             -- Transporte escolar
        'donations',                  -- Donativos
        'other'                       -- Otros deducibles
    )),
    
    amount REAL NOT NULL DEFAULT 0,
    limit_amount REAL,
    deductible_amount REAL,
    
    -- Supporting Information
    description TEXT,
    provider_name TEXT,
    provider_rfc TEXT,
    has_cfdi BOOLEAN DEFAULT 0,
    cfdi_uuid TEXT,
    payment_date TEXT,
    
    -- Limits and Validation
    exceeds_limit BOOLEAN DEFAULT 0,
    validation_status TEXT DEFAULT 'pending' CHECK(validation_status IN ('pending', 'valid', 'invalid', 'exceeds_limit')),
    validation_notes TEXT,
    
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(declaration_id) REFERENCES annual_declarations(id) ON DELETE SET NULL
);
```

#### Fiscal Projections Table
```sql
CREATE TABLE fiscal_projections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    projection_year INTEGER NOT NULL,
    projection_month INTEGER CHECK(projection_month >= 1 AND projection_month <= 12),
    
    -- Projected Values
    projected_income REAL DEFAULT 0,
    projected_expenses REAL DEFAULT 0,
    projected_isr REAL DEFAULT 0,
    projected_iva REAL DEFAULT 0,
    
    -- Actual Values (for comparison)
    actual_income REAL DEFAULT 0,
    actual_expenses REAL DEFAULT 0,
    actual_isr REAL DEFAULT 0,
    actual_iva REAL DEFAULT 0,
    
    -- Variance Analysis
    income_variance REAL DEFAULT 0,
    expense_variance REAL DEFAULT 0,
    isr_variance REAL DEFAULT 0,
    iva_variance REAL DEFAULT 0,
    
    projection_date TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes, Views, and Triggers:**
- Create indexes on user_id, fiscal_year, status, deduction_type
- Create view for deduction limits by type
- Create view for annual declaration summary
- Create triggers for updated_at timestamps
- Create trigger for automatic deduction limit calculation

### 2. Backend API Development

**Create:** `functions/api/annual-declarations.js`

#### Core Endpoints
```javascript
// Annual Declarations
GET    /api/annual-declarations                    - List annual declarations
GET    /api/annual-declarations/:id               - Get single declaration
GET    /api/annual-declarations/:year/summary     - Get year summary
POST   /api/annual-declarations/calculate/:year   - Calculate annual declaration
PUT    /api/annual-declarations/:id               - Update declaration
DELETE /api/annual-declarations/:id               - Delete declaration

// Personal Deductions
GET    /api/annual-declarations/deductions/:year              - List deductions
POST   /api/annual-declarations/deductions                    - Add deduction
PUT    /api/annual-declarations/deductions/:id                - Update deduction
DELETE /api/annual-declarations/deductions/:id                - Delete deduction
GET    /api/annual-declarations/deductions/:year/limits       - Get deduction limits

// Projections
GET    /api/fiscal-projections/:year                          - Get projections
POST   /api/fiscal-projections                                - Create projection
PUT    /api/fiscal-projections/:id                            - Update projection
```

#### Annual ISR Calculation Engine (Art. 152 LISR)
Implement comprehensive annual ISR calculation:

1. **Income Accumulation:**
   - Sum all income for the fiscal year
   - Identify exempt income
   - Calculate taxable income

2. **Business Deductions:**
   - Sum all deductible business expenses
   - Validate deduction requirements
   - Apply proportional deduction rules

3. **Personal Deductions:**
   - Load all personal deductions
   - Apply category-specific limits:
     - Medical expenses: 10% of annual income
     - Education: UMA-based limits per level
     - Mortgage interest: specific caps
     - Retirement contributions: 10% of income or 5 UMA annual
     - Donations: 7% of taxable income
   - Calculate total allowed personal deductions (max 15% of income or 5 UMA annual)

4. **ISR Calculation:**
   - Apply annual ISR tariff table (Art. 152)
   - Subtract monthly provisional payments
   - Subtract withholdings
   - Calculate final balance (refund or payment)

5. **Generate Declaration:**
   - Create annual_declarations record
   - Store all calculation details
   - Generate XML (if required)
   - Update status

**Create:** `functions/api/fiscal-dashboards.js`

#### Dashboard Endpoints
```javascript
GET /api/fiscal-dashboards/overview/:year        - Overall fiscal health
GET /api/fiscal-dashboards/monthly-trends/:year  - Monthly trends
GET /api/fiscal-dashboards/compliance            - Compliance alerts
GET /api/fiscal-dashboards/deductibility-ratio   - Deduction analysis
GET /api/fiscal-dashboards/projections/:year     - Tax projections
```

### 3. Frontend UI - Annual Declaration & Dashboards

**Create:** `src/components/AnnualDeclaration.jsx`

#### Component Structure
Multi-tab interface with:

**Tab 1: Resumen Anual**
- Fiscal year selector
- Income/expense summary cards
- ISR calculation overview
- IVA balance summary
- Personal deductions summary
- Quick calculate button

**Tab 2: Deducciones Personales**
- Deduction type selector
- Add/edit deduction form
- Deductions list with validation status
- Limit indicators (visual progress bars)
- Category-wise summary
- CFDI linking support

**Tab 3: Cálculo ISR Anual**
- Detailed calculation breakdown:
  - Total income
  - Business deductions
  - Personal deductions (with limits applied)
  - Taxable base
  - ISR calculated (with tariff table details)
  - Monthly payments sum
  - Retentions sum
  - Final balance (refund/payment)
- Step-by-step calculation view
- Export to PDF/Excel capability

**Tab 4: Historial**
- List of annual declarations
- Status tracking
- Comparison across years
- Download XML/PDF

**Create:** `src/components/FiscalDashboard.jsx`

#### Dashboard Widgets

**Widget 1: Resumen Fiscal Anual**
- Total income vs expenses chart
- Tax efficiency ratio
- Deductibility percentage
- Year-over-year comparison

**Widget 2: Proyecciones Mensuales**
- Monthly ISR/IVA projections
- Actual vs projected comparison
- Variance alerts
- Trend analysis

**Widget 3: Compliance Score**
- CFDI compliance rate
- Bank reconciliation status
- Declaration timeliness
- Deduction documentation level
- Overall compliance score (0-100)

**Widget 4: Deductibility Analysis**
- Deduction by category (pie chart)
- Expense deductibility ratio
- IVA accreditation rate
- Improvement opportunities

**Widget 5: Tax Calendar**
- Upcoming payment deadlines
- Declaration due dates
- Compliance reminders
- Automatic alerts

**Widget 6: Cash Flow Impact**
- Tax payment schedule
- Expected refunds
- Liquidity analysis
- Payment recommendations

**Navigation Integration:**
Add to Fiscal menu:
- "Declaración Anual" (📊)
- "Dashboard Fiscal" (📈)

### 4. Personal Deduction Management

**Implement deduction limit logic:**

```javascript
// Medical Expenses Limit
const medicalLimit = annualIncome * 0.10;

// Education Limit (by level, UMA-based)
const educationLimits = {
  'preschool': UMA_ANNUAL * 0.90,
  'primary_secondary': UMA_ANNUAL * 1.40,
  'high_school': UMA_ANNUAL * 1.70,
  'university': UMA_ANNUAL * 2.80
};

// Mortgage Interest Limit
const mortgageLimit = UMA_ANNUAL * 5;

// Retirement Contributions Limit
const retirementLimit = Math.min(
  annualIncome * 0.10,
  UMA_ANNUAL * 5
);

// Donations Limit
const donationsLimit = taxableIncome * 0.07;

// Total Personal Deductions Limit
const totalPersonalLimit = Math.min(
  annualIncome * 0.15,
  UMA_ANNUAL * 5
);
```

**Validation Flow:**
1. User adds personal deduction
2. System checks category-specific limit
3. Calculate total personal deductions
4. Validate against overall limit
5. Show warnings if limits exceeded
6. Apply allowed amount in annual calculation

### 5. Custom Reports Module

**Create:** `src/components/CustomReports.jsx`

#### Report Types

**Report 1: Análisis por Actividad Económica**
- Income/expenses by economic activity code
- Profitability analysis
- Tax burden by activity
- Optimization recommendations

**Report 2: Análisis por Cliente**
- Top clients by income
- Client profitability
- Payment behavior
- Client concentration risk

**Report 3: Análisis por Categoría de Gasto**
- Expense breakdown by category
- Deductibility analysis
- Cost reduction opportunities
- Budget variance

**Report 4: Análisis de IVA**
- IVA collected vs paid
- IVA balance trend
- Provider IVA analysis
- IVA optimization opportunities

**Report 5: Análisis de Rentabilidad**
- Gross margin
- Net margin
- ROI by activity
- Efficiency metrics

**Features:**
- Date range selection
- Filter by category, client, activity
- Export to Excel, PDF, CSV
- Schedule automated reports
- Email delivery (future)
- Chart visualizations

### 6. Integration Points

**Connect with existing phases:**
- Phase 17: Use income module data and fiscal parameters
- Phase 18: Link CFDI data to personal deductions
- Phase 19: Use monthly ISR/IVA calculations for annual summary
- Phase 20: Integrate bank reconciliation status in compliance score
- Phase 21: Use DIOT and Contabilidad data for annual declaration

**Data Consistency:**
- Annual totals must match sum of monthly calculations
- Personal deductions must have CFDI support (where required)
- All amounts must trace back to transactions
- Deduction limits must use current UMA values

---

## Verification Steps

1. ✅ Run `npm run build` to ensure the application compiles without errors
2. ✅ Test annual declaration calculation with full year of data
3. ✅ Verify personal deduction limits are correctly applied
4. ✅ Test deduction limit warnings and validations
5. ✅ Verify annual ISR calculation matches manual calculation
6. ✅ Test fiscal dashboard widgets display correct data
7. ✅ Verify custom reports generate accurate results
8. ✅ Test export functionality (PDF, Excel, CSV)
9. ✅ Confirm year-over-year comparisons work correctly
10. ✅ Verify compliance score calculations
11. ✅ Test responsive design on all components
12. ✅ Verify dark mode support

---

## Progress Tracking

**MANDATORY:**
- Update `IMPLEMENTATION_PLAN_V7.md` with checkmarks (✅) as you complete each task
- Create completion summary document `PHASE_22_ANNUAL_DECLARATION_SUMMARY.md` when finished
- Commit your changes with descriptive messages
- Mark Phase 22 as completed when all tasks are done

---

## Technical Considerations

### Annual ISR Calculation Complexity
- Must accumulate all income and deductions for the year
- Apply progressive tariff table (different from monthly)
- Handle multiple deduction categories with varying limits
- Calculate interaction between business and personal deductions
- Subtract all provisional payments made during the year

### Personal Deduction Limits
- Each category has its own limit calculation
- Overall limit on total personal deductions
- Must validate CFDI requirement for certain deductions
- UMA values change annually (must use correct year)
- Some limits are absolute, others are percentage-based

### Dashboard Performance
- Optimize queries for year-to-date calculations
- Cache frequently accessed data
- Use database views for complex aggregations
- Implement efficient chart data preparation
- Consider lazy loading for widgets

### Report Generation
- Handle large datasets efficiently
- Optimize export file generation
- Implement streaming for large exports
- Provide progress indicators
- Handle memory constraints

---

## Database Considerations

### Data Integrity
- Annual totals must match monthly sums
- Deduction limits must be validated on insert/update
- Foreign key relationships must cascade properly
- Calculation metadata should be stored for audit

### Performance
- Index all year-based queries
- Create materialized views for dashboard queries
- Optimize deduction limit calculations
- Use efficient aggregation queries

### Data Archiving
- Plan for multi-year data retention
- Consider archiving old declarations
- Maintain calculation history
- Preserve audit trail

---

## Mexican Tax Law Compliance

### ISR (Art. 152 LISR)
- Implement correct annual tariff table
- Apply all required deductions
- Calculate correctly the tax base
- Handle edge cases (negative income, etc.)

### Personal Deductions (Art. 151 LISR)
- Implement all 10 deduction categories
- Apply correct limits for each category
- Validate CFDI requirements
- Calculate overall deduction limit

### UMA Values
- Use correct UMA for the fiscal year
- Update annually (currently: daily $113.14, monthly $3,439.46, annual $41,273.52)
- Apply to all UMA-based calculations

### Declaration Deadlines
- Annual declaration: April 30 of following year
- Automatic reminders and alerts
- Track submission status

---

## Security Considerations

### Data Validation
- Validate all deduction amounts
- Verify CFDI existence when required
- Validate year ranges
- Sanitize all user inputs

### Access Control
- User can only access their own declarations
- Admin can view all declarations
- Proper authentication on all endpoints

### Audit Logging
- Log all calculation changes
- Track declaration status changes
- Record deduction additions/modifications
- Maintain complete audit trail

---

## Next Step

Upon successful completion and verification of all Phase 22 tasks, generate and output the complete, self-contained prompt for **Phase 23: Digital Archive & Compliance**, following this same instructional format and referencing the updated implementation plan.

---

**Document Version:** 1.0  
**Created:** October 18, 2025  
**Phase:** 22 of 29
