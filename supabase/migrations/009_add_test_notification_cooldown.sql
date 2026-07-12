-- ============================================================
-- CARTERA — Cooldown del lado servidor para la notificación de prueba
-- ============================================================

-- Registrar el momento del último envío de prueba por usuario para que
-- POST /api/notifications/test pueda rechazar con 429 los envíos repetidos
-- (el guard del cliente no basta: un fetch directo lo evita)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_test_notification_at TIMESTAMPTZ;
