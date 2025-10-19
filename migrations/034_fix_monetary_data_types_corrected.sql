-- ============================================================================
-- Migration 034: Fix Monetary Data Types (Corrected Schema)
-- Phase 30: Critical Infrastructure and Data Hardening
-- ============================================================================
--
-- OBJECTIVE: Convert all monetary columns from REAL to INTEGER (cents-based)
--
-- RATIONALE:
--   SQLite's REAL type uses floating-point arithmetic which can introduce
--   rounding errors in financial calculations. By storing monetary values
--   as INTEGER cents (multiply by 100), we eliminate floating-point errors
--   and ensure perfect accuracy for financial operations.
--
-- STRATEGY:
--   1. Create new tables with INTEGER monetary columns
--   2. Migrate data, converting REAL to cents (multiply by 100, round)
--   3. Drop old tables
--   4. Rename new tables to original names
--   5. Recreate indexes
--
-- NOTES:
--   - Percentage/rate columns (interest_rate, iva_rate, etc.) remain REAL
--   - All monetary amounts are converted: amount, balance, total, etc.
--   - Backend code has been updated to handle cent-based values
--   - Frontend displays convert cents back to decimal for display
--
-- ============================================================================

-- ============================================================================
-- 1. TRANSACTIONS TABLE (Corrected Schema)
-- ============================================================================

-- Create new transactions table with INTEGER amount
CREATE TABLE IF NOT EXISTS transactions_new (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    description TEXT,
    category TEXT,
    date DATETIME NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
    is_business INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    is_deleted INTEGER DEFAULT 0 CHECK(is_deleted IN (0, 1)),
    transaction_type TEXT CHECK(transaction_type IN ('business', 'personal', 'transfer')) DEFAULT 'personal',
    category_id INTEGER,
    linked_invoice_id INTEGER,
    notes TEXT,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Migrate transactions data
INSERT INTO transactions_new
SELECT 
    id, account_id,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    description, category, date, type, is_business,
    created_at, updated_at, user_id, is_deleted,
    transaction_type, category_id, linked_invoice_id, notes
FROM transactions;

-- Drop old table and rename new one
DROP TABLE transactions;
ALTER TABLE transactions_new RENAME TO transactions;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted ON transactions(is_deleted);

-- ============================================================================
-- 2. ACCOUNTS TABLE (Corrected Schema)
-- ============================================================================

-- Create new accounts table with INTEGER balance
CREATE TABLE IF NOT EXISTS accounts_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('checking', 'savings', 'credit', 'cash')),
    balance INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Migrate accounts data
INSERT INTO accounts_new
SELECT 
    id, user_id, name, type,
    CAST(ROUND(balance * 100) AS INTEGER) as balance,  -- Convert to cents
    is_active, created_at, updated_at
FROM accounts;

-- Drop old table and rename new one
DROP TABLE accounts;
ALTER TABLE accounts_new RENAME TO accounts;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- ============================================================================
-- 3. INVOICES TABLE (If exists)
-- ============================================================================

-- Check if invoices table exists and migrate it
CREATE TABLE IF NOT EXISTS invoices_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    date TEXT NOT NULL,
    due_date TEXT,
    client_name TEXT NOT NULL,
    client_rfc TEXT,
    subtotal INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    iva INTEGER NOT NULL,       -- Changed from REAL to INTEGER (cents)
    total INTEGER NOT NULL,     -- Changed from REAL to INTEGER (cents)
    status TEXT NOT NULL CHECK(status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
    payment_method TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Migrate invoices data (if table exists)
INSERT INTO invoices_new
SELECT 
    id, user_id, invoice_number, date, due_date, client_name, client_rfc,
    CAST(ROUND(subtotal * 100) AS INTEGER) as subtotal,  -- Convert to cents
    CAST(ROUND(iva * 100) AS INTEGER) as iva,           -- Convert to cents
    CAST(ROUND(total * 100) AS INTEGER) as total,        -- Convert to cents
    status, payment_method, notes, created_at, updated_at
FROM invoices
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='invoices');

-- Drop old table and rename new one (if invoices table exists)
DROP TABLE invoices;
ALTER TABLE invoices_new RENAME TO invoices;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);

-- ============================================================================
-- 4. BUDGETS TABLE (If exists)
-- ============================================================================

-- Check if budgets table exists and migrate it
CREATE TABLE IF NOT EXISTS budgets_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    spent INTEGER DEFAULT 0,  -- Changed from REAL to INTEGER (cents)
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    category TEXT,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Migrate budgets data (if table exists)
INSERT INTO budgets_new
SELECT 
    id, user_id, name,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    CAST(ROUND(spent * 100) AS INTEGER) as spent,   -- Convert to cents
    period_start, period_end, category, is_active, created_at, updated_at
FROM budgets
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='budgets');

