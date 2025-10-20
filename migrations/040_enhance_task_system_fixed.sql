-- Migration 040: Enhance Task System with Progress Tracking and Declarations
-- Phase 36: Task System Redesign as Interactive Guide
-- Created: January 2025
-- Fixed: Create financial_tasks table first if it doesn't exist

-- ============================================================================
-- CREATE FINANCIAL TASKS TABLE (if it doesn't exist)
-- ============================================================================
CREATE TABLE IF NOT EXISTS financial_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    priority INTEGER DEFAULT 3 CHECK(priority >= 1 AND priority <= 5),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    category TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- ENHANCE FINANCIAL TASKS TABLE
-- ============================================================================
-- Add new columns for automatic progress tracking and completion criteria

-- Add completion criteria (JSON format for flexible criteria definition)
ALTER TABLE financial_tasks ADD COLUMN completion_criteria TEXT;

-- Add progress percentage (0-100)
ALTER TABLE financial_tasks ADD COLUMN progress_percentage INTEGER DEFAULT 0 CHECK(progress_percentage >= 0 AND progress_percentage <= 100);

-- Add last evaluation timestamp
ALTER TABLE financial_tasks ADD COLUMN last_evaluated_at TEXT;

-- Add auto-update flag to enable/disable automatic progress tracking
ALTER TABLE financial_tasks ADD COLUMN auto_update INTEGER DEFAULT 1 CHECK(auto_update IN (0, 1));

-- Add task type to distinguish between different task categories
ALTER TABLE financial_tasks ADD COLUMN task_type TEXT DEFAULT 'manual' CHECK(task_type IN ('manual', 'auto', 'declaration', 'custom'));

-- Add notes field for task-specific notes
ALTER TABLE financial_tasks ADD COLUMN notes TEXT;

-- ============================================================================
-- TASK TEMPLATES TABLE
-- ============================================================================
-- Predefined task templates for quick task creation
CREATE TABLE IF NOT EXISTS task_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK(template_type IN ('monthly', 'annual', 'quarterly', 'custom', 'declaration')),
    description TEXT,
    completion_criteria TEXT NOT NULL, -- JSON with criteria structure
    priority INTEGER DEFAULT 1 CHECK(priority >= 1 AND priority <= 5), -- 1=highest, 5=lowest
    category TEXT,
    estimated_duration INTEGER, -- Estimated duration in minutes
    help_text TEXT, -- Guidance text for users
    default_auto_update INTEGER DEFAULT 1 CHECK(default_auto_update IN (0, 1)),
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster template lookups
CREATE INDEX IF NOT EXISTS idx_task_templates_type ON task_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_task_templates_active ON task_templates(is_active);

-- ============================================================================
-- TASK PROGRESS TABLE
-- ============================================================================
-- Historical tracking of task progress for analytics and debugging
CREATE TABLE IF NOT EXISTS task_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    progress_percentage INTEGER NOT NULL CHECK(progress_percentage >= 0 AND progress_percentage <= 100),
    completion_data TEXT, -- JSON with completion details
    evaluation_criteria TEXT, -- JSON with criteria used for evaluation
    evaluated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES financial_tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster progress lookups
CREATE INDEX IF NOT EXISTS idx_task_progress_task_id ON task_progress(task_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_user_id ON task_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_task_progress_evaluated_at ON task_progress(evaluated_at);

-- ============================================================================
-- DECLARATION STEPS TABLE
-- ============================================================================
-- Interactive step-by-step guides for fiscal declarations
CREATE TABLE IF NOT EXISTS declaration_steps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    declaration_type TEXT NOT NULL CHECK(declaration_type IN ('isr', 'iva', 'diot', 'annual')),
    step_number INTEGER NOT NULL,
    step_title TEXT NOT NULL,
    step_description TEXT,
    step_criteria TEXT, -- JSON completion criteria for this step
    required_fields TEXT, -- JSON array of required data fields
    help_text TEXT, -- Detailed help text for this step
    validation_rules TEXT, -- JSON validation rules
    is_optional INTEGER DEFAULT 0 CHECK(is_optional IN (0, 1)),
    estimated_time INTEGER, -- Estimated time in minutes
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(declaration_type, step_number)
);

-- Index for faster step lookups
CREATE INDEX IF NOT EXISTS idx_declaration_steps_type ON declaration_steps(declaration_type);
CREATE INDEX IF NOT EXISTS idx_declaration_steps_number ON declaration_steps(declaration_type, step_number);

-- ============================================================================
-- INSERT DEFAULT TASK TEMPLATES
-- ============================================================================

-- Monthly ISR Declaration Template
INSERT OR IGNORE INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, category, estimated_duration, help_text
) VALUES (
    'Monthly ISR Declaration',
    'monthly',
    'Complete monthly ISR (Income Tax) declaration',
    '{"criteria": [{"type": "has_transactions", "period": "current_month"}, {"type": "has_income_data", "required": true}, {"type": "has_deductions", "required": false}, {"type": "calculation_complete", "required": true}]}',
    1,
    'Tax Declaration',
    30,
    'Ensure all income transactions are recorded and deductions are properly categorized before calculating ISR.'
);

