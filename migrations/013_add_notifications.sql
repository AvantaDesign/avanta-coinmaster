-- Migration: Add notifications and task tracking tables
-- Phase 5: In-App Financial Activities and Workflows

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('payment_reminder', 'tax_deadline', 'financial_task', 'system_alert', 'low_cash_flow', 'budget_overrun')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_type TEXT, -- e.g., 'invoice', 'payment', 'task'
  related_id INTEGER, -- ID of related entity
  is_read BOOLEAN NOT NULL DEFAULT 0,
  is_dismissed BOOLEAN NOT NULL DEFAULT 0,
  snoozed_until TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP,
  dismissed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create financial tasks table for tracking completion
CREATE TABLE IF NOT EXISTS financial_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  task_key TEXT NOT NULL, -- unique identifier for the task type
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'cash_flow', 'invoices', 'tax', 'budget'
  is_completed BOOLEAN NOT NULL DEFAULT 0,
  completed_at TIMESTAMP,
  due_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, task_key, due_date)
);

-- Create user preferences for notifications
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  email_notifications BOOLEAN NOT NULL DEFAULT 1,
  payment_reminders BOOLEAN NOT NULL DEFAULT 1,
  tax_deadlines BOOLEAN NOT NULL DEFAULT 1,
  financial_tasks BOOLEAN NOT NULL DEFAULT 1,
  system_alerts BOOLEAN NOT NULL DEFAULT 1,
  reminder_days_before INTEGER NOT NULL DEFAULT 3, -- days before deadline to send reminder
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create onboarding progress tracking
CREATE TABLE IF NOT EXISTS user_onboarding (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT 0,
  current_step INTEGER NOT NULL DEFAULT 0,
  steps_completed TEXT, -- JSON array of completed step identifiers
  last_step_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_tasks_user_id ON financial_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_tasks_frequency ON financial_tasks(frequency);
CREATE INDEX IF NOT EXISTS idx_financial_tasks_due_date ON financial_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_financial_tasks_completed ON financial_tasks(is_completed);

-- Insert default notification preferences for existing users
INSERT OR IGNORE INTO notification_preferences (user_id)
SELECT id FROM users;

-- Insert default onboarding records for existing users
INSERT OR IGNORE INTO user_onboarding (user_id)
SELECT id FROM users;
