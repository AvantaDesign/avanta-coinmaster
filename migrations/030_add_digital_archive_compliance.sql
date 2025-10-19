-- Migration 030: Add Digital Archive & Compliance System
-- Purpose: Create comprehensive digital archive and compliance monitoring system
-- Phase 23: Digital Archive & Compliance
-- Date: October 2025
-- Author: Avanta Finance Development Team

-- ============================================================================
-- PART 1: Create Digital Archive Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS digital_archive (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    
    -- Document metadata
    document_type TEXT NOT NULL CHECK(document_type IN ('cfdi', 'receipt', 'invoice', 'declaration', 'statement', 'contract', 'report', 'other')),
    document_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER DEFAULT 0,
    mime_type TEXT,
    hash_sha256 TEXT,
    
    -- Document lifecycle
    upload_date TEXT DEFAULT CURRENT_TIMESTAMP,
    expiration_date TEXT,
    retention_period INTEGER DEFAULT 5 CHECK(retention_period >= 1 AND retention_period <= 99),
    
    -- Document classification
    access_level TEXT DEFAULT 'private' CHECK(access_level IN ('public', 'private', 'confidential')),
    tags TEXT,
    metadata TEXT,
    
    -- Document status
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived', 'deleted', 'expired')),
    
    -- Related entities
    related_transaction_id INTEGER,
    related_declaration_id INTEGER,
    
    -- Timestamps
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(related_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 2: Create Compliance Monitoring Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS compliance_monitoring (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    
    -- Compliance metadata
    compliance_type TEXT NOT NULL CHECK(compliance_type IN ('fiscal', 'tax', 'declaration', 'document', 'cfdi', 'retention', 'payment')),
    period_year INTEGER NOT NULL CHECK(period_year >= 2020 AND period_year <= 2100),
    period_month INTEGER CHECK(period_month >= 1 AND period_month <= 12),
    
    -- Compliance scoring
    compliance_score REAL DEFAULT 0 CHECK(compliance_score >= 0 AND compliance_score <= 100),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('compliant', 'warning', 'non_compliant', 'critical', 'pending', 'resolved')),
    
    -- Issues and recommendations
    issues_found TEXT,
    recommendations TEXT,
    
    -- Check scheduling
    last_checked TEXT DEFAULT CURRENT_TIMESTAMP,
    next_check TEXT,
    
    -- Resolution tracking
    resolution_notes TEXT,
    resolved_date TEXT,
    resolved_by INTEGER,
    
    -- Metadata
    metadata TEXT,
    
    -- Timestamps
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(resolved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- PART 3: Create Audit Trail Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    
    -- Action metadata
    action_type TEXT NOT NULL CHECK(action_type IN ('create', 'read', 'update', 'delete', 'export', 'submit', 'approve', 'reject', 'archive', 'restore')),
    entity_type TEXT NOT NULL CHECK(entity_type IN ('transaction', 'cfdi', 'declaration', 'document', 'compliance', 'user', 'configuration', 'report', 'other')),
    entity_id INTEGER,
    
    -- Action details
    action_details TEXT,
    old_values TEXT,
    new_values TEXT,
    
    -- Request context
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    
    -- Security and compliance
    security_level TEXT DEFAULT 'normal' CHECK(security_level IN ('normal', 'elevated', 'critical')),
    compliance_relevant INTEGER DEFAULT 0 CHECK(compliance_relevant IN (0, 1)),
    
    -- Metadata
    metadata TEXT,
    
    -- Timestamp
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- PART 4: Create Indexes for Performance
-- ============================================================================

-- Digital Archive Indexes
CREATE INDEX IF NOT EXISTS idx_digital_archive_user_id ON digital_archive(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_archive_document_type ON digital_archive(document_type);
CREATE INDEX IF NOT EXISTS idx_digital_archive_status ON digital_archive(status);
CREATE INDEX IF NOT EXISTS idx_digital_archive_upload_date ON digital_archive(upload_date);
CREATE INDEX IF NOT EXISTS idx_digital_archive_expiration_date ON digital_archive(expiration_date);
CREATE INDEX IF NOT EXISTS idx_digital_archive_related_transaction ON digital_archive(related_transaction_id);
CREATE INDEX IF NOT EXISTS idx_digital_archive_hash ON digital_archive(hash_sha256);

-- Compliance Monitoring Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_monitoring_user_id ON compliance_monitoring(user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_monitoring_type ON compliance_monitoring(compliance_type);
CREATE INDEX IF NOT EXISTS idx_compliance_monitoring_status ON compliance_monitoring(status);
CREATE INDEX IF NOT EXISTS idx_compliance_monitoring_period ON compliance_monitoring(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_compliance_monitoring_score ON compliance_monitoring(compliance_score);
CREATE INDEX IF NOT EXISTS idx_compliance_monitoring_next_check ON compliance_monitoring(next_check);

-- Audit Trail Indexes
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_action_type ON audit_trail(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_type ON audit_trail(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity_id ON audit_trail(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_trail_security_level ON audit_trail(security_level);
CREATE INDEX IF NOT EXISTS idx_audit_trail_compliance_relevant ON audit_trail(compliance_relevant);

-- ============================================================================
-- PART 5: Create Views for Common Queries
-- ============================================================================

-- View: Active Documents Summary
CREATE VIEW IF NOT EXISTS v_active_documents_summary AS
SELECT 
    user_id,
    document_type,
    COUNT(*) as document_count,
    SUM(file_size) as total_size,
    MIN(upload_date) as oldest_upload,
    MAX(upload_date) as newest_upload
FROM digital_archive
WHERE status = 'active'
GROUP BY user_id, document_type;

-- View: Expiring Documents
CREATE VIEW IF NOT EXISTS v_expiring_documents AS
SELECT 
    id,
    user_id,
    document_name,
    document_type,
    expiration_date,
    CAST((JULIANDAY(expiration_date) - JULIANDAY('now')) AS INTEGER) as days_until_expiration
FROM digital_archive
WHERE status = 'active'
  AND expiration_date IS NOT NULL
  AND expiration_date > date('now')
  AND JULIANDAY(expiration_date) - JULIANDAY('now') <= 30
ORDER BY expiration_date;

-- View: Compliance Status Summary
CREATE VIEW IF NOT EXISTS v_compliance_status_summary AS
SELECT 
    user_id,
    period_year,
    period_month,
    compliance_type,
    status,
    AVG(compliance_score) as avg_score,
    COUNT(*) as check_count,
    SUM(CASE WHEN status = 'compliant' THEN 1 ELSE 0 END) as compliant_count,
    SUM(CASE WHEN status IN ('warning', 'non_compliant', 'critical') THEN 1 ELSE 0 END) as issue_count
FROM compliance_monitoring
GROUP BY user_id, period_year, period_month, compliance_type, status;

-- View: Recent Audit Activities
CREATE VIEW IF NOT EXISTS v_recent_audit_activities AS
SELECT 
    a.id,
    a.user_id,
    a.action_type,
    a.entity_type,
    a.entity_id,
    a.timestamp,
    a.security_level,
    u.email as user_email
FROM audit_trail a
LEFT JOIN users u ON a.user_id = u.id
WHERE a.timestamp >= datetime('now', '-7 days')
ORDER BY a.timestamp DESC;

-- View: Compliance Issues Summary
CREATE VIEW IF NOT EXISTS v_compliance_issues_summary AS
SELECT 
    user_id,
    compliance_type,
    status,
    COUNT(*) as issue_count,
    AVG(compliance_score) as avg_compliance_score,
    MAX(last_checked) as last_check_date
FROM compliance_monitoring
WHERE status IN ('warning', 'non_compliant', 'critical')
  AND (resolved_date IS NULL OR resolved_date = '')
GROUP BY user_id, compliance_type, status
ORDER BY 
    CASE status 
        WHEN 'critical' THEN 1 
        WHEN 'non_compliant' THEN 2 
        WHEN 'warning' THEN 3 
        ELSE 4 
    END;

-- ============================================================================
-- PART 6: Create Triggers for Automatic Updates
-- ============================================================================

-- Trigger: Update timestamp on digital_archive update
CREATE TRIGGER IF NOT EXISTS trg_digital_archive_updated_at
AFTER UPDATE ON digital_archive
FOR EACH ROW
BEGIN
    UPDATE digital_archive 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger: Update timestamp on compliance_monitoring update
CREATE TRIGGER IF NOT EXISTS trg_compliance_monitoring_updated_at
AFTER UPDATE ON compliance_monitoring
FOR EACH ROW
BEGIN
    UPDATE compliance_monitoring 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger: Auto-expire documents
CREATE TRIGGER IF NOT EXISTS trg_auto_expire_documents
AFTER INSERT ON digital_archive
FOR EACH ROW
WHEN NEW.expiration_date IS NOT NULL AND NEW.expiration_date < date('now')
BEGIN
    UPDATE digital_archive 
    SET status = 'expired'
    WHERE id = NEW.id;
END;

-- Trigger: Log document status changes in audit trail
CREATE TRIGGER IF NOT EXISTS trg_audit_document_status_change
AFTER UPDATE OF status ON digital_archive
FOR EACH ROW
WHEN OLD.status != NEW.status
BEGIN
    INSERT INTO audit_trail (
        user_id, 
        action_type, 
        entity_type, 
        entity_id, 
        action_details,
        old_values,
        new_values,
        compliance_relevant
    ) VALUES (
        NEW.user_id,
        'update',
        'document',
        NEW.id,
        'Document status changed from ' || OLD.status || ' to ' || NEW.status,
        json_object('status', OLD.status),
        json_object('status', NEW.status),
        1
    );
END;

-- Trigger: Set next_check date on compliance_monitoring insert
CREATE TRIGGER IF NOT EXISTS trg_set_next_compliance_check
AFTER INSERT ON compliance_monitoring
FOR EACH ROW
WHEN NEW.next_check IS NULL
BEGIN
    UPDATE compliance_monitoring 
    SET next_check = datetime('now', '+30 days')
    WHERE id = NEW.id;
END;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Add migration tracking (if migrations table exists)
INSERT INTO migrations (version, name, applied_at) 
VALUES (30, 'add_digital_archive_compliance', CURRENT_TIMESTAMP)
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='migrations');
