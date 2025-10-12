-- Avanta Finance Database Schema
-- Cloudflare D1 (SQLite)

-- Transactions table: All financial transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('ingreso', 'gasto')),
    category TEXT NOT NULL CHECK(category IN ('personal', 'avanta')),
    account TEXT,
    is_deductible INTEGER DEFAULT 0 CHECK(is_deductible IN (0, 1)),
    economic_activity TEXT,
    receipt_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table: Bank accounts and credit cards
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('banco', 'credito')),
    balance REAL DEFAULT 0,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table: CFDI invoices
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT UNIQUE NOT NULL,
    rfc_emisor TEXT NOT NULL,
    rfc_receptor TEXT NOT NULL,
    date TEXT NOT NULL,
    subtotal REAL NOT NULL,
    iva REAL NOT NULL,
    total REAL NOT NULL,
    xml_url TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Fiscal payments table: Track SAT payments
CREATE TABLE IF NOT EXISTS fiscal_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    isr REAL DEFAULT 0,
    iva REAL DEFAULT 0,
    diot_status TEXT DEFAULT 'pending' CHECK(diot_status IN ('pending', 'filed', 'exempt')),
    due_date TEXT NOT NULL,
    payment_date TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_fiscal_payments_year_month ON fiscal_payments(year, month);

-- Insert default accounts
INSERT INTO accounts (name, type, balance) VALUES
    ('BBVA Cuenta', 'banco', 0),
    ('Banco Azteca', 'banco', 0),
    ('Tarjeta Crédito', 'credito', 0);
