-- Migration: Add archived_at column to orders table
-- Date: 2025-01-05
-- Issue: #6 - Archivar y eliminar órdenes de trabajo
--
-- IMPORTANT: This migration is SAFE for production data
-- - Only adds a new nullable column
-- - Does NOT delete any existing data
-- - Does NOT modify existing columns

-- ============================================
-- ADD ARCHIVED_AT COLUMN
-- ============================================

-- Add archived_at column to orders table (nullable timestamp)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Add archived_by column to track who archived the order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES profiles(id) DEFAULT NULL;

-- Create index for filtering non-archived orders (most common query)
CREATE INDEX IF NOT EXISTS idx_orders_archived_at ON orders(archived_at) WHERE archived_at IS NULL;

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this to verify the columns were added:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'orders' AND column_name IN ('archived_at', 'archived_by');
