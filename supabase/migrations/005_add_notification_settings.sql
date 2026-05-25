-- ============================================================
-- CARTERA — Agregar configuraciones de notificaciones y Web Push
-- ============================================================

-- 1. Agregar columnas de configuración de notificaciones a profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS notif_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS notif_interval_days INTEGER NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS notif_summary_type TEXT NOT NULL DEFAULT 'total',
  ADD COLUMN IF NOT EXISTS notif_categories JSONB NOT NULL DEFAULT '{"Alimentación":true,"Transporte":true,"Ropa":true,"Restaurantes":true,"Suscripciones":true,"Salud":true,"Hogar":true,"Ocio":true,"Tecnología":true,"Otro":true}',
  ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;

-- 2. Crear tabla push_subscriptions para almacenar los endpoints de Web Push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Habilitar seguridad de nivel de fila (RLS) en la nueva tabla
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS para push_subscriptions
CREATE POLICY "Cada usuario ve y maneja sus propias suscripciones push"
  ON push_subscriptions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Índices útiles para optimizar búsquedas por usuario
CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON push_subscriptions (user_id);
