-- Migration 026: Add Tax Calculation Engine
-- Purpose: Enable accurate monthly provisional ISR and definitive IVA calculations
-- Phase 19: Core Tax Calculation Engine
-- Date: 2025-10-18
-- Author: Avanta Finance Development Team

-- ============================================================================
-- PART 1: Create Tax Calculations Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS tax_calculations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    
    -- Calculation metadata
    calculation_type TEXT NOT NULL CHECK(calculation_type IN ('monthly_provisional_isr', 'definitive_iva', 'annual_isr')),
    period_year INTEGER NOT NULL CHECK(period_year >= 2020 AND period_year <= 2100),
    period_month INTEGER CHECK(period_month >= 1 AND period_month <= 12),
    
    -- Income and expense totals
    total_income REAL DEFAULT 0,
    total_expenses REAL DEFAULT 0,
    deductible_expenses REAL DEFAULT 0,
    
    -- ISR calculation results
    accumulated_income REAL DEFAULT 0,
    accumulated_deductions REAL DEFAULT 0,
    taxable_income REAL DEFAULT 0,
    isr_calculated REAL DEFAULT 0,
    isr_paid REAL DEFAULT 0,
    isr_balance REAL DEFAULT 0,
    
    -- IVA calculation results
    iva_collected REAL DEFAULT 0,
    iva_paid REAL DEFAULT 0,
    iva_balance REAL DEFAULT 0,
    previous_iva_balance REAL DEFAULT 0,
    
    -- Detailed calculation breakdown (JSON)
    calculation_details TEXT,
    
    -- Status tracking
    status TEXT DEFAULT 'calculated' CHECK(status IN ('calculated', 'paid', 'pending', 'overdue')),
    
    -- Timestamps
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PART 2: Create Indexes for Tax Calculations
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_id 
    ON tax_calculations(user_id);

CREATE INDEX IF NOT EXISTS idx_tax_calculations_type 
    ON tax_calculations(calculation_type);

CREATE INDEX IF NOT EXISTS idx_tax_calculations_period 
    ON tax_calculations(period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_period 
    ON tax_calculations(user_id, period_year, period_month);

CREATE INDEX IF NOT EXISTS idx_tax_calculations_status 
    ON tax_calculations(status);

CREATE INDEX IF NOT EXISTS idx_tax_calculations_created_at 
    ON tax_calculations(created_at);

-- ============================================================================
-- PART 3: Create View for Monthly Tax Summary
-- ============================================================================

CREATE VIEW IF NOT EXISTS v_monthly_tax_summary AS
SELECT 
    tc.user_id,
    tc.period_year,
    tc.period_month,
    tc.period_year || '-' || printf('%02d', tc.period_month) AS period,
    
    -- ISR totals
    SUM(CASE WHEN tc.calculation_type = 'monthly_provisional_isr' 
        THEN tc.total_income ELSE 0 END) AS total_income,
    SUM(CASE WHEN tc.calculation_type = 'monthly_provisional_isr' 
        THEN tc.deductible_expenses ELSE 0 END) AS total_deductions,
    SUM(CASE WHEN tc.calculation_type = 'monthly_provisional_isr' 
        THEN tc.taxable_income ELSE 0 END) AS taxable_base,
    SUM(CASE WHEN tc.calculation_type = 'monthly_provisional_isr' 
        THEN tc.isr_calculated ELSE 0 END) AS isr_due,
    SUM(CASE WHEN tc.calculation_type = 'monthly_provisional_isr' 
        THEN tc.isr_paid ELSE 0 END) AS isr_paid,
    SUM(CASE WHEN tc.calculation_type = 'monthly_provisional_isr' 
        THEN tc.isr_balance ELSE 0 END) AS isr_balance,
    
    -- IVA totals
    SUM(CASE WHEN tc.calculation_type = 'definitive_iva' 
        THEN tc.iva_collected ELSE 0 END) AS iva_collected,
    SUM(CASE WHEN tc.calculation_type = 'definitive_iva' 
        THEN tc.iva_paid ELSE 0 END) AS iva_paid,
    SUM(CASE WHEN tc.calculation_type = 'definitive_iva' 
        THEN tc.iva_balance ELSE 0 END) AS iva_balance,
    
    -- Status
    MAX(tc.status) AS status,
    MAX(tc.updated_at) AS last_updated
    
FROM tax_calculations tc
GROUP BY tc.user_id, tc.period_year, tc.period_month;

-- ============================================================================
-- PART 4: Create View for Annual Tax Summary
-- ============================================================================

CREATE VIEW IF NOT EXISTS v_annual_tax_summary AS
SELECT 
    tc.user_id,
    tc.period_year,
    
    -- Annual ISR totals
    SUM(CASE WHEN tc.calculation_type = 'monthly_provisional_isr' 
        THEN tc.total_income ELSE 0 END) AS annual_income,
    SUM(CASE WHEN tc.calculation_type = 'monthly_provisional_isr' 
        THEN tc.deductible_expenses ELSE 0 END) AS annual_deductions,
    SUM(CASE WHEN tc.calculation_type = 'monthly_provisional_isr' 
        THEN tc.isr_calculated ELSE 0 END) AS annual_isr,
    SUM(CASE WHEN tc.calculation_type = 'monthly_provisional_isr' 
        THEN tc.isr_paid ELSE 0 END) AS annual_isr_paid,
    
    -- Annual IVA totals
    SUM(CASE WHEN tc.calculation_type = 'definitive_iva' 
        THEN tc.iva_collected ELSE 0 END) AS annual_iva_collected,
    SUM(CASE WHEN tc.calculation_type = 'definitive_iva' 
        THEN tc.iva_paid ELSE 0 END) AS annual_iva_paid,
    
    -- Count of months calculated
    COUNT(DISTINCT tc.period_month) AS months_calculated,
    
    MAX(tc.updated_at) AS last_updated
    
FROM tax_calculations tc
WHERE tc.calculation_type IN ('monthly_provisional_isr', 'definitive_iva')
GROUP BY tc.user_id, tc.period_year;

-- ============================================================================
-- PART 5: Create Trigger for Updated Timestamp
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS trigger_tax_calculations_updated_at
AFTER UPDATE ON tax_calculations
FOR EACH ROW
BEGIN
    UPDATE tax_calculations 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;
