-- Migration 021: Add Audit Logging
-- Description: Create audit_log table to track all important user actions for security and compliance

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL, -- e.g., 'create_transaction', 'delete_account', 'update_fiscal_settings'
    entity_type TEXT, -- e.g., 'transaction', 'account', 'receipt', 'declaration'
    entity_id TEXT, -- ID of the affected entity
    action_details TEXT, -- JSON with detailed information
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    severity TEXT DEFAULT 'low' CHECK(severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT DEFAULT 'success' CHECK(status IN ('success', 'failed', 'partial')),
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON audit_log(entity_id);
