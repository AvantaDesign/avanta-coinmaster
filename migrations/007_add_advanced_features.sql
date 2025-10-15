-- Migration: Add Advanced Features (Phase 4)
-- Date: 2025-10-15
-- 
-- This migration adds comprehensive advanced features including:
-- - Budgeting module (budgets table)
-- - Invoice reconciliation (transaction_invoice_map junction table)
-- - Fiscal improvements (is_deductible flag on categories)
-- - Enhanced financial management capabilities

-- ============================================================================
-- 1. BUDGETS TABLE
-- ============================================================================
-- Budgets table: Manage monthly, quarterly, and yearly budgets by category
CREATE TABLE IF NOT EXISTS budgets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category_id INTEGER,
    classification TEXT NOT NULL CHECK(classification IN ('business', 'personal')),
    amount REAL NOT NULL CHECK(amount >= 0),
    period TEXT NOT NULL CHECK(period IN ('monthly', 'quarterly', 'yearly')),
    start_date TEXT NOT NULL, -- ISO 8601 date (YYYY-MM-DD)
    end_date TEXT, -- Optional end date for budget validity
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(category_id) REFERENCES categories(id)
);

-- Budget indexes for performance
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_classification ON budgets(classification);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);
CREATE INDEX IF NOT EXISTS idx_budgets_is_active ON budgets(is_active);
CREATE INDEX IF NOT EXISTS idx_budgets_start_date ON budgets(start_date);

