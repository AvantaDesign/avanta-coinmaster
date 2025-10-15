-- Migration: Add classification field (alias for transaction_type)
-- Phase 1: Business vs Personal Classification - Naming Clarification
-- Date: 2025-10-15
-- 
-- IMPORTANT NOTE:
-- The implementation plan (docs/IMPLEMENTATION_PLAN.md) refers to a "classification" field,
-- but the actual implementation uses "transaction_type" field.
-- 
-- This migration creates a VIEW to provide backward compatibility and clarity.
-- Both names refer to the SAME feature: distinguishing business vs personal transactions.
-- 
-- The field was already added in migration 002_add_advanced_transaction_classification.sql
-- This migration is for documentation and compatibility purposes only.

-- Create a view that exposes transaction_type as classification for clarity
-- This allows queries to use either name
CREATE VIEW IF NOT EXISTS transactions_with_classification AS
SELECT 
  id,
  user_id,
  date,
  description,
  amount,
  type,
  category,
  account,
  is_deductible,
  economic_activity,
  receipt_url,
  created_at,
  transaction_type,
  transaction_type as classification,  -- Alias for clarity
  category_id,
  linked_invoice_id,
  notes,
  is_deleted
FROM transactions;

-- Naming Convention Note:
-- Field: transaction_type (in database schema)
-- Values: 'business', 'personal', 'transfer'
-- Purpose: Classification for fiscal calculations
-- 
-- Business transactions: Used for ISR/IVA calculations, deductions
-- Personal transactions: Excluded from fiscal calculations
-- Transfer transactions: Internal transfers between accounts
-- 
-- The term "classification" in the implementation plan and "transaction_type" in the code
-- refer to the same field and serve the same purpose.
