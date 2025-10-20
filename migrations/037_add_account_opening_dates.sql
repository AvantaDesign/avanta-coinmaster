-- Migration 037: Add Account Opening Dates and Initial Balances
-- Phase 33: Data Foundations and Initial Improvements
-- Purpose: Enable tracking of account opening dates and historical initial balances

-- Step 1: Add opening_date column to accounts table
ALTER TABLE accounts ADD COLUMN opening_date TEXT;

-- Step 2: Create account_initial_balances table
-- This table stores historical initial balance snapshots for accounts
-- Useful for managing incomplete historical data and accurate reporting
CREATE TABLE IF NOT EXISTS account_initial_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    balance_date TEXT NOT NULL, -- ISO 8601 date format (YYYY-MM-DD)
    initial_balance INTEGER NOT NULL, -- Stored in cents (INTEGER) for precision
    notes TEXT, -- Optional notes about this initial balance
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    UNIQUE(account_id, balance_date) -- One initial balance per account per date
);

-- Step 3: Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_account_initial_balances_account_date 
ON account_initial_balances(account_id, balance_date DESC);

-- Step 4: Create index on opening_date for account age calculations
CREATE INDEX IF NOT EXISTS idx_accounts_opening_date 
ON accounts(opening_date);

-- Migration complete
-- Next steps:
-- 1. Apply this migration: wrangler d1 execute avanta-coinmaster-preview --file=migrations/037_add_account_opening_dates.sql
-- 2. Update backend APIs to support initial balance management
-- 3. Update frontend UI to allow setting opening dates and initial balances
