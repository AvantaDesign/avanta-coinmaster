-- ============================================================================
-- MIGRATION 048: Realistic Demo Scenarios - 3 Levels
-- ============================================================================
-- Phase 46: Integration Testing & Quality Assurance
-- 
-- This migration creates 3 realistic demo scenarios with appropriate amounts:
-- 1. Excelente: +$100,000 MXN (healthy business)
-- 2. Regular: +$10,000 MXN (stable business)  
-- 3. Malo: -$20,000 MXN (struggling business)
-- 
-- Features:
-- - 3 scenario levels instead of 2
-- - Realistic amounts (not millions)
-- - Dynamic 3-position switch
-- - Comprehensive transaction data for each level
-- - Multiple account types with realistic balances
-- ============================================================================

-- ============================================================================
-- DELETE EXISTING DEMO SCENARIOS AND DATA
-- ============================================================================
DELETE FROM demo_data_snapshots WHERE scenario_id IN (1, 2);
DELETE FROM demo_scenarios WHERE id IN (1, 2);

-- ============================================================================
-- INSERT 3 REALISTIC DEMO SCENARIOS
-- ============================================================================

-- Scenario 1: Excelente (Healthy Business)
INSERT INTO demo_scenarios (
    id,
    scenario_name,
    scenario_type,
    description,
    business_context,
    financial_state,
    learning_objectives,
    display_order
) VALUES (
    1,
    'Negocio Excelente',
    'excellent',
    'Un negocio de servicios profesionales muy exitoso con finanzas sólidas, múltiples clientes corporativos y crecimiento sostenido.',
    json('{"business_type": "Servicios Profesionales", "monthly_revenue": 120000, "employees": 2, "years_operating": 4, "fiscal_regime": "RIF", "annual_revenue": 1400000, "client_count": 15}'),
    json('{"cash_balance": 100000, "accounts_receivable": 45000, "accounts_payable": 15000, "monthly_expenses": 75000, "tax_compliance": "current", "isr_paid": true, "iva_paid": true, "investment_balance": 50000, "credit_utilization": 0.2}'),
    json('["Gestión de crecimiento sostenido", "Optimización de flujo de efectivo", "Expansión de servicios", "Planificación fiscal avanzada"]'),
    1
);

-- Scenario 2: Regular (Stable Business)
INSERT INTO demo_scenarios (
    id,
    scenario_name,
    scenario_type,
    description,
    business_context,
    financial_state,
    learning_objectives,
    display_order
) VALUES (
    2,
    'Negocio Regular',
    'regular',
    'Un negocio estable con finanzas equilibradas, clientes regulares y operación sin problemas mayores.',
    json('{"business_type": "Servicios Profesionales", "monthly_revenue": 45000, "employees": 1, "years_operating": 2, "fiscal_regime": "RIF", "annual_revenue": 540000, "client_count": 8}'),
    json('{"cash_balance": 10000, "accounts_receivable": 20000, "accounts_payable": 8000, "monthly_expenses": 35000, "tax_compliance": "current", "isr_paid": true, "iva_paid": true, "credit_utilization": 0.4}'),
    json('["Mantenimiento de estabilidad financiera", "Optimización de procesos", "Crecimiento gradual", "Gestión eficiente de recursos"]'),
    2
);

-- Scenario 3: Malo (Struggling Business)
INSERT INTO demo_scenarios (
    id,
    scenario_name,
    scenario_type,
    description,
    business_context,
    financial_state,
    learning_objectives,
    display_order
) VALUES (
    3,
    'Negocio en Problemas',
    'struggling',
    'Un negocio enfrentando desafíos financieros: flujo de efectivo negativo, clientes morosos y necesidad urgente de restructuración.',
    json('{"business_type": "Servicios Profesionales", "monthly_revenue": 25000, "employees": 0, "years_operating": 1, "fiscal_regime": "RIF", "annual_revenue": 300000, "client_count": 4}'),
    json('{"cash_balance": -20000, "accounts_receivable": 35000, "accounts_payable": 25000, "monthly_expenses": 30000, "tax_compliance": "overdue", "isr_paid": false, "iva_paid": false, "late_payments": 3, "overdraft_fees": 2000}'),
    json('["Recuperación de flujo de efectivo", "Gestión de crisis financiera", "Reducción de gastos", "Recuperación de cuentas por cobrar", "Planificación de emergencia"]'),
    3
);

