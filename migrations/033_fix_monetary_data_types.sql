-- ============================================================================
-- Migration 033: Fix Monetary Data Types
-- Phase 30: Critical Infrastructure and Data Hardening
-- ============================================================================
--
-- OBJECTIVE: Convert all monetary columns from REAL to INTEGER (cents-based)
--
-- RATIONALE:
--   SQLite's REAL type uses floating-point arithmetic which can introduce
--   rounding errors in financial calculations. By storing monetary values
--   as INTEGER cents (multiply by 100), we eliminate floating-point errors
--   and ensure perfect accuracy for financial operations.
--
-- STRATEGY:
--   1. Create new tables with INTEGER monetary columns
--   2. Migrate data, converting REAL to cents (multiply by 100, round)
--   3. Drop old tables
--   4. Rename new tables to original names
--   5. Recreate indexes
--
-- NOTES:
--   - Percentage/rate columns (interest_rate, iva_rate, etc.) remain REAL
--   - All monetary amounts are converted: amount, balance, total, etc.
--   - Backend code must be updated to handle cent-based values
--   - Frontend displays must convert cents back to decimal for display
--
-- ============================================================================

-- ============================================================================
-- CORE TABLES: Transactions, Accounts, Invoices
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. TRANSACTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    type TEXT NOT NULL CHECK(type IN ('ingreso', 'gasto')),
    category TEXT NOT NULL CHECK(category IN ('personal', 'avanta')),
    account TEXT,
    is_deductible INTEGER DEFAULT 0 CHECK(is_deductible IN (0, 1)),
    economic_activity TEXT,
    receipt_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    transaction_type TEXT CHECK(transaction_type IN ('business', 'personal', 'transfer')) DEFAULT 'personal',
    category_id INTEGER,
    linked_invoice_id INTEGER,
    notes TEXT,
    is_deleted INTEGER DEFAULT 0 CHECK(is_deleted IN (0, 1)),
    is_iva_deductible INTEGER DEFAULT 0 CHECK(is_iva_deductible IN (0, 1)),
    is_isr_deductible INTEGER DEFAULT 0 CHECK(is_isr_deductible IN (0, 1)),
    expense_type TEXT DEFAULT 'national' CHECK(expense_type IN ('national', 'international_with_invoice', 'international_no_invoice')),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Migrate transactions data
INSERT INTO transactions_new 
SELECT 
    id, user_id, date, description,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    type, category, account, is_deductible, economic_activity, receipt_url,
    created_at, transaction_type, category_id, linked_invoice_id, notes,
    is_deleted, is_iva_deductible, is_isr_deductible, expense_type
FROM transactions;

DROP TABLE transactions;
ALTER TABLE transactions_new RENAME TO transactions;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted ON transactions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_linked_invoice_id ON transactions(linked_invoice_id);
CREATE INDEX IF NOT EXISTS idx_transactions_is_iva_deductible ON transactions(is_iva_deductible);
CREATE INDEX IF NOT EXISTS idx_transactions_is_isr_deductible ON transactions(is_isr_deductible);
CREATE INDEX IF NOT EXISTS idx_transactions_expense_type ON transactions(expense_type);

-- ----------------------------------------------------------------------------
-- 2. ACCOUNTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS accounts_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('checking', 'savings', 'credit', 'cash')),
    balance INTEGER DEFAULT 0,  -- Changed from REAL to INTEGER (cents)
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Migrate accounts data
INSERT INTO accounts_new
SELECT 
    id, user_id, name, type,
    CAST(ROUND(balance * 100) AS INTEGER) as balance,  -- Convert to cents
    is_active, created_at, updated_at
FROM accounts;

DROP TABLE accounts;
ALTER TABLE accounts_new RENAME TO accounts;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- ----------------------------------------------------------------------------
-- 3. INVOICES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    uuid TEXT NOT NULL,
    rfc_emisor TEXT NOT NULL,
    rfc_receptor TEXT NOT NULL,
    date TEXT NOT NULL,
    subtotal INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    iva INTEGER NOT NULL,       -- Changed from REAL to INTEGER (cents)
    total INTEGER NOT NULL,     -- Changed from REAL to INTEGER (cents)
    xml_url TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, uuid)
);

