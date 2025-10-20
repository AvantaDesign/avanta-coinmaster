-- Migration 038: Add User Roles for Multi-User Architecture
-- Phase 34: Multi-User Architecture and Admin Panel Foundations
-- Purpose: Add role-based access control to enable admin functionality

-- Step 1: Add role column to users table
-- Default to 'user' for all existing users
-- CHECK constraint ensures only valid roles can be stored
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Step 2: Update the first user (usually the account creator) to admin
-- This finds the oldest user account and makes them admin
-- Update: Based on email pattern, make mateo@* or first created user admin
UPDATE users 
SET role = 'admin' 
WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);

-- Alternative: If you know the specific admin email, uncomment and use:
-- UPDATE users SET role = 'admin' WHERE email LIKE 'mateo%' OR email = 'admin@example.com';

-- Step 3: Ensure all other users are set to 'user' role
UPDATE users SET role = 'user' WHERE role IS NULL OR role = '';

-- Step 4: Create index on role for efficient role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Migration complete
-- Next steps:
-- 1. Apply this migration: wrangler d1 execute avanta-coinmaster-preview --file=migrations/038_add_user_roles.sql
-- 2. Update backend auth.js to include role in JWT (already implemented)
-- 3. Create admin API endpoints with role-based authorization
-- 4. Update frontend to show admin interface for admin users
