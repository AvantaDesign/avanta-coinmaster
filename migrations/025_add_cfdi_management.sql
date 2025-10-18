-- Migration 025: Add CFDI Control & Validation Module
-- Purpose: Create comprehensive CFDI metadata table for managing and validating CFDI XML files
-- Phase 18: CFDI Control & Validation Module
-- Date: 2025-10-18
-- Author: Avanta Finance Development Team

-- ============================================================================
-- PART 1: Create CFDI Metadata Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS cfdi_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Core CFDI Identifiers
    uuid TEXT NOT NULL UNIQUE,  -- CFDI UUID (Folio Fiscal) - 36 characters
    
    -- Classification
    type TEXT NOT NULL CHECK(type IN ('issued', 'received')),  -- Issued by user or received from provider
    status TEXT NOT NULL DEFAULT 'Pending Validation' CHECK(status IN (
        'Pending Validation',
        'Valid',
        'Invalid RFC',
        'Canceled',
        'Error'
    )),
    
    -- Emisor & Receptor Information
    emitter_rfc TEXT NOT NULL,
    emitter_name TEXT,
    receiver_rfc TEXT NOT NULL,
    receiver_name TEXT,
    
    -- Amounts
    total_amount REAL NOT NULL,
    subtotal REAL NOT NULL,
    iva_amount REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    
    -- Additional Tax Information
    isr_retention REAL DEFAULT 0,
    iva_retention REAL DEFAULT 0,
    
    -- Dates
    issue_date TEXT NOT NULL,  -- Fecha de emisión
    payment_date TEXT,  -- Fecha de cobro/pago efectivo
    stamp_date TEXT,  -- Fecha de timbrado
    
    -- Payment Information
    payment_method TEXT,  -- PUE, PPD
    payment_form TEXT,  -- 01, 02, 03, etc.
    
    -- Currency
    currency TEXT DEFAULT 'MXN',
    exchange_rate REAL DEFAULT 1.0,
    
    -- CFDI Details
    serie TEXT,
    folio TEXT,
    cfdi_type TEXT,  -- I = Ingreso, E = Egreso, T = Traslado, P = Pago, N = Nómina
    cfdi_version TEXT,  -- 3.3, 4.0
    
    -- Uso del CFDI
    uso_cfdi TEXT,  -- G01, G02, G03, etc.
    
    -- Storage
    xml_content TEXT,  -- Full XML content for reference
    xml_url TEXT,  -- R2 storage URL if uploaded
    
    -- Transaction Linking
    linked_transaction_id INTEGER,
    auto_matched INTEGER DEFAULT 0 CHECK(auto_matched IN (0, 1)),  -- Was it auto-matched or manually linked?
    
    -- Validation
    validation_errors TEXT,  -- JSON array of validation errors
    validation_date TEXT,
    
    -- Metadata
    user_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(linked_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 2: Create Indexes for CFDI Metadata
-- ============================================================================

-- Primary query indexes
CREATE INDEX IF NOT EXISTS idx_cfdi_metadata_user_id ON cfdi_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_cfdi_metadata_uuid ON cfdi_metadata(uuid);
CREATE INDEX IF NOT EXISTS idx_cfdi_metadata_type ON cfdi_metadata(type);
CREATE INDEX IF NOT EXISTS idx_cfdi_metadata_status ON cfdi_metadata(status);

-- Date-based queries
CREATE INDEX IF NOT EXISTS idx_cfdi_metadata_issue_date ON cfdi_metadata(issue_date);
CREATE INDEX IF NOT EXISTS idx_cfdi_metadata_payment_date ON cfdi_metadata(payment_date);

-- RFC-based queries
CREATE INDEX IF NOT EXISTS idx_cfdi_metadata_emitter_rfc ON cfdi_metadata(emitter_rfc);
CREATE INDEX IF NOT EXISTS idx_cfdi_metadata_receiver_rfc ON cfdi_metadata(receiver_rfc);

-- Transaction linking queries
CREATE INDEX IF NOT EXISTS idx_cfdi_metadata_linked_transaction_id ON cfdi_metadata(linked_transaction_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_cfdi_metadata_user_type_status ON cfdi_metadata(user_id, type, status);
CREATE INDEX IF NOT EXISTS idx_cfdi_metadata_user_issue_date ON cfdi_metadata(user_id, issue_date DESC);

-- ============================================================================
-- PART 3: Create CFDI Duplicate Detection View
-- ============================================================================

-- View to help identify potential duplicate CFDIs
CREATE VIEW IF NOT EXISTS cfdi_duplicates AS
SELECT 
    c1.id as cfdi_id,
    c1.uuid,
    c1.user_id,
    c1.type,
    c1.status,
    c1.created_at,
    COUNT(*) OVER (PARTITION BY c1.user_id, c1.uuid) as duplicate_count
FROM cfdi_metadata c1
WHERE status != 'Canceled';

-- ============================================================================
-- PART 4: Create CFDI Unlinked View
-- ============================================================================

-- View to identify CFDIs that are not linked to transactions
CREATE VIEW IF NOT EXISTS cfdi_unlinked AS
SELECT 
    id,
    uuid,
    user_id,
    type,
    status,
    emitter_rfc,
    receiver_rfc,
    total_amount,
    issue_date,
    payment_date,
    created_at
FROM cfdi_metadata
WHERE linked_transaction_id IS NULL
    AND status IN ('Valid', 'Pending Validation')
ORDER BY issue_date DESC;

-- ============================================================================
-- PART 5: Create Trigger to Update updated_at
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS update_cfdi_metadata_timestamp
AFTER UPDATE ON cfdi_metadata
FOR EACH ROW
BEGIN
    UPDATE cfdi_metadata 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- ============================================================================
-- PART 6: Migration Complete
-- ============================================================================

-- This migration adds:
-- 1. Comprehensive cfdi_metadata table with all required fields
-- 2. Proper indexes for efficient querying
-- 3. Views for duplicate detection and unlinked CFDIs
-- 4. Triggers for automatic timestamp updates
-- 5. Foreign key relationships with users and transactions
