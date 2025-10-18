-- Migration 022: Add Tax Simulation System
-- Purpose: Support "Declaración Anual" simulator for Mexican tax calculations

-- Tax simulations table - stores simulation scenarios
CREATE TABLE IF NOT EXISTS tax_simulations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    tax_year INTEGER NOT NULL,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'completed', 'archived')),
    income_total REAL DEFAULT 0,
    deductions_total REAL DEFAULT 0,
    credits_total REAL DEFAULT 0,
    tax_liability REAL DEFAULT 0,
    metadata TEXT, -- JSON for additional data
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tax deductions table - categorizes potential deductions
CREATE TABLE IF NOT EXISTS tax_deductions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id INTEGER NOT NULL,
    category TEXT NOT NULL, -- 'business_expense', 'medical', 'education', 'home_office', etc.
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    is_applied INTEGER DEFAULT 1, -- Boolean: 1 = applied, 0 = not applied
    transaction_ids TEXT, -- JSON array of related transaction IDs
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (simulation_id) REFERENCES tax_simulations(id) ON DELETE CASCADE
);

-- Tax credits table - tracks available tax credits
CREATE TABLE IF NOT EXISTS tax_credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id INTEGER NOT NULL,
    credit_type TEXT NOT NULL, -- 'personal_credit', 'dependent_credit', 'housing_credit', etc.
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    is_applied INTEGER DEFAULT 1, -- Boolean: 1 = applied, 0 = not applied
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (simulation_id) REFERENCES tax_simulations(id) ON DELETE CASCADE
);

-- Simulation results table - stores detailed calculation results
CREATE TABLE IF NOT EXISTS simulation_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulation_id INTEGER NOT NULL,
    gross_income REAL NOT NULL,
    total_deductions REAL NOT NULL,
    taxable_income REAL NOT NULL,
    isr_calculated REAL NOT NULL,
    total_credits REAL NOT NULL,
    net_tax_liability REAL NOT NULL,
    effective_tax_rate REAL,
    calculation_breakdown TEXT, -- JSON with detailed calculations
    recommendations TEXT, -- JSON with tax-saving recommendations
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (simulation_id) REFERENCES tax_simulations(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tax_simulations_user_year ON tax_simulations(user_id, tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_deductions_simulation ON tax_deductions(simulation_id);
CREATE INDEX IF NOT EXISTS idx_tax_credits_simulation ON tax_credits(simulation_id);
CREATE INDEX IF NOT EXISTS idx_simulation_results_simulation ON simulation_results(simulation_id);
