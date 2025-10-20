-- Migration 039: Add Settings Tables
-- Phase 35: Centralized Settings Panel
-- Created: January 2025

-- ============================================================================
-- USER SETTINGS TABLE
-- ============================================================================
-- Stores user-specific settings and preferences as key-value pairs
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL, -- Stored as JSON string for complex values
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, setting_key)
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Index for faster lookups by setting key
CREATE INDEX IF NOT EXISTS idx_user_settings_key ON user_settings(setting_key);

-- ============================================================================
-- FISCAL CERTIFICATES TABLE
-- ============================================================================
-- Stores fiscal certificates (e.g., Constancia de Situación Fiscal) and OCR analysis
CREATE TABLE IF NOT EXISTS fiscal_certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL, -- Path in R2 storage
    file_size INTEGER, -- Size in bytes
    mime_type TEXT,
    analysis_data TEXT, -- JSON data from OCR analysis
    certificate_type TEXT DEFAULT 'situacion_fiscal', -- Type of certificate
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT, -- Error details if processing failed
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    processed_at TEXT, -- When OCR processing completed
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster lookups by user
CREATE INDEX IF NOT EXISTS idx_fiscal_certificates_user_id ON fiscal_certificates(user_id);

-- Index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_fiscal_certificates_status ON fiscal_certificates(status);

-- Index for faster lookups by certificate type
CREATE INDEX IF NOT EXISTS idx_fiscal_certificates_type ON fiscal_certificates(certificate_type);

-- ============================================================================
-- DEFAULT SETTINGS
-- ============================================================================
-- Insert default settings for existing users
-- This will be skipped if settings already exist due to UNIQUE constraint

-- Default settings structure (will be inserted per-user by the API)
-- Example settings:
-- - theme: 'light' | 'dark' | 'system'
-- - language: 'es' | 'en'
-- - currency: 'MXN' | 'USD'
-- - date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY'
-- - notifications_enabled: true | false
-- - email_notifications: true | false
-- - fiscal_regime: '612' | '621' etc.

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_user_settings_timestamp 
AFTER UPDATE ON user_settings
BEGIN
    UPDATE user_settings 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;
