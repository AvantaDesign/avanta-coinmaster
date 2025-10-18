-- Migration 015: Add Savings Goals
-- Date: 2025-10-18
-- Purpose: Create savings_goals table for tracking financial goals

-- Table for tracking savings goals
CREATE TABLE IF NOT EXISTS savings_goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    target_date TEXT,
    type TEXT NOT NULL CHECK(type IN ('personal', 'business')),
    category TEXT, -- e.g., 'investment', 'emergency_fund', 'vacation', 'equipment'
    description TEXT,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_type ON savings_goals(type);
CREATE INDEX IF NOT EXISTS idx_savings_goals_is_active ON savings_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date ON savings_goals(target_date);
CREATE INDEX IF NOT EXISTS idx_savings_goals_category ON savings_goals(category);

-- Add optional savings_goal_id field to transactions table
ALTER TABLE transactions ADD COLUMN savings_goal_id TEXT;

-- Create index for transactions linked to savings goals
CREATE INDEX IF NOT EXISTS idx_transactions_savings_goal_id ON transactions(savings_goal_id);

-- Success message
SELECT 'Savings goals migration completed successfully' AS status;
