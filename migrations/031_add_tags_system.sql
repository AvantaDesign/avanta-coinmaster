-- ============================================================================
-- Migration 031: Add Generalized Tags System
-- Phase 27: Advanced Usability Enhancements
-- Description: Implement a flexible metadata/tagging system that can be 
--              linked to multiple entities (polymorphic association)
-- ============================================================================

-- ============================================================================
-- PART 1: Create Tags Table
-- ============================================================================

-- Tags table: Store reusable tags for categorizing various entities
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    category TEXT, -- Optional grouping: 'provider', 'account', 'budget', 'general', etc.
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    usage_count INTEGER DEFAULT 0, -- Track how many times this tag is used
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name) -- Prevent duplicate tag names per user
);

-- ============================================================================
-- PART 2: Create Entity Tags Junction Table (Polymorphic Association)
-- ============================================================================

-- Entity tags junction table: Link tags to any entity type
CREATE TABLE IF NOT EXISTS entity_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id INTEGER NOT NULL,
    entity_type TEXT NOT NULL, -- 'transaction', 'account', 'budget', 'category', 'provider', 'service', 'freelancer'
    entity_id INTEGER NOT NULL, -- The ID of the entity in its respective table
    user_id TEXT NOT NULL, -- Denormalized for faster queries and cascading
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT, -- Track who added the tag
    FOREIGN KEY(tag_id) REFERENCES tags(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE(tag_id, entity_type, entity_id) -- Prevent duplicate tags on same entity
);

-- ============================================================================
-- PART 3: Create Indexes for Performance
-- ============================================================================

-- Tags table indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(user_id, name);
CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);
CREATE INDEX IF NOT EXISTS idx_tags_is_active ON tags(is_active);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

-- Entity tags junction table indexes
CREATE INDEX IF NOT EXISTS idx_entity_tags_tag_id ON entity_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_entity ON entity_tags(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_user_id ON entity_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_tags_created_by ON entity_tags(created_by);
CREATE INDEX IF NOT EXISTS idx_entity_tags_composite ON entity_tags(user_id, entity_type);

-- ============================================================================
-- PART 4: Create Views for Common Queries
-- ============================================================================

-- View: Tag usage summary per user
CREATE VIEW IF NOT EXISTS v_tag_usage_summary AS
SELECT 
    t.id,
    t.user_id,
    t.name,
    t.description,
    t.color,
    t.category,
    t.is_active,
    t.usage_count,
    COUNT(DISTINCT et.id) as actual_usage_count,
    COUNT(DISTINCT et.entity_type) as entity_types_count,
    GROUP_CONCAT(DISTINCT et.entity_type) as used_in_entities,
    t.created_at,
    t.updated_at
FROM tags t
LEFT JOIN entity_tags et ON t.id = et.tag_id
GROUP BY t.id, t.user_id, t.name, t.description, t.color, t.category, t.is_active, t.usage_count, t.created_at, t.updated_at;

-- View: Most popular tags by usage
CREATE VIEW IF NOT EXISTS v_popular_tags AS
SELECT 
    t.id,
    t.user_id,
    t.name,
    t.description,
    t.color,
    t.category,
    COUNT(et.id) as usage_count,
    MAX(et.created_at) as last_used_at
FROM tags t
LEFT JOIN entity_tags et ON t.id = et.tag_id
WHERE t.is_active = 1
GROUP BY t.id, t.user_id, t.name, t.description, t.color, t.category
ORDER BY usage_count DESC;

-- View: Entities by tag (denormalized view for quick lookups)
CREATE VIEW IF NOT EXISTS v_entities_by_tag AS
SELECT 
    et.tag_id,
    t.name as tag_name,
    t.color as tag_color,
    et.entity_type,
    et.entity_id,
    et.user_id,
    et.created_at as tagged_at,
    et.created_by
FROM entity_tags et
JOIN tags t ON et.tag_id = t.id
WHERE t.is_active = 1;

-- View: Unused tags (tags with no associations)
CREATE VIEW IF NOT EXISTS v_unused_tags AS
SELECT 
    t.id,
    t.user_id,
    t.name,
    t.description,
    t.color,
    t.category,
    t.created_at,
    CAST((julianday('now') - julianday(t.created_at)) AS INTEGER) as days_since_creation
FROM tags t
LEFT JOIN entity_tags et ON t.id = et.tag_id
WHERE et.id IS NULL AND t.is_active = 1
ORDER BY t.created_at DESC;

-- ============================================================================
-- PART 5: Create Triggers for Automatic Updates
-- ============================================================================

-- Trigger: Update tags.updated_at on update
CREATE TRIGGER IF NOT EXISTS trg_tags_updated_at
AFTER UPDATE ON tags
FOR EACH ROW
BEGIN
    UPDATE tags 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Trigger: Update tag usage_count when entity_tag is added
CREATE TRIGGER IF NOT EXISTS trg_increment_tag_usage
AFTER INSERT ON entity_tags
FOR EACH ROW
BEGIN
    UPDATE tags 
    SET usage_count = usage_count + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.tag_id;
END;

-- Trigger: Update tag usage_count when entity_tag is removed
CREATE TRIGGER IF NOT EXISTS trg_decrement_tag_usage
AFTER DELETE ON entity_tags
FOR EACH ROW
BEGIN
    UPDATE tags 
    SET usage_count = CASE 
            WHEN usage_count > 0 THEN usage_count - 1 
            ELSE 0 
        END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.tag_id;
END;

-- Trigger: Log tag creation in audit trail (if audit_trail table exists)
CREATE TRIGGER IF NOT EXISTS trg_audit_tag_creation
AFTER INSERT ON tags
FOR EACH ROW
WHEN EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='audit_trail')
BEGIN
    INSERT INTO audit_trail (
        user_id, 
        action_type, 
        entity_type, 
        entity_id, 
        action_details,
        new_values
    ) VALUES (
        NEW.user_id,
        'create',
        'tag',
        NEW.id,
        'Tag created: ' || NEW.name,
        json_object(
            'name', NEW.name,
            'description', NEW.description,
            'color', NEW.color,
            'category', NEW.category
        )
    );
