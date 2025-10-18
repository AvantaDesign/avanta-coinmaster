-- Migration 019: Add Fiscal Parameters
-- Purpose: Store dynamic tax rates and fiscal parameters by period
-- Date: October 2025

-- Create fiscal_parameters table
CREATE TABLE IF NOT EXISTS fiscal_parameters (
    id TEXT PRIMARY KEY,
    parameter_type TEXT NOT NULL CHECK(parameter_type IN ('isr_bracket', 'iva_rate', 'iva_retention', 'diot_threshold', 'uma_value', 'minimum_wage', 'other')),
    period_type TEXT NOT NULL CHECK(period_type IN ('monthly', 'annual', 'permanent')),
    effective_from TEXT NOT NULL,
    effective_to TEXT,
    value TEXT NOT NULL,
    description TEXT,
    source TEXT,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for fiscal_parameters
CREATE INDEX IF NOT EXISTS idx_fiscal_parameters_parameter_type ON fiscal_parameters(parameter_type);
CREATE INDEX IF NOT EXISTS idx_fiscal_parameters_effective_from ON fiscal_parameters(effective_from);
CREATE INDEX IF NOT EXISTS idx_fiscal_parameters_effective_to ON fiscal_parameters(effective_to);
CREATE INDEX IF NOT EXISTS idx_fiscal_parameters_is_active ON fiscal_parameters(is_active);
CREATE INDEX IF NOT EXISTS idx_fiscal_parameters_period_type ON fiscal_parameters(period_type);
