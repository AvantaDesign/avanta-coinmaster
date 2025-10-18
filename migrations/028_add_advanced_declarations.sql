-- Migration 028: Add Advanced Declarations (DIOT & Contabilidad Electrónica)
-- Purpose: Create comprehensive SAT declaration management system
-- Date: October 2025

-- ============================================================
-- SAT DECLARATIONS TABLE
-- ============================================================
-- Stores all types of SAT declarations including DIOT and Contabilidad Electrónica
CREATE TABLE IF NOT EXISTS sat_declarations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    declaration_type TEXT NOT NULL CHECK(declaration_type IN ('diot', 'contabilidad_electronica', 'catalogo_cuentas', 'balanza_comprobacion', 'polizas', 'auxiliar_folios')),
    period_year INTEGER NOT NULL CHECK(period_year >= 2020 AND period_year <= 2100),
    period_month INTEGER CHECK(period_month >= 1 AND period_month <= 12),
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'generated', 'submitted', 'accepted', 'rejected', 'error')),
    xml_content TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    submission_date TEXT,
    sat_response TEXT,
    error_message TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- DIOT OPERATIONS TABLE
-- ============================================================
-- Stores detailed operations with third parties for DIOT reporting
CREATE TABLE IF NOT EXISTS diot_operations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    declaration_id INTEGER,
    client_rfc TEXT NOT NULL,
    client_name TEXT NOT NULL,
    operation_type TEXT NOT NULL CHECK(operation_type IN ('purchase', 'sale', 'service', 'rent', 'other')),
    nationality TEXT NOT NULL DEFAULT 'nacional' CHECK(nationality IN ('nacional', 'extranjero')),
    amount REAL NOT NULL DEFAULT 0,
    base_amount REAL NOT NULL DEFAULT 0,
    iva_amount REAL NOT NULL DEFAULT 0,
    iva_rate TEXT CHECK(iva_rate IN ('0', '8', '16', 'exento')),
    currency TEXT DEFAULT 'MXN',
    exchange_rate REAL DEFAULT 1.0,
    operation_date TEXT NOT NULL,
    cfdi_uuid TEXT,
    payment_method TEXT,
    is_exempt BOOLEAN DEFAULT 0,
    is_zero_rate BOOLEAN DEFAULT 0,
    has_cfdi BOOLEAN DEFAULT 0,
    notes TEXT,
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(declaration_id) REFERENCES sat_declarations(id) ON DELETE SET NULL
);

-- ============================================================
-- CONTABILIDAD ELECTRONICA FILES TABLE
-- ============================================================
-- Tracks individual files for Contabilidad Electrónica submissions
CREATE TABLE IF NOT EXISTS contabilidad_electronica_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    declaration_id INTEGER NOT NULL,
    file_type TEXT NOT NULL CHECK(file_type IN ('catalogo_cuentas', 'balanza_comprobacion', 'polizas', 'auxiliar_folios')),
    period_year INTEGER NOT NULL,
    period_month INTEGER,
    xml_content TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    record_count INTEGER DEFAULT 0,
    validation_status TEXT DEFAULT 'pending' CHECK(validation_status IN ('pending', 'valid', 'invalid', 'error')),
    validation_errors TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(declaration_id) REFERENCES sat_declarations(id) ON DELETE CASCADE
);

-- ============================================================
-- INDEXES
-- ============================================================

