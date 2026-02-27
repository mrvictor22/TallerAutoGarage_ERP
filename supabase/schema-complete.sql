-- ============================================
-- GARAGE MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- VERSION COMPLETA ACTUALIZADA
-- Fecha: 2026-01-23
-- ============================================
-- Este script incluye el esquema base + todas las migraciones
-- Listo para ejecutar en un nuevo proyecto de Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- User roles (incluye mechanic_lead)
CREATE TYPE user_role AS ENUM ('admin', 'reception', 'mechanic_lead', 'technician');

-- Owner types
CREATE TYPE owner_type AS ENUM ('person', 'company');

-- Order status
CREATE TYPE order_status AS ENUM (
  'new',
  'diagnosis',
  'waiting_approval',
  'approved',
  'in_progress',
  'waiting_parts',
  'quality_check',
  'ready',
  'delivered',
  'cancelled'
);

-- Budget line type
CREATE TYPE budget_line_type AS ENUM ('labor', 'parts');

-- Message status
CREATE TYPE message_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');

-- Timeline entry type
CREATE TYPE timeline_entry_type AS ENUM (
  'note',
  'task',
  'diagnosis',
  'labor',
  'parts_purchase',
  'status_change',
  'message_sent',
  'payment',
  'photo_added'
);

-- Payment method
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'check', 'credit');

-- Payment status
CREATE TYPE payment_status AS ENUM ('pending', 'partial', 'paid', 'refunded');

-- Notification type
CREATE TYPE notification_type AS ENUM (
  'order_created',
  'order_status_changed',
  'budget_approved',
  'budget_missing',
  'payment_received',
  'payment_reminder',
  'order_ready',
  'order_stalled',
  'vehicle_ready',
  'whatsapp_failed'
);

-- ============================================
-- TABLES
-- ============================================

-- Workshop configuration (single row table)
CREATE TABLE workshop_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  tax_id VARCHAR(50),
  tax_regime VARCHAR(50) DEFAULT 'general',
  currency VARCHAR(10) DEFAULT 'USD',
  logo_url TEXT,
  business_hours JSONB DEFAULT '{"open": "08:00", "close": "17:00", "workingDays": [1,2,3,4,5,6]}',
  order_prefix VARCHAR(10) DEFAULT 'ORD',
  order_counter INTEGER DEFAULT 0,
  whatsapp_enabled BOOLEAN DEFAULT false,
  whatsapp_business_number VARCHAR(50),
  whatsapp_api_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (linked to Supabase auth.users via id)
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'technician',
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Owners (customers)
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type owner_type NOT NULL DEFAULT 'person',
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  phone_secondary VARCHAR(50),
  whatsapp_consent BOOLEAN DEFAULT false,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  tax_id VARCHAR(50),
  company_name VARCHAR(255),
  contact_person VARCHAR(255),
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  total_spent DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  plate VARCHAR(20) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  vin VARCHAR(50),
  color VARCHAR(50),
  engine VARCHAR(100),
  transmission VARCHAR(50),
  fuel_type VARCHAR(50),
  mileage INTEGER,
  last_service_date DATE,
  notes TEXT,
  photos TEXT[] DEFAULT '{}',
  body_type VARCHAR(20) DEFAULT 'sedan',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plate)
);

