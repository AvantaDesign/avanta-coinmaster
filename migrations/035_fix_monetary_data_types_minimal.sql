-- ============================================================================
-- Migration 035: Fix Monetary Data Types (Minimal - Only Existing Tables)
-- Phase 30: Critical Infrastructure and Data Hardening
-- ============================================================================
--
-- OBJECTIVE: Convert all monetary columns from REAL to INTEGER (cents-based)
-- Only migrates tables that actually exist in the database
--
-- ============================================================================

-- ============================================================================
-- 1. TRANSACTIONS TABLE
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
-- 2. ACCOUNTS TABLE
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
-- 3. CREDITS TABLE
-- ============================================================================

-- Create new credits table with INTEGER monetary columns
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

-- Migrate credits data
INSERT INTO credits_new
SELECT 
    id, user_id, name, type,
    CAST(ROUND(credit_limit * 100) AS INTEGER) as credit_limit,  -- Convert to cents
    CAST(ROUND(current_balance * 100) AS INTEGER) as current_balance,  -- Convert to cents
    interest_rate,  -- Keep as REAL
    CAST(ROUND(minimum_payment * 100) AS INTEGER) as minimum_payment,  -- Convert to cents
    due_date, is_active, created_at, updated_at
FROM credits;

-- Drop old table and rename new one
DROP TABLE credits;
ALTER TABLE credits_new RENAME TO credits;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_type ON credits(type);

-- ============================================================================
-- 4. CREDIT_MOVEMENTS TABLE
-- ============================================================================

-- Create new credit_movements table with INTEGER amount
CREATE TABLE IF NOT EXISTS credit_movements_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credit_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('payment', 'charge', 'interest')),
    amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    description TEXT,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(credit_id) REFERENCES credits(id)
);

-- Migrate credit_movements data
INSERT INTO credit_movements_new
SELECT 
    id, credit_id, type,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    description, date, created_at
FROM credit_movements;

-- Drop old table and rename new one
DROP TABLE credit_movements;
ALTER TABLE credit_movements_new RENAME TO credit_movements;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_credit_movements_credit_id ON credit_movements(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_movements_date ON credit_movements(date);

-- ============================================================================
-- 5. BUDGETS TABLE
-- ============================================================================

-- Create new budgets table with INTEGER amount
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

-- Migrate budgets data
INSERT INTO budgets_new
SELECT 
    id, user_id, name,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    CAST(ROUND(spent * 100) AS INTEGER) as spent,   -- Convert to cents
    period_start, period_end, category, is_active, created_at, updated_at
FROM budgets;

-- Drop old table and rename new one
DROP TABLE budgets;
ALTER TABLE budgets_new RENAME TO budgets;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period_start, period_end);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify the migration by checking the new INTEGER types
PRAGMA table_info(transactions);
PRAGMA table_info(accounts);
PRAGMA table_info(credits);
PRAGMA table_info(credit_movements);
PRAGMA table_info(budgets);