-- Migrate invoices data
INSERT INTO invoices_new
SELECT 
    id, user_id, uuid, rfc_emisor, rfc_receptor, date,
    CAST(ROUND(subtotal * 100) AS INTEGER) as subtotal,  -- Convert to cents
    CAST(ROUND(iva * 100) AS INTEGER) as iva,            -- Convert to cents
    CAST(ROUND(total * 100) AS INTEGER) as total,        -- Convert to cents
    xml_url, status, created_at
FROM invoices;

DROP TABLE invoices;
ALTER TABLE invoices_new RENAME TO invoices;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);

-- ----------------------------------------------------------------------------
-- 4. FISCAL_PAYMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fiscal_payments_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    isr INTEGER DEFAULT 0,  -- Changed from REAL to INTEGER (cents)
    iva INTEGER DEFAULT 0,  -- Changed from REAL to INTEGER (cents)
    diot_status TEXT DEFAULT 'pending' CHECK(diot_status IN ('pending', 'filed', 'exempt')),
    due_date TEXT NOT NULL,
    payment_date TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, year, month)
);

-- Migrate fiscal_payments data
INSERT INTO fiscal_payments_new
SELECT 
    id, user_id, year, month,
    CAST(ROUND(isr * 100) AS INTEGER) as isr,  -- Convert to cents
    CAST(ROUND(iva * 100) AS INTEGER) as iva,  -- Convert to cents
    diot_status, due_date, payment_date, status, created_at
FROM fiscal_payments;

DROP TABLE fiscal_payments;
ALTER TABLE fiscal_payments_new RENAME TO fiscal_payments;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_fiscal_payments_user_id ON fiscal_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_payments_year_month ON fiscal_payments(year, month);

-- ============================================================================
-- CREDITS AND MOVEMENTS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5. CREDITS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credits_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('credit_card', 'loan', 'mortgage')),
    credit_limit INTEGER,        -- Changed from REAL to INTEGER (cents)
    interest_rate REAL,          -- KEEP as REAL (percentage)
    statement_day INTEGER,
    payment_due_day INTEGER,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Migrate credits data
INSERT INTO credits_new
SELECT 
    id, user_id, name, type,
    CAST(ROUND(COALESCE(credit_limit, 0) * 100) AS INTEGER) as credit_limit,  -- Convert to cents
    interest_rate,  -- Keep as REAL
    statement_day, payment_due_day, is_active, created_at, updated_at
FROM credits;

DROP TABLE credits;
ALTER TABLE credits_new RENAME TO credits;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_type ON credits(type);
CREATE INDEX IF NOT EXISTS idx_credits_is_active ON credits(is_active);

-- ----------------------------------------------------------------------------
-- 6. CREDIT_MOVEMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS credit_movements_new (
    id TEXT PRIMARY KEY,
    credit_id TEXT NOT NULL,
    transaction_id INTEGER,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    type TEXT NOT NULL CHECK(type IN ('payment', 'charge', 'interest')),
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(credit_id) REFERENCES credits(id),
    FOREIGN KEY(transaction_id) REFERENCES transactions(id)
);

-- Migrate credit_movements data
INSERT INTO credit_movements_new
SELECT 
    id, credit_id, transaction_id, description,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    type, date, created_at
FROM credit_movements;

DROP TABLE credit_movements;
ALTER TABLE credit_movements_new RENAME TO credit_movements;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_credit_movements_credit_id ON credit_movements(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_movements_date ON credit_movements(date);
CREATE INDEX IF NOT EXISTS idx_credit_movements_type ON credit_movements(type);

-- ============================================================================
-- BUDGETS AND FISCAL CONFIGURATION
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7. BUDGETS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS budgets_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category_id INTEGER,
    classification TEXT NOT NULL CHECK(classification IN ('business', 'personal')),
    amount INTEGER NOT NULL CHECK(amount >= 0),  -- Changed from REAL to INTEGER (cents)
    period TEXT NOT NULL CHECK(period IN ('monthly', 'quarterly', 'yearly')),
    start_date TEXT NOT NULL,
    end_date TEXT,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(category_id) REFERENCES categories(id)
);

-- Migrate budgets data
INSERT INTO budgets_new
SELECT 
    id, user_id, category_id, classification,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    period, start_date, end_date, is_active, notes, created_at, updated_at
