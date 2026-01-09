-- ============================================
-- NOTIFICATIONS SYSTEM MIGRATION
-- ============================================
-- Run this migration in your Supabase SQL Editor

-- 1. Create notification type enum
DO $$ BEGIN
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
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 4. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 6. Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- HELPER FUNCTION: Create notification
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
-- TRIGGER: Nueva orden creada
-- Notifica a admin y recepcion
-- ============================================
CREATE OR REPLACE FUNCTION notify_order_created()
RETURNS TRIGGER AS $$
DECLARE
  v_user_ids UUID[];
  v_user_id UUID;
BEGIN
  -- Notificar a admins y recepcion
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

DROP TRIGGER IF EXISTS on_order_created ON orders;
CREATE TRIGGER on_order_created
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_created();

-- ============================================
-- TRIGGER: Cambio de estado en orden
-- Notifica al tecnico asignado, creador, y leads
-- ============================================
CREATE OR REPLACE FUNCTION notify_order_status_changed()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_users UUID[];
  v_user_id UUID;
  v_status_label VARCHAR(50);
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Mapear estado a etiqueta en espanol
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

    -- Recopilar usuarios a notificar: tecnico asignado, creador, admins y leads
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

    -- Si el nuevo estado es quality_check o ready, verificar si hay pago pendiente de mano de obra
    IF NEW.status IN ('quality_check', 'ready') AND NEW.payment_status != 'paid' THEN
      -- Notificar recordatorio de pago
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

DROP TRIGGER IF EXISTS on_order_status_changed ON orders;
CREATE TRIGGER on_order_status_changed
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_changed();

-- ============================================
-- TRIGGER: Pago recibido
-- Notifica a admin y recepcion
-- ============================================
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

DROP TRIGGER IF EXISTS on_payment_received ON payments;
CREATE TRIGGER on_payment_received
  AFTER INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION notify_payment_received();

-- ============================================
-- TRIGGER: Mensaje WhatsApp fallido
-- Notifica al creador del mensaje
-- ============================================
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

DROP TRIGGER IF EXISTS on_whatsapp_failed ON whatsapp_messages;
CREATE TRIGGER on_whatsapp_failed
  AFTER UPDATE ON whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_whatsapp_failed();

-- ============================================
-- TRIGGER: Presupuesto sin lineas (budget_missing)
-- Notifica cuando una orden pasa a ciertos estados sin presupuesto
-- Se activa cuando cambia el estado y no hay lineas de presupuesto
-- ============================================
CREATE OR REPLACE FUNCTION notify_budget_missing()
RETURNS TRIGGER AS $$
DECLARE
  v_budget_count INTEGER;
  v_notification_users UUID[];
  v_user_id UUID;
  v_status_label VARCHAR(50);
BEGIN
  -- Solo verificar cuando el estado cambia a diagnosis, in_progress, o waiting_approval
  IF OLD.status IS DISTINCT FROM NEW.status
     AND NEW.status IN ('diagnosis', 'in_progress', 'waiting_approval', 'approved') THEN

    -- Contar lineas de presupuesto
    SELECT COUNT(*) INTO v_budget_count
    FROM budget_lines
    WHERE order_id = NEW.id;

    -- Si no hay lineas de presupuesto, notificar
    IF v_budget_count = 0 THEN
      v_status_label := CASE NEW.status
        WHEN 'diagnosis' THEN 'Diagnostico'
        WHEN 'in_progress' THEN 'En Proceso'
        WHEN 'waiting_approval' THEN 'Esperando Aprobacion'
        WHEN 'approved' THEN 'Aprobado'
        ELSE NEW.status::VARCHAR
      END;

      -- Notificar al tecnico asignado, creador, y quienes han editado (admins/leads)
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

DROP TRIGGER IF EXISTS on_budget_missing ON orders;
CREATE TRIGGER on_budget_missing
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_budget_missing();

-- ============================================
-- TRIGGER: Presupuesto aprobado
-- Notifica cuando el cliente aprueba el presupuesto
-- ============================================
CREATE OR REPLACE FUNCTION notify_budget_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_users UUID[];
  v_user_id UUID;
BEGIN
  -- Solo cuando budget_approved cambia de false a true
  IF (OLD.budget_approved IS DISTINCT FROM NEW.budget_approved)
     AND NEW.budget_approved = true THEN

    -- Notificar al tecnico asignado, creador, admins y leads
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

DROP TRIGGER IF EXISTS on_budget_approved ON orders;
CREATE TRIGGER on_budget_approved
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_budget_approved();

-- ============================================
-- TRIGGER: Vehiculo/Orden lista para entrega
-- Notifica cuando el estado cambia a 'ready'
-- ============================================
CREATE OR REPLACE FUNCTION notify_order_ready()
RETURNS TRIGGER AS $$
DECLARE
  v_notification_users UUID[];
  v_user_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'ready' THEN
    -- Notificar a admins y recepcion
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

DROP TRIGGER IF EXISTS on_order_ready ON orders;
CREATE TRIGGER on_order_ready
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_ready();

-- ============================================
-- CLEAN UP: Remove old notifications (optional cron job)
-- Run this periodically to clean up old read notifications
-- ============================================
-- CREATE OR REPLACE FUNCTION cleanup_old_notifications()
-- RETURNS void AS $$
-- BEGIN
--   DELETE FROM notifications
--   WHERE read = true
--   AND created_at < NOW() - INTERVAL '30 days';
-- END;
-- $$ LANGUAGE plpgsql;
