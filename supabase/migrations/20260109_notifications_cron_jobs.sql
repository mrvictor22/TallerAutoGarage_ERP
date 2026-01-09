-- ============================================
-- NOTIFICATIONS CRON JOBS
-- ============================================
-- Recordatorios periódicos cada hora
--
-- IMPORTANTE: pg_cron solo está disponible en Supabase Pro+
-- Si usas el plan Free, puedes llamar estas funciones desde:
-- - Vercel Cron Jobs
-- - GitHub Actions
-- - cron-job.org (servicio externo)

-- ============================================
-- 1. Habilitar pg_cron (solo si tienes Supabase Pro)
-- ============================================
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 2. Función: Recordatorio de órdenes sin presupuesto
-- Busca órdenes activas sin líneas de presupuesto
-- ============================================
CREATE OR REPLACE FUNCTION notify_orders_without_budget()
RETURNS INTEGER AS $$
DECLARE
  v_order RECORD;
  v_notification_users UUID[];
  v_user_id UUID;
  v_count INTEGER := 0;
  v_last_notification TIMESTAMP;
BEGIN
  -- Buscar órdenes activas sin presupuesto que no han sido notificadas en la última hora
  FOR v_order IN
    SELECT o.id, o.folio, o.status, o.technician_id, o.created_by
    FROM orders o
    WHERE o.status NOT IN ('delivered', 'cancelled', 'new')
    AND o.archived_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM budget_lines bl WHERE bl.order_id = o.id
    )
    -- Solo órdenes creadas hace más de 2 horas (dar tiempo para agregar presupuesto)
    AND o.created_at < NOW() - INTERVAL '2 hours'
  LOOP
    -- Verificar si ya se envió notificación en la última hora para esta orden
    SELECT MAX(created_at) INTO v_last_notification
    FROM notifications
    WHERE metadata->>'order_id' = v_order.id::TEXT
    AND type = 'budget_missing'
    AND created_at > NOW() - INTERVAL '1 hour';

    -- Si no hay notificación reciente, enviar una nueva
    IF v_last_notification IS NULL THEN
      -- Obtener usuarios a notificar
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
            'La orden ' || v_order.folio || ' aún no tiene presupuesto registrado.',
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

-- ============================================
-- 3. Función: Recordatorio de órdenes estancadas
-- Busca órdenes sin actividad por más de X días
-- ============================================
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
  -- Buscar órdenes activas sin actividad reciente
  FOR v_order IN
    SELECT o.id, o.folio, o.status, o.technician_id, o.created_by, o.updated_at
    FROM orders o
    WHERE o.status NOT IN ('delivered', 'cancelled', 'ready')
    AND o.archived_at IS NULL
  LOOP
    -- Obtener última actividad (timeline o actualización)
    SELECT GREATEST(
      v_order.updated_at,
      COALESCE((
        SELECT MAX(created_at)
        FROM timeline_entries
        WHERE order_id = v_order.id
      ), v_order.updated_at)
    ) INTO v_last_activity;

    -- Calcular días sin actividad
    v_days_stalled := EXTRACT(DAY FROM NOW() - v_last_activity);

    -- Si supera el umbral
    IF v_days_stalled >= days_threshold THEN
      -- Verificar si ya se envió notificación en las últimas 24 horas
      SELECT MAX(created_at) INTO v_last_notification
      FROM notifications
      WHERE metadata->>'order_id' = v_order.id::TEXT
      AND type = 'order_stalled'
      AND created_at > NOW() - INTERVAL '24 hours';

      IF v_last_notification IS NULL THEN
        -- Obtener usuarios a notificar
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
              'La orden ' || v_order.folio || ' lleva ' || v_days_stalled || ' días sin actividad.',
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

-- ============================================
-- 4. Función: Recordatorio de pagos pendientes
-- Órdenes en quality_check o ready sin pago completo
-- ============================================
CREATE OR REPLACE FUNCTION notify_pending_payments()
RETURNS INTEGER AS $$
DECLARE
  v_order RECORD;
  v_notification_users UUID[];
  v_user_id UUID;
  v_count INTEGER := 0;
  v_last_notification TIMESTAMP;
BEGIN
  -- Buscar órdenes listas para entrega con pago pendiente
  FOR v_order IN
    SELECT o.id, o.folio, o.status, o.total, o.amount_paid, o.payment_status
    FROM orders o
    WHERE o.status IN ('quality_check', 'ready')
    AND o.payment_status != 'paid'
    AND o.archived_at IS NULL
    AND o.total > 0
  LOOP
    -- Verificar si ya se envió notificación en las últimas 4 horas
    SELECT MAX(created_at) INTO v_last_notification
    FROM notifications
    WHERE metadata->>'order_id' = v_order.id::TEXT
    AND type = 'payment_reminder'
    AND created_at > NOW() - INTERVAL '4 hours';

    IF v_last_notification IS NULL THEN
      -- Notificar a admins y recepción
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
            'La orden ' || v_order.folio || ' está lista pero pendiente de cobro ($' ||
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

-- ============================================
-- 5. Función maestra: Ejecutar todos los recordatorios
-- Esta es la función que debe llamarse cada hora
-- ============================================
CREATE OR REPLACE FUNCTION run_notification_reminders()
RETURNS TABLE (
  budget_missing_count INTEGER,
  stalled_orders_count INTEGER,
  pending_payments_count INTEGER
) AS $$
BEGIN
  budget_missing_count := notify_orders_without_budget();
  stalled_orders_count := notify_stalled_orders(3); -- 3 días sin actividad
  pending_payments_count := notify_pending_payments();
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. Configurar pg_cron (SOLO SUPABASE PRO+)
-- ============================================
-- Descomentar estas líneas si tienes Supabase Pro:

-- Ejecutar cada hora
-- SELECT cron.schedule(
--   'notification-reminders-hourly',
--   '0 * * * *',  -- Cada hora en el minuto 0
--   'SELECT run_notification_reminders()'
-- );

-- Para ver los jobs programados:
-- SELECT * FROM cron.job;

-- Para eliminar un job:
-- SELECT cron.unschedule('notification-reminders-hourly');

-- ============================================
-- 7. API Endpoint para llamar desde Vercel/External Cron
-- ============================================
-- Si no tienes pg_cron, crea un Edge Function o API route
-- que llame a: SELECT run_notification_reminders();
--
-- Ejemplo con Vercel Cron (vercel.json):
-- {
--   "crons": [{
--     "path": "/api/cron/notifications",
--     "schedule": "0 * * * *"
--   }]
-- }
