-- ============================================================================
-- MIGRATION 047: Enhanced Demo Data - Exaggerated Scenarios
-- ============================================================================
-- Phase 46: Integration Testing & Quality Assurance
-- 
-- This migration replaces the existing demo data with much more exaggerated
-- and comprehensive scenarios to thoroughly test all system functionality.
-- 
-- Features:
-- - Accounts with balances over $10,000 MXN
-- - Extensive transaction history (50+ transactions per scenario)
-- - Multiple account types and categories
-- - Comprehensive fiscal data
-- - Realistic business scenarios
-- - Data to test all system features
-- ============================================================================

-- Update existing demo scenarios with more dramatic descriptions
UPDATE demo_scenarios SET 
    description = 'Un negocio de servicios profesionales exitoso con finanzas robustas, múltiples cuentas bancarias, flujo de efectivo excelente y cumplimiento fiscal impecable. Incluye inversiones, créditos manejables y crecimiento sostenido.',
    business_context = json('{"business_type": "Servicios Profesionales", "monthly_revenue": 150000, "employees": 2, "years_operating": 5, "fiscal_regime": "RIF", "annual_revenue": 1800000, "client_count": 25}'),
    financial_state = json('{"cash_balance": 450000, "accounts_receivable": 180000, "accounts_payable": 25000, "monthly_expenses": 85000, "tax_compliance": "current", "isr_paid": true, "iva_paid": true, "investment_balance": 200000, "credit_utilization": 0.15}')
WHERE scenario_type = 'healthy';

UPDATE demo_scenarios SET 
    description = 'Un negocio en crisis financiera severa con múltiples problemas: cuentas sobregiradas, deudas acumuladas, declaraciones fiscales atrasadas, clientes morosos y necesidad urgente de restructuración financiera.',
    business_context = json('{"business_type": "Servicios Profesionales", "monthly_revenue": 25000, "employees": 0, "years_operating": 2, "fiscal_regime": "RIF", "annual_revenue": 300000, "client_count": 8}'),
    financial_state = json('{"cash_balance": -85000, "accounts_receivable": 120000, "accounts_payable": 95000, "monthly_expenses": 45000, "tax_compliance": "overdue", "isr_paid": false, "iva_paid": false, "late_payments": 5, "overdraft_fees": 15000}')
WHERE scenario_type = 'critical';

-- ============================================================================
-- DELETE EXISTING DEMO DATA SNAPSHOTS
-- ============================================================================
DELETE FROM demo_data_snapshots WHERE scenario_id IN (1, 2);

-- ============================================================================
-- ENHANCED DEMO DATA SNAPSHOTS - HEALTHY SCENARIO
-- ============================================================================

-- Enhanced Accounts for Healthy Scenario (Multiple accounts with high balances)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'healthy_accounts',
    'accounts',
    json('[
        {
            "name": "BBVA Empresarial Principal",
            "type": "checking",
            "balance": 45000000,
            "opening_date": "2020-01-15",
            "is_active": 1,
            "account_number": "0123456789"
        },
        {
            "name": "Santander Business Premium",
            "type": "checking",
            "balance": 28000000,
            "opening_date": "2021-06-01",
            "is_active": 1,
            "account_number": "9876543210"
        },
        {
            "name": "AMEX Business Platinum",
            "type": "credit",
            "balance": -2500000,
            "opening_date": "2020-03-15",
            "is_active": 1,
            "credit_limit": 50000000
        },
        {
            "name": "HSBC Business Gold",
            "type": "credit",
            "balance": -1800000,
            "opening_date": "2021-09-01",
            "is_active": 1,
            "credit_limit": 30000000
        },
        {
            "name": "Efectivo Oficina",
            "type": "cash",
            "balance": 1500000,
            "opening_date": "2020-01-01",
            "is_active": 1
        },
        {
            "name": "Inversión CETES",
            "type": "investment",
            "balance": 20000000,
            "opening_date": "2022-01-01",
            "is_active": 1
        },
        {
            "name": "Fondo de Emergencia",
            "type": "savings",
            "balance": 12000000,
            "opening_date": "2020-06-01",
            "is_active": 1
        }
    ]')
);

-- Enhanced Categories for Healthy Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'healthy_categories',
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
            "name": "inversiones",
            "description": "Inversiones y ahorros",
            "type": "investment",
            "is_active": 1,
            "color": "#14B8A6"
        }
    ]')
);

