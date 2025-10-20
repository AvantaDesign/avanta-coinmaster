PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE user_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT NOT NULL, 
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, setting_key)
);
CREATE TABLE fiscal_certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL, 
    file_size INTEGER, 
    mime_type TEXT,
    analysis_data TEXT, 
    certificate_type TEXT DEFAULT 'situacion_fiscal', 
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT, 
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    processed_at TEXT, 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
DELETE FROM sqlite_sequence;
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_key ON user_settings(setting_key);
CREATE INDEX idx_fiscal_certificates_user_id ON fiscal_certificates(user_id);
CREATE INDEX idx_fiscal_certificates_status ON fiscal_certificates(status);
CREATE INDEX idx_fiscal_certificates_type ON fiscal_certificates(certificate_type);
CREATE TRIGGER update_user_settings_timestamp 
AFTER UPDATE ON user_settings
BEGIN
    UPDATE user_settings 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;