-- Migration 041: Add Demo System
-- Phase 37: Advanced Demo Experience
-- Created: January 2025
--
-- This migration creates the infrastructure for the demo mode feature,
-- allowing users to experience different business scenarios with realistic data.

-- ============================================================================
-- ALTER USERS TABLE - Add demo mode flag
-- ============================================================================
-- Add is_demo flag to users table to identify demo users
ALTER TABLE users ADD COLUMN is_demo INTEGER DEFAULT 0 CHECK(is_demo IN (0, 1));

-- Add current_demo_scenario_id to track active scenario
ALTER TABLE users ADD COLUMN current_demo_scenario_id INTEGER;

-- Index for faster demo user queries
CREATE INDEX IF NOT EXISTS idx_users_demo ON users(is_demo);

-- ============================================================================
-- DEMO SCENARIOS TABLE
-- ============================================================================
-- Stores predefined demo scenarios (healthy vs critical business states)
CREATE TABLE IF NOT EXISTS demo_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_name TEXT NOT NULL UNIQUE,
    scenario_type TEXT NOT NULL CHECK(scenario_type IN ('healthy', 'critical')),
    description TEXT NOT NULL,
    business_context TEXT, -- JSON with business details
    financial_state TEXT, -- JSON with financial metrics
    learning_objectives TEXT, -- JSON with educational goals
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster scenario lookups
CREATE INDEX IF NOT EXISTS idx_demo_scenarios_type ON demo_scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_demo_scenarios_active ON demo_scenarios(is_active);
CREATE INDEX IF NOT EXISTS idx_demo_scenarios_order ON demo_scenarios(display_order);

-- ============================================================================
-- DEMO DATA SNAPSHOTS TABLE
-- ============================================================================
-- Stores complete data state for each scenario for quick reset
CREATE TABLE IF NOT EXISTS demo_data_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id INTEGER NOT NULL,
    snapshot_name TEXT NOT NULL,
    data_type TEXT NOT NULL, -- 'transactions', 'accounts', 'invoices', etc.
    data_snapshot TEXT NOT NULL, -- JSON with complete data state
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scenario_id) REFERENCES demo_scenarios(id) ON DELETE CASCADE
);

-- Index for faster snapshot retrieval
CREATE INDEX IF NOT EXISTS idx_demo_snapshots_scenario ON demo_data_snapshots(scenario_id);
CREATE INDEX IF NOT EXISTS idx_demo_snapshots_type ON demo_data_snapshots(data_type);

-- ============================================================================
-- DEMO SESSIONS TABLE
-- ============================================================================
-- Track demo user sessions for analytics and automatic reset
CREATE TABLE IF NOT EXISTS demo_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    scenario_id INTEGER NOT NULL,
    session_start TEXT DEFAULT CURRENT_TIMESTAMP,
    session_end TEXT,
    actions_count INTEGER DEFAULT 0,
    features_explored TEXT, -- JSON array of features used
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (scenario_id) REFERENCES demo_scenarios(id) ON DELETE CASCADE
);

-- Index for session queries
CREATE INDEX IF NOT EXISTS idx_demo_sessions_user ON demo_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_scenario ON demo_sessions(scenario_id);

-- ============================================================================
-- INSERT INITIAL DEMO SCENARIOS
-- ============================================================================

-- Scenario 1: Healthy Business
INSERT INTO demo_scenarios (
    scenario_name,
    scenario_type,
    description,
    business_context,
    financial_state,
    learning_objectives,
    display_order
) VALUES (
    'Negocio Saludable',
    'healthy',
    'Un negocio de servicios profesionales con finanzas saludables, cumplimiento fiscal al día y flujo de efectivo positivo.',
    json('{"business_type": "Servicios Profesionales", "monthly_revenue": 80000, "employees": 0, "years_operating": 3, "fiscal_regime": "RIF"}'),
    json('{"cash_balance": 120000, "accounts_receivable": 45000, "accounts_payable": 15000, "monthly_expenses": 35000, "tax_compliance": "current", "isr_paid": true, "iva_paid": true}'),
    json('["Gestión de flujo de efectivo positivo", "Declaraciones fiscales al corriente", "Optimización de deducciones", "Planificación tributaria efectiva"]'),
    1
);

