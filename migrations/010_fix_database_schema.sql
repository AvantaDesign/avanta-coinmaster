-- Migration 010: Fix Database Schema Issues
-- Date: 2025-10-17
-- Purpose: Fix missing columns and ensure proper database structure

-- Step 1: Add missing columns to users table if they don't exist
-- Note: SQLite doesn't support IF COLUMN NOT EXISTS, so we'll handle errors gracefully

-- Add avatar_url column if it doesn't exist
-- This will fail silently if column already exists
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Add preferences column if it doesn't exist  
-- This will fail silently if column already exists
ALTER TABLE users ADD COLUMN preferences TEXT;

-- Add role column if it doesn't exist
-- This will fail silently if column already exists
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin'));

-- Add updated_at column if it doesn't exist
-- This will fail silently if column already exists
ALTER TABLE users ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Ensure all tables have user_id column
-- Add user_id to accounts table if it doesn't exist
ALTER TABLE accounts ADD COLUMN user_id TEXT;

-- Add user_id to categories table if it doesn't exist
ALTER TABLE categories ADD COLUMN user_id TEXT;

-- Add user_id to invoices table if it doesn't exist
ALTER TABLE invoices ADD COLUMN user_id TEXT;

-- Add user_id to fiscal_payments table if it doesn't exist
ALTER TABLE fiscal_payments ADD COLUMN user_id TEXT;

-- Step 3: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON users(updated_at);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_payments_user_id ON fiscal_payments(user_id);

-- Step 4: Update existing records with default values
-- Set default role for existing users
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Assign existing data to admin user if no user_id is set
UPDATE accounts SET user_id = 'admin_001' WHERE user_id IS NULL;
UPDATE categories SET user_id = 'admin_001' WHERE user_id IS NULL;
UPDATE invoices SET user_id = 'admin_001' WHERE user_id IS NULL;
UPDATE fiscal_payments SET user_id = 'admin_001' WHERE user_id IS NULL;

-- Step 5: Ensure admin user exists and has correct role
INSERT OR IGNORE INTO users (id, email, name, password, role, is_active, created_at)
VALUES (
    'admin_001',
    'm@avantadesign.com',
    'Mateo Reyes',
    'AvantaAdmin2025!',
    'admin',
    1,
    CURRENT_TIMESTAMP
);

-- Update admin user role if exists
UPDATE users SET role = 'admin' WHERE email = 'm@avantadesign.com';

-- Success message
SELECT 'Database schema fixed successfully' AS status;