-- Drop old table and rename new one (if budgets table exists)
DROP TABLE budgets;
ALTER TABLE budgets_new RENAME TO budgets;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period_start, period_end);

-- ============================================================================
-- 5. CREDITS TABLE (If exists)
-- ============================================================================

-- Check if credits table exists and migrate it
CREATE TABLE IF NOT EXISTS credits_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('credit_card', 'loan', 'mortgage')),
    credit_limit INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    current_balance INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    interest_rate REAL NOT NULL,  -- Keep as REAL (percentage)
    minimum_payment INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    due_date INTEGER NOT NULL,  -- Day of month
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Migrate credits data (if table exists)
INSERT INTO credits_new
SELECT 
    id, user_id, name, type,
    CAST(ROUND(credit_limit * 100) AS INTEGER) as credit_limit,  -- Convert to cents
    CAST(ROUND(current_balance * 100) AS INTEGER) as current_balance,  -- Convert to cents
    interest_rate,  -- Keep as REAL
    CAST(ROUND(minimum_payment * 100) AS INTEGER) as minimum_payment,  -- Convert to cents
    due_date, is_active, created_at, updated_at
FROM credits
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='credits');

-- Drop old table and rename new one (if credits table exists)
DROP TABLE credits;
ALTER TABLE credits_new RENAME TO credits;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_type ON credits(type);

-- ============================================================================
-- 6. DEBTS TABLE (If exists)
-- ============================================================================

-- Check if debts table exists and migrate it
CREATE TABLE IF NOT EXISTS debts_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('personal', 'business', 'mortgage', 'auto')),
    principal_amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    current_balance INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    interest_rate REAL NOT NULL,  -- Keep as REAL (percentage)
    term_months INTEGER NOT NULL,
    monthly_payment INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    start_date TEXT NOT NULL,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Migrate debts data (if table exists)
INSERT INTO debts_new
SELECT 
    id, user_id, name, type,
    CAST(ROUND(principal_amount * 100) AS INTEGER) as principal_amount,  -- Convert to cents
    CAST(ROUND(current_balance * 100) AS INTEGER) as current_balance,  -- Convert to cents
    interest_rate,  -- Keep as REAL
    term_months,
    CAST(ROUND(monthly_payment * 100) AS INTEGER) as monthly_payment,  -- Convert to cents
    start_date, is_active, created_at, updated_at
FROM debts
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='debts');

-- Drop old table and rename new one (if debts table exists)
DROP TABLE debts;
ALTER TABLE debts_new RENAME TO debts;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_type ON debts(type);

-- ============================================================================
-- 7. INVESTMENTS TABLE (If exists)
-- ============================================================================

-- Check if investments table exists and migrate it
CREATE TABLE IF NOT EXISTS investments_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('stock', 'bond', 'fund', 'crypto', 'real_estate')),
    symbol TEXT,
    purchase_price INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    current_price INTEGER,  -- Changed from REAL to INTEGER (cents)
    quantity REAL NOT NULL,  -- Keep as REAL (can be fractional)
    purchase_date TEXT NOT NULL,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Migrate investments data (if table exists)
INSERT INTO investments_new
SELECT 
    id, user_id, name, type, symbol,
    CAST(ROUND(purchase_price * 100) AS INTEGER) as purchase_price,  -- Convert to cents
    CAST(ROUND(current_price * 100) AS INTEGER) as current_price,  -- Convert to cents
    quantity,  -- Keep as REAL
    purchase_date, is_active, created_at, updated_at
FROM investments
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='investments');

-- Drop old table and rename new one (if investments table exists)
DROP TABLE investments;
ALTER TABLE investments_new RENAME TO investments;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(type);

-- ============================================================================
-- 8. SAVINGS_GOALS TABLE (If exists)
-- ============================================================================

-- Check if savings_goals table exists and migrate it
CREATE TABLE IF NOT EXISTS savings_goals_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    target_amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    current_amount INTEGER DEFAULT 0,  -- Changed from REAL to INTEGER (cents)
    target_date TEXT,
    type TEXT NOT NULL CHECK(type IN ('personal', 'business')),
    category TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Migrate savings_goals data (if table exists)
INSERT INTO savings_goals_new
SELECT 
    id, user_id, name,
    CAST(ROUND(target_amount * 100) AS INTEGER) as target_amount,  -- Convert to cents
    CAST(ROUND(current_amount * 100) AS INTEGER) as current_amount,  -- Convert to cents
    target_date, type, category, description, is_active, created_at, updated_at
FROM savings_goals
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='savings_goals');

-- Drop old table and rename new one (if savings_goals table exists)
DROP TABLE savings_goals;
ALTER TABLE savings_goals_new RENAME TO savings_goals;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_type ON savings_goals(type);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the migration by checking a few key tables
-- This will show the new INTEGER types for monetary columns
PRAGMA table_info(transactions);
PRAGMA table_info(accounts);
