-- Migration 016: Add Metadata Fields
-- Date: 2025-10-18
-- Purpose: Add metadata JSON column to accounts, credits, debts, and investments tables

-- Add metadata column to accounts table
-- Store: bank_name, account_number_last4, branch, swift_code, etc.
ALTER TABLE accounts ADD COLUMN metadata TEXT;

-- Add metadata column to credits table
-- Store: bank_name, card_network, card_last4, apr, etc.
ALTER TABLE credits ADD COLUMN metadata TEXT;

-- Add metadata column to debts table
-- Store: creditor_type, original_creditor, collection_agency, etc.
ALTER TABLE debts ADD COLUMN metadata TEXT;

-- Add metadata column to investments table
-- Store: broker, asset_class, ticker_symbol, cusip, etc.
ALTER TABLE investments ADD COLUMN metadata TEXT;

-- Success message
SELECT 'Metadata fields migration completed successfully' AS status;
