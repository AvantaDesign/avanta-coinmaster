-- Migration 011: Add Recurring Payments Tables
-- Date: 2025-10-17
-- Purpose: Create tables for managing recurring payments to freelancers and services

-- Table for recurring freelancer payments
CREATE TABLE IF NOT EXISTS recurring_freelancers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    freelancer_name TEXT NOT NULL,
    freelancer_rfc TEXT,
    amount REAL NOT NULL,
    frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    payment_day INTEGER CHECK(payment_day >= 1 AND payment_day <= 31), -- Day of month for monthly payments
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'paused')),
    description TEXT,
    category TEXT,
    next_payment_date TEXT,
    last_generated_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT
);

-- Table for recurring service payments (subscriptions, utilities, etc.)
CREATE TABLE IF NOT EXISTS recurring_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    amount REAL NOT NULL,
    frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    payment_day INTEGER CHECK(payment_day >= 1 AND payment_day <= 31), -- Day of month for monthly payments
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'paused')),
    description TEXT,
    category TEXT,
    next_payment_date TEXT,
    last_generated_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recurring_freelancers_status ON recurring_freelancers(status);
CREATE INDEX IF NOT EXISTS idx_recurring_freelancers_next_payment ON recurring_freelancers(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_recurring_freelancers_user_id ON recurring_freelancers(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_freelancers_frequency ON recurring_freelancers(frequency);

CREATE INDEX IF NOT EXISTS idx_recurring_services_status ON recurring_services(status);
CREATE INDEX IF NOT EXISTS idx_recurring_services_next_payment ON recurring_services(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_recurring_services_user_id ON recurring_services(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_services_frequency ON recurring_services(frequency);

-- Success message
SELECT 'Recurring payments tables created successfully' AS status;