-- Extensive Transactions for Healthy Scenario (60+ transactions covering 6 months)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'healthy_transactions',
    'transactions',
    json('[
        {
            "date": "2025-01-20",
            "description": "Proyecto Desarrollo Web Corporativo - Empresa ABC",
            "amount": 85000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-18",
            "description": "Consultoría Estratégica Digital - Cliente XYZ",
            "amount": 45000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business Premium",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-15",
            "description": "Pago Renta Oficina Corporativa",
            "amount": -25000000,
            "type": "gasto",
            "category": "oficina",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-12",
            "description": "Servicios Internet Empresarial Fibra Óptica",
            "amount": -2500000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "AMEX Business Platinum",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-10",
            "description": "Software Adobe Creative Cloud Enterprise",
            "amount": -3500000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "AMEX Business Platinum",
            "is_isr_deductible": 1,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-08",
            "description": "Marketing Digital - Google Ads Campaña Q1",
            "amount": -12000000,
            "type": "gasto",
            "category": "marketing",
            "account": "Santander Business Premium",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-05",
            "description": "Contador - Servicios Fiscales Enero",
            "amount": -8000000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-03",
            "description": "Equipo de Cómputo - MacBook Pro M3",
            "amount": -45000000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-28",
            "description": "Proyecto App Móvil Fintech - Startup DEF",
            "amount": 120000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-25",
            "description": "Bonos Navideños Personal",
            "amount": -15000000,
            "type": "gasto",
            "category": "personal",
            "account": "Efectivo Oficina",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "personal"
        },
        {
            "date": "2024-12-20",
            "description": "Diseño UI/UX Plataforma E-commerce",
            "amount": 65000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business Premium",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-18",
            "description": "Mobiliario Oficina - Escritorios Ejecutivos",
            "amount": -18000000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "AMEX Business Platinum",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-15",
            "description": "Servicios Legales - Contratos Corporativos",
            "amount": -12000000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-12",
            "description": "Marketing - Campaña LinkedIn Premium",
            "amount": -8500000,
            "type": "gasto",
            "category": "marketing",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-10",
            "description": "Inversión CETES - Plazo 28 días",
            "amount": -20000000,
            "type": "gasto",
            "category": "inversiones",
            "account": "Fondo de Emergencia",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "investment"
        },
        {
            "date": "2024-12-08",
            "description": "Desarrollo Sistema CRM Personalizado",
            "amount": 95000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-05",
            "description": "Servicios Cloud AWS - Infraestructura",
            "amount": -15000000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "Santander Business Premium",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-03",
            "description": "Capacitación Equipo - Certificación Scrum",
            "amount": -12000000,
            "type": "gasto",
            "category": "servicios",
            "account": "AMEX Business Platinum",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-28",
            "description": "Proyecto E-commerce B2B - Empresa GHI",
            "amount": 180000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business Premium",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-25",
            "description": "Equipamiento - Servidores y Networking",
            "amount": -35000000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-22",
            "description": "Marketing - Evento Tech Conference",
            "amount": -25000000,
            "type": "gasto",
            "category": "marketing",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-20",
            "description": "Consultoría Arquitectura de Software",
            "amount": 75000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-18",
            "description": "Servicios Contables - Auditoría Mensual",
            "amount": -15000000,
            "type": "gasto",
            "category": "servicios",
            "account": "Santander Business Premium",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-15",
            "description": "Software Licencias Enterprise",
            "amount": -22000000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "AMEX Business Platinum",
            "is_isr_deductible": 1,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-12",
            "description": "Desarrollo App Móvil Fintech",
            "amount": 140000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business Premium",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-10",
            "description": "Oficina - Renta Mensual Diciembre",
            "amount": -25000000,
            "type": "gasto",
            "category": "oficina",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-08",
            "description": "Marketing - Influencer Tech Campaign",
            "amount": -18000000,
            "type": "gasto",
            "category": "marketing",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-05",
            "description": "Equipamiento - Monitores 4K Profesionales",
            "amount": -12000000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "AMEX Business Platinum",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-03",
            "description": "Servicios Legales - Patentes Software",
            "amount": -25000000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-30",
            "description": "Proyecto Blockchain - DeFi Platform",
            "amount": 200000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business Premium",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-28",
            "description": "Inversión - Bonos Corporativos",
            "amount": -50000000,
            "type": "gasto",
            "category": "inversiones",
            "account": "Inversión CETES",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "investment"
        },
        {
            "date": "2024-10-25",
            "description": "Marketing - Google Ads Q4 Campaign",
            "amount": -30000000,
            "type": "gasto",
            "category": "marketing",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-22",
            "description": "Desarrollo SaaS - Plataforma Analytics",
            "amount": 160000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business Premium",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-20",
            "description": "Servicios Cloud - Azure Enterprise",
            "amount": -18000000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "AMEX Business Platinum",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-18",
            "description": "Equipamiento - Workstations Gaming",
            "amount": -28000000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-15",
            "description": "Oficina - Renta Mensual Noviembre",
            "amount": -25000000,
            "type": "gasto",
            "category": "oficina",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-12",
            "description": "Consultoría DevOps - Automatización CI/CD",
            "amount": 85000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business Premium",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-10",
            "description": "Servicios Contables - Declaración Anual",
            "amount": -20000000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-08",
            "description": "Marketing - Facebook Ads Q4",
            "amount": -22000000,
            "type": "gasto",
            "category": "marketing",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-05",
            "description": "Software - Licencias Microsoft 365",
            "amount": -15000000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "AMEX Business Platinum",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-03",
            "description": "Proyecto IA/ML - Sistema Recomendaciones",
            "amount": 220000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business Premium",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-01",
            "description": "Equipamiento - Servidores Rack",
            "amount": -45000000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-28",
            "description": "Desarrollo App - Plataforma E-learning",
            "amount": 180000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business Premium",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-25",
            "description": "Marketing - LinkedIn Premium Q3",
            "amount": -25000000,
            "type": "gasto",
            "category": "marketing",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-22",
            "description": "Servicios Legales - Contratos Internacionales",
            "amount": -35000000,
            "type": "gasto",
            "category": "servicios",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-20",
            "description": "Oficina - Renta Mensual Octubre",
            "amount": -25000000,
            "type": "gasto",
            "category": "oficina",
            "account": "Santander Business Premium",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-18",
            "description": "Consultoría Ciberseguridad - Auditoría",
            "amount": 95000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-15",
            "description": "Equipamiento - Laptops Dell Precision",
            "amount": -32000000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "AMEX Business Platinum",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-12",
            "description": "Servicios Cloud - Google Cloud Platform",
            "amount": -28000000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "Santander Business Premium",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-10",
            "description": "Marketing - Evento Tech Summit",
            "amount": -40000000,
            "type": "gasto",
            "category": "marketing",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-08",
            "description": "Proyecto IoT - Sistema Monitoreo Industrial",
            "amount": 250000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business Premium",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-05",
            "description": "Servicios Contables - Revisión Q3",
            "amount": -18000000,
            "type": "gasto",
            "category": "servicios",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-03",
            "description": "Inversión - Fondo de Crecimiento",
            "amount": -30000000,
            "type": "gasto",
            "category": "inversiones",
            "account": "Fondo de Emergencia",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "investment"
        },
        {
            "date": "2024-09-01",
            "description": "Desarrollo Blockchain - Smart Contracts",
            "amount": 300000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial Principal",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        }
    ]')
);

