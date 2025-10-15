-- Phase 3: Automation and Accounts Receivable/Payable Schema
-- Migration: 003_add_automation_and_ar_ap.sql

-- Receivables table: Track outstanding invoices and payments
CREATE TABLE IF NOT EXISTS receivables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_rfc TEXT,
    invoice_number TEXT,
    invoice_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    amount REAL NOT NULL,
    amount_paid REAL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
    payment_terms INTEGER DEFAULT 30, -- days
    notes TEXT,
    last_reminder_date TEXT,
    reminder_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Payables table: Track bills and vendor payments
CREATE TABLE IF NOT EXISTS payables (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_name TEXT NOT NULL,
    vendor_rfc TEXT,
    bill_number TEXT,
    bill_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    amount REAL NOT NULL,
    amount_paid REAL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
    payment_terms INTEGER DEFAULT 30, -- days
    category TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Automation rules table: Configure automatic invoice generation and reminders
CREATE TABLE IF NOT EXISTS automation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_type TEXT NOT NULL CHECK(rule_type IN ('recurring_invoice', 'payment_reminder', 'overdue_alert')),
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    -- For recurring invoices
    customer_name TEXT,
    customer_rfc TEXT,
    amount REAL,
    frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    start_date TEXT,
    end_date TEXT,
    last_generated_date TEXT,
    next_generation_date TEXT,
    -- For reminders
    days_before_due INTEGER,
    reminder_type TEXT CHECK(reminder_type IN ('email', 'notification', 'both')),
    -- Configuration JSON for additional settings
    config_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Payment schedules table: Track scheduled payments
CREATE TABLE IF NOT EXISTS payment_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_type TEXT NOT NULL CHECK(schedule_type IN ('receivable', 'payable')),
    reference_id INTEGER NOT NULL, -- receivable_id or payable_id
    scheduled_date TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled', 'missed')),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Receivable payments table: Track individual payments for receivables
CREATE TABLE IF NOT EXISTS receivable_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receivable_id INTEGER NOT NULL,
    payment_date TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receivable_id) REFERENCES receivables(id)
);

-- Payable payments table: Track individual payments for payables
CREATE TABLE IF NOT EXISTS payable_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payable_id INTEGER NOT NULL,
    payment_date TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payable_id) REFERENCES payables(id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_receivables_status ON receivables(status);
CREATE INDEX IF NOT EXISTS idx_receivables_due_date ON receivables(due_date);
CREATE INDEX IF NOT EXISTS idx_receivables_invoice_id ON receivables(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receivables_customer_name ON receivables(customer_name);

CREATE INDEX IF NOT EXISTS idx_payables_status ON payables(status);
CREATE INDEX IF NOT EXISTS idx_payables_due_date ON payables(due_date);
CREATE INDEX IF NOT EXISTS idx_payables_vendor_name ON payables(vendor_name);

CREATE INDEX IF NOT EXISTS idx_automation_rules_type ON automation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_rules_next_date ON automation_rules(next_generation_date);

CREATE INDEX IF NOT EXISTS idx_payment_schedules_type ON payment_schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_date ON payment_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status);

CREATE INDEX IF NOT EXISTS idx_receivable_payments_receivable_id ON receivable_payments(receivable_id);
CREATE INDEX IF NOT EXISTS idx_payable_payments_payable_id ON payable_payments(payable_id);
