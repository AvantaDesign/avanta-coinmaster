-- Migration 014: Add Business/Personal Separation
-- Date: 2025-10-18
-- Purpose: Add type column to relevant tables for business/personal separation

-- Add type column to transactions (reusing existing transaction_type, but standardizing values)
-- Note: transactions already has transaction_type with values 'business', 'personal', 'transfer'
-- We'll create an index to optimize filtering by this field

-- Add type column to recurring_freelancers
ALTER TABLE recurring_freelancers ADD COLUMN type TEXT DEFAULT 'business' CHECK(type IN ('personal', 'business'));

-- Add type column to recurring_services  
ALTER TABLE recurring_services ADD COLUMN type TEXT DEFAULT 'business' CHECK(type IN ('personal', 'business'));

-- Add type column to accounts
ALTER TABLE accounts ADD COLUMN account_type TEXT DEFAULT 'personal' CHECK(account_type IN ('personal', 'business'));

-- Add type column to budgets (already has classification with 'business', 'personal')
-- budgets table already has classification field, no changes needed

-- Add type column to categories
ALTER TABLE categories ADD COLUMN category_type TEXT DEFAULT 'business' CHECK(category_type IN ('personal', 'business'));

-- Create indexes for optimized filtering
CREATE INDEX IF NOT EXISTS idx_recurring_freelancers_type ON recurring_freelancers(type);
CREATE INDEX IF NOT EXISTS idx_recurring_services_type ON recurring_services(type);
CREATE INDEX IF NOT EXISTS idx_accounts_account_type ON accounts(account_type);
CREATE INDEX IF NOT EXISTS idx_categories_category_type ON categories(category_type);

-- Update existing transactions to have proper transaction_type based on category
-- Migrate 'avanta' category to 'business' transaction_type
UPDATE transactions 
SET transaction_type = 'business' 
WHERE category = 'avanta' AND (transaction_type IS NULL OR transaction_type = 'personal');

-- Migrate 'personal' category to 'personal' transaction_type
UPDATE transactions 
SET transaction_type = 'personal' 
WHERE category = 'personal' AND transaction_type IS NULL;

-- Set default for any null values
UPDATE transactions 
SET transaction_type = 'personal' 
WHERE transaction_type IS NULL;

-- Success message
SELECT 'Business/Personal separation migration completed successfully' AS status;