-- ============================================================================
-- ENHANCED DEMO DATA SNAPSHOTS - CRITICAL SCENARIO
-- ============================================================================

-- Enhanced Accounts for Critical Scenario (Overdrawn and high debt)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'critical_accounts',
    'accounts',
    json('[
        {
            "name": "BBVA Empresarial",
            "type": "checking",
            "balance": -85000000,
            "opening_date": "2023-01-15",
            "is_active": 1,
            "account_number": "0123456789",
            "overdraft_limit": 100000000
        },
        {
            "name": "Santander Business",
            "type": "checking",
            "balance": -45000000,
            "opening_date": "2023-06-01",
            "is_active": 1,
            "account_number": "9876543210",
            "overdraft_limit": 50000000
        },
        {
            "name": "HSBC Business Gold",
            "type": "credit",
            "balance": -85000000,
            "opening_date": "2023-03-15",
            "is_active": 1,
            "credit_limit": 100000000
        },
        {
            "name": "AMEX Business",
            "type": "credit",
            "balance": -65000000,
            "opening_date": "2023-09-01",
            "is_active": 1,
            "credit_limit": 80000000
        },
        {
            "name": "Efectivo",
            "type": "cash",
            "balance": 500000,
            "opening_date": "2023-01-01",
            "is_active": 1
        },
        {
            "name": "Préstamo Empresarial",
            "type": "loan",
            "balance": -200000000,
            "opening_date": "2023-12-01",
            "is_active": 1,
            "interest_rate": 18.5
        }
    ]')
);

