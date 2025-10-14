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
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    -- Phase 1: Advanced Transaction Classification fields
    transaction_type TEXT CHECK(transaction_type IN ('business', 'personal', 'transfer')) DEFAULT 'personal',
    category_id INTEGER,
    linked_invoice_id INTEGER,
    notes TEXT,
    is_deleted INTEGER DEFAULT 0 CHECK(is_deleted IN (0, 1))
);

-- Accounts table: Bank accounts and credit cards
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('checking', 'savings', 'credit', 'cash')),
    balance REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Categories table: Custom transaction categories
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
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
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted ON transactions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_linked_invoice_id ON transactions(linked_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_fiscal_payments_year_month ON fiscal_payments(year, month);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Insert default accounts
INSERT OR IGNORE INTO accounts (name, type, balance) VALUES
    ('BBVA Cuenta', 'checking', 0),
    ('Banco Azteca', 'checking', 0),
    ('Tarjeta Crédito', 'credit', 0);

-- Insert default categories
INSERT OR IGNORE INTO categories (name, description, color) VALUES
    ('Servicios Profesionales', 'Ingresos por servicios profesionales', '#10B981'),
    ('Gastos Operativos', 'Gastos generales del negocio', '#EF4444'),
    ('Tecnología', 'Gastos en software y hardware', '#3B82F6'),
    ('Marketing', 'Gastos en publicidad y marketing', '#8B5CF6'),
    ('Transporte', 'Gastos de transporte y gasolina', '#F59E0B');
