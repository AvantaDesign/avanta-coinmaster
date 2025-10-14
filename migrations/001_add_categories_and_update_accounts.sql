-- Migration: Add categories table and update accounts table
-- Date: 2025-10-14
-- Description: Phase 0, Section 3 - Add custom categories and improve accounts

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_active INTEGER DEFAULT 1 CHECK(is_active IN (0, 1)),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Insert default categories
INSERT OR IGNORE INTO categories (name, description, color) VALUES
    ('Servicios Profesionales', 'Ingresos por servicios profesionales', '#10B981'),
    ('Gastos Operativos', 'Gastos generales del negocio', '#EF4444'),
    ('Tecnología', 'Gastos en software y hardware', '#3B82F6'),
    ('Marketing', 'Gastos en publicidad y marketing', '#8B5CF6'),
    ('Transporte', 'Gastos de transporte y gasolina', '#F59E0B');