-- Monthly IVA Declaration Template
INSERT OR IGNORE INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, category, estimated_duration, help_text
) VALUES (
    'Monthly IVA Declaration',
    'monthly',
    'Complete monthly IVA (VAT) declaration',
    '{"criteria": [{"type": "has_invoices", "period": "current_month"}, {"type": "has_sales_data", "required": true}, {"type": "has_purchase_data", "required": true}, {"type": "iva_calculation_complete", "required": true}]}',
    1,
    'Tax Declaration',
    25,
    'Review all invoices and ensure IVA calculations are accurate for both sales and purchases.'
);

-- DIOT Declaration Template
INSERT OR IGNORE INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, category, estimated_duration, help_text
) VALUES (
    'DIOT Declaration',
    'monthly',
    'Complete DIOT (Informative Return of Operations with Third Parties)',
    '{"criteria": [{"type": "has_third_party_transactions", "period": "current_month"}, {"type": "has_rfc_data", "required": true}, {"type": "amounts_validated", "required": true}]}',
    2,
    'Tax Declaration',
    20,
    'Ensure all transactions with third parties are properly documented with RFC information.'
);

-- Bank Reconciliation Template
INSERT OR IGNORE INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, category, estimated_duration, help_text
) VALUES (
    'Bank Reconciliation',
    'monthly',
    'Reconcile bank statements with accounting records',
    '{"criteria": [{"type": "has_bank_statements", "period": "current_month"}, {"type": "transactions_matched", "threshold": 0.95}, {"type": "discrepancies_resolved", "required": true}]}',
    2,
    'Reconciliation',
    45,
    'Match all bank transactions with accounting records and resolve any discrepancies.'
);

-- Invoice Review Template
INSERT OR IGNORE INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, category, estimated_duration, help_text
) VALUES (
    'Invoice Review',
    'monthly',
    'Review and validate all invoices for the month',
    '{"criteria": [{"type": "has_invoices", "period": "current_month"}, {"type": "invoices_validated", "threshold": 1.0}, {"type": "cfdi_verified", "required": true}]}',
    3,
    'Documentation',
    60,
    'Verify all invoices are properly documented and CFDI compliance is maintained.'
);

-- Financial Report Generation Template
INSERT OR IGNORE INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, category, estimated_duration, help_text
) VALUES (
    'Financial Report Generation',
    'monthly',
    'Generate monthly financial reports',
    '{"criteria": [{"type": "has_transactions", "period": "current_month"}, {"type": "reports_generated", "required": true}, {"type": "data_validated", "required": true}]}',
    3,
    'Reporting',
    30,
    'Generate comprehensive financial reports including P&L, balance sheet, and cash flow.'
);

-- Budget Review Template
INSERT OR IGNORE INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, category, estimated_duration, help_text
) VALUES (
    'Budget Review',
    'monthly',
    'Review budget performance and update forecasts',
    '{"criteria": [{"type": "has_budget_data", "required": true}, {"type": "variance_analysis", "required": true}, {"type": "forecast_updated", "required": true}]}',
    4,
    'Planning',
    40,
    'Compare actual performance against budget and update forecasts for the next period.'
);

-- Annual Tax Return Template
INSERT OR IGNORE INTO task_templates (
    template_name, template_type, description, completion_criteria, priority, category, estimated_duration, help_text
) VALUES (
    'Annual Tax Return',
    'annual',
    'Complete annual tax return and filing',
    '{"criteria": [{"type": "has_annual_data", "required": true}, {"type": "all_declarations_complete", "required": true}, {"type": "final_review", "required": true}]}',
    1,
    'Tax Declaration',
    120,
    'Ensure all monthly declarations are complete and final annual return is accurate.'
);

-- ============================================================================
-- INSERT DECLARATION STEPS
-- ============================================================================