-- Service orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folio VARCHAR(50) NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES owners(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  status order_status NOT NULL DEFAULT 'new',
  technician_id UUID REFERENCES profiles(id),

  -- Entry information
  entry_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  entry_mileage INTEGER,
  fuel_level INTEGER CHECK (fuel_level >= 0 AND fuel_level <= 100),
  reason TEXT NOT NULL,
  customer_complaints TEXT,
  entry_photos TEXT[] DEFAULT '{}',
  entry_signature TEXT,

  -- Dates
  estimated_completion DATE,
  commitment_date DATE,
  actual_completion TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,

  -- Diagnosis
  diagnosis TEXT,
  diagnosis_date TIMESTAMPTZ,
  diagnosed_by UUID REFERENCES profiles(id),

  -- Approval
  budget_approved BOOLEAN DEFAULT false,
  budget_approved_at TIMESTAMPTZ,
  budget_approved_by VARCHAR(255),
  approval_signature TEXT,

  -- Totals (calculated)
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,

  -- Payment
  payment_status payment_status DEFAULT 'pending',
  amount_paid DECIMAL(12,2) DEFAULT 0,

  -- Exit information
  exit_mileage INTEGER,
  exit_photos TEXT[] DEFAULT '{}',
  exit_signature TEXT,

  -- Inspection data (JSONB)
  inspection_data JSONB DEFAULT NULL,
  vehicle_body_type VARCHAR(20) DEFAULT NULL,

  -- Archive (soft delete)
  archived_at TIMESTAMPTZ DEFAULT NULL,
  archived_by UUID REFERENCES profiles(id) DEFAULT NULL,

  -- Metadata
  priority INTEGER DEFAULT 0,
  internal_notes TEXT,
  attachments TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget lines (labor and parts for each order)
CREATE TABLE budget_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type budget_line_type NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  approved BOOLEAN DEFAULT false,

  -- For parts tracking
  part_number VARCHAR(100),
  supplier VARCHAR(255),
  cost_price DECIMAL(12,2),

  sort_order INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parts invoices (supplier invoices for parts)
CREATE TABLE parts_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  budget_line_id UUID REFERENCES budget_lines(id),
  supplier VARCHAR(255) NOT NULL,
  invoice_number VARCHAR(100),
  invoice_date DATE,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  file_urls TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timeline entries (activity log for orders)
CREATE TABLE timeline_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  type timeline_entry_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,

  -- For labor entries
  time_spent_minutes INTEGER,

  -- For status changes
  old_status order_status,
  new_status order_status,

  -- Metadata
  attachments TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Checklist for tasks
  checklist JSONB DEFAULT '[]',

  author_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  payment_method payment_method NOT NULL,
  reference_number VARCHAR(100),
  notes TEXT,
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  received_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp templates
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  language VARCHAR(10) DEFAULT 'es',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp messages
CREATE TABLE whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES owners(id),
  template_id UUID REFERENCES whatsapp_templates(id),
  phone_number VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  status message_status DEFAULT 'pending',
  external_id VARCHAR(255),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Expense categories
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- General expenses (not tied to orders)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES expense_categories(id),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  expense_date DATE NOT NULL,
  payment_method payment_method,
  reference_number VARCHAR(100),
  file_urls TEXT[] DEFAULT '{}',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES profiles(id),
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_owners_phone ON owners(phone);
CREATE INDEX idx_owners_email ON owners(email);
CREATE INDEX idx_owners_name ON owners(name);
CREATE INDEX idx_owners_created_at ON owners(created_at DESC);

CREATE INDEX idx_vehicles_owner_id ON vehicles(owner_id);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_vehicles_brand_model ON vehicles(brand, model);

CREATE INDEX idx_orders_owner_id ON orders(owner_id);
CREATE INDEX idx_orders_vehicle_id ON orders(vehicle_id);
CREATE INDEX idx_orders_technician_id ON orders(technician_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_folio ON orders(folio);
CREATE INDEX idx_orders_entry_date ON orders(entry_date DESC);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_archived_at ON orders(archived_at) WHERE archived_at IS NULL;

CREATE INDEX idx_budget_lines_order_id ON budget_lines(order_id);
CREATE INDEX idx_timeline_entries_order_id ON timeline_entries(order_id);
CREATE INDEX idx_timeline_entries_created_at ON timeline_entries(created_at DESC);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_parts_invoices_order_id ON parts_invoices(order_id);

CREATE INDEX idx_whatsapp_messages_owner_id ON whatsapp_messages(owner_id);
CREATE INDEX idx_whatsapp_messages_order_id ON whatsapp_messages(order_id);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate order folio
CREATE OR REPLACE FUNCTION generate_order_folio()
RETURNS TRIGGER AS $$
DECLARE
  config_record workshop_config%ROWTYPE;
  new_counter INTEGER;
  year_str VARCHAR(4);
BEGIN
  -- Get workshop config
  SELECT * INTO config_record FROM workshop_config LIMIT 1;

  -- If no config exists, use defaults
  IF config_record IS NULL THEN
    new_counter := 1;
    NEW.folio := 'ORD-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(new_counter::TEXT, 5, '0');
  ELSE
    -- Increment counter
    new_counter := config_record.order_counter + 1;
    year_str := TO_CHAR(NOW(), 'YYYY');
    NEW.folio := config_record.order_prefix || '-' || year_str || '-' || LPAD(new_counter::TEXT, 5, '0');

    -- Update counter
    UPDATE workshop_config SET order_counter = new_counter, updated_at = NOW() WHERE id = config_record.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate budget line totals
CREATE OR REPLACE FUNCTION calculate_budget_line_totals()
RETURNS TRIGGER AS $$
BEGIN
  NEW.subtotal := NEW.quantity * NEW.unit_price;
  NEW.tax_amount := NEW.subtotal * (NEW.tax_rate / 100);
  NEW.total := NEW.subtotal + NEW.tax_amount - (NEW.subtotal * (NEW.discount_percent / 100));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update order totals
CREATE OR REPLACE FUNCTION update_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  order_subtotal DECIMAL(12,2);
  order_tax DECIMAL(12,2);
  order_discount DECIMAL(12,2);
  order_total DECIMAL(12,2);
BEGIN
  -- Calculate totals from budget lines
  SELECT
    COALESCE(SUM(subtotal), 0),
    COALESCE(SUM(tax_amount), 0),
    COALESCE(SUM(subtotal * discount_percent / 100), 0),
    COALESCE(SUM(total), 0)
  INTO order_subtotal, order_tax, order_discount, order_total
  FROM budget_lines
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);

  -- Update order
  UPDATE orders
  SET
    subtotal = order_subtotal,
    tax_amount = order_tax,
    discount_amount = order_discount,
    total = order_total,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update payment status
CREATE OR REPLACE FUNCTION update_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  total_paid DECIMAL(12,2);
  order_total DECIMAL(12,2);
BEGIN
  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payments
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);

  -- Get order total
  SELECT total INTO order_total
  FROM orders
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  -- Update order payment status
  UPDATE orders
  SET
    amount_paid = total_paid,
    payment_status = CASE
      WHEN total_paid >= order_total THEN 'paid'::payment_status
      WHEN total_paid > 0 THEN 'partial'::payment_status
      ELSE 'pending'::payment_status
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update owner stats
CREATE OR REPLACE FUNCTION update_owner_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update owner total orders and total spent
  UPDATE owners
  SET
    total_orders = (SELECT COUNT(*) FROM orders WHERE owner_id = COALESCE(NEW.owner_id, OLD.owner_id)),
    total_spent = (SELECT COALESCE(SUM(amount_paid), 0) FROM orders WHERE owner_id = COALESCE(NEW.owner_id, OLD.owner_id) AND payment_status IN ('paid', 'partial')),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.owner_id, OLD.owner_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update vehicle last service date