-- ============================================================================
-- DEMO DATA SNAPSHOTS - EXCELLENT SCENARIO
-- ============================================================================

-- Accounts for Excellent Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'excellent_accounts',
    'accounts',
    json('[
        {
            "name": "BBVA Empresarial",
            "type": "checking",
            "balance": 10000000,
            "opening_date": "2021-01-15",
            "is_active": 1,
            "account_number": "0123456789"
        },
        {
            "name": "Santander Business",
            "type": "checking",
            "balance": 2500000,
            "opening_date": "2022-06-01",
            "is_active": 1,
            "account_number": "9876543210"
        },
        {
            "name": "AMEX Business Gold",
            "type": "credit",
            "balance": -1500000,
            "opening_date": "2021-03-15",
            "is_active": 1,
            "credit_limit": 10000000
        },
        {
            "name": "Efectivo",
            "type": "cash",
            "balance": 500000,
            "opening_date": "2021-01-01",
            "is_active": 1
        },
        {
            "name": "Fondo de Emergencia",
            "type": "savings",
            "balance": 5000000,
            "opening_date": "2021-06-01",
            "is_active": 1
        }
    ]')
);

-- Categories for Excellent Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'excellent_categories',
    'categories',
    json('[
        {
            "name": "avanta",
            "description": "Ingresos por servicios profesionales",
            "type": "income",
            "is_active": 1,
            "color": "#10B981"
        },
        {
            "name": "personal",
            "description": "Gastos personales",
            "type": "expense",
            "is_active": 1,
            "color": "#EF4444"
        },
        {
            "name": "oficina",
            "description": "Gastos de oficina y operación",
            "type": "expense",
            "is_active": 1,
            "color": "#3B82F6"
        },
        {
            "name": "marketing",
            "description": "Marketing y publicidad",
            "type": "expense",
            "is_active": 1,
            "color": "#8B5CF6"
        },
        {
            "name": "tecnologia",
            "description": "Tecnología y software",
            "type": "expense",
            "is_active": 1,
            "color": "#06B6D4"
        },
        {
            "name": "servicios",
            "description": "Servicios profesionales",
            "type": "expense",
            "is_active": 1,
            "color": "#F59E0B"
        },
        {
            "name": "equipamiento",
            "description": "Equipamiento y mobiliario",
            "type": "expense",
            "is_active": 1,
            "color": "#84CC16"
        }
    ]')
);

-- Transactions for Excellent Scenario (30+ transactions)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'excellent_transactions',
    'transactions',
    json('[
        {
            "date": "2025-01-20",
            "description": "Proyecto Desarrollo Web - Empresa ABC",
            "amount": 4500000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-18",
            "description": "Consultoría Estratégica - Cliente XYZ",
            "amount": 2500000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-15",
            "description": "Pago Renta Oficina",
            "amount": -1200000,
            "type": "gasto",
            "category": "oficina",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-12",
            "description": "Servicios Internet Empresarial",
            "amount": -89900,
            "type": "gasto",
            "category": "tecnologia",
            "account": "AMEX Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-10",
            "description": "Software Adobe Creative Cloud",
            "amount": -116000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "AMEX Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-08",
            "description": "Marketing Digital - Google Ads",
            "amount": -350000,
            "type": "gasto",
            "category": "marketing",
            "account": "Santander Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-05",
            "description": "Contador - Servicios Fiscales",
            "amount": -250000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-03",
            "description": "Equipo de Cómputo - Laptop",
            "amount": -1800000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "AMEX Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-28",
            "description": "Proyecto App Móvil - Startup DEF",
            "amount": 3800000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-25",
            "description": "Bonos Navideños Personal",
            "amount": -500000,
            "type": "gasto",
            "category": "personal",
            "account": "Efectivo",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "personal"
        },
        {
            "date": "2024-12-20",
            "description": "Diseño UI/UX - Cliente GHI",
            "amount": 3200000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-18",
            "description": "Mobiliario Oficina",
            "amount": -850000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "AMEX Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-15",
            "description": "Servicios Legales",
            "amount": -450000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-12",
            "description": "Marketing - LinkedIn Premium",
            "amount": -120000,
            "type": "gasto",
            "category": "marketing",
            "account": "Santander Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-10",
            "description": "Desarrollo Sistema CRM",
            "amount": 4200000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-08",
            "description": "Servicios Cloud AWS",
            "amount": -180000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "Santander Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-05",
            "description": "Capacitación Equipo",
            "amount": -350000,
            "type": "gasto",
            "category": "servicios",
            "account": "AMEX Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-28",
            "description": "Proyecto E-commerce - Empresa JKL",
            "amount": 5500000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-25",
            "description": "Equipamiento - Servidores",
            "amount": -2200000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "AMEX Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-22",
            "description": "Marketing - Evento Tech",
            "amount": -850000,
            "type": "gasto",
            "category": "marketing",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-20",
            "description": "Consultoría Arquitectura",
            "amount": 3800000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-18",
            "description": "Servicios Contables",
            "amount": -180000,
            "type": "gasto",
            "category": "servicios",
            "account": "Santander Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-15",
            "description": "Software Licencias",
            "amount": -250000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "AMEX Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-12",
            "description": "Desarrollo App Fintech",
            "amount": 4800000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-10",
            "description": "Oficina - Renta Mensual",
            "amount": -1200000,
            "type": "gasto",
            "category": "oficina",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-08",
            "description": "Marketing - Facebook Ads",
            "amount": -280000,
            "type": "gasto",
            "category": "marketing",
            "account": "Santander Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-05",
            "description": "Equipamiento - Monitores",
            "amount": -450000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "AMEX Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-03",
            "description": "Servicios Legales",
            "amount": -350000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-30",
            "description": "Proyecto Blockchain",
            "amount": 6200000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-28",
            "description": "Marketing - Google Ads Q4",
            "amount": -420000,
            "type": "gasto",
            "category": "marketing",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-25",
            "description": "Desarrollo SaaS",
            "amount": 5200000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        }
    ]')
);