-- ISR Declaration Steps
INSERT OR IGNORE INTO declaration_steps (declaration_type, step_number, step_title, step_description, step_criteria, required_fields, help_text, estimated_time) VALUES
('isr', 1, 'Verify Income Data', 'Review and verify all income transactions for the period', '{"type": "has_income_data", "threshold": 1.0}', '["income_transactions", "total_income"]', 'Ensure all income sources are properly recorded and categorized.', 10),
('isr', 2, 'Calculate Deductions', 'Review and calculate applicable deductions', '{"type": "has_deductions", "threshold": 0.8}', '["deductible_expenses", "personal_deductions"]', 'Review all expenses and identify those that qualify as deductions.', 15),
('isr', 3, 'Determine Tax Base', 'Calculate taxable income after deductions', '{"type": "tax_base_calculated", "required": true}', '["taxable_income", "deduction_total"]', 'Subtract deductions from total income to determine taxable amount.', 5),
('isr', 4, 'Calculate ISR', 'Apply tax rates to determine ISR amount', '{"type": "isr_calculated", "required": true}', '["isr_amount", "tax_rate"]', 'Apply the appropriate tax rate to calculate the final ISR amount.', 5),
('isr', 5, 'Prepare Payment', 'Generate payment information and documentation', '{"type": "payment_prepared", "required": true}', '["payment_amount", "due_date", "payment_method"]', 'Prepare payment documentation and ensure timely submission.', 10);

-- IVA Declaration Steps
INSERT OR IGNORE INTO declaration_steps (declaration_type, step_number, step_title, step_description, step_criteria, required_fields, help_text, estimated_time) VALUES
('iva', 1, 'Review Sales Invoices', 'Review all sales invoices and calculate output IVA', '{"type": "has_sales_invoices", "threshold": 1.0}', '["sales_invoices", "output_iva"]', 'Ensure all sales invoices are properly recorded with IVA calculations.', 15),
('iva', 2, 'Review Purchase Invoices', 'Review all purchase invoices and calculate input IVA', '{"type": "has_purchase_invoices", "threshold": 1.0}', '["purchase_invoices", "input_iva"]', 'Review all purchase invoices and calculate deductible input IVA.', 15),
('iva', 3, 'Calculate IVA Balance', 'Determine IVA payable or refundable', '{"type": "iva_balance_calculated", "required": true}', '["iva_balance", "iva_payable"]', 'Calculate the difference between output and input IVA.', 5),
('iva', 4, 'Validate Calculations', 'Verify all IVA calculations are accurate', '{"type": "calculations_validated", "required": true}', '["validation_results"]', 'Double-check all calculations and ensure accuracy.', 10),
('iva', 5, 'Prepare Declaration', 'Complete IVA declaration form', '{"type": "declaration_complete", "required": true}', '["declaration_form", "supporting_documents"]', 'Complete the official IVA declaration form with all required information.', 15);

-- DIOT Declaration Steps
INSERT OR IGNORE INTO declaration_steps (declaration_type, step_number, step_title, step_description, step_criteria, required_fields, help_text, estimated_time) VALUES
('diot', 1, 'Identify Third-Party Transactions', 'Identify all transactions with third parties', '{"type": "has_third_party_transactions", "threshold": 1.0}', '["third_party_transactions"]', 'Identify all transactions with suppliers, customers, and other third parties.', 20),
('diot', 2, 'Verify RFC Information', 'Ensure all third parties have valid RFC information', '{"type": "rfc_verified", "threshold": 0.95}', '["rfc_data", "third_party_info"]', 'Verify that all third parties have valid RFC numbers.', 10),
('diot', 3, 'Calculate Transaction Amounts', 'Calculate total amounts by third party', '{"type": "amounts_calculated", "required": true}', '["transaction_amounts", "third_party_totals"]', 'Calculate total transaction amounts for each third party.', 10),
('diot', 4, 'Validate Data Completeness', 'Ensure all required data is complete', '{"type": "data_complete", "required": true}', '["complete_data"]', 'Verify that all required information is present and accurate.', 5),
('diot', 5, 'Submit DIOT', 'Submit the DIOT declaration', '{"type": "diot_submitted", "required": true}', '["submission_confirmation"]', 'Submit the completed DIOT declaration to the tax authority.', 5);

-- ============================================================================
-- CREATE TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Trigger for financial_tasks updated_at
CREATE TRIGGER IF NOT EXISTS update_financial_tasks_timestamp 
    AFTER UPDATE ON financial_tasks
    FOR EACH ROW
BEGIN
    UPDATE financial_tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger for task_templates updated_at
CREATE TRIGGER IF NOT EXISTS update_task_templates_timestamp 
    AFTER UPDATE ON task_templates
    FOR EACH ROW
BEGIN
    UPDATE task_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger for declaration_steps updated_at
CREATE TRIGGER IF NOT EXISTS update_declaration_steps_timestamp 
    AFTER UPDATE ON declaration_steps
    FOR EACH ROW
BEGIN
    UPDATE declaration_steps SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration creates the enhanced task system with:
-- 1. Enhanced financial_tasks table with progress tracking
-- 2. Task templates for quick task creation
-- 3. Task progress history for analytics
-- 4. Declaration steps for guided processes
-- 5. Default templates and steps for common fiscal obligations
-- 6. Automatic timestamp triggers