CREATE OR REPLACE FUNCTION update_vehicle_service_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    UPDATE vehicles
    SET
      last_service_date = CURRENT_DATE,
      mileage = COALESCE(NEW.exit_mileage, NEW.entry_mileage, mileage),
      updated_at = NOW()
    WHERE id = NEW.vehicle_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'technician')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get user role (in public schema)
CREATE OR REPLACE FUNCTION public.user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is admin (in public schema)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================
-- NOTIFICATION HELPER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type notification_type,
  p_title VARCHAR(255),
  p_message TEXT,
  p_link VARCHAR(255) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Generate folio on order insert
CREATE TRIGGER trigger_generate_order_folio
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.folio IS NULL OR NEW.folio = '')
  EXECUTE FUNCTION generate_order_folio();

-- Calculate budget line totals
CREATE TRIGGER trigger_calculate_budget_line_totals
  BEFORE INSERT OR UPDATE ON budget_lines
  FOR EACH ROW
  EXECUTE FUNCTION calculate_budget_line_totals();

-- Update order totals when budget lines change
CREATE TRIGGER trigger_update_order_totals
  AFTER INSERT OR UPDATE OR DELETE ON budget_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_order_totals();

-- Update payment status when payments change
CREATE TRIGGER trigger_update_payment_status
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_status();

-- Update owner stats when orders change
CREATE TRIGGER trigger_update_owner_stats
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_owner_stats();

-- Update vehicle service date when order delivered
CREATE TRIGGER trigger_update_vehicle_service_date
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_service_date();

-- Create profile on user signup (requires auth schema access)
-- NOTE: Run this separately if you have auth schema access:
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_new_user();

-- Updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_owners_updated_at BEFORE UPDATE ON owners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budget_lines_updated_at BEFORE UPDATE ON budget_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workshop_config_updated_at BEFORE UPDATE ON workshop_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- NOTIFICATION TRIGGERS
-- ============================================

-- Trigger: Nueva orden creada
CREATE OR REPLACE FUNCTION notify_order_created()
RETURNS TRIGGER AS $$
DECLARE
  v_user_ids UUID[];
  v_user_id UUID;
