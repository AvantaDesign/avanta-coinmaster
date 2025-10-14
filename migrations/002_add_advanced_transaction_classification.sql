-- Migration: Add Advanced Transaction Classification fields
-- Phase 1: Advanced Transaction Classification
-- Date: 2025-10-14

-- Add new columns to transactions table
ALTER TABLE transactions ADD COLUMN transaction_type TEXT CHECK(transaction_type IN ('business', 'personal', 'transfer')) DEFAULT 'personal';
ALTER TABLE transactions ADD COLUMN category_id INTEGER;
ALTER TABLE transactions ADD COLUMN linked_invoice_id INTEGER;
ALTER TABLE transactions ADD COLUMN notes TEXT;
ALTER TABLE transactions ADD COLUMN is_deleted INTEGER DEFAULT 0 CHECK(is_deleted IN (0, 1));

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted ON transactions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_linked_invoice_id ON transactions(linked_invoice_id);

-- Set default values for existing records
-- Map existing 'category' field to new 'transaction_type' field
-- 'avanta' category -> 'business' transaction_type
-- 'personal' category -> 'personal' transaction_type
UPDATE transactions SET transaction_type = 'business' WHERE category = 'avanta';
UPDATE transactions SET transaction_type = 'personal' WHERE category = 'personal';