-- SAT Declarations indexes
CREATE INDEX IF NOT EXISTS idx_sat_declarations_user_id ON sat_declarations(user_id);
CREATE INDEX IF NOT EXISTS idx_sat_declarations_type ON sat_declarations(declaration_type);
CREATE INDEX IF NOT EXISTS idx_sat_declarations_period ON sat_declarations(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_sat_declarations_status ON sat_declarations(status);
CREATE INDEX IF NOT EXISTS idx_sat_declarations_user_period ON sat_declarations(user_id, period_year, period_month);

-- DIOT Operations indexes
CREATE INDEX IF NOT EXISTS idx_diot_operations_user_id ON diot_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_diot_operations_declaration_id ON diot_operations(declaration_id);
CREATE INDEX IF NOT EXISTS idx_diot_operations_rfc ON diot_operations(client_rfc);
CREATE INDEX IF NOT EXISTS idx_diot_operations_date ON diot_operations(operation_date);
CREATE INDEX IF NOT EXISTS idx_diot_operations_type ON diot_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_diot_operations_period ON diot_operations(user_id, operation_date);

-- Contabilidad Electrónica Files indexes
CREATE INDEX IF NOT EXISTS idx_ce_files_user_id ON contabilidad_electronica_files(user_id);
CREATE INDEX IF NOT EXISTS idx_ce_files_declaration_id ON contabilidad_electronica_files(declaration_id);
CREATE INDEX IF NOT EXISTS idx_ce_files_type ON contabilidad_electronica_files(file_type);
CREATE INDEX IF NOT EXISTS idx_ce_files_period ON contabilidad_electronica_files(period_year, period_month);

-- ============================================================
-- VIEWS
-- ============================================================

-- View: Declaration Summary by Period
CREATE VIEW IF NOT EXISTS v_declaration_summary AS
SELECT 
    user_id,
    period_year,
    period_month,
    declaration_type,
    status,
    COUNT(*) as declaration_count,
    MAX(created_at) as last_created,
    MAX(updated_at) as last_updated
FROM sat_declarations
GROUP BY user_id, period_year, period_month, declaration_type, status;

-- View: DIOT Operations Summary
CREATE VIEW IF NOT EXISTS v_diot_operations_summary AS
SELECT 
    d.user_id,
    d.declaration_id,
    d.client_rfc,
    d.client_name,
    d.nationality,
    COUNT(d.id) as operation_count,
    SUM(d.amount) as total_amount,
    SUM(d.base_amount) as total_base,
    SUM(d.iva_amount) as total_iva,
    MIN(d.operation_date) as first_operation,
    MAX(d.operation_date) as last_operation
FROM diot_operations d
GROUP BY d.user_id, d.declaration_id, d.client_rfc, d.client_name, d.nationality;

-- View: Pending Declarations
CREATE VIEW IF NOT EXISTS v_pending_declarations AS
SELECT 
    sd.id,
    sd.user_id,
    sd.declaration_type,
    sd.period_year,
    sd.period_month,
    sd.status,
    sd.created_at,
    sd.updated_at,
    COUNT(ce.id) as file_count
FROM sat_declarations sd
LEFT JOIN contabilidad_electronica_files ce ON sd.id = ce.declaration_id
WHERE sd.status IN ('draft', 'generated', 'error')
GROUP BY sd.id, sd.user_id, sd.declaration_type, sd.period_year, sd.period_month, sd.status, sd.created_at, sd.updated_at;

-- View: Contabilidad Electrónica File Summary
CREATE VIEW IF NOT EXISTS v_ce_file_summary AS
SELECT 
    user_id,
    declaration_id,
    file_type,
    period_year,
    period_month,
    validation_status,
    COUNT(*) as file_count,
    SUM(record_count) as total_records,
    SUM(file_size) as total_size,
    MAX(created_at) as last_created
FROM contabilidad_electronica_files
GROUP BY user_id, declaration_id, file_type, period_year, period_month, validation_status;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: Update sat_declarations updated_at
CREATE TRIGGER IF NOT EXISTS trg_sat_declarations_updated_at
AFTER UPDATE ON sat_declarations
FOR EACH ROW
BEGIN
    UPDATE sat_declarations 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Trigger: Update diot_operations updated_at
CREATE TRIGGER IF NOT EXISTS trg_diot_operations_updated_at
AFTER UPDATE ON diot_operations
FOR EACH ROW
BEGIN
    UPDATE diot_operations 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Trigger: Update contabilidad_electronica_files updated_at
CREATE TRIGGER IF NOT EXISTS trg_ce_files_updated_at
AFTER UPDATE ON contabilidad_electronica_files
FOR EACH ROW
BEGIN
    UPDATE contabilidad_electronica_files 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

-- Trigger: Auto-update declaration status when all files are valid
CREATE TRIGGER IF NOT EXISTS trg_update_declaration_status_on_files
AFTER UPDATE ON contabilidad_electronica_files
FOR EACH ROW
WHEN NEW.validation_status = 'valid'
BEGIN
    UPDATE sat_declarations 
    SET status = 'generated',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.declaration_id
      AND status = 'draft'
      AND NOT EXISTS (
          SELECT 1 FROM contabilidad_electronica_files 
          WHERE declaration_id = NEW.declaration_id 
            AND validation_status != 'valid'
      );
END;