-- Scenario 2: Critical Business
INSERT INTO demo_scenarios (
    scenario_name,
    scenario_type,
    description,
    business_context,
    financial_state,
    learning_objectives,
    display_order
) VALUES (
    'Negocio en Crisis',
    'critical',
    'Un negocio enfrentando desafíos financieros: bajo flujo de efectivo, declaraciones atrasadas y necesidad urgente de planificación.',
    json('{"business_type": "Servicios Profesionales", "monthly_revenue": 35000, "employees": 0, "years_operating": 1, "fiscal_regime": "RIF"}'),
    json('{"cash_balance": -15000, "accounts_receivable": 75000, "accounts_payable": 45000, "monthly_expenses": 40000, "tax_compliance": "overdue", "isr_paid": false, "iva_paid": false, "late_payments": 2}'),
    json('["Recuperación de flujo de efectivo", "Ponerse al corriente con el SAT", "Reducción de gastos no esenciales", "Gestión de cuentas por cobrar", "Planificación de pagos fiscales"]'),
    2
);

-- ============================================================================
-- DEMO DATA SNAPSHOTS - Healthy Scenario
-- ============================================================================

-- Demo Accounts for Healthy Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'healthy_accounts',
    'accounts',
    json('[
        {
            "name": "BBVA Empresarial",
            "type": "checking",
            "balance": 12000000,
            "opening_date": "2022-01-15",
            "is_active": 1
        },
        {
            "name": "Tarjeta AMEX Business",
            "type": "credit",
            "balance": -1500000,
            "opening_date": "2022-06-01",
            "is_active": 1
        },
        {
            "name": "Efectivo",
            "type": "cash",
            "balance": 500000,
            "opening_date": "2022-01-01",
            "is_active": 1
        }
    ]')
);

-- Demo Transactions for Healthy Scenario (last 3 months)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'healthy_transactions',
    'transactions',
    json('[
        {
            "date": "2025-01-15",
            "description": "Consultoría Desarrollo Web - Cliente ABC",
            "amount": 4500000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2025-01-10",
            "description": "Pago Renta Oficina",
            "amount": -800000,
            "type": "gasto",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national"
        },
        {
            "date": "2025-01-08",
            "description": "Servicios Internet Empresarial",
            "amount": -89900,
            "type": "gasto",
            "category": "avanta",
            "account": "Tarjeta AMEX Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national"
        },
        {
            "date": "2025-01-05",
            "description": "Software Adobe Creative Cloud",
            "amount": -116000,
            "type": "gasto",
            "category": "avanta",
            "account": "Tarjeta AMEX Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "expense_type": "international_with_invoice"
        },
        {
            "date": "2024-12-20",
            "description": "Proyecto Diseño UI/UX - Cliente XYZ",
            "amount": 3800000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-12-15",
            "description": "Equipo de Cómputo - Laptop",
            "amount": -2500000,
            "type": "gasto",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national"
        },
        {
            "date": "2024-12-10",
            "description": "Contador - Servicios Fiscales Diciembre",
            "amount": -450000,
            "type": "gasto",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national"
        },
        {
            "date": "2024-11-25",
            "description": "Desarrollo App Móvil - Cliente DEF",
            "amount": 5200000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-11-18",
            "description": "Compra Despensa Personal",
            "amount": -280000,
            "type": "gasto",
            "category": "personal",
            "account": "Efectivo",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "personal"
        },
        {
            "date": "2024-11-12",
            "description": "Material de Oficina",
            "amount": -35000,
            "type": "gasto",
            "category": "avanta",
            "account": "Tarjeta AMEX Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national"
        }
    ]')
);

-- ============================================================================
-- DEMO DATA SNAPSHOTS - Critical Scenario
-- ============================================================================