-- ============================================================================
-- DEMO DATA SNAPSHOTS - REGULAR SCENARIO
-- ============================================================================

-- Accounts for Regular Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'regular_accounts',
    'accounts',
    json('[
        {
            "name": "BBVA Empresarial",
            "type": "checking",
            "balance": 1000000,
            "opening_date": "2022-01-15",
            "is_active": 1,
            "account_number": "0123456789"
        },
        {
            "name": "HSBC Business",
            "type": "credit",
            "balance": -400000,
            "opening_date": "2022-06-01",
            "is_active": 1,
            "credit_limit": 1000000
        },
        {
            "name": "Efectivo",
            "type": "cash",
            "balance": 200000,
            "opening_date": "2022-01-01",
            "is_active": 1
        }
    ]')
);

-- Categories for Regular Scenario (same as excellent)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'regular_categories',
    'categories',
    json('[
        {
            "name": "avanta",
            "description": "Ingresos por servicios profesionales",
            "type": "income",
            "is_active": 1,
            "color": "#10B981"
        },
        {
            "name": "personal",
            "description": "Gastos personales",
            "type": "expense",
            "is_active": 1,
            "color": "#EF4444"
        },
        {
            "name": "oficina",
            "description": "Gastos de oficina y operación",
            "type": "expense",
            "is_active": 1,
            "color": "#3B82F6"
        },
        {
            "name": "marketing",
            "description": "Marketing y publicidad",
            "type": "expense",
            "is_active": 1,
            "color": "#8B5CF6"
        },
        {
            "name": "tecnologia",
            "description": "Tecnología y software",
            "type": "expense",
            "is_active": 1,
            "color": "#06B6D4"
        },
        {
            "name": "servicios",
            "description": "Servicios profesionales",
            "type": "expense",
            "is_active": 1,
            "color": "#F59E0B"
        },
        {
            "name": "equipamiento",
            "description": "Equipamiento y mobiliario",
            "type": "expense",
            "is_active": 1,
            "color": "#84CC16"
        }
    ]')
);