FROM budgets;

DROP TABLE budgets;
ALTER TABLE budgets_new RENAME TO budgets;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_classification ON budgets(classification);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);
CREATE INDEX IF NOT EXISTS idx_budgets_is_active ON budgets(is_active);
CREATE INDEX IF NOT EXISTS idx_budgets_start_date ON budgets(start_date);

-- ----------------------------------------------------------------------------
-- 8. FISCAL_CONFIG TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fiscal_config_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    isr_brackets TEXT NOT NULL,
    iva_rate REAL DEFAULT 0.16,              -- KEEP as REAL (percentage)
    iva_retention_rate REAL DEFAULT 0.1067,  -- KEEP as REAL (percentage)
    diot_threshold INTEGER DEFAULT 5000000,  -- Changed from REAL to INTEGER (cents) - 50,000 * 100
    settings TEXT,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, year)
);

-- Migrate fiscal_config data
INSERT INTO fiscal_config_new
SELECT 
    id, user_id, year, isr_brackets,
    iva_rate,           -- Keep as REAL
    iva_retention_rate, -- Keep as REAL
    CAST(ROUND(COALESCE(diot_threshold, 50000) * 100) AS INTEGER) as diot_threshold,  -- Convert to cents
    settings, is_active, created_at, updated_at
FROM fiscal_config;

