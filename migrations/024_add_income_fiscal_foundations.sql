-- Migration 024: Add Income Module & Fiscal Foundations
-- Purpose: Complete the foundational data model for income management and fiscal compliance
-- Phase 17: Income Module & Fiscal Foundations
-- Date: 2025-10-18
-- Author: Avanta Finance Development Team

-- ============================================================================
-- PART 1: Add Income-Specific Fields to Transactions Table
-- ============================================================================

-- Add client_type field (nacional/extranjero)
ALTER TABLE transactions ADD COLUMN client_type TEXT DEFAULT 'nacional' CHECK(client_type IN ('nacional', 'extranjero'));

-- Add client_rfc field (TEXT for flexibility with foreign clients)
ALTER TABLE transactions ADD COLUMN client_rfc TEXT;

-- Add currency field (default MXN for Mexican pesos)
ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT 'MXN' CHECK(LENGTH(currency) = 3);

-- Add exchange_rate field (DECIMAL for precision in currency conversions)
ALTER TABLE transactions ADD COLUMN exchange_rate REAL DEFAULT 1.0;

-- Add payment_method field (PUE - Pago en Una Exhibición, PPD - Pago en Parcialidades o Diferido)
ALTER TABLE transactions ADD COLUMN payment_method TEXT CHECK(payment_method IN ('PUE', 'PPD') OR payment_method IS NULL);

-- Add iva_rate field (16%, 0%, or exento)
ALTER TABLE transactions ADD COLUMN iva_rate TEXT DEFAULT '16' CHECK(iva_rate IN ('16', '0', 'exento') OR iva_rate IS NULL);

-- Add isr_retention field (amount withheld for ISR)
ALTER TABLE transactions ADD COLUMN isr_retention REAL DEFAULT 0;

-- Add iva_retention field (amount withheld for IVA)
ALTER TABLE transactions ADD COLUMN iva_retention REAL DEFAULT 0;

-- Add cfdi_uuid field (Folio Fiscal from CFDI)
ALTER TABLE transactions ADD COLUMN cfdi_uuid TEXT;

-- Add issue_date field (fecha de emisión del CFDI)
ALTER TABLE transactions ADD COLUMN issue_date TEXT;

-- Add payment_date field (fecha de cobro/pago efectivo)
ALTER TABLE transactions ADD COLUMN payment_date TEXT;

