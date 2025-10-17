-- Migration 009: Add Admin User and Role-Based Access Control
-- Date: 2025-10-16
-- Purpose: Restore admin access to m@avantadesign.com and add role system

-- Step 1: Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin'));

-- Step 2: Create index on role for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Step 3: Update demo user to have admin role
UPDATE users SET role = 'admin' WHERE email = 'demo@avantafinance.com';

-- Step 4: Insert or update admin user m@avantadesign.com
-- If user exists, update role and ensure active
-- If user doesn't exist, create with placeholder password (will be hashed on first login)
INSERT INTO users (id, email, name, password, role, is_active, created_at)
VALUES (
    'admin_001',
    'm@avantadesign.com',
    'Mateo Reyes',
    'AvantaAdmin2025!', -- This will be hashed on first login due to migration 008
    'admin',
    1,
    CURRENT_TIMESTAMP
)
ON CONFLICT(email) DO UPDATE SET
    role = 'admin',
    is_active = 1,
    password = CASE 
        WHEN password IS NULL OR password = '' THEN 'AvantaAdmin2025!'
        ELSE password
    END;

-- Step 5: Ensure all existing users have a role
UPDATE users SET role = 'user' WHERE role IS NULL;

-- Success message
SELECT 'Admin user and role system added successfully' AS status;
