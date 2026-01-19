-- Migration: Allow mechanic_lead role to manage payments
-- Date: 2026-01-19
-- Issue: Bug reported by Max Cartagena - mechanic_lead cannot register payments
-- Error: "new row violates row-level security policy for table payments"
--
-- IMPORTANT: This migration is SAFE for production data
-- - Only modifies access policies (who can do what)
-- - Does NOT delete any existing data
-- - Does NOT modify table structure

-- ============================================
-- PAYMENTS TABLE - Update policy
-- ============================================

-- Drop existing policy that only allows admin and reception
DROP POLICY IF EXISTS "Admin and reception can manage payments" ON payments;

-- Create new policy that includes mechanic_lead
CREATE POLICY "Authorized roles can manage payments"
  ON payments FOR ALL TO authenticated
  USING (public.user_role() IN ('admin', 'reception', 'mechanic_lead'))
  WITH CHECK (public.user_role() IN ('admin', 'reception', 'mechanic_lead'));

-- ============================================
-- VERIFICATION QUERIES (run these to verify)
-- ============================================
--
-- Check policies on payments:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'payments';