-- Enhanced Categories for Critical Scenario (same as healthy)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'critical_categories',
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

-- Extensive Transactions for Critical Scenario (60+ transactions showing crisis)
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'critical_transactions',
    'transactions',
    json('[
        {
            "date": "2025-01-20",
            "description": "Pago Renta Oficina - URGENTE ATRASADO",
            "amount": -25000000,
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
            "amount": 15000000,
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
            "description": "Pago Mínimo Tarjeta HSBC - ATRASADO",
            "amount": -8500000,
            "type": "gasto",
            "category": "deudas",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2025-01-12",
            "description": "Servicios Internet - Último Pago",
            "amount": -2500000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "AMEX Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2025-01-10",
            "description": "Comida Personal - Supermercado",
            "amount": -3500000,
            "type": "gasto",
            "category": "personal",
            "account": "Efectivo",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "personal"
        },
        {
            "date": "2025-01-08",
            "description": "Pago Mínimo AMEX - ATRASADO",
            "amount": -6500000,
            "type": "gasto",
            "category": "deudas",
            "account": "AMEX Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2025-01-05",
            "description": "Multa SAT - Declaración Atrasada",
            "amount": -12000000,
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
            "amount": -1800000,
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
            "amount": 8000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-25",
            "description": "Regalos Navidad - Familia",
            "amount": -5000000,
            "type": "gasto",
            "category": "personal",
            "account": "Efectivo",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "personal"
        },
        {
            "date": "2024-12-22",
            "description": "Pago Préstamo Empresarial - Cuota",
            "amount": -25000000,
            "type": "gasto",
            "category": "deudas",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-12-20",
            "description": "Renta Oficina - Diciembre",
            "amount": -25000000,
            "type": "gasto",
            "category": "oficina",
            "account": "Santander Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-18",
            "description": "Servicios Contables - Emergencia",
            "amount": -15000000,
            "type": "gasto",
            "category": "servicios",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-15",
            "description": "Pago Mínimo HSBC - ATRASADO",
            "amount": -8500000,
            "type": "gasto",
            "category": "deudas",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-12-12",
            "description": "Marketing Básico - Google Ads",
            "amount": -5000000,
            "type": "gasto",
            "category": "marketing",
            "account": "AMEX Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-12-10",
            "description": "Proyecto Pequeño - Cliente C",
            "amount": 12000000,
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
            "description": "Software Básico - Licencia Mensual",
            "amount": -3500000,
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
            "description": "Pago Mínimo AMEX - ATRASADO",
            "amount": -6500000,
            "type": "gasto",
            "category": "deudas",
            "account": "AMEX Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-12-03",
            "description": "Equipamiento Básico - Mouse y Teclado",
            "amount": -1500000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-28",
            "description": "Consultoría Pequeña - Cliente D",
            "amount": 18000000,
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
            "description": "Renta Oficina - Noviembre",
            "amount": -25000000,
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
            "date": "2024-11-22",
            "description": "Pago Préstamo Empresarial - Cuota",
            "amount": -25000000,
            "type": "gasto",
            "category": "deudas",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-11-20",
            "description": "Servicios Legales - Emergencia",
            "amount": -20000000,
            "type": "gasto",
            "category": "servicios",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-18",
            "description": "Pago Mínimo HSBC - ATRASADO",
            "amount": -8500000,
            "type": "gasto",
            "category": "deudas",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-11-15",
            "description": "Marketing - Facebook Ads Básico",
            "amount": -3000000,
            "type": "gasto",
            "category": "marketing",
            "account": "AMEX Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-12",
            "description": "Proyecto Pequeño - Cliente E",
            "amount": 10000000,
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
            "description": "Servicios Internet - Último Pago",
            "amount": -2500000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "Santander Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-11-08",
            "description": "Pago Mínimo AMEX - ATRASADO",
            "amount": -6500000,
            "type": "gasto",
            "category": "deudas",
            "account": "AMEX Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-11-05",
            "description": "Comida Personal - Restaurante",
            "amount": -2500000,
            "type": "gasto",
            "category": "personal",
            "account": "Efectivo",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "personal"
        },
        {
            "date": "2024-11-03",
            "description": "Equipamiento - Monitor Básico",
            "amount": -8000000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-30",
            "description": "Consultoría Pequeña - Cliente F",
            "amount": 15000000,
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
            "description": "Renta Oficina - Octubre",
            "amount": -25000000,
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
            "date": "2024-10-25",
            "description": "Pago Préstamo Empresarial - Cuota",
            "amount": -25000000,
            "type": "gasto",
            "category": "deudas",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-10-22",
            "description": "Servicios Contables - Emergencia",
            "amount": -12000000,
            "type": "gasto",
            "category": "servicios",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-20",
            "description": "Pago Mínimo HSBC - ATRASADO",
            "amount": -8500000,
            "type": "gasto",
            "category": "deudas",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-10-18",
            "description": "Marketing - Google Ads Básico",
            "amount": -4000000,
            "type": "gasto",
            "category": "marketing",
            "account": "AMEX Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-15",
            "description": "Proyecto Pequeño - Cliente G",
            "amount": 12000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-12",
            "description": "Software Básico - Licencia Mensual",
            "amount": -3500000,
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
            "date": "2024-10-10",
            "description": "Pago Mínimo AMEX - ATRASADO",
            "amount": -6500000,
            "type": "gasto",
            "category": "deudas",
            "account": "AMEX Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-10-08",
            "description": "Equipamiento - Laptop Básica",
            "amount": -18000000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-05",
            "description": "Consultoría Pequeña - Cliente H",
            "amount": 8000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-10-03",
            "description": "Renta Oficina - Septiembre",
            "amount": -25000000,
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
            "date": "2024-10-01",
            "description": "Pago Préstamo Empresarial - Cuota",
            "amount": -25000000,
            "type": "gasto",
            "category": "deudas",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-09-28",
            "description": "Servicios Legales - Emergencia",
            "amount": -18000000,
            "type": "gasto",
            "category": "servicios",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-25",
            "description": "Pago Mínimo HSBC - ATRASADO",
            "amount": -8500000,
            "type": "gasto",
            "category": "deudas",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-09-22",
            "description": "Marketing - LinkedIn Básico",
            "amount": -2000000,
            "type": "gasto",
            "category": "marketing",
            "account": "AMEX Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "international_with_invoice",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-20",
            "description": "Proyecto Pequeño - Cliente I",
            "amount": 10000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "BBVA Empresarial",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-18",
            "description": "Servicios Internet - Último Pago",
            "amount": -2500000,
            "type": "gasto",
            "category": "tecnologia",
            "account": "Santander Business",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-15",
            "description": "Pago Mínimo AMEX - ATRASADO",
            "amount": -6500000,
            "type": "gasto",
            "category": "deudas",
            "account": "AMEX Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-09-12",
            "description": "Equipamiento - Mouse y Teclado",
            "amount": -1500000,
            "type": "gasto",
            "category": "equipamiento",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-10",
            "description": "Consultoría Pequeña - Cliente J",
            "amount": 15000000,
            "type": "ingreso",
            "category": "avanta",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-08",
            "description": "Renta Oficina - Agosto",
            "amount": -25000000,
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
            "date": "2024-09-05",
            "description": "Pago Préstamo Empresarial - Cuota",
            "amount": -25000000,
            "type": "gasto",
            "category": "deudas",
            "account": "Santander Business",
            "is_isr_deductible": 0,
            "is_iva_deductible": 0,
            "transaction_type": "business"
        },
        {
            "date": "2024-09-03",
            "description": "Servicios Contables - Emergencia",
            "amount": -15000000,
            "type": "gasto",
            "category": "servicios",
            "account": "HSBC Business Gold",
            "is_isr_deductible": 1,
            "is_iva_deductible": 1,
            "transaction_type": "business",
            "expense_type": "national",
            "cfdi_usage": "G01"
        },
        {
            "date": "2024-09-01",
            "description": "Proyecto Pequeño - Cliente K",
            "amount": 12000000,
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
-- DEMO INVOICES AND FISCAL DATA
-- ============================================================================

-- Demo Invoices for Healthy Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'healthy_invoices',
    'invoices',
    json('[
        {
            "invoice_number": "AV-2025-001",
            "client_name": "Empresa ABC Corp",
            "amount": 85000000,
            "date": "2025-01-20",
            "status": "paid",
            "cfdi_usage": "G01",
            "description": "Proyecto Desarrollo Web Corporativo"
        },
        {
            "invoice_number": "AV-2025-002",
            "client_name": "Cliente XYZ S.A.",
            "amount": 45000000,
            "date": "2025-01-18",
            "status": "paid",
            "cfdi_usage": "G01",
            "description": "Consultoría Estratégica Digital"
        },
        {
            "invoice_number": "AV-2024-120",
            "client_name": "Startup DEF",
            "amount": 120000000,
            "date": "2024-12-28",
            "status": "paid",
            "cfdi_usage": "G01",
            "description": "Proyecto App Móvil Fintech"
        },
        {
            "invoice_number": "AV-2024-119",
            "client_name": "Empresa GHI",
            "amount": 180000000,
            "date": "2024-11-28",
            "status": "paid",
            "cfdi_usage": "G01",
            "description": "Proyecto E-commerce B2B"
        },
        {
            "invoice_number": "AV-2024-118",
            "client_name": "Corporación JKL",
            "amount": 300000000,
            "date": "2024-09-01",
            "status": "paid",
            "cfdi_usage": "G01",
            "description": "Desarrollo Blockchain - Smart Contracts"
        }
    ]')
);

-- Demo Invoices for Critical Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'critical_invoices',
    'invoices',
    json('[
        {
            "invoice_number": "AV-2025-001",
            "client_name": "Cliente A",
            "amount": 15000000,
            "date": "2025-01-18",
            "status": "pending",
            "cfdi_usage": "G01",
            "description": "Proyecto Pequeño"
        },
        {
            "invoice_number": "AV-2024-120",
            "client_name": "Cliente B",
            "amount": 8000000,
            "date": "2024-12-28",
            "status": "overdue",
            "cfdi_usage": "G01",
            "description": "Proyecto Pequeño"
        },
        {
            "invoice_number": "AV-2024-119",
            "client_name": "Cliente C",
            "amount": 12000000,
            "date": "2024-12-10",
            "status": "overdue",
            "cfdi_usage": "G01",
            "description": "Proyecto Pequeño"
        },
        {
            "invoice_number": "AV-2024-118",
            "client_name": "Cliente D",
            "amount": 18000000,
            "date": "2024-11-28",
            "status": "paid",
            "cfdi_usage": "G01",
            "description": "Consultoría Pequeña"
        },
        {
            "invoice_number": "AV-2024-117",
            "client_name": "Cliente E",
            "amount": 10000000,
            "date": "2024-11-12",
            "status": "overdue",
            "cfdi_usage": "G01",
            "description": "Proyecto Pequeño"
        }
    ]')
);

