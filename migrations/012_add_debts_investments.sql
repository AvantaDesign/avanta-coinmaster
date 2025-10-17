-- Migration 012: Add Debts and Investments Tables
-- Date: 2025-10-17
-- Purpose: Create tables for managing debts, investments, and freelancer timesheets

-- Table for tracking debts and loans
CREATE TABLE IF NOT EXISTS debts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_name TEXT NOT NULL,
    lender TEXT NOT NULL,
    principal_amount REAL NOT NULL,
    current_balance REAL NOT NULL,
    interest_rate REAL NOT NULL, -- Annual interest rate as percentage
    interest_type TEXT NOT NULL CHECK(interest_type IN ('fixed', 'variable')),
    loan_term_months INTEGER NOT NULL, -- Total loan term in months
    payment_frequency TEXT NOT NULL CHECK(payment_frequency IN ('monthly', 'biweekly', 'weekly', 'quarterly')),
    monthly_payment REAL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    next_payment_date TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paid_off', 'refinanced', 'defaulted')),
    category TEXT, -- mortgage, personal, business, etc.
    description TEXT,
    collateral TEXT,
    payment_day INTEGER CHECK(payment_day >= 1 AND payment_day <= 31),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT
);

-- Table for tracking debt payments
CREATE TABLE IF NOT EXISTS debt_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_id INTEGER NOT NULL,
    payment_date TEXT NOT NULL,
    amount REAL NOT NULL,
    principal_paid REAL NOT NULL,
    interest_paid REAL NOT NULL,
    remaining_balance REAL NOT NULL,
    payment_method TEXT,
    reference_number TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
);

-- Table for tracking investments
CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investment_name TEXT NOT NULL,
    investment_type TEXT NOT NULL CHECK(investment_type IN ('stocks', 'bonds', 'mutual_funds', 'real_estate', 'crypto', 'other')),
    broker_platform TEXT,
    purchase_date TEXT NOT NULL,
    purchase_amount REAL NOT NULL,
    quantity REAL, -- Number of shares/units
    current_value REAL,
    current_price_per_unit REAL,
    currency TEXT DEFAULT 'MXN',
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'sold', 'closed')),
    category TEXT, -- retirement, growth, income, etc.
    risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')),
    description TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT
);

-- Table for tracking investment transactions
CREATE TABLE IF NOT EXISTS investment_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investment_id INTEGER NOT NULL,
    transaction_date TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('buy', 'sell', 'dividend', 'interest', 'fee')),
    quantity REAL,
    price_per_unit REAL,
    amount REAL NOT NULL,
    fees REAL DEFAULT 0,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
);

-- Table for investment performance tracking
CREATE TABLE IF NOT EXISTS investment_valuations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investment_id INTEGER NOT NULL,
    valuation_date TEXT NOT NULL,
    value REAL NOT NULL,
    price_per_unit REAL,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE
);

-- Table for freelancer timesheets (enhanced payroll)
CREATE TABLE IF NOT EXISTS freelancer_timesheets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    freelancer_id INTEGER NOT NULL,
    work_date TEXT NOT NULL,
    hours_worked REAL NOT NULL,
    hourly_rate REAL,
    total_amount REAL,
    project_name TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'paid')),
    approved_by TEXT,
    approved_at TEXT,
    tax_retention_percent REAL DEFAULT 0,
    tax_retention_amount REAL DEFAULT 0,
    net_amount REAL,
    payment_date TEXT,
    payment_reference TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT,
    FOREIGN KEY (freelancer_id) REFERENCES recurring_freelancers(id) ON DELETE CASCADE
);

-- Indexes for better query performance

-- Debts indexes
CREATE INDEX IF NOT EXISTS idx_debts_status ON debts(status);
CREATE INDEX IF NOT EXISTS idx_debts_next_payment ON debts(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_debts_category ON debts(category);

CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_date ON debt_payments(payment_date);

-- Investments indexes
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_type ON investments(investment_type);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_purchase_date ON investments(purchase_date);

CREATE INDEX IF NOT EXISTS idx_investment_transactions_investment_id ON investment_transactions(investment_id);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_date ON investment_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_investment_transactions_type ON investment_transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_investment_valuations_investment_id ON investment_valuations(investment_id);
CREATE INDEX IF NOT EXISTS idx_investment_valuations_date ON investment_valuations(valuation_date);

-- Freelancer timesheets indexes
CREATE INDEX IF NOT EXISTS idx_freelancer_timesheets_freelancer_id ON freelancer_timesheets(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_freelancer_timesheets_work_date ON freelancer_timesheets(work_date);
CREATE INDEX IF NOT EXISTS idx_freelancer_timesheets_status ON freelancer_timesheets(status);
CREATE INDEX IF NOT EXISTS idx_freelancer_timesheets_user_id ON freelancer_timesheets(user_id);

-- Success message
SELECT 'Debts, investments, and freelancer timesheets tables created successfully' AS status;
