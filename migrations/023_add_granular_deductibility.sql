-- Migration 023: Add Granular Tax Deductibility
-- Purpose: Implement granular deductibility rules for Mexican tax compliance (ISR/IVA)
-- Phase 16: Granular Tax Deductibility
-- Date: 2025-10-18
-- Author: Avanta Finance Development Team

-- Add granular deductibility fields to transactions table
-- These fields provide more precise control over tax deductions per Mexican SAT requirements

-- Add IVA deductibility flag
ALTER TABLE transactions ADD COLUMN is_iva_deductible INTEGER DEFAULT 0 CHECK(is_iva_deductible IN (0, 1));

-- Add ISR deductibility flag  
ALTER TABLE transactions ADD COLUMN is_isr_deductible INTEGER DEFAULT 0 CHECK(is_isr_deductible IN (0, 1));

-- Add expense type classification for international transactions
-- Values: 'national', 'international_with_invoice', 'international_no_invoice'
ALTER TABLE transactions ADD COLUMN expense_type TEXT DEFAULT 'national' CHECK(expense_type IN ('national', 'international_with_invoice', 'international_no_invoice'));

-- Create deductibility_rules table for custom user-defined rules
CREATE TABLE IF NOT EXISTS deductibility_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 0, -- Higher priority rules are evaluated first
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    
    -- Matching criteria (all conditions are AND-ed together, null values are ignored)
    match_category_id INTEGER, -- Match specific category
    match_keywords TEXT, -- JSON array of keywords to match in description
    match_amount_min REAL, -- Minimum amount to match
    match_amount_max REAL, -- Maximum amount to match
    match_transaction_type TEXT CHECK(match_transaction_type IN ('business', 'personal', 'transfer') OR match_transaction_type IS NULL),
    match_expense_type TEXT CHECK(match_expense_type IN ('national', 'international_with_invoice', 'international_no_invoice') OR match_expense_type IS NULL),
    
    -- Actions to apply when rule matches
    set_is_iva_deductible INTEGER CHECK(set_is_iva_deductible IN (0, 1) OR set_is_iva_deductible IS NULL),
    set_is_isr_deductible INTEGER CHECK(set_is_isr_deductible IN (0, 1) OR set_is_isr_deductible IS NULL),
    set_expense_type TEXT CHECK(set_expense_type IN ('national', 'international_with_invoice', 'international_no_invoice') OR set_expense_type IS NULL),
    
    -- Metadata
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(match_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_is_iva_deductible ON transactions(is_iva_deductible);
CREATE INDEX IF NOT EXISTS idx_transactions_is_isr_deductible ON transactions(is_isr_deductible);
CREATE INDEX IF NOT EXISTS idx_transactions_expense_type ON transactions(expense_type);
CREATE INDEX IF NOT EXISTS idx_deductibility_rules_user_id ON deductibility_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_deductibility_rules_is_active ON deductibility_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_deductibility_rules_priority ON deductibility_rules(priority);

-- Migrate existing data: if is_deductible = 1, set both IVA and ISR as deductible
-- This maintains backward compatibility
UPDATE transactions 
SET 
    is_iva_deductible = is_deductible,
    is_isr_deductible = is_deductible,
    expense_type = 'national'
WHERE is_deductible IS NOT NULL;

-- Insert default deductibility rules for common scenarios
-- These are sample rules that users can modify or delete

-- Rule 1: Business expenses are generally both IVA and ISR deductible
INSERT INTO deductibility_rules (
    user_id, 
    name, 
    description, 
    priority,
    match_transaction_type,
    set_is_iva_deductible,
    set_is_isr_deductible,
    notes
) 
SELECT 
    id,
    'Gastos de Negocio - Deducibles',
    'Gastos clasificados como negocio son deducibles de ISR e IVA por defecto',
    10,
    'business',
    1,
    1,
    'Regla automática creada durante migración'
FROM users
WHERE is_active = 1;

-- Rule 2: Personal expenses are not deductible
INSERT INTO deductibility_rules (
    user_id, 
    name, 
    description, 
    priority,
    match_transaction_type,
    set_is_iva_deductible,
    set_is_isr_deductible,
    notes
) 
SELECT 
    id,
    'Gastos Personales - No Deducibles',
    'Gastos personales no son deducibles de ISR ni IVA',
    5,
    'personal',
    0,
    0,
    'Regla automática creada durante migración'
FROM users
WHERE is_active = 1;

-- Rule 3: International expenses without invoice - IVA not deductible
INSERT INTO deductibility_rules (
    user_id, 
    name, 
    description, 
    priority,
    match_expense_type,
    set_is_iva_deductible,
    notes
) 
SELECT 
    id,
    'Gastos Internacionales sin Factura - IVA No Deducible',
    'Gastos internacionales sin factura mexicana no permiten deducir IVA',
    15,
    'international_no_invoice',
    0,
    'Regla automática creada durante migración - SAT compliance'
FROM users
WHERE is_active = 1;