END;

-- Trigger: Log entity tagging in audit trail
CREATE TRIGGER IF NOT EXISTS trg_audit_entity_tagging
AFTER INSERT ON entity_tags
FOR EACH ROW
WHEN EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='audit_trail')
BEGIN
    INSERT INTO audit_trail (
        user_id, 
        action_type, 
        entity_type, 
        entity_id, 
        action_details,
        new_values
    ) VALUES (
        NEW.user_id,
        'tag',
        NEW.entity_type,
        NEW.entity_id,
        'Entity tagged with tag_id: ' || NEW.tag_id,
        json_object(
            'tag_id', NEW.tag_id,
            'entity_type', NEW.entity_type,
            'entity_id', NEW.entity_id
        )
    );
END;

-- ============================================================================
-- PART 6: Sample Data (Optional - for development/testing)
-- ============================================================================

-- Insert some default tag categories for demo user
INSERT OR IGNORE INTO tags (user_id, name, description, color, category)
VALUES 
    ('demo_user_001', 'Importante', 'Elementos de alta prioridad', '#EF4444', 'general'),
    ('demo_user_001', 'Urgente', 'Requiere atención inmediata', '#F97316', 'general'),
    ('demo_user_001', 'Revisión', 'Pendiente de revisión', '#F59E0B', 'general'),
    ('demo_user_001', 'Aprobado', 'Elementos aprobados', '#10B981', 'general'),
    ('demo_user_001', 'Cliente Principal', 'Clientes importantes', '#3B82F6', 'provider'),
    ('demo_user_001', 'Proveedor Recurrente', 'Proveedores frecuentes', '#8B5CF6', 'provider'),
    ('demo_user_001', 'Cuenta Primaria', 'Cuenta bancaria principal', '#06B6D4', 'account'),
    ('demo_user_001', 'Tarjeta Corporativa', 'Tarjetas de uso empresarial', '#EC4899', 'account');

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Add migration tracking (if migrations table exists)
INSERT INTO migrations (version, name, applied_at) 
SELECT 31, 'add_tags_system', CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='migrations')
  AND NOT EXISTS (SELECT 1 FROM migrations WHERE version = 31);
