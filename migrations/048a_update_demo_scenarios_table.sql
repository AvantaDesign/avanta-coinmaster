-- ============================================================================
-- MIGRATION 048A: Update Demo Scenarios Table for 3 Levels
-- ============================================================================
-- Phase 46: Integration Testing & Quality Assurance
-- 
-- This migration updates the demo_scenarios table to support 3 scenario types:
-- - excellent (instead of healthy)
-- - regular (new)
-- - struggling (instead of critical)
-- ============================================================================

-- Drop the existing CHECK constraint
DROP TABLE IF EXISTS demo_scenarios_backup;
CREATE TABLE demo_scenarios_backup AS SELECT * FROM demo_scenarios;

-- Recreate the table without the restrictive CHECK constraint
DROP TABLE demo_scenarios;

CREATE TABLE demo_scenarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_name TEXT NOT NULL,
    scenario_type TEXT NOT NULL CHECK (scenario_type IN ('excellent', 'regular', 'struggling')),
    description TEXT NOT NULL,
    business_context TEXT NOT NULL, -- JSON
    financial_state TEXT NOT NULL, -- JSON
    learning_objectives TEXT NOT NULL, -- JSON array
    display_order INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Restore data from backup
INSERT INTO demo_scenarios SELECT * FROM demo_scenarios_backup;
DROP TABLE demo_scenarios_backup;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- Migration 048A completed successfully
-- Updated demo_scenarios table to support 3 scenario types:
-- - excellent (instead of healthy)
-- - regular (new)
-- - struggling (instead of critical)
-- ============================================================================