DROP TABLE fiscal_config;
ALTER TABLE fiscal_config_new RENAME TO fiscal_config;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_fiscal_config_user_id ON fiscal_config(user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_config_year ON fiscal_config(year);
CREATE INDEX IF NOT EXISTS idx_fiscal_config_is_active ON fiscal_config(is_active);

-- ----------------------------------------------------------------------------
-- 9. TRANSACTION_INVOICE_MAP TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transaction_invoice_map_new (
    id TEXT PRIMARY KEY,
    transaction_id INTEGER NOT NULL,
    invoice_id INTEGER NOT NULL,
    amount INTEGER,  -- Changed from REAL to INTEGER (cents), nullable
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT,
    FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY(created_by) REFERENCES users(id),
    UNIQUE(transaction_id, invoice_id)
);

-- Migrate transaction_invoice_map data
INSERT INTO transaction_invoice_map_new
SELECT 
    id, transaction_id, invoice_id,
    CASE 
        WHEN amount IS NOT NULL THEN CAST(ROUND(amount * 100) AS INTEGER)
        ELSE NULL 
    END as amount,  -- Convert to cents if not null
    notes, created_at, created_by
FROM transaction_invoice_map;

DROP TABLE transaction_invoice_map;
ALTER TABLE transaction_invoice_map_new RENAME TO transaction_invoice_map;

-- ----------------------------------------------------------------------------
-- 10. DEDUCTIBILITY_RULES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS deductibility_rules_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    match_category_id INTEGER,
    match_keywords TEXT,
    match_amount_min INTEGER,  -- Changed from REAL to INTEGER (cents)
    match_amount_max INTEGER,  -- Changed from REAL to INTEGER (cents)
    match_transaction_type TEXT CHECK(match_transaction_type IN ('business', 'personal', 'transfer') OR match_transaction_type IS NULL),
    match_expense_type TEXT CHECK(match_expense_type IN ('national', 'international_with_invoice', 'international_no_invoice') OR match_expense_type IS NULL),
    set_is_iva_deductible INTEGER CHECK(set_is_iva_deductible IN (0, 1) OR set_is_iva_deductible IS NULL),
    set_is_isr_deductible INTEGER CHECK(set_is_isr_deductible IN (0, 1) OR set_is_isr_deductible IS NULL),
    set_expense_type TEXT CHECK(set_expense_type IN ('national', 'international_with_invoice', 'international_no_invoice') OR set_expense_type IS NULL),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(match_category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Migrate deductibility_rules data
INSERT INTO deductibility_rules_new
SELECT 
    id, user_id, name, description, priority, is_active,
    match_category_id, match_keywords,
    CASE 
        WHEN match_amount_min IS NOT NULL THEN CAST(ROUND(match_amount_min * 100) AS INTEGER)
        ELSE NULL 
    END as match_amount_min,  -- Convert to cents
    CASE 
        WHEN match_amount_max IS NOT NULL THEN CAST(ROUND(match_amount_max * 100) AS INTEGER)
        ELSE NULL 
    END as match_amount_max,  -- Convert to cents
    match_transaction_type, match_expense_type,
    set_is_iva_deductible, set_is_isr_deductible, set_expense_type,
    notes, created_at, updated_at
FROM deductibility_rules;

DROP TABLE deductibility_rules;
ALTER TABLE deductibility_rules_new RENAME TO deductibility_rules;

-- ============================================================================
-- ADDITIONAL TABLES FROM MIGRATIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 11. RECEIVABLES TABLE (from migration 003)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receivables_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_rfc TEXT,
    invoice_number TEXT,
    invoice_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    amount INTEGER NOT NULL,      -- Changed from REAL to INTEGER (cents)
    amount_paid INTEGER DEFAULT 0, -- Changed from REAL to INTEGER (cents)
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
    payment_terms INTEGER DEFAULT 30,
    notes TEXT,
    last_reminder_date TEXT,
    reminder_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Migrate receivables data
INSERT INTO receivables_new
SELECT 
    id, invoice_id, customer_name, customer_rfc, invoice_number,
    invoice_date, due_date,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,          -- Convert to cents
    CAST(ROUND(amount_paid * 100) AS INTEGER) as amount_paid, -- Convert to cents
    status, payment_terms, notes, last_reminder_date, reminder_count,
    created_at, updated_at
FROM receivables;

DROP TABLE receivables;
ALTER TABLE receivables_new RENAME TO receivables;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_receivables_status ON receivables(status);
CREATE INDEX IF NOT EXISTS idx_receivables_due_date ON receivables(due_date);
CREATE INDEX IF NOT EXISTS idx_receivables_invoice_id ON receivables(invoice_id);
CREATE INDEX IF NOT EXISTS idx_receivables_customer_name ON receivables(customer_name);

-- ----------------------------------------------------------------------------
-- 12. PAYABLES TABLE (from migration 003)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payables_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_name TEXT NOT NULL,
    vendor_rfc TEXT,
    bill_number TEXT,
    bill_date TEXT NOT NULL,
    due_date TEXT NOT NULL,
    amount INTEGER NOT NULL,      -- Changed from REAL to INTEGER (cents)
    amount_paid INTEGER DEFAULT 0, -- Changed from REAL to INTEGER (cents)
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
    payment_terms INTEGER DEFAULT 30,
    category TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Migrate payables data
INSERT INTO payables_new
SELECT 
    id, vendor_name, vendor_rfc, bill_number, bill_date, due_date,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,          -- Convert to cents
    CAST(ROUND(amount_paid * 100) AS INTEGER) as amount_paid, -- Convert to cents
    status, payment_terms, category, notes, created_at, updated_at
FROM payables;

DROP TABLE payables;
ALTER TABLE payables_new RENAME TO payables;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_payables_status ON payables(status);
CREATE INDEX IF NOT EXISTS idx_payables_due_date ON payables(due_date);
CREATE INDEX IF NOT EXISTS idx_payables_vendor_name ON payables(vendor_name);

-- ----------------------------------------------------------------------------
-- 13. AUTOMATION_RULES TABLE (from migration 003)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automation_rules_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_type TEXT NOT NULL CHECK(rule_type IN ('recurring_invoice', 'payment_reminder', 'overdue_alert')),
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    customer_name TEXT,
    customer_rfc TEXT,
    amount INTEGER,  -- Changed from REAL to INTEGER (cents)
    frequency TEXT CHECK(frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    start_date TEXT,
    end_date TEXT,
    last_generated_date TEXT,
    next_generation_date TEXT,
    days_before_due INTEGER,
    reminder_type TEXT CHECK(reminder_type IN ('email', 'notification', 'both')),
    config_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Migrate automation_rules data
INSERT INTO automation_rules_new
SELECT 
    id, rule_type, name, description, is_active, customer_name, customer_rfc,
    CASE 
        WHEN amount IS NOT NULL THEN CAST(ROUND(amount * 100) AS INTEGER)
        ELSE NULL 
    END as amount,  -- Convert to cents
    frequency, start_date, end_date, last_generated_date, next_generation_date,
    days_before_due, reminder_type, config_json, created_at, updated_at
FROM automation_rules;

DROP TABLE automation_rules;
ALTER TABLE automation_rules_new RENAME TO automation_rules;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_type ON automation_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_rules_next_date ON automation_rules(next_generation_date);

-- ----------------------------------------------------------------------------
-- 14. PAYMENT_SCHEDULES TABLE (from migration 003)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_schedules_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule_type TEXT NOT NULL CHECK(schedule_type IN ('receivable', 'payable')),
    reference_id INTEGER NOT NULL,
    scheduled_date TEXT NOT NULL,
    amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled', 'missed')),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Migrate payment_schedules data
INSERT INTO payment_schedules_new
SELECT 
    id, schedule_type, reference_id, scheduled_date,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    status, notes, created_at, updated_at
FROM payment_schedules;

DROP TABLE payment_schedules;
ALTER TABLE payment_schedules_new RENAME TO payment_schedules;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_payment_schedules_type ON payment_schedules(schedule_type);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_date ON payment_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_payment_schedules_status ON payment_schedules(status);

-- ----------------------------------------------------------------------------
-- 15. RECEIVABLE_PAYMENTS TABLE (from migration 003)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receivable_payments_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    receivable_id INTEGER NOT NULL,
    payment_date TEXT NOT NULL,
    amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (receivable_id) REFERENCES receivables(id)
);

-- Migrate receivable_payments data
INSERT INTO receivable_payments_new
SELECT 
    id, receivable_id, payment_date,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    payment_method, reference_number, notes, created_at
FROM receivable_payments;

DROP TABLE receivable_payments;
ALTER TABLE receivable_payments_new RENAME TO receivable_payments;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_receivable_payments_receivable_id ON receivable_payments(receivable_id);

-- ----------------------------------------------------------------------------
-- 16. PAYABLE_PAYMENTS TABLE (from migration 003)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payable_payments_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    payable_id INTEGER NOT NULL,
    payment_date TEXT NOT NULL,
    amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payable_id) REFERENCES payables(id)
);