-- Add economic_activity_id field (links to user's registered activities)
ALTER TABLE transactions ADD COLUMN economic_activity_code TEXT;

-- ============================================================================
-- PART 2: Create SAT Accounts Catalog Table (Anexo 24)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sat_accounts_catalog (
    codigo_agrupador TEXT PRIMARY KEY,
    descripcion TEXT NOT NULL,
    nivel INTEGER NOT NULL CHECK(nivel IN (1, 2, 3, 4, 5)),
    codigo_padre TEXT,
    activo INTEGER DEFAULT 1 CHECK(activo IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(codigo_padre) REFERENCES sat_accounts_catalog(codigo_agrupador) ON DELETE CASCADE
);

-- Create indexes for SAT accounts catalog
CREATE INDEX IF NOT EXISTS idx_sat_accounts_catalog_nivel ON sat_accounts_catalog(nivel);
CREATE INDEX IF NOT EXISTS idx_sat_accounts_catalog_codigo_padre ON sat_accounts_catalog(codigo_padre);
CREATE INDEX IF NOT EXISTS idx_sat_accounts_catalog_activo ON sat_accounts_catalog(activo);

-- ============================================================================
-- PART 3: Create Indexes for New Transaction Fields
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_transactions_client_type ON transactions(client_type);
CREATE INDEX IF NOT EXISTS idx_transactions_client_rfc ON transactions(client_rfc);
CREATE INDEX IF NOT EXISTS idx_transactions_currency ON transactions(currency);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method ON transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_transactions_cfdi_uuid ON transactions(cfdi_uuid);
CREATE INDEX IF NOT EXISTS idx_transactions_issue_date ON transactions(issue_date);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_date ON transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_transactions_economic_activity_code ON transactions(economic_activity_code);

-- ============================================================================
-- PART 4: Populate SAT Accounts Catalog (Anexo 24 - Código Agrupador SAT)
-- ============================================================================
-- This is a simplified version with main categories. Full catalog should be imported.

-- Nivel 1: Major Account Groups
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('100', 'ACTIVO', 1, NULL, 1),
('200', 'PASIVO', 1, NULL, 1),
('300', 'CAPITAL CONTABLE', 1, NULL, 1),
('400', 'INGRESOS', 1, NULL, 1),
('500', 'COSTOS', 1, NULL, 1),
('600', 'GASTOS', 1, NULL, 1),
('700', 'RESULTADO INTEGRAL DE FINANCIAMIENTO', 1, NULL, 1);

-- Nivel 2: ACTIVO subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('101', 'ACTIVO CIRCULANTE', 2, '100', 1),
('102', 'ACTIVO NO CIRCULANTE', 2, '100', 1);

-- Nivel 3: ACTIVO CIRCULANTE subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('101.01', 'Caja', 3, '101', 1),
('101.02', 'Bancos', 3, '101', 1),
('101.03', 'Inversiones temporales', 3, '101', 1),
('101.04', 'Clientes', 3, '101', 1),
('101.05', 'Cuentas y documentos por cobrar a corto plazo', 3, '101', 1),
('101.06', 'Deudores diversos', 3, '101', 1),
('101.07', 'Estimación de cuentas incobrables', 3, '101', 1),
('101.08', 'Inventarios', 3, '101', 1),
('101.09', 'Pagos anticipados', 3, '101', 1);

-- Nivel 3: ACTIVO NO CIRCULANTE subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('102.01', 'Terrenos', 3, '102', 1),
('102.02', 'Edificios', 3, '102', 1),
('102.03', 'Maquinaria y equipo', 3, '102', 1),
('102.04', 'Automóviles, autobuses, camiones de carga, tractocamiones, montacargas y remolques', 3, '102', 1),
('102.05', 'Mobiliario y equipo de oficina', 3, '102', 1),
('102.06', 'Equipo de cómputo', 3, '102', 1),
('102.07', 'Equipo de comunicación', 3, '102', 1),
('102.08', 'Activos biológicos, vegetales y semovientes', 3, '102', 1),
('102.09', 'Obras en proceso de activos fijos', 3, '102', 1),
('102.10', 'Depreciación acumulada de activos fijos', 3, '102', 1);

-- Nivel 2: PASIVO subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('201', 'PASIVO CIRCULANTE', 2, '200', 1),
('202', 'PASIVO NO CIRCULANTE', 2, '200', 1);

-- Nivel 3: PASIVO CIRCULANTE subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('201.01', 'Proveedores', 3, '201', 1),
('201.02', 'Cuentas por pagar a corto plazo', 3, '201', 1),
('201.03', 'Impuestos trasladados cobrados', 3, '201', 1),
('201.04', 'Impuestos y derechos por pagar', 3, '201', 1),
('201.05', 'Contribuciones por pagar a corto plazo', 3, '201', 1),
('201.06', 'Acreedores diversos a corto plazo', 3, '201', 1);

-- Nivel 3: PASIVO NO CIRCULANTE subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('202.01', 'Cuentas por pagar a largo plazo', 3, '202', 1),
('202.02', 'Obligaciones por pagar a largo plazo', 3, '202', 1),
('202.03', 'Documentos por pagar a largo plazo', 3, '202', 1);

-- Nivel 2: CAPITAL CONTABLE subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('301', 'CAPITAL CONTABLE', 2, '300', 1);

-- Nivel 3: CAPITAL CONTABLE subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('301.01', 'Capital social', 3, '301', 1),
('301.02', 'Aportaciones para futuros aumentos de capital', 3, '301', 1),
('301.03', 'Utilidades acumuladas', 3, '301', 1),
('301.04', 'Utilidad o pérdida del ejercicio', 3, '301', 1);

-- Nivel 2: INGRESOS subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('401', 'INGRESOS', 2, '400', 1);

-- Nivel 3: INGRESOS subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('401.01', 'Ingresos', 3, '401', 1),
('401.02', 'Devoluciones, descuentos y bonificaciones sobre ventas', 3, '401', 1),
('401.03', 'Ingresos por servicios', 3, '401', 1),
('401.04', 'Ingresos por dividendos', 3, '401', 1),
('401.05', 'Ingresos por intereses', 3, '401', 1),
('401.06', 'Otros ingresos', 3, '401', 1);

-- Nivel 2: COSTOS subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('501', 'COSTO DE VENTAS Y DE PRESTACIÓN DE SERVICIOS', 2, '500', 1);

-- Nivel 3: COSTOS subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('501.01', 'Costo de ventas', 3, '501', 1),
('501.02', 'Costo de servicios', 3, '501', 1);

-- Nivel 2: GASTOS subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('601', 'GASTOS GENERALES', 2, '600', 1);

-- Nivel 3: GASTOS GENERALES subcategories (most relevant for persona física)
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('601.01', 'Gastos de administración', 3, '601', 1),
('601.02', 'Gastos de venta', 3, '601', 1),
('601.03', 'Gastos financieros', 3, '601', 1),
('601.04', 'Gastos de operación', 3, '601', 1),
('601.05', 'Sueldos y salarios', 3, '601', 1),
('601.06', 'Cuotas patronales al IMSS e INFONAVIT', 3, '601', 1),
('601.07', 'Honorarios', 3, '601', 1),
('601.08', 'Arrendamientos', 3, '601', 1),
('601.09', 'Combustibles y lubricantes', 3, '601', 1),
('601.10', 'Viáticos y gastos de viaje', 3, '601', 1),
('601.11', 'Mantenimiento y reparación', 3, '601', 1),
('601.12', 'Servicios públicos (luz, agua, teléfono, internet)', 3, '601', 1),
('601.13', 'Seguros y fianzas', 3, '601', 1),
('601.14', 'Depreciación y amortización', 3, '601', 1),
('601.15', 'Gastos de investigación y desarrollo', 3, '601', 1),
('601.16', 'Publicidad y mercadotecnia', 3, '601', 1),
('601.17', 'Otros gastos', 3, '601', 1);

-- Nivel 2: RESULTADO INTEGRAL DE FINANCIAMIENTO subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('701', 'RESULTADO INTEGRAL DE FINANCIAMIENTO', 2, '700', 1);

-- Nivel 3: RESULTADO INTEGRAL DE FINANCIAMIENTO subcategories
INSERT OR IGNORE INTO sat_accounts_catalog (codigo_agrupador, descripcion, nivel, codigo_padre, activo) VALUES
('701.01', 'Gastos financieros', 3, '701', 1),
('701.02', 'Productos financieros', 3, '701', 1),
('701.03', 'Pérdida o ganancia en cambios', 3, '701', 1);

-- ============================================================================
-- PART 5: Update Fiscal Parameters with 2025 UMA Values
-- ============================================================================

-- Update UMA values for 2025 (daily, monthly, and annual)
-- UMA 2025: $113.14 diario (estimated, will be official in January)
INSERT OR IGNORE INTO fiscal_parameters (id, parameter_type, period_type, effective_from, effective_to, value, description, source, is_active)
VALUES 
('uma_daily_2025', 'uma_value', 'permanent', '2025-01-01', NULL, '113.14', 'UMA daily value for 2025', 'INEGI', 1),
('uma_monthly_2025', 'uma_value', 'permanent', '2025-01-01', NULL, '3439.46', 'UMA monthly value for 2025 (113.14 * 30.4)', 'INEGI', 1),
('uma_annual_2025', 'uma_value', 'permanent', '2025-01-01', NULL, '41273.52', 'UMA annual value for 2025 (113.14 * 365)', 'INEGI', 1);

-- Add IVA rates for different scenarios
INSERT OR IGNORE INTO fiscal_parameters (id, parameter_type, period_type, effective_from, effective_to, value, description, source, is_active)
VALUES 
('iva_16_2025', 'iva_rate', 'permanent', '2025-01-01', NULL, '0.16', 'IVA standard rate 16%', 'SAT', 1),
('iva_0_2025', 'iva_rate', 'permanent', '2025-01-01', NULL, '0.00', 'IVA 0% rate for exports and specific services', 'SAT', 1),
('iva_exento_2025', 'iva_rate', 'permanent', '2025-01-01', NULL, '0.00', 'IVA exempt for certain goods and services', 'SAT', 1);

-- Add ISR retention rates (common scenarios)
INSERT OR IGNORE INTO fiscal_parameters (id, parameter_type, period_type, effective_from, effective_to, value, description, source, is_active)
VALUES 
('isr_retention_professional_2025', 'isr_retention', 'permanent', '2025-01-01', NULL, '0.10', 'ISR retention rate for professional services (10%)', 'SAT', 1),
('isr_retention_rent_2025', 'isr_retention', 'permanent', '2025-01-01', NULL, '0.10', 'ISR retention rate for rent income (10%)', 'SAT', 1);

-- Add IVA retention rate (professional services)
INSERT OR IGNORE INTO fiscal_parameters (id, parameter_type, period_type, effective_from, effective_to, value, description, source, is_active)
VALUES 
('iva_retention_professional_2025', 'iva_retention', 'permanent', '2025-01-01', NULL, '0.1067', 'IVA retention rate for professional services (10.67%)', 'SAT', 1);

-- ============================================================================
-- PART 6: Migration Complete
-- ============================================================================

-- This migration adds:
-- 1. 12 new income-specific fields to the transactions table
-- 2. A comprehensive SAT accounts catalog table (Anexo 24)
-- 3. Proper indexes for all new fields
-- 4. Populated SAT accounts catalog with hierarchical structure
-- 5. Updated fiscal parameters with 2025 UMA values and tax rates