-- ============================================================================
-- DEMO FISCAL PAYMENTS
-- ============================================================================

-- Demo Fiscal Payments for Healthy Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'healthy_fiscal_payments',
    'fiscal_payments',
    json('[
        {
            "payment_type": "isr",
            "amount": 15000000,
            "period": "2024-12",
            "due_date": "2025-01-17",
            "status": "paid",
            "payment_date": "2025-01-15"
        },
        {
            "payment_type": "iva",
            "amount": 8500000,
            "period": "2024-12",
            "due_date": "2025-01-17",
            "status": "paid",
            "payment_date": "2025-01-15"
        },
        {
            "payment_type": "isr",
            "amount": 12000000,
            "period": "2024-11",
            "due_date": "2024-12-17",
            "status": "paid",
            "payment_date": "2024-12-15"
        },
        {
            "payment_type": "iva",
            "amount": 6800000,
            "period": "2024-11",
            "due_date": "2024-12-17",
            "status": "paid",
            "payment_date": "2024-12-15"
        }
    ]')
);

-- Demo Fiscal Payments for Critical Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'critical_fiscal_payments',
    'fiscal_payments',
    json('[
        {
            "payment_type": "isr",
            "amount": 2500000,
            "period": "2024-12",
            "due_date": "2025-01-17",
            "status": "overdue",
            "payment_date": null
        },
        {
            "payment_type": "iva",
            "amount": 1500000,
            "period": "2024-12",
            "due_date": "2025-01-17",
            "status": "overdue",
            "payment_date": null
        },
        {
            "payment_type": "isr",
            "amount": 2000000,
            "period": "2024-11",
            "due_date": "2024-12-17",
            "status": "overdue",
            "payment_date": null
        },
        {
            "payment_type": "iva",
            "amount": 1200000,
            "period": "2024-11",
            "due_date": "2024-12-17",
            "status": "overdue",
            "payment_date": null
        },
        {
            "payment_type": "multa",
            "amount": 12000000,
            "period": "2024-12",
            "due_date": "2025-01-31",
            "status": "overdue",
            "payment_date": null,
            "description": "Multa por declaración atrasada"
        }
    ]')
);

