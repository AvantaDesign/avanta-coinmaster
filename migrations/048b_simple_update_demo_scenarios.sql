-- ============================================================================
-- MIGRATION 048B: Simple Update Demo Scenarios for 3 Levels
-- ============================================================================
-- Phase 46: Integration Testing & Quality Assurance
-- 
-- This migration simply updates the existing scenarios to use new types
-- and adds a third scenario, without changing table structure
-- ============================================================================

-- First, let's see what constraints exist
-- We'll work around the CHECK constraint by updating existing records

-- Update existing scenarios to new types
UPDATE demo_scenarios SET 
    scenario_name = 'Negocio Excelente',
    scenario_type = 'excellent',
    description = 'Un negocio de servicios profesionales muy exitoso con finanzas sólidas, múltiples clientes corporativos y crecimiento sostenido.',
    business_context = json('{"business_type": "Servicios Profesionales", "monthly_revenue": 120000, "employees": 2, "years_operating": 4, "fiscal_regime": "RIF", "annual_revenue": 1400000, "client_count": 15}'),
    financial_state = json('{"cash_balance": 100000, "accounts_receivable": 45000, "accounts_payable": 15000, "monthly_expenses": 75000, "tax_compliance": "current", "isr_paid": true, "iva_paid": true, "investment_balance": 50000, "credit_utilization": 0.2}'),
    learning_objectives = json('["Gestión de crecimiento sostenido", "Optimización de flujo de efectivo", "Expansión de servicios", "Planificación fiscal avanzada"]'),
    display_order = 1
WHERE id = 1;

UPDATE demo_scenarios SET 
    scenario_name = 'Negocio en Problemas',
    scenario_type = 'struggling',
    description = 'Un negocio enfrentando desafíos financieros: flujo de efectivo negativo, clientes morosos y necesidad urgente de restructuración.',
    business_context = json('{"business_type": "Servicios Profesionales", "monthly_revenue": 25000, "employees": 0, "years_operating": 1, "fiscal_regime": "RIF", "annual_revenue": 300000, "client_count": 4}'),
    financial_state = json('{"cash_balance": -20000, "accounts_receivable": 35000, "accounts_payable": 25000, "monthly_expenses": 30000, "tax_compliance": "overdue", "isr_paid": false, "iva_paid": false, "late_payments": 3, "overdraft_fees": 2000}'),
    learning_objectives = json('["Recuperación de flujo de efectivo", "Gestión de crisis financiera", "Reducción de gastos", "Recuperación de cuentas por cobrar", "Planificación de emergencia"]'),
    display_order = 3
WHERE id = 2;

-- Add the regular scenario as a new record
INSERT INTO demo_scenarios (
    scenario_name,
    scenario_type,
    description,
    business_context,
    financial_state,
    learning_objectives,
    display_order
) VALUES (
    'Negocio Regular',
    'regular',
    'Un negocio estable con finanzas equilibradas, clientes regulares y operación sin problemas mayores.',
    json('{"business_type": "Servicios Profesionales", "monthly_revenue": 45000, "employees": 1, "years_operating": 2, "fiscal_regime": "RIF", "annual_revenue": 540000, "client_count": 8}'),
    json('{"cash_balance": 10000, "accounts_receivable": 20000, "accounts_payable": 8000, "monthly_expenses": 35000, "tax_compliance": "current", "isr_paid": true, "iva_paid": true, "credit_utilization": 0.4}'),
    json('["Mantenimiento de estabilidad financiera", "Optimización de procesos", "Crecimiento gradual", "Gestión eficiente de recursos"]'),
    2
);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- Migration 048B completed successfully
-- Updated demo scenarios to support 3 levels:
-- 1. Negocio Excelente (excellent) - +$100,000 MXN
-- 2. Negocio Regular (regular) - +$10,000 MXN  
-- 3. Negocio en Problemas (struggling) - -$20,000 MXN
-- ============================================================================
