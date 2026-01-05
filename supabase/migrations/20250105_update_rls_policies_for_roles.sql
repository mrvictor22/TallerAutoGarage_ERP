-- Migration: Update RLS policies to allow mechanic_lead and technician roles
-- to create and manage orders, owners, and vehicles
-- Date: 2025-01-05
-- Issue: #7 - Revisar y corregir permisos de roles
--
-- IMPORTANT: This migration is SAFE for production data
-- - Only modifies access policies (who can do what)
-- - Does NOT delete any existing data
-- - Does NOT modify table structure

-- ============================================
-- OWNERS TABLE - Update policies
-- ============================================

-- Drop existing insert/update policies for owners
DROP POLICY IF EXISTS "Admin and reception can insert owners" ON owners;
DROP POLICY IF EXISTS "Admin and reception can update owners" ON owners;

-- Create new policies that include mechanic_lead and technician
CREATE POLICY "Authorized roles can insert owners"
  ON owners FOR INSERT TO authenticated
  WITH CHECK (auth.user_role() IN ('admin', 'reception', 'mechanic_lead', 'technician'));

CREATE POLICY "Authorized roles can update owners"
  ON owners FOR UPDATE TO authenticated
  USING (auth.user_role() IN ('admin', 'reception', 'mechanic_lead', 'technician'));

-- Delete policy - only admin can delete (reception keeps delete via owners:* wildcard in frontend)
DROP POLICY IF EXISTS "Admin can delete owners" ON owners;
CREATE POLICY "Admin can delete owners"
  ON owners FOR DELETE TO authenticated
  USING (auth.user_role() = 'admin');

-- ============================================
-- VEHICLES TABLE - Update policies
-- ============================================

-- Drop existing insert/update policies for vehicles
DROP POLICY IF EXISTS "Admin and reception can insert vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admin and reception can update vehicles" ON vehicles;

-- Create new policies that include mechanic_lead and technician
CREATE POLICY "Authorized roles can insert vehicles"
  ON vehicles FOR INSERT TO authenticated
  WITH CHECK (auth.user_role() IN ('admin', 'reception', 'mechanic_lead', 'technician'));

CREATE POLICY "Authorized roles can update vehicles"
  ON vehicles FOR UPDATE TO authenticated
  USING (auth.user_role() IN ('admin', 'reception', 'mechanic_lead', 'technician'));

-- Delete policy - only admin can delete
DROP POLICY IF EXISTS "Admin can delete vehicles" ON vehicles;
CREATE POLICY "Admin can delete vehicles"
  ON vehicles FOR DELETE TO authenticated
  USING (auth.user_role() = 'admin');

-- ============================================
-- ORDERS TABLE - Update policies
-- ============================================

-- Drop existing insert policy for orders
DROP POLICY IF EXISTS "Admin and reception can insert orders" ON orders;

-- Create new policy that includes mechanic_lead and technician
CREATE POLICY "Authorized roles can insert orders"
  ON orders FOR INSERT TO authenticated
  WITH CHECK (auth.user_role() IN ('admin', 'reception', 'mechanic_lead', 'technician'));

-- Update policy - all authenticated users with proper roles can update
DROP POLICY IF EXISTS "Authorized roles can update orders" ON orders;
CREATE POLICY "Authorized roles can update orders"
  ON orders FOR UPDATE TO authenticated
  USING (auth.user_role() IN ('admin', 'reception', 'mechanic_lead', 'technician'));

-- Delete policy - only admin can delete orders
DROP POLICY IF EXISTS "Admin can delete orders" ON orders;
CREATE POLICY "Admin can delete orders"
  ON orders FOR DELETE TO authenticated
  USING (auth.user_role() = 'admin');

-- ============================================
-- VERIFICATION QUERIES (run these to verify)
-- ============================================
--
-- Check policies on owners:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'owners';
--
-- Check policies on vehicles:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'vehicles';
--
-- Check policies on orders:
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'orders';