BEGIN
  SELECT ARRAY_AGG(id) INTO v_user_ids
  FROM profiles
  WHERE role IN ('admin', 'reception') AND is_active = true;

  IF v_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      PERFORM create_notification(
        v_user_id,
        'order_created'::notification_type,
        'Nueva orden creada',
        'Se ha creado la orden ' || NEW.folio,
        '/es/ordenes/' || NEW.id,
        jsonb_build_object('order_id', NEW.id, 'folio', NEW.folio)
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_created();

-- Trigger: Cambio de estado en orden
CREATE OR REPLACE FUNCTION notify_order_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_users UUID[];
  v_user_id UUID;
  v_status_label VARCHAR(50);
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    v_status_label := CASE NEW.status
      WHEN 'new' THEN 'Nuevo'
      WHEN 'diagnosis' THEN 'Diagnostico'
      WHEN 'waiting_approval' THEN 'Esperando Aprobacion'
      WHEN 'approved' THEN 'Aprobado'
      WHEN 'in_progress' THEN 'En Proceso'
      WHEN 'waiting_parts' THEN 'Esperando Repuestos'
      WHEN 'quality_check' THEN 'Control de Calidad'
      WHEN 'ready' THEN 'Listo para Entrega'
      WHEN 'delivered' THEN 'Entregado'
      WHEN 'cancelled' THEN 'Cancelado'
      ELSE NEW.status::VARCHAR
    END;

    SELECT ARRAY_AGG(DISTINCT id) INTO v_notification_users
    FROM profiles
    WHERE (
      id = NEW.technician_id
      OR id = NEW.created_by
      OR role IN ('admin', 'mechanic_lead')
    )
    AND is_active = true
    AND id IS NOT NULL;

    IF v_notification_users IS NOT NULL THEN
      FOREACH v_user_id IN ARRAY v_notification_users
      LOOP
        PERFORM create_notification(
          v_user_id,
          'order_status_changed'::notification_type,
          'Cambio de estado en orden',
          'La orden ' || NEW.folio || ' cambio a ' || v_status_label,
          '/es/ordenes/' || NEW.id,
          jsonb_build_object(
            'order_id', NEW.id,
            'folio', NEW.folio,
            'old_status', OLD.status,
            'new_status', NEW.status
          )
        );
      END LOOP;
    END IF;

    IF NEW.status IN ('quality_check', 'ready') AND NEW.payment_status != 'paid' THEN
      SELECT ARRAY_AGG(DISTINCT id) INTO v_notification_users
      FROM profiles
      WHERE role IN ('admin', 'reception') AND is_active = true;

      IF v_notification_users IS NOT NULL THEN
        FOREACH v_user_id IN ARRAY v_notification_users
        LOOP
          PERFORM create_notification(
            v_user_id,
            'payment_reminder'::notification_type,
            'Recordatorio: Registrar pago',
            'La orden ' || NEW.folio || ' esta en ' || v_status_label || '. Pendiente de pago.',
            '/es/ordenes/' || NEW.id || '?tab=pagos',
            jsonb_build_object(
              'order_id', NEW.id,
              'folio', NEW.folio,
              'status', NEW.status,
              'payment_status', NEW.payment_status
            )
          );
        END LOOP;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_status_changed
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_changed();

-- Trigger: Pago recibido
CREATE OR REPLACE FUNCTION notify_payment_received()
RETURNS TRIGGER AS $$
DECLARE
  v_order RECORD;
  v_user_ids UUID[];
  v_user_id UUID;
BEGIN
  SELECT folio INTO v_order FROM orders WHERE id = NEW.order_id;

  SELECT ARRAY_AGG(id) INTO v_user_ids
  FROM profiles
  WHERE role IN ('admin', 'reception') AND is_active = true;

  IF v_user_ids IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY v_user_ids
    LOOP
      PERFORM create_notification(
        v_user_id,
        'payment_received'::notification_type,
        'Pago recibido',
        'Se recibio un pago de $' || NEW.amount || ' para la orden ' || v_order.folio,
        '/es/ordenes/' || NEW.order_id || '?tab=pagos',
        jsonb_build_object(
          'order_id', NEW.order_id,
          'payment_id', NEW.id,
          'amount', NEW.amount,
          'folio', v_order.folio
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_payment_received
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();

-- Trigger: Mensaje WhatsApp fallido
CREATE OR REPLACE FUNCTION notify_whatsapp_failed()
RETURNS TRIGGER AS $$
DECLARE
  v_order RECORD;
  v_creator_id UUID;
BEGIN
  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    v_creator_id := NEW.created_by;

    IF v_creator_id IS NOT NULL THEN
      SELECT folio INTO v_order FROM orders WHERE id = NEW.order_id;

      PERFORM create_notification(
        v_creator_id,
        'whatsapp_failed'::notification_type,
        'Error en mensaje WhatsApp',
        'Fallo el envio del mensaje a ' || NEW.phone_number ||
          COALESCE(' (Orden: ' || v_order.folio || ')', ''),
        CASE WHEN NEW.order_id IS NOT NULL
          THEN '/es/ordenes/' || NEW.order_id || '?tab=whatsapp'
          ELSE '/es/notificaciones/whatsapp'
        END,
        jsonb_build_object(
          'message_id', NEW.id,
          'order_id', NEW.order_id,
          'error', NEW.error_message
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_whatsapp_failed
  AFTER UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_whatsapp_failed();

-- Trigger: Presupuesto sin lineas
CREATE OR REPLACE FUNCTION notify_budget_missing()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_count INTEGER;
  v_notification_users UUID[];
  v_user_id UUID;
  v_status_label VARCHAR(50);
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status
     AND NEW.status IN ('diagnosis', 'in_progress', 'waiting_approval', 'approved') THEN

    SELECT COUNT(*) INTO v_budget_count
    FROM budget_lines
    WHERE order_id = NEW.id;

    IF v_budget_count = 0 THEN
      v_status_label := CASE NEW.status
        WHEN 'diagnosis' THEN 'Diagnostico'
        WHEN 'in_progress' THEN 'En Proceso'
        WHEN 'waiting_approval' THEN 'Esperando Aprobacion'
        WHEN 'approved' THEN 'Aprobado'
        ELSE NEW.status::VARCHAR
      END;

      SELECT ARRAY_AGG(DISTINCT id) INTO v_notification_users
      FROM profiles
      WHERE (
        id = NEW.technician_id
        OR id = NEW.created_by
        OR role IN ('admin', 'mechanic_lead', 'reception')
      )
      AND is_active = true
      AND id IS NOT NULL;

      IF v_notification_users IS NOT NULL THEN
        FOREACH v_user_id IN ARRAY v_notification_users
        LOOP
          PERFORM create_notification(
            v_user_id,
            'budget_missing'::notification_type,
            'Presupuesto sin registrar',
            'La orden ' || NEW.folio || ' esta en ' || v_status_label || ' pero no tiene lineas de presupuesto.',
            '/es/ordenes/' || NEW.id || '?tab=presupuesto',
            jsonb_build_object(
              'order_id', NEW.id,
              'folio', NEW.folio,
              'status', NEW.status
            )
          );
        END LOOP;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_budget_missing
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_budget_missing();

-- Trigger: Presupuesto aprobado
CREATE OR REPLACE FUNCTION notify_budget_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_users UUID[];
  v_user_id UUID;
BEGIN
  IF (OLD.budget_approved IS DISTINCT FROM NEW.budget_approved)
     AND NEW.budget_approved = true THEN

    SELECT ARRAY_AGG(DISTINCT id) INTO v_notification_users
    FROM profiles
    WHERE (
      id = NEW.technician_id
      OR id = NEW.created_by
      OR role IN ('admin', 'mechanic_lead')
    )
    AND is_active = true
    AND id IS NOT NULL;

    IF v_notification_users IS NOT NULL THEN
      FOREACH v_user_id IN ARRAY v_notification_users
      LOOP
        PERFORM create_notification(
          v_user_id,
          'budget_approved'::notification_type,
          'Presupuesto aprobado',
          'El cliente aprobo el presupuesto de la orden ' || NEW.folio || ' ($' || NEW.total || ')',
          '/es/ordenes/' || NEW.id,
          jsonb_build_object(
            'order_id', NEW.id,
            'folio', NEW.folio,
            'total', NEW.total
          )
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_budget_approved
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_budget_approved();

-- Trigger: Vehiculo/Orden lista para entrega
CREATE OR REPLACE FUNCTION notify_order_ready()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_users UUID[];
  v_user_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'ready' THEN
    SELECT ARRAY_AGG(id) INTO v_notification_users
    FROM profiles
    WHERE role IN ('admin', 'reception') AND is_active = true;

    IF v_notification_users IS NOT NULL THEN
      FOREACH v_user_id IN ARRAY v_notification_users
      LOOP
        PERFORM create_notification(
          v_user_id,
          'order_ready'::notification_type,
          'Vehiculo listo para entrega',
          'La orden ' || NEW.folio || ' esta lista para entregar al cliente.',
          '/es/ordenes/' || NEW.id,
          jsonb_build_object(
            'order_id', NEW.id,
            'folio', NEW.folio
          )
        );
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_order_ready
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_ready();

-- ============================================
-- CRON JOB FUNCTIONS (for periodic reminders)
-- ============================================

-- Recordatorio de ordenes sin presupuesto
CREATE OR REPLACE FUNCTION notify_orders_without_budget()
RETURNS INTEGER AS $$
DECLARE
  v_order RECORD;
  v_notification_users UUID[];
  v_user_id UUID;
  v_count INTEGER := 0;
  v_last_notification TIMESTAMP;
BEGIN
  FOR v_order IN
    SELECT o.id, o.folio, o.status, o.technician_id, o.created_by
    FROM orders o
    WHERE o.status NOT IN ('delivered', 'cancelled', 'new')
    AND o.archived_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM budget_lines bl WHERE bl.order_id = o.id
    )
    AND o.created_at < NOW() - INTERVAL '2 hours'
  LOOP
    SELECT MAX(created_at) INTO v_last_notification
    FROM notifications
    WHERE metadata->>'order_id' = v_order.id::TEXT
    AND type = 'budget_missing'
    AND created_at > NOW() - INTERVAL '1 hour';

    IF v_last_notification IS NULL THEN
      SELECT ARRAY_AGG(DISTINCT id) INTO v_notification_users
      FROM profiles
      WHERE (
        id = v_order.technician_id
        OR id = v_order.created_by
        OR role IN ('admin', 'mechanic_lead')
      )
      AND is_active = true
      AND id IS NOT NULL;

      IF v_notification_users IS NOT NULL THEN
        FOREACH v_user_id IN ARRAY v_notification_users
        LOOP
          PERFORM create_notification(
            v_user_id,
            'budget_missing'::notification_type,
            'Recordatorio: Presupuesto pendiente',
            'La orden ' || v_order.folio || ' aun no tiene presupuesto registrado.',
            '/es/ordenes/' || v_order.id || '?tab=presupuesto',
            jsonb_build_object(
              'order_id', v_order.id,
              'folio', v_order.folio,
              'reminder', true
            )
          );
        END LOOP;
        v_count := v_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recordatorio de ordenes estancadas
CREATE OR REPLACE FUNCTION notify_stalled_orders(days_threshold INTEGER DEFAULT 3)
RETURNS INTEGER AS $$
DECLARE
  v_order RECORD;
  v_notification_users UUID[];
  v_user_id UUID;
  v_count INTEGER := 0;
  v_last_notification TIMESTAMP;
  v_last_activity TIMESTAMP;
  v_days_stalled INTEGER;
BEGIN
  FOR v_order IN
    SELECT o.id, o.folio, o.status, o.technician_id, o.created_by, o.updated_at
    FROM orders o
    WHERE o.status NOT IN ('delivered', 'cancelled', 'ready')
    AND o.archived_at IS NULL
  LOOP
    SELECT GREATEST(
      v_order.updated_at,
      COALESCE((
        SELECT MAX(created_at)
        FROM timeline_entries
        WHERE order_id = v_order.id
      ), v_order.updated_at)
    ) INTO v_last_activity;

    v_days_stalled := EXTRACT(DAY FROM NOW() - v_last_activity);

    IF v_days_stalled >= days_threshold THEN
      SELECT MAX(created_at) INTO v_last_notification
      FROM notifications
      WHERE metadata->>'order_id' = v_order.id::TEXT
      AND type = 'order_stalled'
      AND created_at > NOW() - INTERVAL '24 hours';

      IF v_last_notification IS NULL THEN
        SELECT ARRAY_AGG(DISTINCT id) INTO v_notification_users
        FROM profiles
        WHERE (
          id = v_order.technician_id
          OR id = v_order.created_by
          OR role IN ('admin', 'mechanic_lead')
        )
        AND is_active = true
        AND id IS NOT NULL;

        IF v_notification_users IS NOT NULL THEN
          FOREACH v_user_id IN ARRAY v_notification_users
          LOOP
            PERFORM create_notification(
              v_user_id,
              'order_stalled'::notification_type,
              'Orden sin actividad',
              'La orden ' || v_order.folio || ' lleva ' || v_days_stalled || ' dias sin actividad.',
              '/es/ordenes/' || v_order.id,
              jsonb_build_object(
                'order_id', v_order.id,
                'folio', v_order.folio,
                'days_stalled', v_days_stalled
              )
            );
          END LOOP;
          v_count := v_count + 1;
        END IF;
      END IF;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recordatorio de pagos pendientes
CREATE OR REPLACE FUNCTION notify_pending_payments()
RETURNS INTEGER AS $$
DECLARE
  v_order RECORD;
  v_notification_users UUID[];
  v_user_id UUID;
  v_count INTEGER := 0;
  v_last_notification TIMESTAMP;
BEGIN
  FOR v_order IN
    SELECT o.id, o.folio, o.status, o.total, o.amount_paid, o.payment_status
    FROM orders o
    WHERE o.status IN ('quality_check', 'ready')
    AND o.payment_status != 'paid'
    AND o.archived_at IS NULL
    AND o.total > 0
  LOOP
    SELECT MAX(created_at) INTO v_last_notification
    FROM notifications
    WHERE metadata->>'order_id' = v_order.id::TEXT
    AND type = 'payment_reminder'
    AND created_at > NOW() - INTERVAL '4 hours';

    IF v_last_notification IS NULL THEN
      SELECT ARRAY_AGG(id) INTO v_notification_users
      FROM profiles
      WHERE role IN ('admin', 'reception')
      AND is_active = true;

      IF v_notification_users IS NOT NULL THEN
        FOREACH v_user_id IN ARRAY v_notification_users
        LOOP
          PERFORM create_notification(
            v_user_id,
            'payment_reminder'::notification_type,
            'Recordatorio: Cobro pendiente',
            'La orden ' || v_order.folio || ' esta lista pero pendiente de cobro ($' ||
              (v_order.total - v_order.amount_paid) || ' restante).',
            '/es/ordenes/' || v_order.id || '?tab=pagos',
            jsonb_build_object(
              'order_id', v_order.id,
              'folio', v_order.folio,
              'total', v_order.total,
              'amount_paid', v_order.amount_paid,
              'pending', v_order.total - v_order.amount_paid
            )
          );
        END LOOP;
        v_count := v_count + 1;
      END IF;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion maestra para ejecutar todos los recordatorios
CREATE OR REPLACE FUNCTION run_notification_reminders()
RETURNS TABLE (
  budget_missing_count INTEGER,
  stalled_orders_count INTEGER,
  pending_payments_count INTEGER
) AS $$
BEGIN
  budget_missing_count := notify_orders_without_budget();
  stalled_orders_count := notify_stalled_orders(3);
  pending_payments_count := notify_pending_payments();
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert profiles" ON profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin());

-- Owners policies
CREATE POLICY "Authenticated users can view owners" ON owners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized roles can insert owners" ON owners FOR INSERT TO authenticated WITH CHECK (public.user_role() IN ('admin', 'reception', 'mechanic_lead', 'technician'));
CREATE POLICY "Authorized roles can update owners" ON owners FOR UPDATE TO authenticated USING (public.user_role() IN ('admin', 'reception', 'mechanic_lead', 'technician'));
CREATE POLICY "Admin can delete owners" ON owners FOR DELETE TO authenticated USING (public.user_role() = 'admin');

-- Vehicles policies
CREATE POLICY "Authenticated users can view vehicles" ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized roles can insert vehicles" ON vehicles FOR INSERT TO authenticated WITH CHECK (public.user_role() IN ('admin', 'reception', 'mechanic_lead', 'technician'));
CREATE POLICY "Authorized roles can update vehicles" ON vehicles FOR UPDATE TO authenticated USING (public.user_role() IN ('admin', 'reception', 'mechanic_lead', 'technician'));
CREATE POLICY "Admin can delete vehicles" ON vehicles FOR DELETE TO authenticated USING (public.user_role() = 'admin');

-- Orders policies
CREATE POLICY "Authenticated users can view orders" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized roles can insert orders" ON orders FOR INSERT TO authenticated WITH CHECK (public.user_role() IN ('admin', 'reception', 'mechanic_lead', 'technician'));
CREATE POLICY "Authorized roles can update orders" ON orders FOR UPDATE TO authenticated USING (public.user_role() IN ('admin', 'reception', 'mechanic_lead', 'technician'));
CREATE POLICY "Admin can delete orders" ON orders FOR DELETE TO authenticated USING (public.user_role() = 'admin');

-- Budget lines policies
CREATE POLICY "Authenticated users can view budget lines" ON budget_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage budget lines" ON budget_lines FOR ALL TO authenticated USING (true);

-- Timeline entries policies
CREATE POLICY "Authenticated users can view timeline" ON timeline_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert timeline" ON timeline_entries FOR INSERT TO authenticated WITH CHECK (true);

-- Payments policies
CREATE POLICY "Authenticated users can view payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authorized roles can manage payments" ON payments FOR ALL TO authenticated USING (public.user_role() IN ('admin', 'reception', 'mechanic_lead')) WITH CHECK (public.user_role() IN ('admin', 'reception', 'mechanic_lead'));

-- Parts invoices policies
CREATE POLICY "Authenticated users can view parts invoices" ON parts_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage parts invoices" ON parts_invoices FOR ALL TO authenticated USING (true);

-- WhatsApp templates policies
CREATE POLICY "Authenticated users can view templates" ON whatsapp_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage templates" ON whatsapp_templates FOR ALL TO authenticated USING (public.is_admin());

-- WhatsApp messages policies
CREATE POLICY "Authenticated users can view messages" ON whatsapp_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and reception can send messages" ON whatsapp_messages FOR INSERT TO authenticated WITH CHECK (public.user_role() IN ('admin', 'reception'));

-- Workshop config policies
CREATE POLICY "Authenticated users can view config" ON workshop_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage config" ON workshop_config FOR ALL TO authenticated USING (public.is_admin());

-- Expense categories policies
CREATE POLICY "Authenticated users can view expense categories" ON expense_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage expense categories" ON expense_categories FOR ALL TO authenticated USING (public.is_admin());

-- Expenses policies
CREATE POLICY "Authenticated users can view expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin and reception can manage expenses" ON expenses FOR ALL TO authenticated USING (public.user_role() IN ('admin', 'reception'));

-- Audit log policies
CREATE POLICY "Admins can view audit log" ON audit_log FOR SELECT TO authenticated USING (public.is_admin());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================
-- Habilitar Realtime para la tabla notifications
-- (ejecutar en Supabase Dashboard si da error aqui)
-- ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- INITIAL DATA
-- ============================================

-- Insert default workshop config (MODIFICAR con datos del nuevo taller)
INSERT INTO workshop_config (name, address, phone, email, currency, order_prefix)
VALUES (
  'Mi Taller Automotriz',
  'Direccion del taller',
  '0000-0000',
  'taller@ejemplo.com',
  'USD',
  'ORD'
);

-- Insert default WhatsApp templates
INSERT INTO whatsapp_templates (name, category, content, variables) VALUES
('Bienvenida', 'general', 'Hola {{nombre}}, bienvenido a nuestro taller. Su vehiculo {{vehiculo}} ha sido registrado con la orden #{{folio}}.', ARRAY['nombre', 'vehiculo', 'folio']),
('Diagnostico listo', 'order_update', 'Hola {{nombre}}, el diagnostico de su {{vehiculo}} esta listo. Total estimado: ${{total}}. Desea que procedamos con la reparacion?', ARRAY['nombre', 'vehiculo', 'total']),
('Aprobacion requerida', 'approval', 'Hola {{nombre}}, necesitamos su aprobacion para continuar con el trabajo en su {{vehiculo}}. Presupuesto: ${{total}}', ARRAY['nombre', 'vehiculo', 'total']),
('Vehiculo listo', 'delivery', 'Hola {{nombre}}, su {{vehiculo}} esta listo para recoger. Total a pagar: ${{total}}. Horario: Lun-Sab 8am-5pm', ARRAY['nombre', 'vehiculo', 'total']),
('Recordatorio de cita', 'reminder', 'Hola {{nombre}}, le recordamos su cita programada para el {{fecha}} a las {{hora}}. Lo esperamos!', ARRAY['nombre', 'fecha', 'hora']),
('Actualizacion de estado', 'order_update', 'Hola {{nombre}}, le informamos que su {{vehiculo}} ahora esta en estado: {{estado}}.', ARRAY['nombre', 'vehiculo', 'estado']);

-- Insert default expense categories
INSERT INTO expense_categories (name, description, color) VALUES
('Herramientas', 'Compra de herramientas y equipo', '#3B82F6'),
('Servicios', 'Agua, luz, internet, etc.', '#10B981'),
('Renta', 'Alquiler del local', '#F59E0B'),
('Nomina', 'Salarios y prestaciones', '#EF4444'),
('Mantenimiento', 'Mantenimiento de instalaciones', '#8B5CF6'),
('Marketing', 'Publicidad y promocion', '#EC4899'),
('Otros', 'Gastos varios', '#6B7280');

-- ============================================
-- POST-INSTALLATION STEPS
-- ============================================
--
-- 1. Crear el trigger para auth.users (ejecutar en SQL Editor con permisos):
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW
     EXECUTE FUNCTION handle_new_user();
--
-- 2. Habilitar Realtime para notifications:
--    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
--
-- 3. Crear el primer usuario admin manualmente:
--    a) Crear usuario en Authentication > Users
--    b) Insertar/actualizar profile con role = 'admin'
--
-- 4. Configurar el workshop_config con los datos reales del taller
--
-- 5. (Opcional) Configurar pg_cron si tienes Supabase Pro:
--    SELECT cron.schedule(
--      'notification-reminders-hourly',
--      '0 * * * *',
--      'SELECT run_notification_reminders()'
--    );
--
-- 6. Crear bucket de Storage para fotos de inspección:
--    INSERT INTO storage.buckets (id, name, public)
--    VALUES ('damage-photos', 'damage-photos', true);
--
--    CREATE POLICY "Authenticated users can upload damage photos"
--    ON storage.objects FOR INSERT TO authenticated
--    WITH CHECK (bucket_id = 'damage-photos');
--
--    CREATE POLICY "Public read access for damage photos"
--    ON storage.objects FOR SELECT TO public
--    USING (bucket_id = 'damage-photos');
--
--    CREATE POLICY "Authenticated users can delete damage photos"
--    ON storage.objects FOR DELETE TO authenticated
--    USING (bucket_id = 'damage-photos');