-- Migrate payable_payments data
INSERT INTO payable_payments_new
SELECT 
    id, payable_id, payment_date,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    payment_method, reference_number, notes, created_at
FROM payable_payments;

DROP TABLE payable_payments;
ALTER TABLE payable_payments_new RENAME TO payable_payments;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_payable_payments_payable_id ON payable_payments(payable_id);

-- ============================================================================
-- RECURRING PAYMENTS AND SERVICES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 17. RECURRING_FREELANCERS TABLE (from migration 011)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_freelancers_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    freelancer_name TEXT NOT NULL,
    freelancer_rfc TEXT,
    amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    payment_day INTEGER CHECK(payment_day >= 1 AND payment_day <= 31),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'paused')),
    description TEXT,
    category TEXT,
    next_payment_date TEXT,
    last_generated_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT
);

-- Migrate recurring_freelancers data
INSERT INTO recurring_freelancers_new
SELECT 
    id, freelancer_name, freelancer_rfc,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    frequency, payment_day, status, description, category,
    next_payment_date, last_generated_date, created_at, updated_at, user_id
FROM recurring_freelancers;

DROP TABLE recurring_freelancers;
ALTER TABLE recurring_freelancers_new RENAME TO recurring_freelancers;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_recurring_freelancers_status ON recurring_freelancers(status);
CREATE INDEX IF NOT EXISTS idx_recurring_freelancers_next_payment ON recurring_freelancers(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_recurring_freelancers_user_id ON recurring_freelancers(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_freelancers_frequency ON recurring_freelancers(frequency);

-- ----------------------------------------------------------------------------
-- 18. RECURRING_SERVICES TABLE (from migration 011)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_services_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
    payment_day INTEGER CHECK(payment_day >= 1 AND payment_day <= 31),
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'paused')),
    description TEXT,
    category TEXT,
    next_payment_date TEXT,
    last_generated_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT
);

-- Migrate recurring_services data
INSERT INTO recurring_services_new
SELECT 
    id, service_name, provider,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    frequency, payment_day, status, description, category,
    next_payment_date, last_generated_date, created_at, updated_at, user_id
FROM recurring_services;

