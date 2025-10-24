-- ============================================================================
-- Migration 052: Advanced Search & Filtering System - Phase 50
-- ============================================================================
-- Description: Adds comprehensive search, filtering, and tagging infrastructure
-- Phase: 50 - Advanced Search & Filtering Implementation
-- Date: October 24, 2025
-- Dependencies: Phase 49 (Database Optimization)
-- ============================================================================

-- ============================================================================
-- 1. TAGS SYSTEM
-- ============================================================================

-- Tags table - Flexible tagging system for all entities
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    category TEXT, -- Optional category for organization
    is_active INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

-- Entity tags junction table - Links tags to any entity type
CREATE TABLE IF NOT EXISTS entity_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL, -- 'transaction', 'invoice', 'account', etc.
    entity_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_by INTEGER NOT NULL, -- User who applied the tag
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(tag_id, entity_type, entity_id)
);

-- ============================================================================
-- 2. FILTER PRESETS SYSTEM
-- ============================================================================

-- Filter presets table - Save frequently used filter combinations
CREATE TABLE IF NOT EXISTS filter_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    filter_config TEXT NOT NULL, -- JSON configuration of filters
    is_shared INTEGER DEFAULT 0,
    is_favorite INTEGER DEFAULT 0,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 3. SEARCH HISTORY SYSTEM
-- ============================================================================

-- Search history table - Track user searches for suggestions
CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    search_query TEXT NOT NULL,
    entity_type TEXT, -- Filter by entity type
    results_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- 4. FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- FTS5 virtual table for full-text search across transactions
CREATE VIRTUAL TABLE IF NOT EXISTS transactions_fts USING fts5(
    transaction_id UNINDEXED,
    user_id UNINDEXED,
    description,
    notes,
    content='transactions',
    content_rowid='id'
);

-- Populate FTS table with existing transactions
INSERT INTO transactions_fts(transaction_id, user_id, description, notes)
SELECT id, user_id, description, COALESCE(notes, '') FROM transactions;

-- FTS5 virtual table for invoices
CREATE VIRTUAL TABLE IF NOT EXISTS invoices_fts USING fts5(
    invoice_id UNINDEXED,
    user_id UNINDEXED,
    invoice_number,
    description,
    notes,
    content='invoices',
    content_rowid='id'
);

-- Populate FTS table with existing invoices
INSERT INTO invoices_fts(invoice_id, user_id, invoice_number, description, notes)
SELECT id, user_id, invoice_number, description, COALESCE(notes, '') FROM invoices;

-- FTS5 virtual table for accounts
CREATE VIRTUAL TABLE IF NOT EXISTS accounts_fts USING fts5(
    account_id UNINDEXED,
    user_id UNINDEXED,
    name,
    description,
    content='accounts',
    content_rowid='id'
);

-- Populate FTS table with existing accounts
INSERT INTO accounts_fts(account_id, user_id, name, description)
SELECT id, user_id, name, COALESCE(description, '') FROM accounts;

-- ============================================================================
-- 5. PERFORMANCE INDEXES
-- ============================================================================