-- ============================================================================
-- DEMO BUDGETS
-- ============================================================================

-- Demo Budgets for Healthy Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'healthy_budgets',
    'budgets',
    json('[
        {
            "category": "oficina",
            "monthly_limit": 30000000,
            "current_spent": 25000000,
            "period": "2025-01"
        },
        {
            "category": "marketing",
            "monthly_limit": 50000000,
            "current_spent": 12000000,
            "period": "2025-01"
        },
        {
            "category": "tecnologia",
            "monthly_limit": 40000000,
            "current_spent": 6000000,
            "period": "2025-01"
        },
        {
            "category": "servicios",
            "monthly_limit": 25000000,
            "current_spent": 8000000,
            "period": "2025-01"
        },
        {
            "category": "equipamiento",
            "monthly_limit": 60000000,
            "current_spent": 45000000,
            "period": "2025-01"
        }
    ]')
);

-- Demo Budgets for Critical Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'critical_budgets',
    'budgets',
    json('[
        {
            "category": "oficina",
            "monthly_limit": 30000000,
            "current_spent": 25000000,
            "period": "2025-01"
        },
        {
            "category": "marketing",
            "monthly_limit": 10000000,
            "current_spent": 5000000,
            "period": "2025-01"
        },
        {
            "category": "tecnologia",
            "monthly_limit": 15000000,
            "current_spent": 2500000,
            "period": "2025-01"
        },
        {
            "category": "servicios",
            "monthly_limit": 20000000,
            "current_spent": 15000000,
            "period": "2025-01"
        },
        {
            "category": "deudas",
            "monthly_limit": 50000000,
            "current_spent": 85000000,
            "period": "2025-01"
        }
    ]')
);

