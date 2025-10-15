-- Avanta Finance Database Schema
-- Cloudflare D1 (SQLite)

-- Users table: Authentication and user management
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    password TEXT, -- For email/password auth (hashed)
    google_id TEXT UNIQUE, -- For Google OAuth
    avatar_url TEXT,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT,
    preferences TEXT -- JSON string for user preferences
);

-- Transactions table: All financial transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
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
    is_deleted INTEGER DEFAULT 0 CHECK(is_deleted IN (0, 1)),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Accounts table: Bank accounts and credit cards
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('checking', 'savings', 'credit', 'cash')),
    balance REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Categories table: Custom transaction categories
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, name)
);

-- Invoices table: CFDI invoices
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    uuid TEXT NOT NULL,
    rfc_emisor TEXT NOT NULL,
    rfc_receptor TEXT NOT NULL,
    date TEXT NOT NULL,
    subtotal REAL NOT NULL,
    iva REAL NOT NULL,
    total REAL NOT NULL,
    xml_url TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, uuid)
);

-- Fiscal payments table: Track SAT payments
CREATE TABLE IF NOT EXISTS fiscal_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    isr REAL DEFAULT 0,
    iva REAL DEFAULT 0,
    diot_status TEXT DEFAULT 'pending' CHECK(diot_status IN ('pending', 'filed', 'exempt')),
    due_date TEXT NOT NULL,
    payment_date TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'paid', 'overdue')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(user_id, year, month)
);

-- Credits table: Credit cards, loans, and mortgages
CREATE TABLE IF NOT EXISTS credits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('credit_card', 'loan', 'mortgage')),
    credit_limit REAL,
    interest_rate REAL,
    statement_day INTEGER,
    payment_due_day INTEGER,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Credit movements table: Charges, payments, and interest
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

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_is_deleted ON transactions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_linked_invoice_id ON transactions(linked_invoice_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_fiscal_payments_user_id ON fiscal_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_payments_year_month ON fiscal_payments(year, month);
CREATE INDEX IF NOT EXISTS idx_credits_user_id ON credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credits_type ON credits(type);
CREATE INDEX IF NOT EXISTS idx_credits_is_active ON credits(is_active);
CREATE INDEX IF NOT EXISTS idx_credit_movements_credit_id ON credit_movements(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_movements_date ON credit_movements(date);
CREATE INDEX IF NOT EXISTS idx_credit_movements_type ON credit_movements(type);

-- Insert default accounts
-- Note: These will be migrated to the demo user during migration
INSERT OR IGNORE INTO accounts (name, type, balance, user_id) VALUES
    ('BBVA Cuenta', 'checking', 0, 'demo_user_001'),
    ('Banco Azteca', 'checking', 0, 'demo_user_001'),
    ('Tarjeta Crédito', 'credit', 0, 'demo_user_001');

-- Insert default categories
-- Note: These will be migrated to the demo user during migration
INSERT OR IGNORE INTO categories (name, description, color, user_id) VALUES
    ('Servicios Profesionales', 'Ingresos por servicios profesionales', '#10B981', 'demo_user_001'),
    ('Gastos Operativos', 'Gastos generales del negocio', '#EF4444', 'demo_user_001'),
    ('Tecnología', 'Gastos en software y hardware', '#3B82F6', 'demo_user_001'),
    ('Marketing', 'Gastos en publicidad y marketing', '#8B5CF6', 'demo_user_001'),
    ('Transporte', 'Gastos de transporte y gasolina', '#F59E0B', 'demo_user_001');