-- Transactions for Regular Scenario (25+ transactions)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'regular_transactions',
    'transactions',
    json('[
        {
            "date": "2025-01-20",
            "description": "Proyecto Web - Cliente A",
            "amount": 1800000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-18",
            "description": "Consultoría - Cliente B",
            "amount": 1200000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-15",
            "description": "Pago Renta Oficina",
            "amount": -800000,
            "type": "gasto",
            "category": "oficina",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-12",
            "description": "Servicios Internet",
            "amount": -89900,
            "type": "gasto",
            "category": "tecnologia",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-10",
            "description": "Software Adobe",
            "amount": -116000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-08",
            "description": "Marketing Google Ads",
            "amount": -150000,
            "type": "gasto",
            "category": "marketing",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-05",
            "description": "Contador - Servicios",
            "amount": -180000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-03",
            "description": "Equipo - Laptop",
            "amount": -1200000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-28",
            "description": "Proyecto App - Cliente C",
            "amount": 1500000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-25",
            "description": "Regalos Navidad",
            "amount": -200000,
            "type": "gasto",
            "category": "personal",
            "account": "Efectivo",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "personal"
        },
        {
            "date": "2024-12-20",
            "description": "Diseño UI/UX - Cliente D",
            "amount": 1300000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-18",
            "description": "Mobiliario Oficina",
            "amount": -450000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-15",
            "description": "Servicios Legales",
            "amount": -250000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-12",
            "description": "Marketing LinkedIn",
            "amount": -80000,
            "type": "gasto",
            "category": "marketing",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-10",
            "description": "Desarrollo CRM",
            "amount": 1800000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-08",
            "description": "Servicios Cloud",
            "amount": -120000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-05",
            "description": "Capacitación",
            "amount": -200000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-28",
            "description": "Proyecto E-commerce - Cliente E",
            "amount": 2200000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-25",
            "description": "Equipamiento",
            "amount": -850000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-22",
            "description": "Marketing Evento",
            "amount": -350000,
            "type": "gasto",
            "category": "marketing",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-20",
            "description": "Consultoría Arquitectura",
            "amount": 1600000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-18",
            "description": "Servicios Contables",
            "amount": -120000,
            "type": "gasto",
            "category": "servicios",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-15",
            "description": "Software Licencias",
            "amount": -150000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-12",
            "description": "Desarrollo App",
            "amount": 1900000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-10",
            "description": "Oficina - Renta",
            "amount": -800000,
            "type": "gasto",
            "category": "oficina",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-08",
            "description": "Marketing Facebook",
            "amount": -180000,
            "type": "gasto",
            "category": "marketing",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-05",
            "description": "Equipamiento Monitores",
            "amount": -280000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        }
    ]')
);

-- ============================================================================
-- DEMO DATA SNAPSHOTS - STRUGGLING SCENARIO
-- ============================================================================

-- Accounts for Struggling Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    3,
    'struggling_accounts',
    'accounts',
    json('[
        {
            "name": "BBVA Empresarial",
            "type": "checking",
            "balance": -2000000,
            "opening_date": "2023-01-15",
            "is_active": 1,
            "account_number": "0123456789",
            "overdraft_limit": 5000000
        },
        {
            "name": "HSBC Business",
            "type": "credit",
            "balance": -800000,
            "opening_date": "2023-06-01",
            "is_active": 1,
            "credit_limit": 1000000
        },
        {
            "name": "Efectivo",
            "type": "cash",
            "balance": 50000,
            "opening_date": "2023-01-01",
            "is_active": 1
        }
    ]')
);

-- Categories for Struggling Scenario (same as others)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    3,
    'struggling_categories',
    'categories',
    json('[
        {
            "name": "avanta",
            "description": "Ingresos por servicios profesionales",
            "type": "income",
            "is_active": 1,
            "color": "#10B981"
        },
        {
            "name": "personal",
            "description": "Gastos personales",
            "type": "expense",
            "is_active": 1,
            "color": "#EF4444"
        },
        {
            "name": "oficina",
            "description": "Gastos de oficina y operación",
            "type": "expense",
            "is_active": 1,
            "color": "#3B82F6"
        },
        {
            "name": "marketing",
            "description": "Marketing y publicidad",
            "type": "expense",
            "is_active": 1,
            "color": "#8B5CF6"
        },
        {
            "name": "tecnologia",
            "description": "Tecnología y software",
            "type": "expense",
            "is_active": 1,
            "color": "#06B6D4"
        },
        {
            "name": "servicios",
            "description": "Servicios profesionales",
            "type": "expense",
            "is_active": 1,
            "color": "#F59E0B"
        },
        {
            "name": "equipamiento",
            "description": "Equipamiento y mobiliario",
            "type": "expense",
            "is_active": 1,
            "color": "#84CC16"
        },
        {
            "name": "deudas",
            "description": "Pagos de deudas y préstamos",
            "type": "expense",
            "is_active": 1,
            "color": "#DC2626"
        }
    ]')
);