-- ============================================================================
-- DEMO CREDITS
-- ============================================================================

-- Demo Credits for Healthy Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    1,
    'healthy_credits',
    'credits',
    json('[
        {
            "credit_name": "AMEX Business Platinum",
            "credit_limit": 50000000,
            "current_balance": 2500000,
            "minimum_payment": 250000,
            "interest_rate": 15.5,
            "due_date": "2025-02-15",
            "status": "current"
        },
        {
            "credit_name": "HSBC Business Gold",
            "credit_limit": 30000000,
            "current_balance": 1800000,
            "minimum_payment": 180000,
            "interest_rate": 16.0,
            "due_date": "2025-02-20",
            "status": "current"
        }
    ]')
);

-- Demo Credits for Critical Scenario
INSERT INTO demo_data_snapshots (scenario_id, snapshot_name, data_type, data_snapshot) VALUES (
    2,
    'critical_credits',
    'credits',
    json('[
        {
            "credit_name": "HSBC Business Gold",
            "credit_limit": 100000000,
            "current_balance": 85000000,
            "minimum_payment": 8500000,
            "interest_rate": 18.5,
            "due_date": "2025-02-15",
            "status": "overdue"
        },
        {
            "credit_name": "AMEX Business",
            "credit_limit": 80000000,
            "current_balance": 65000000,
            "minimum_payment": 6500000,
            "interest_rate": 19.0,
            "due_date": "2025-02-20",
            "status": "overdue"
        },
        {
            "credit_name": "Préstamo Empresarial",
            "credit_limit": 200000000,
            "current_balance": 200000000,
            "minimum_payment": 25000000,
            "interest_rate": 18.5,
            "due_date": "2025-02-01",
            "status": "overdue"
        }
    ]')
);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- Migration 047 completed successfully
-- Enhanced demo data with exaggerated scenarios:
-- - 60+ transactions per scenario
-- - Multiple account types with high balances
-- - Comprehensive fiscal data
-- - Realistic business scenarios
-- - Data to test all system features
-- - Accounts with balances over $10,000 MXN
-- - Extensive transaction history
-- - Multiple categories and account types
-- - Comprehensive fiscal payments and invoices
-- - Budget tracking and credit management
-- ============================================================================
