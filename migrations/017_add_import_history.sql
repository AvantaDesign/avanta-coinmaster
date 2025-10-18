-- Migration 017: Add Import History
-- Purpose: Track historical data imports from CSV files and other sources
-- Date: October 2025

-- Create import_history table
CREATE TABLE IF NOT EXISTS import_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    import_date TEXT DEFAULT CURRENT_TIMESTAMP,
    source TEXT NOT NULL CHECK(source IN ('csv_bank_statement', 'manual_entry', 'api_import', 'batch_upload')),
    file_name TEXT,
    period_start TEXT,
    period_end TEXT,
    records_imported INTEGER DEFAULT 0,
    records_duplicated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'processing', 'completed', 'failed')),
    metadata TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Create indexes for import_history
CREATE INDEX IF NOT EXISTS idx_import_history_user_id ON import_history(user_id);
CREATE INDEX IF NOT EXISTS idx_import_history_status ON import_history(status);
CREATE INDEX IF NOT EXISTS idx_import_history_import_date ON import_history(import_date);
CREATE INDEX IF NOT EXISTS idx_import_history_source ON import_history(source);

-- Add import_id to transactions table to track which import created each transaction
ALTER TABLE transactions ADD COLUMN import_id TEXT;

-- Create index for import_id in transactions
CREATE INDEX IF NOT EXISTS idx_transactions_import_id ON transactions(import_id);
