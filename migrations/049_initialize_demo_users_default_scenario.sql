-- ============================================================================
-- MIGRATION 049: Initialize Demo Users with Default Scenario
-- ============================================================================
-- Phase 47.5: Demo System Initialization & Activation
-- 
-- This migration sets default scenario for existing demo users to ensure
-- DemoBanner shows immediately after login
-- ============================================================================

-- Set default scenario (ID=1 - Negocio Excelente) for all demo users
-- who don't have a current scenario set
UPDATE users 
SET current_demo_scenario_id = 1 
WHERE is_demo = 1 AND current_demo_scenario_id IS NULL;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
-- Migration 049 completed successfully
-- All demo users now have default scenario (Negocio Excelente)
-- DemoBanner will show immediately after demo user login
-- ============================================================================
