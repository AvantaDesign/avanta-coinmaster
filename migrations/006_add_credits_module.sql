-- Migration: Add Credits and Debts Module
-- Phase 2: Credits and Debts Management
-- Date: 2025-10-15
-- 
-- This migration adds comprehensive credit management functionality including:
-- - Credit cards, loans, and mortgages tracking
-- - Credit movements (charges, payments, interest)
-- - Statement and payment due date management
-- - Integration with transactions for payment tracking

-- Credits table: Manage credit cards, loans, and mortgages
CREATE TABLE IF NOT EXISTS credits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('credit_card', 'loan', 'mortgage')),
    credit_limit REAL,
    interest_rate REAL,
    statement_day INTEGER CHECK(statement_day >= 1 AND statement_day <= 31),
    payment_due_day INTEGER CHECK(payment_due_day >= 1 AND payment_due_day <= 31),
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Credit movements table: Track charges, payments, and interest
CREATE TABLE IF NOT EXISTS credit_movements (
    id TEXT PRIMARY KEY,
    credit_id TEXT NOT NULL,
    transaction_id INTEGER,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('payment', 'charge', 'interest')),
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(credit_id) REFERENCES credits(id),
    FOREIGN KEY(transaction_id) REFERENCES transactions(id)
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_type ON credits(type);
CREATE INDEX IF NOT EXISTS idx_credits_is_active ON credits(is_active);
CREATE INDEX IF NOT EXISTS idx_credit_movements_credit_id ON credit_movements(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_movements_date ON credit_movements(date);
CREATE INDEX IF NOT EXISTS idx_credit_movements_type ON credit_movements(type);
CREATE INDEX IF NOT EXISTS idx_credit_movements_transaction_id ON credit_movements(transaction_id);

-- Notes:
-- 1. credit_limit: Maximum credit available (NULL for loans/mortgages with fixed amounts)
-- 2. interest_rate: Annual interest rate as decimal (e.g., 0.24 for 24%)
-- 3. statement_day: Day of month when statement is generated (1-31)
-- 4. payment_due_day: Day of month when payment is due (1-31)
-- 5. transaction_id: Links credit payments to transactions for reconciliation
-- 
-- Usage Examples:
-- - Credit Card: type='credit_card', credit_limit=50000, statement_day=20, payment_due_day=5
-- - Personal Loan: type='loan', interest_rate=0.15, payment_due_day=15
-- - Mortgage: type='mortgage', interest_rate=0.08, payment_due_day=1
-- 
-- Movement Types:
-- - 'charge': Purchases or charges to the credit (increases balance)
-- - 'payment': Payments made to reduce balance (decreases balance)
-- - 'interest': Interest charges applied to balance (increases balance)
