-- Migration 043: Add user_id columns to tables missing them
-- Fix for API authentication issues
-- Created: January 2025

-- ============================================================================
-- ADD USER_ID COLUMNS TO TABLES MISSING THEM
-- ============================================================================

-- Add user_id to receivables table
ALTER TABLE receivables ADD COLUMN user_id TEXT NOT NULL DEFAULT 'demo_user_001';

-- Add user_id to payables table  
ALTER TABLE payables ADD COLUMN user_id TEXT NOT NULL DEFAULT 'demo_user_001';

-- Add user_id to automation_rules table
ALTER TABLE automation_rules ADD COLUMN user_id TEXT NOT NULL DEFAULT 'demo_user_001';

-- Add user_id to debts table (if it exists)
ALTER TABLE debts ADD COLUMN user_id TEXT NOT NULL DEFAULT 'demo_user_001';

-- Add user_id to investments table (if it exists)
ALTER TABLE investments ADD COLUMN user_id TEXT NOT NULL DEFAULT 'demo_user_001';

-- Add user_id to notifications table (if it exists)
ALTER TABLE notifications ADD COLUMN user_id TEXT NOT NULL DEFAULT 'demo_user_001';

-- Add user_id to financial_tasks table (if it exists)
ALTER TABLE financial_tasks ADD COLUMN user_id TEXT NOT NULL DEFAULT 'demo_user_001';

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for user_id columns
CREATE INDEX IF NOT EXISTS idx_receivables_user_id ON receivables(user_id);
CREATE INDEX IF NOT EXISTS idx_payables_user_id ON payables(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id ON automation_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_tasks_user_id ON financial_tasks(user_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration adds user_id columns to tables that were missing them
-- and creates appropriate indexes for performance.