DROP TABLE recurring_services;
ALTER TABLE recurring_services_new RENAME TO recurring_services;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_recurring_services_status ON recurring_services(status);
CREATE INDEX IF NOT EXISTS idx_recurring_services_next_payment ON recurring_services(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_recurring_services_user_id ON recurring_services(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_services_frequency ON recurring_services(frequency);

-- ============================================================================
-- DEBTS AND INVESTMENTS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 19. DEBTS TABLE (from migration 012)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS debts_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_name TEXT NOT NULL,
    lender TEXT NOT NULL,
    principal_amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    current_balance INTEGER NOT NULL,   -- Changed from REAL to INTEGER (cents)
    interest_rate REAL NOT NULL,        -- KEEP as REAL (percentage)
    interest_type TEXT NOT NULL CHECK(interest_type IN ('fixed', 'variable')),
    loan_term_months INTEGER NOT NULL,
    payment_frequency TEXT NOT NULL CHECK(payment_frequency IN ('monthly', 'biweekly', 'weekly', 'quarterly')),
    monthly_payment INTEGER,  -- Changed from REAL to INTEGER (cents)
    start_date TEXT NOT NULL,
    end_date TEXT,
    next_payment_date TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paid_off', 'refinanced', 'defaulted')),
    category TEXT,
    description TEXT,
    collateral TEXT,
    payment_day INTEGER CHECK(payment_day >= 1 AND payment_day <= 31),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT
);

-- Migrate debts data
INSERT INTO debts_new
SELECT 
    id, debt_name, lender,
    CAST(ROUND(principal_amount * 100) AS INTEGER) as principal_amount,  -- Convert to cents
    CAST(ROUND(current_balance * 100) AS INTEGER) as current_balance,    -- Convert to cents
    interest_rate,  -- Keep as REAL
    interest_type, loan_term_months, payment_frequency,
    CASE 
        WHEN monthly_payment IS NOT NULL THEN CAST(ROUND(monthly_payment * 100) AS INTEGER)
        ELSE NULL 
    END as monthly_payment,  -- Convert to cents
    start_date, end_date, next_payment_date, status, category,
    description, collateral, payment_day, created_at, updated_at, user_id
FROM debts;

DROP TABLE debts;
ALTER TABLE debts_new RENAME TO debts;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_next_payment ON debts(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_category ON debts(category);

-- ----------------------------------------------------------------------------
-- 20. DEBT_PAYMENTS TABLE (from migration 012)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS debt_payments_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_id INTEGER NOT NULL,
    payment_date TEXT NOT NULL,
    amount INTEGER NOT NULL,           -- Changed from REAL to INTEGER (cents)
    principal_paid INTEGER NOT NULL,   -- Changed from REAL to INTEGER (cents)
    interest_paid INTEGER NOT NULL,    -- Changed from REAL to INTEGER (cents)
    remaining_balance INTEGER NOT NULL, -- Changed from REAL to INTEGER (cents)
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
);

-- Migrate debt_payments data
INSERT INTO debt_payments_new
SELECT 
    id, debt_id, payment_date,
    CAST(ROUND(amount * 100) AS INTEGER) as amount,                    -- Convert to cents
    CAST(ROUND(principal_paid * 100) AS INTEGER) as principal_paid,    -- Convert to cents
    CAST(ROUND(interest_paid * 100) AS INTEGER) as interest_paid,      -- Convert to cents
    CAST(ROUND(remaining_balance * 100) AS INTEGER) as remaining_balance, -- Convert to cents
    payment_method, reference_number, notes, created_at
FROM debt_payments;

DROP TABLE debt_payments;
ALTER TABLE debt_payments_new RENAME TO debt_payments;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_date ON debt_payments(payment_date);

-- ----------------------------------------------------------------------------
-- 21. INVESTMENTS TABLE (from migration 012)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investments_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investment_name TEXT NOT NULL,
    investment_type TEXT NOT NULL CHECK(investment_type IN ('stocks', 'bonds', 'mutual_funds', 'real_estate', 'crypto', 'other')),
    broker_platform TEXT,
    purchase_date TEXT NOT NULL,
    purchase_amount INTEGER NOT NULL,      -- Changed from REAL to INTEGER (cents)
    quantity REAL,                          -- KEEP as REAL (can be fractional shares)
    current_value INTEGER,                  -- Changed from REAL to INTEGER (cents)
    current_price_per_unit INTEGER,        -- Changed from REAL to INTEGER (cents)
    currency TEXT DEFAULT 'MXN',
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'sold', 'closed')),
    category TEXT,
    risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')),
    description TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT
);

