-- Migration 004: Add User Authentication and Multi-tenancy
-- This migration adds user_id columns to all user data tables
-- to support multi-tenant data isolation

-- Add user_id column to transactions table
ALTER TABLE transactions ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';

-- Add user_id column to accounts table
ALTER TABLE accounts ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';

-- Add user_id column to categories table
ALTER TABLE categories ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';

-- Add user_id column to invoices table
ALTER TABLE invoices ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';

-- Add user_id column to fiscal_payments table
ALTER TABLE fiscal_payments ADD COLUMN user_id TEXT NOT NULL DEFAULT 'default_user';

-- Create indexes for user_id on all tables for query performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_payments_user_id ON fiscal_payments(user_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category);