-- Transactions for Struggling Scenario (20+ transactions showing crisis)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    3,
    'struggling_transactions',
    'transactions',
    json('[
        {
            "date": "2025-01-20",
            "description": "Pago Renta Oficina - URGENTE",
            "amount": -800000,
            "type": "gasto",
            "category": "oficina",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-18",
            "description": "Proyecto Pequeño - Cliente A",
            "amount": 600000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-15",
            "description": "Pago Mínimo Tarjeta - ATRASADO",
            "amount": -80000,
            "type": "gasto",
            "category": "deudas",
            "account": "HSBC Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2025-01-12",
            "description": "Servicios Internet",
            "amount": -89900,
            "type": "gasto",
            "category": "tecnologia",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-10",
            "description": "Comida Personal",
            "amount": -120000,
            "type": "gasto",
            "category": "personal",
            "account": "Efectivo",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "personal"
        },
        {
            "date": "2025-01-08",
            "description": "Software Básico",
            "amount": -116000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-05",
            "description": "Multa SAT - Declaración Atrasada",
            "amount": -500000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2025-01-03",
            "description": "Gasolina Personal",
            "amount": -80000,
            "type": "gasto",
            "category": "personal",
            "account": "Efectivo",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "personal"
        },
        {
            "date": "2024-12-28",
            "description": "Proyecto Pequeño - Cliente B",
            "amount": 450000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-25",
            "description": "Regalos Navidad",
            "amount": -150000,
            "type": "gasto",
            "category": "personal",
            "account": "Efectivo",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "personal"
        },
        {
            "date": "2024-12-22",
            "description": "Renta Oficina - Diciembre",
            "amount": -800000,
            "type": "gasto",
            "category": "oficina",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-20",
            "description": "Servicios Contables - Emergencia",
            "amount": -300000,
            "type": "gasto",
            "category": "servicios",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-18",
            "description": "Pago Mínimo Tarjeta",
            "amount": -80000,
            "type": "gasto",
            "category": "deudas",
            "account": "HSBC Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-12-15",
            "description": "Marketing Básico",
            "amount": -50000,
            "type": "gasto",
            "category": "marketing",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-12",
            "description": "Proyecto Pequeño - Cliente C",
            "amount": 350000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-10",
            "description": "Equipamiento Básico",
            "amount": -150000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-08",
            "description": "Servicios Legales - Emergencia",
            "amount": -200000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-05",
            "description": "Consultoría Pequeña - Cliente D",
            "amount": 400000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-03",
            "description": "Renta Oficina - Noviembre",
            "amount": -800000,
            "type": "gasto",
            "category": "oficina",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-28",
            "description": "Pago Mínimo Tarjeta - ATRASADO",
            "amount": -80000,
            "type": "gasto",
            "category": "deudas",
            "account": "HSBC Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-11-25",
            "description": "Proyecto Pequeño - Cliente E",
            "amount": 300000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-22",
            "description": "Servicios Internet",
            "amount": -89900,
            "type": "gasto",
            "category": "tecnologia",
            "account": "HSBC Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-20",
            "description": "Comida Personal",
            "amount": -100000,
            "type": "gasto",
            "category": "personal",
            "account": "Efectivo",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "personal"
        },
        {
            "date": "2024-11-18",
            "description": "Equipamiento Básico",
            "amount": -120000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-15",
            "description": "Proyecto Pequeño - Cliente F",
            "amount": 250000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        }
    ]')
);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- Migration 048 completed successfully
-- Realistic demo scenarios with 3 levels:
-- 1. Excelente: +$100,000 MXN (healthy business)
-- 2. Regular: +$10,000 MXN (stable business)  
-- 3. Malo: -$20,000 MXN (struggling business)
-- 
-- Features:
-- - 3 scenario levels instead of 2
-- - Realistic amounts (not millions)
-- - Dynamic 3-position switch capability
-- - Comprehensive transaction data for each level
-- - Multiple account types with realistic balances
-- - 30+ transactions for excellent scenario
-- - 25+ transactions for regular scenario
-- - 20+ transactions for struggling scenario
-- - Proper CFDI usage codes
-- - Realistic business scenarios
-- ============================================================================