-- Migrate investments data
INSERT INTO investments_new
SELECT 
    id, investment_name, investment_type, broker_platform, purchase_date,
    CAST(ROUND(purchase_amount * 100) AS INTEGER) as purchase_amount,  -- Convert to cents
    quantity,  -- Keep as REAL
    CASE 
        WHEN current_value IS NOT NULL THEN CAST(ROUND(current_value * 100) AS INTEGER)
        ELSE NULL 
    END as current_value,  -- Convert to cents
    CASE 
        WHEN current_price_per_unit IS NOT NULL THEN CAST(ROUND(current_price_per_unit * 100) AS INTEGER)
        ELSE NULL 
    END as current_price_per_unit,  -- Convert to cents
    currency, status, category, risk_level, description, notes,
    created_at, updated_at, user_id
FROM investments;

DROP TABLE investments;
ALTER TABLE investments_new RENAME TO investments;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(investment_type);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_purchase_date ON investments(purchase_date);

-- ----------------------------------------------------------------------------
-- 22. INVESTMENT_TRANSACTIONS TABLE (from migration 012)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investment_transactions_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investment_id INTEGER NOT NULL,
    transaction_date TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('buy', 'sell', 'dividend', 'interest', 'fee')),
    quantity REAL,                  -- KEEP as REAL (can be fractional shares)
    price_per_unit INTEGER,        -- Changed from REAL to INTEGER (cents)
    amount INTEGER NOT NULL,       -- Changed from REAL to INTEGER (cents)
    fees INTEGER DEFAULT 0,        -- Changed from REAL to INTEGER (cents)
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
);

-- Migrate investment_transactions data
INSERT INTO investment_transactions_new
SELECT 
    id, investment_id, transaction_date, transaction_type,
    quantity,  -- Keep as REAL
    CASE 
        WHEN price_per_unit IS NOT NULL THEN CAST(ROUND(price_per_unit * 100) AS INTEGER)
        ELSE NULL 
    END as price_per_unit,  -- Convert to cents
    CAST(ROUND(amount * 100) AS INTEGER) as amount,  -- Convert to cents
    CAST(ROUND(fees * 100) AS INTEGER) as fees,      -- Convert to cents
    description, created_at
FROM investment_transactions;

DROP TABLE investment_transactions;
ALTER TABLE investment_transactions_new RENAME TO investment_transactions;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_investment_transactions_investment_id ON investment_transactions(investment_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_date ON investment_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_type ON investment_transactions(transaction_type);

-- ----------------------------------------------------------------------------
-- 23. INVESTMENT_VALUATIONS TABLE (from migration 012)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS investment_valuations_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investment_id INTEGER NOT NULL,
    valuation_date TEXT NOT NULL,
    value INTEGER NOT NULL,         -- Changed from REAL to INTEGER (cents)
    price_per_unit INTEGER,         -- Changed from REAL to INTEGER (cents)
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
);

-- Migrate investment_valuations data
INSERT INTO investment_valuations_new
SELECT 
    id, investment_id, valuation_date,
    CAST(ROUND(value * 100) AS INTEGER) as value,  -- Convert to cents
    CASE 
        WHEN price_per_unit IS NOT NULL THEN CAST(ROUND(price_per_unit * 100) AS INTEGER)
        ELSE NULL 
    END as price_per_unit,  -- Convert to cents
    notes, created_at
FROM investment_valuations;

DROP TABLE investment_valuations;
ALTER TABLE investment_valuations_new RENAME TO investment_valuations;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_investment_valuations_investment_id ON investment_valuations(investment_id);
CREATE INDEX IF NOT EXISTS idx_investment_valuations_date ON investment_valuations(valuation_date);

