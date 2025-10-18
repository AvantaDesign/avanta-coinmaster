-- Migration 018: Add SAT Declarations
-- Purpose: Store SAT tax declarations for reconciliation
-- Date: October 2025

-- Create sat_declarations table
CREATE TABLE IF NOT EXISTS sat_declarations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK(month >= 1 AND month <= 12),
    declaration_type TEXT NOT NULL CHECK(declaration_type IN ('isr', 'iva', 'diot', 'annual')),
    declared_income REAL DEFAULT 0,
    declared_expenses REAL DEFAULT 0,
    declared_isr REAL DEFAULT 0,
    declared_iva REAL DEFAULT 0,
    declaration_date TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'filed', 'accepted', 'rejected', 'amended')),
    sat_acknowledgment TEXT,
    notes TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, year, month, declaration_type)
);

-- Create indexes for sat_declarations
CREATE INDEX IF NOT EXISTS idx_sat_declarations_user_id ON sat_declarations(user_id);
CREATE INDEX IF NOT EXISTS idx_sat_declarations_year ON sat_declarations(year);
CREATE INDEX IF NOT EXISTS idx_sat_declarations_month ON sat_declarations(month);
CREATE INDEX IF NOT EXISTS idx_sat_declarations_declaration_type ON sat_declarations(declaration_type);
CREATE INDEX IF NOT EXISTS idx_sat_declarations_status ON sat_declarations(status);
CREATE INDEX IF NOT EXISTS idx_sat_declarations_year_month ON sat_declarations(year, month);
