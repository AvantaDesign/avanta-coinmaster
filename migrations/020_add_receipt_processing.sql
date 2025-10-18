-- Migration 020: Receipt Processing System
-- Add tables and indexes for receipt upload and OCR processing

-- Receipts table: Store receipt metadata and OCR results
CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL, -- R2 storage path
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    ocr_status TEXT NOT NULL DEFAULT 'pending' CHECK(ocr_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    ocr_text TEXT, -- Raw extracted text from OCR
    extracted_data TEXT, -- JSON with structured data (amount, date, merchant, etc.)
    confidence_score REAL, -- OCR confidence score (0-1)
    transaction_id INTEGER, -- FK to transactions table if linked
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_ocr_status ON receipts(ocr_status);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts(created_at);
CREATE INDEX IF NOT EXISTS idx_receipts_transaction_id ON receipts(transaction_id);

-- Add receipt_id column to transactions table for reverse lookup
-- Note: This is optional as we already have transaction_id in receipts table
-- But it helps with bidirectional relationships
ALTER TABLE transactions ADD COLUMN receipt_id TEXT REFERENCES receipts(id) ON DELETE SET NULL;

-- Create index for the new column
CREATE INDEX IF NOT EXISTS idx_transactions_receipt_id ON transactions(receipt_id);
