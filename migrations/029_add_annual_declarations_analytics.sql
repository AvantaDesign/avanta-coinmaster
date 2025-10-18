-- Migration 029: Add Annual Declarations & Advanced Analytics
-- Purpose: Create comprehensive annual tax declaration and analytics system
-- Phase 22: Annual Declaration & Advanced Analytics
-- Date: October 2025
-- Author: Avanta Finance Development Team

-- ============================================================================
-- PART 1: Create Annual Declarations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS annual_declarations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    
    -- Declaration metadata
    fiscal_year INTEGER NOT NULL CHECK(fiscal_year >= 2020 AND fiscal_year <= 2100),
    declaration_type TEXT NOT NULL CHECK(declaration_type IN ('isr_annual', 'iva_annual', 'combined')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'calculated', 'submitted', 'accepted', 'rejected', 'error')),
    
    -- Income and expense totals
    total_income REAL DEFAULT 0,
    total_expenses REAL DEFAULT 0,
    deductible_expenses REAL DEFAULT 0,
    personal_deductions REAL DEFAULT 0,
    
    -- ISR calculation results
    taxable_income REAL DEFAULT 0,
    isr_calculated REAL DEFAULT 0,
    isr_paid REAL DEFAULT 0,
    isr_balance REAL DEFAULT 0,
    isr_retention_applied REAL DEFAULT 0,
    
    -- IVA calculation results
    iva_collected REAL DEFAULT 0,
    iva_paid REAL DEFAULT 0,
    iva_balance REAL DEFAULT 0,
    iva_accreditable REAL DEFAULT 0,
    
    -- Deduction details (JSON)
    deduction_breakdown TEXT,
    
    -- Calculation details (JSON)
    calculation_details TEXT,
    
    -- Submission details
    submission_date TEXT,
    sat_response TEXT,
    error_message TEXT,
    
    -- Metadata
    metadata TEXT,
    
    -- Timestamps
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PART 2: Create Fiscal Analytics Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS fiscal_analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    
    -- Analytics metadata
    analytics_type TEXT NOT NULL CHECK(analytics_type IN ('monthly_summary', 'quarterly_summary', 'annual_summary', 'compliance_status', 'trend_analysis', 'optimization_suggestions')),
    period_year INTEGER NOT NULL CHECK(period_year >= 2020 AND period_year <= 2100),
    period_month INTEGER CHECK(period_month >= 1 AND period_month <= 12),
    period_quarter INTEGER CHECK(period_quarter >= 1 AND period_quarter <= 4),
    
    -- Analytics data (JSON)
    analytics_data TEXT NOT NULL,
    
    -- Summary metrics
    total_transactions INTEGER DEFAULT 0,
    total_income REAL DEFAULT 0,
    total_expenses REAL DEFAULT 0,
    tax_liability REAL DEFAULT 0,
    compliance_score REAL DEFAULT 0,
    
    -- Generation metadata
    generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- Timestamps
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PART 3: Create Indexes for Performance
-- ============================================================================

-- Indexes for annual_declarations
CREATE INDEX IF NOT EXISTS idx_annual_declarations_user_year 
    ON annual_declarations(user_id, fiscal_year);

CREATE INDEX IF NOT EXISTS idx_annual_declarations_type_status 
    ON annual_declarations(declaration_type, status);

CREATE INDEX IF NOT EXISTS idx_annual_declarations_submission 
    ON annual_declarations(submission_date);

CREATE INDEX IF NOT EXISTS idx_annual_declarations_created 
    ON annual_declarations(created_at);

-- Indexes for fiscal_analytics
CREATE INDEX IF NOT EXISTS idx_fiscal_analytics_user_period 
    ON fiscal_analytics(user_id, period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_fiscal_analytics_type 
    ON fiscal_analytics(analytics_type);

CREATE INDEX IF NOT EXISTS idx_fiscal_analytics_generated 
    ON fiscal_analytics(generated_at);

-- ============================================================================
-- PART 4: Create Views for Analytics Summaries
-- ============================================================================

-- View: Annual declarations summary
CREATE VIEW IF NOT EXISTS v_annual_declarations_summary AS
SELECT 
    ad.id,
    ad.user_id,
    ad.fiscal_year,
    ad.declaration_type,
    ad.status,
    ad.total_income,
    ad.total_expenses,
    ad.deductible_expenses,
    ad.taxable_income,
    ad.isr_calculated,
    ad.isr_paid,
    ad.isr_balance,
    ad.iva_collected,
    ad.iva_paid,
    ad.iva_balance,
    ad.submission_date,
    ad.created_at,
    ad.updated_at,
    u.username as user_name
FROM annual_declarations ad
LEFT JOIN users u ON ad.user_id = u.id
ORDER BY ad.fiscal_year DESC, ad.created_at DESC;

-- View: Monthly analytics summary
CREATE VIEW IF NOT EXISTS v_monthly_analytics_summary AS
SELECT 
    fa.id,
    fa.user_id,
    fa.analytics_type,
    fa.period_year,
    fa.period_month,
    fa.total_transactions,
    fa.total_income,
    fa.total_expenses,
    fa.tax_liability,
    fa.compliance_score,
    fa.generated_at,
    u.username as user_name
FROM fiscal_analytics fa
LEFT JOIN users u ON fa.user_id = u.id
WHERE fa.analytics_type = 'monthly_summary'
ORDER BY fa.period_year DESC, fa.period_month DESC;

-- View: Annual analytics summary
CREATE VIEW IF NOT EXISTS v_annual_analytics_summary AS
SELECT 
    fa.id,
    fa.user_id,
    fa.period_year,
    SUM(fa.total_transactions) as total_transactions,
    SUM(fa.total_income) as total_income,
    SUM(fa.total_expenses) as total_expenses,
    SUM(fa.tax_liability) as total_tax_liability,
    AVG(fa.compliance_score) as avg_compliance_score,
    u.username as user_name
FROM fiscal_analytics fa
LEFT JOIN users u ON fa.user_id = u.id
WHERE fa.analytics_type = 'monthly_summary'
GROUP BY fa.user_id, fa.period_year
ORDER BY fa.period_year DESC;

-- View: Compliance status summary
CREATE VIEW IF NOT EXISTS v_compliance_status AS
SELECT 
    fa.user_id,
    fa.period_year,
    fa.period_month,
    fa.compliance_score,
    fa.analytics_data,
    fa.generated_at,
    u.username as user_name
FROM fiscal_analytics fa
LEFT JOIN users u ON fa.user_id = u.id
WHERE fa.analytics_type = 'compliance_status'
ORDER BY fa.period_year DESC, fa.period_month DESC;

-- ============================================================================
-- PART 5: Create Triggers for Timestamp Updates
-- ============================================================================

-- Trigger for annual_declarations update timestamp
CREATE TRIGGER IF NOT EXISTS update_annual_declarations_timestamp 
    AFTER UPDATE ON annual_declarations
    FOR EACH ROW
BEGIN
    UPDATE annual_declarations 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger for fiscal_analytics update timestamp
CREATE TRIGGER IF NOT EXISTS update_fiscal_analytics_timestamp 
    AFTER UPDATE ON fiscal_analytics
    FOR EACH ROW
BEGIN
    UPDATE fiscal_analytics 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;