-- ----------------------------------------------------------------------------
-- 24. FREELANCER_TIMESHEETS TABLE (from migration 012)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS freelancer_timesheets_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    freelancer_id INTEGER NOT NULL,
    work_date TEXT NOT NULL,
    hours_worked REAL NOT NULL,             -- KEEP as REAL (can be fractional hours)
    hourly_rate INTEGER,                    -- Changed from REAL to INTEGER (cents)
    total_amount INTEGER,                   -- Changed from REAL to INTEGER (cents)
    project_name TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'paid')),
    approved_by TEXT,
    approved_at TEXT,
    tax_retention_percent REAL DEFAULT 0,  -- KEEP as REAL (percentage)
    tax_retention_amount INTEGER DEFAULT 0, -- Changed from REAL to INTEGER (cents)
    net_amount INTEGER,                     -- Changed from REAL to INTEGER (cents)
    payment_date TEXT,
    payment_reference TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    FOREIGN KEY (freelancer_id) REFERENCES recurring_freelancers(id) ON DELETE CASCADE
);

-- Migrate freelancer_timesheets data
INSERT INTO freelancer_timesheets_new
SELECT 
    id, freelancer_id, work_date,
    hours_worked,  -- Keep as REAL
    CASE 
        WHEN hourly_rate IS NOT NULL THEN CAST(ROUND(hourly_rate * 100) AS INTEGER)
        ELSE NULL 
    END as hourly_rate,  -- Convert to cents
    CASE 
        WHEN total_amount IS NOT NULL THEN CAST(ROUND(total_amount * 100) AS INTEGER)
        ELSE NULL 
    END as total_amount,  -- Convert to cents
    project_name, description, status, approved_by, approved_at,
    tax_retention_percent,  -- Keep as REAL
    CAST(ROUND(tax_retention_amount * 100) AS INTEGER) as tax_retention_amount,  -- Convert to cents
    CASE 
        WHEN net_amount IS NOT NULL THEN CAST(ROUND(net_amount * 100) AS INTEGER)
        ELSE NULL 
    END as net_amount,  -- Convert to cents
    payment_date, payment_reference, notes, created_at, updated_at, user_id
FROM freelancer_timesheets;

DROP TABLE freelancer_timesheets;
ALTER TABLE freelancer_timesheets_new RENAME TO freelancer_timesheets;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_freelancer_timesheets_freelancer_id ON freelancer_timesheets(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_timesheets_work_date ON freelancer_timesheets(work_date);
CREATE INDEX IF NOT EXISTS idx_freelancer_timesheets_status ON freelancer_timesheets(status);
CREATE INDEX IF NOT EXISTS idx_freelancer_timesheets_user_id ON freelancer_timesheets(user_id);

-- ============================================================================
-- SAVINGS GOALS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 25. SAVINGS_GOALS TABLE (from migration 015)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS savings_goals_new (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    target_amount INTEGER NOT NULL,  -- Changed from REAL to INTEGER (cents)
    current_amount INTEGER DEFAULT 0, -- Changed from REAL to INTEGER (cents)
    target_date TEXT,
    type TEXT NOT NULL CHECK(type IN ('personal', 'business')),
    category TEXT,
    description TEXT,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Migrate savings_goals data
INSERT INTO savings_goals_new
SELECT 
    id, user_id, name,
    CAST(ROUND(target_amount * 100) AS INTEGER) as target_amount,  -- Convert to cents
    CAST(ROUND(current_amount * 100) AS INTEGER) as current_amount, -- Convert to cents
    target_date, type, category, description, is_active,
    created_at, updated_at
FROM savings_goals;

DROP TABLE savings_goals;
ALTER TABLE savings_goals_new RENAME TO savings_goals;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_savings_goals_user_id ON savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_type ON savings_goals(type);
CREATE INDEX IF NOT EXISTS idx_savings_goals_is_active ON savings_goals(is_active);
CREATE INDEX IF NOT EXISTS idx_savings_goals_target_date ON savings_goals(target_date);
CREATE INDEX IF NOT EXISTS idx_savings_goals_category ON savings_goals(category);

-- ============================================================================
-- Migration complete
-- ============================================================================

SELECT 'Migration 033: Monetary data type conversion completed successfully' AS status;
SELECT 'All monetary columns have been converted from REAL to INTEGER (cents-based)' AS details;
SELECT 'Backend code must be updated to handle cent-based values using decimal.js' AS action_required;