-- ============================================================================
-- 2. TRANSACTION-INVOICE MAPPING TABLE
-- ============================================================================
-- Transaction-Invoice Map: Explicit relationship between transactions and invoices (CFDIs)
-- Allows one transaction to be linked to multiple invoices and vice versa
CREATE TABLE IF NOT EXISTS transaction_invoice_map (
    id TEXT PRIMARY KEY,
    transaction_id INTEGER NOT NULL,
    invoice_id INTEGER NOT NULL,
    amount REAL, -- Portion of transaction amount allocated to this invoice (optional)
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT, -- user_id who created the link
    FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY(invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
    FOREIGN KEY(created_by) REFERENCES users(id),
    UNIQUE(transaction_id, invoice_id)
);

-- Transaction-Invoice map indexes
CREATE INDEX IF NOT EXISTS idx_transaction_invoice_map_transaction_id ON transaction_invoice_map(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_invoice_map_invoice_id ON transaction_invoice_map(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transaction_invoice_map_created_by ON transaction_invoice_map(created_by);

-- ============================================================================
-- 3. CATEGORIES TABLE ENHANCEMENT
-- ============================================================================
-- Add is_deductible flag to categories for fiscal management
-- This helps identify which categories are tax-deductible for business expenses
ALTER TABLE categories ADD COLUMN is_deductible INTEGER DEFAULT 0 CHECK(is_deductible IN (0, 1));

-- Index for quick filtering of deductible categories
CREATE INDEX IF NOT EXISTS idx_categories_is_deductible ON categories(is_deductible);

-- ============================================================================
-- 4. FISCAL CONFIGURATION TABLE
-- ============================================================================
-- Fiscal Configuration: Store annual tax rates and fiscal settings
CREATE TABLE IF NOT EXISTS fiscal_config (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    -- ISR (Income Tax) brackets and rates stored as JSON
    isr_brackets TEXT NOT NULL, -- JSON array: [{"limit": 10000, "rate": 0.0192, "fixedFee": 0}, ...]
    -- IVA (Value Added Tax) rates
    iva_rate REAL DEFAULT 0.16, -- 16% standard VAT rate
    iva_retention_rate REAL DEFAULT 0.1067, -- 10.67% retention rate
    -- DIOT threshold
    diot_threshold REAL DEFAULT 50000, -- Monthly threshold for DIOT filing
    -- Other fiscal settings
    settings TEXT, -- JSON for additional settings
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, year)
);

-- Fiscal config indexes
CREATE INDEX IF NOT EXISTS idx_fiscal_config_user_id ON fiscal_config(user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_config_year ON fiscal_config(year);
CREATE INDEX IF NOT EXISTS idx_fiscal_config_is_active ON fiscal_config(is_active);

-- ============================================================================
-- 5. DEFAULT FISCAL CONFIGURATION (2025)
-- ============================================================================
-- Insert default 2025 fiscal configuration for demo user
-- ISR brackets for 2025 (example - should be updated with official rates)
INSERT OR IGNORE INTO fiscal_config (id, user_id, year, isr_brackets, iva_rate, iva_retention_rate, diot_threshold, is_active)
VALUES (
    'fiscal_config_demo_2025',
    'demo_user_001',
    2025,
    '[
        {"limit": 7735.00, "rate": 0.0192, "fixedFee": 0, "lowerLimit": 0},
        {"limit": 65651.07, "rate": 0.0640, "fixedFee": 148.51, "lowerLimit": 7735.00},
        {"limit": 115375.90, "rate": 0.1088, "fixedFee": 3855.14, "lowerLimit": 65651.07},
        {"limit": 134119.41, "rate": 0.1600, "fixedFee": 9265.20, "lowerLimit": 115375.90},
        {"limit": 160577.65, "rate": 0.1792, "fixedFee": 12264.16, "lowerLimit": 134119.41},
        {"limit": 323862.00, "rate": 0.2136, "fixedFee": 17005.47, "lowerLimit": 160577.65},
        {"limit": 510451.00, "rate": 0.2352, "fixedFee": 51883.01, "lowerLimit": 323862.00},
        {"limit": 974535.03, "rate": 0.3000, "fixedFee": 95768.74, "lowerLimit": 510451.00},
        {"limit": 1299380.04, "rate": 0.3200, "fixedFee": 234993.95, "lowerLimit": 974535.03},
        {"limit": 3898140.12, "rate": 0.3400, "fixedFee": 338944.34, "lowerLimit": 1299380.04},
        {"limit": 999999999, "rate": 0.3500, "fixedFee": 1222522.76, "lowerLimit": 3898140.12}
    ]',
    0.16,
    0.1067,
    50000,
    1
);

-- ============================================================================
-- 6. UPDATE DEFAULT CATEGORIES WITH DEDUCTIBLE FLAGS
-- ============================================================================
-- Mark common business expense categories as deductible
UPDATE categories 
SET is_deductible = 1 
WHERE user_id = 'demo_user_001' 
AND name IN (
    'Gastos Operativos',
    'Tecnología',
    'Marketing',
    'Transporte'
);

-- ============================================================================
-- NOTES AND USAGE EXAMPLES
-- ============================================================================

/*
BUDGETS TABLE USAGE:
--------------------
1. Monthly Budget by Category:
   INSERT INTO budgets (id, user_id, category_id, classification, amount, period, start_date)
   VALUES ('budget_001', 'user_123', 5, 'business', 10000, 'monthly', '2025-01-01');

2. Overall Personal Budget:
   INSERT INTO budgets (id, user_id, category_id, classification, amount, period, start_date)
   VALUES ('budget_002', 'user_123', NULL, 'personal', 50000, 'monthly', '2025-01-01');

3. Query Budget vs Actual:
   SELECT 
       b.amount AS budgeted,
       COALESCE(SUM(t.amount), 0) AS actual,
       b.amount - COALESCE(SUM(t.amount), 0) AS remaining
   FROM budgets b
   LEFT JOIN transactions t ON t.category_id = b.category_id
       AND t.transaction_type = b.classification
       AND t.date >= b.start_date
       AND (b.end_date IS NULL OR t.date <= b.end_date)
   WHERE b.user_id = 'user_123' AND b.is_active = 1
   GROUP BY b.id;

TRANSACTION-INVOICE MAP USAGE:
-------------------------------
1. Link Transaction to Invoice:
   INSERT INTO transaction_invoice_map (id, transaction_id, invoice_id, amount, created_by)
   VALUES ('map_001', 12345, 67890, 10000, 'user_123');

2. Get All Invoices for a Transaction:
   SELECT i.* 
   FROM invoices i
   JOIN transaction_invoice_map tim ON tim.invoice_id = i.id
   WHERE tim.transaction_id = 12345;

3. Get All Transactions for an Invoice:
   SELECT t.* 
   FROM transactions t
   JOIN transaction_invoice_map tim ON tim.transaction_id = t.id
   WHERE tim.invoice_id = 67890;

4. Reconciliation Report:
   SELECT 
       i.uuid,
       i.total AS invoice_amount,
       COALESCE(SUM(tim.amount), 0) AS paid_amount,
       i.total - COALESCE(SUM(tim.amount), 0) AS pending_amount
   FROM invoices i
   LEFT JOIN transaction_invoice_map tim ON tim.invoice_id = i.id
   WHERE i.user_id = 'user_123' AND i.status = 'active'
   GROUP BY i.id;

FISCAL CONFIGURATION USAGE:
----------------------------
1. Get Active Fiscal Config for Year:
   SELECT * FROM fiscal_config
   WHERE user_id = 'user_123' AND year = 2025 AND is_active = 1;

2. Calculate ISR for Income:
   -- Use the isr_brackets JSON to find applicable bracket and calculate tax
   -- This should be done in application code for complex calculations

3. Update Fiscal Config:
   UPDATE fiscal_config
   SET isr_brackets = '[...]', updated_at = CURRENT_TIMESTAMP
   WHERE user_id = 'user_123' AND year = 2025;

DEDUCTIBLE CATEGORIES:
----------------------
1. Get All Deductible Categories:
   SELECT * FROM categories
   WHERE user_id = 'user_123' AND is_deductible = 1 AND is_active = 1;

2. Calculate Total Deductible Expenses:
   SELECT SUM(t.amount) AS total_deductible
   FROM transactions t
   JOIN categories c ON c.id = t.category_id
   WHERE t.user_id = 'user_123'
   AND t.transaction_type = 'business'
   AND t.type = 'gasto'
   AND c.is_deductible = 1
   AND strftime('%Y', t.date) = '2025';
*/
