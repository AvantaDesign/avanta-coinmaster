-- Migration 027: Add Bank Reconciliation
-- Purpose: Enable bank statement import and reconciliation with system transactions
-- Phase 20: Bank Reconciliation
-- Date: 2025-10-18
-- Author: Avanta Finance Development Team

-- ============================================================================
-- PART 1: Create Bank Statements Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS bank_statements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    
    -- Bank account information
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    
    -- Transaction details
    statement_date DATE NOT NULL,
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    balance REAL,
    reference_number TEXT,
    
    -- Transaction type classification
    transaction_type TEXT CHECK(transaction_type IN ('deposit', 'withdrawal', 'transfer', 'fee', 'interest')) DEFAULT 'withdrawal',
    
    -- Import metadata
    import_batch_id TEXT,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_file TEXT,
    
    -- Status tracking
    reconciliation_status TEXT DEFAULT 'unmatched' CHECK(reconciliation_status IN ('unmatched', 'matched', 'verified', 'ignored')),
    
    -- Timestamps
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for efficient querying by user and date
CREATE INDEX IF NOT EXISTS idx_bank_statements_user_date 
ON bank_statements(user_id, transaction_date DESC);

-- Index for efficient querying by import batch
CREATE INDEX IF NOT EXISTS idx_bank_statements_batch 
ON bank_statements(user_id, import_batch_id);

-- Index for efficient querying by reconciliation status
CREATE INDEX IF NOT EXISTS idx_bank_statements_status 
ON bank_statements(user_id, reconciliation_status);

-- Index for efficient amount-based matching
CREATE INDEX IF NOT EXISTS idx_bank_statements_amount 
ON bank_statements(user_id, amount, transaction_date);

-- ============================================================================
-- PART 2: Create Reconciliation Matches Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS reconciliation_matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    
    -- Matched records
    bank_statement_id INTEGER NOT NULL,
    transaction_id INTEGER NOT NULL,
    
    -- Match metadata
    match_type TEXT NOT NULL CHECK(match_type IN ('automatic', 'manual', 'verified', 'suggested')) DEFAULT 'automatic',
    match_confidence REAL DEFAULT 0 CHECK(match_confidence >= 0 AND match_confidence <= 1),
    match_criteria TEXT, -- JSON: {"amount": true, "date": true, "description": 0.85}
    
    -- Match details
    amount_difference REAL DEFAULT 0,
    date_difference INTEGER DEFAULT 0, -- Days difference
    description_similarity REAL, -- 0-1 score
    
    -- Status tracking
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'verified', 'rejected', 'reviewed')) DEFAULT 'pending',
    verified_by TEXT,
    verified_at TIMESTAMP,
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(bank_statement_id) REFERENCES bank_statements(id) ON DELETE CASCADE,
    FOREIGN KEY(transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    
    -- Ensure unique matches (one bank statement can match one transaction)
    UNIQUE(bank_statement_id, transaction_id)
);

-- Index for efficient querying by user and status
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_user_status 
ON reconciliation_matches(user_id, status);

-- Index for efficient querying by bank statement
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_statement 
ON reconciliation_matches(bank_statement_id);

-- Index for efficient querying by transaction
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_transaction 
ON reconciliation_matches(transaction_id);

-- Index for confidence-based sorting
CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_confidence 
ON reconciliation_matches(user_id, match_confidence DESC);

-- ============================================================================
-- PART 3: Create Views for Reconciliation Analysis
-- ============================================================================

-- View for unmatched bank statements
CREATE VIEW IF NOT EXISTS v_unmatched_bank_statements AS
SELECT 
    bs.*,
    COUNT(rm.id) as suggested_match_count
FROM bank_statements bs
LEFT JOIN reconciliation_matches rm ON bs.id = rm.bank_statement_id AND rm.status = 'pending'
WHERE bs.reconciliation_status = 'unmatched'
GROUP BY bs.id
ORDER BY bs.transaction_date DESC;

-- View for unmatched transactions
CREATE VIEW IF NOT EXISTS v_unmatched_transactions AS
SELECT 
    t.*,
    COUNT(rm.id) as suggested_match_count
FROM transactions t
LEFT JOIN reconciliation_matches rm ON t.id = rm.transaction_id AND rm.status = 'pending'
WHERE t.id NOT IN (
    SELECT transaction_id 
    FROM reconciliation_matches 
    WHERE status IN ('verified', 'reviewed')
)
AND t.is_deleted = 0
GROUP BY t.id
ORDER BY t.date DESC;

-- View for reconciliation summary by period
CREATE VIEW IF NOT EXISTS v_reconciliation_summary AS
SELECT 
    user_id,
    strftime('%Y-%m', transaction_date) as period,
    COUNT(*) as total_statements,
    SUM(CASE WHEN reconciliation_status = 'matched' THEN 1 ELSE 0 END) as matched_count,
    SUM(CASE WHEN reconciliation_status = 'verified' THEN 1 ELSE 0 END) as verified_count,
    SUM(CASE WHEN reconciliation_status = 'unmatched' THEN 1 ELSE 0 END) as unmatched_count,
    SUM(CASE WHEN transaction_type = 'deposit' THEN amount ELSE 0 END) as total_deposits,
    SUM(CASE WHEN transaction_type IN ('withdrawal', 'fee') THEN amount ELSE 0 END) as total_withdrawals,
    MIN(balance) as min_balance,
    MAX(balance) as max_balance
FROM bank_statements
GROUP BY user_id, period
ORDER BY period DESC;

-- ============================================================================
-- PART 4: Create Triggers for Automatic Updates
-- ============================================================================

-- Trigger to update bank_statements.updated_at on changes
CREATE TRIGGER IF NOT EXISTS update_bank_statements_timestamp
AFTER UPDATE ON bank_statements
FOR EACH ROW
BEGIN
    UPDATE bank_statements 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger to update reconciliation_matches.updated_at on changes
CREATE TRIGGER IF NOT EXISTS update_reconciliation_matches_timestamp
AFTER UPDATE ON reconciliation_matches
FOR EACH ROW
BEGIN
    UPDATE reconciliation_matches 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger to update bank_statement status when matched
CREATE TRIGGER IF NOT EXISTS update_bank_statement_status_on_match
AFTER INSERT ON reconciliation_matches
FOR EACH ROW
WHEN NEW.status IN ('verified', 'reviewed')
BEGIN
    UPDATE bank_statements 
    SET reconciliation_status = 'matched' 
    WHERE id = NEW.bank_statement_id;
END;

-- Trigger to update bank_statement status when match is verified
CREATE TRIGGER IF NOT EXISTS update_bank_statement_status_on_verify
AFTER UPDATE OF status ON reconciliation_matches
FOR EACH ROW
WHEN NEW.status IN ('verified', 'reviewed') AND OLD.status != NEW.status
BEGIN
    UPDATE bank_statements 
    SET reconciliation_status = 'verified' 
    WHERE id = NEW.bank_statement_id;
END;

-- Trigger to revert bank_statement status when match is rejected
CREATE TRIGGER IF NOT EXISTS revert_bank_statement_status_on_reject
AFTER UPDATE OF status ON reconciliation_matches
FOR EACH ROW
WHEN NEW.status = 'rejected' AND OLD.status != 'rejected'
BEGIN
    UPDATE bank_statements 
    SET reconciliation_status = 'unmatched' 
    WHERE id = NEW.bank_statement_id;
END;

-- ============================================================================
-- PART 5: Insert Default Configuration
-- ============================================================================

-- No default data needed for bank reconciliation tables
-- Users will import their own bank statements

-- ============================================================================
-- Migration Complete
-- ============================================================================