-- Demo Accounts for Critical Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'critical_accounts',
    'accounts',
    json('[
        {
            "name": "BBVA Empresarial",
            "type": "checking",
            "balance": -1500000,
            "opening_date": "2024-01-15",
            "is_active": 1
        },
        {
            "name": "Tarjeta HSBC Business",
            "type": "credit",
            "balance": -3500000,
            "opening_date": "2024-03-01",
            "is_active": 1
        },
        {
            "name": "Efectivo",
            "type": "cash",
            "balance": 200000,
            "opening_date": "2024-01-01",
            "is_active": 1
        }
    ]')
);

-- Demo Transactions for Critical Scenario (showing cash flow problems)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'critical_transactions',
    'transactions',
    json('[
        {
            "date": "2025-01-15",
            "description": "Pago Renta Oficina - ATRASADO",
            "amount": -800000,
            "type": "gasto",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national"
        },
        {
            "date": "2025-01-10",
            "description": "Consultoría Pequeña - Cliente A",
            "amount": 1500000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2025-01-08",
            "description": "Pago Mínimo Tarjeta Crédito",
            "amount": -35000,
            "type": "gasto",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2025-01-05",
            "description": "Servicios Internet",
            "amount": -89900,
            "type": "gasto",
            "category": "avanta",
            "account": "Tarjeta HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national"
        },
        {
            "date": "2024-12-28",
            "description": "Compra Despensa Urgente",
            "amount": -150000,
            "type": "gasto",
            "category": "personal",
            "account": "Efectivo",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "personal"
        },
        {
            "date": "2024-12-20",
            "description": "Proyecto Web Simple - Cliente B",
            "amount": 2200000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-12-15",
            "description": "Renta Oficina",
            "amount": -800000,
            "type": "gasto",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national"
        },
        {
            "date": "2024-11-30",
            "description": "Compras Varias Tarjeta",
            "amount": -450000,
            "type": "gasto",
            "category": "avanta",
            "account": "Tarjeta HSBC Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-11-25",
            "description": "Proyecto Consultoría - Cliente C",
            "amount": 1800000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-11-15",
            "description": "Renta Oficina",
            "amount": -800000,
            "type": "gasto",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national"
        }
    ]')
);

-- ============================================================================
-- DEMO INVOICES/CFDI DATA
-- ============================================================================

-- Demo Invoices for Healthy Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'healthy_invoices',
    'invoices',
    json('[
        {
            "uuid": "12345678-1234-1234-1234-123456789ABC",
            "rfc_emisor": "DEMO800101XXX",
            "rfc_receptor": "XAXX010101000",
            "date": "2025-01-15",
            "subtotal": 3879310,
            "iva": 620690,
            "total": 4500000,
            "xml_url": null,
            "invoice_type": "ingreso",
            "payment_method": "PUE",
            "payment_form": "03",
            "currency": "MXN",
            "status": "active"
        },
        {
            "uuid": "23456789-2345-2345-2345-23456789ABCD",
            "rfc_emisor": "DEMO800101XXX",
            "rfc_receptor": "XAXX010101000",
            "date": "2024-12-20",
            "subtotal": 3275862,
            "iva": 524138,
            "total": 3800000,
            "xml_url": null,
            "invoice_type": "ingreso",
            "payment_method": "PUE",
            "payment_form": "03",
            "currency": "MXN",
            "status": "active"
        }
    ]')
);

-- Demo Invoices for Critical Scenario (fewer invoices, lower amounts)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'critical_invoices',
    'invoices',
    json('[
        {
            "uuid": "34567890-3456-3456-3456-34567890ABCD",
            "rfc_emisor": "DEMO800101XXX",
            "rfc_receptor": "XAXX010101000",
            "date": "2025-01-10",
            "subtotal": 1293103,
            "iva": 206897,
            "total": 1500000,
            "xml_url": null,
            "invoice_type": "ingreso",
            "payment_method": "PPD",
            "payment_form": "99",
            "currency": "MXN",
            "status": "active"
        }
    ]')
);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- Demo system initialized successfully
-- Use demo_scenarios table to manage scenarios
-- Use demo_data_snapshots to store/restore demo data
-- Users with is_demo=1 will have access to demo features
