-- Migration 004: Add User Authentication and Multi-tenancy Support
-- This migration adds user authentication tables and user_id columns to all existing tables
-- Date: 2025-10-15

-- Step 1: Create users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    password TEXT, -- For email/password auth (hashed)
    google_id TEXT UNIQUE, -- For Google OAuth
    avatar_url TEXT,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT,
    preferences TEXT -- JSON string for user preferences
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Step 2: Add user_id column to transactions table
ALTER TABLE transactions ADD COLUMN user_id TEXT;

-- Step 3: Add user_id column to accounts table
ALTER TABLE accounts ADD COLUMN user_id TEXT;

-- Step 4: Add user_id column to categories table
ALTER TABLE categories ADD COLUMN user_id TEXT;

-- Step 5: Add user_id column to invoices table
ALTER TABLE invoices ADD COLUMN user_id TEXT;

-- Step 6: Add user_id column to fiscal_payments table
ALTER TABLE fiscal_payments ADD COLUMN user_id TEXT;

-- Step 7: Create indexes for user_id columns for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_payments_user_id ON fiscal_payments(user_id);

-- Step 8: Create a default demo user
-- In production, remove this or change credentials
INSERT OR IGNORE INTO users (id, email, name, password, is_active)
VALUES (
    'demo_user_001',
    'demo@avantafinance.com',
    'Demo User',
    'Demo123!', -- Change in production!
    1
);

-- Step 9: Assign existing data to demo user
-- This migrates all existing data to the demo user account
UPDATE transactions SET user_id = 'demo_user_001' WHERE user_id IS NULL;
UPDATE accounts SET user_id = 'demo_user_001' WHERE user_id IS NULL;
UPDATE categories SET user_id = 'demo_user_001' WHERE user_id IS NULL;
UPDATE invoices SET user_id = 'demo_user_001' WHERE user_id IS NULL;
UPDATE fiscal_payments SET user_id = 'demo_user_001' WHERE user_id IS NULL;

-- Step 10: Add user_id to automation_rules if table exists
-- Check if table exists and add column
-- Note: SQLite doesn't support IF COLUMN NOT EXISTS, so we use error handling in application

-- Step 11: Add user_id to receivables if table exists
-- CREATE INDEX IF NOT EXISTS idx_receivables_user_id ON receivables(user_id);

-- Step 12: Add user_id to payables if table exists
-- CREATE INDEX IF NOT EXISTS idx_payables_user_id ON payables(user_id);

-- Note: After this migration, all new queries must include WHERE user_id = ? clause
-- to ensure proper data isolation between users