-- Tags indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_name ON tags(user_id, name);
CREATE INDEX IF NOT EXISTS idx_tags_user_active ON tags(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON tags(usage_count DESC);

-- Entity tags indexes
CREATE INDEX IF NOT EXISTS idx_entity_tags_tag_id ON entity_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_user_id ON entity_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_user_entity ON entity_tags(user_id, entity_type);

-- Filter presets indexes
CREATE INDEX IF NOT EXISTS idx_filter_presets_user_id ON filter_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_filter_presets_user_fav ON filter_presets(user_id, is_favorite);
CREATE INDEX IF NOT EXISTS idx_filter_presets_usage ON filter_presets(usage_count DESC);

-- Search history indexes
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_date ON search_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_query ON search_history(search_query);

-- ============================================================================
-- 6. TRIGGERS FOR FTS SYNCHRONIZATION
-- ============================================================================

-- Trigger to keep transactions FTS in sync
CREATE TRIGGER IF NOT EXISTS transactions_fts_insert AFTER INSERT ON transactions BEGIN
    INSERT INTO transactions_fts(transaction_id, user_id, description, notes)
    VALUES (new.id, new.user_id, new.description, COALESCE(new.notes, ''));
END;

CREATE TRIGGER IF NOT EXISTS transactions_fts_update AFTER UPDATE ON transactions BEGIN
    UPDATE transactions_fts 
    SET description = new.description, notes = COALESCE(new.notes, '')
    WHERE transaction_id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS transactions_fts_delete AFTER DELETE ON transactions BEGIN
    DELETE FROM transactions_fts WHERE transaction_id = old.id;
END;

-- Trigger to keep invoices FTS in sync
CREATE TRIGGER IF NOT EXISTS invoices_fts_insert AFTER INSERT ON invoices BEGIN
    INSERT INTO invoices_fts(invoice_id, user_id, invoice_number, description, notes)
    VALUES (new.id, new.user_id, new.invoice_number, new.description, COALESCE(new.notes, ''));
END;

CREATE TRIGGER IF NOT EXISTS invoices_fts_update AFTER UPDATE ON invoices BEGIN
    UPDATE invoices_fts 
    SET invoice_number = new.invoice_number,
        description = new.description,
        notes = COALESCE(new.notes, '')
    WHERE invoice_id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS invoices_fts_delete AFTER DELETE ON invoices BEGIN
    DELETE FROM invoices_fts WHERE invoice_id = old.id;
END;

-- Trigger to keep accounts FTS in sync
CREATE TRIGGER IF NOT EXISTS accounts_fts_insert AFTER INSERT ON accounts BEGIN
    INSERT INTO accounts_fts(account_id, user_id, name, description)
    VALUES (new.id, new.user_id, new.name, COALESCE(new.description, ''));
END;

CREATE TRIGGER IF NOT EXISTS accounts_fts_update AFTER UPDATE ON accounts BEGIN
    UPDATE accounts_fts 
    SET name = new.name, description = COALESCE(new.description, '')
    WHERE account_id = new.id;
END;

CREATE TRIGGER IF NOT EXISTS accounts_fts_delete AFTER DELETE ON accounts BEGIN
    DELETE FROM accounts_fts WHERE account_id = old.id;
END;

-- Trigger to update tag usage count
CREATE TRIGGER IF NOT EXISTS tag_usage_increment AFTER INSERT ON entity_tags BEGIN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = new.tag_id;
END;

CREATE TRIGGER IF NOT EXISTS tag_usage_decrement AFTER DELETE ON entity_tags BEGIN
    UPDATE tags SET usage_count = usage_count - 1 WHERE id = old.tag_id;
END;

-- Trigger to update filter preset usage count
CREATE TRIGGER IF NOT EXISTS filter_preset_usage_increment AFTER UPDATE ON filter_presets
WHEN new.usage_count > old.usage_count BEGIN
    UPDATE filter_presets SET updated_at = CURRENT_TIMESTAMP WHERE id = new.id;
END;

-- ============================================================================
-- 7. VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for popular tags by user
CREATE VIEW IF NOT EXISTS v_popular_tags AS
SELECT 
    t.id,
    t.user_id,
    t.name,
    t.description,
    t.color,
    t.category,
    t.usage_count,
    COUNT(DISTINCT et.entity_id) as entity_count,
    MAX(et.created_at) as last_used
FROM tags t
LEFT JOIN entity_tags et ON t.id = et.tag_id
WHERE t.is_active = 1
GROUP BY t.id
ORDER BY t.usage_count DESC, t.name ASC;

-- View for unused tags
CREATE VIEW IF NOT EXISTS v_unused_tags AS
SELECT 
    t.id,
    t.user_id,
    t.name,
    t.description,
    t.color,
    t.created_at,
    CAST((julianday('now') - julianday(t.created_at)) AS INTEGER) as days_since_creation
FROM tags t
LEFT JOIN entity_tags et ON t.id = et.tag_id
WHERE t.is_active = 1 AND et.id IS NULL
ORDER BY t.created_at DESC;

-- View for recent searches
CREATE VIEW IF NOT EXISTS v_recent_searches AS
SELECT 
    user_id,
    search_query,
    entity_type,
    COUNT(*) as search_count,
    MAX(created_at) as last_searched,
    AVG(results_count) as avg_results
FROM search_history
GROUP BY user_id, search_query, entity_type
ORDER BY last_searched DESC;

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify tables were created
SELECT 
    'Migration 052 Complete - Tables Created:' as status,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN (
        'tags', 'entity_tags', 'filter_presets', 'search_history'
    )) as new_tables,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name LIKE '%_fts') as fts_tables,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%') as total_indexes,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='trigger') as total_triggers,
    (SELECT COUNT(*) FROM sqlite_master WHERE type='view' AND name LIKE 'v_%') as total_views;
