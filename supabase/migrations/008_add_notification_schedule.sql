-- ============================================================
-- CARTERA — Agregar programación horaria de notificaciones
-- y corregir el default de categorías (faltaba 'Cuidado Personal')
-- ============================================================

-- 1. Agregar la hora preferida de envío (0-23) y la zona horaria IANA del usuario
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notif_hour INTEGER NOT NULL DEFAULT 9,
  ADD COLUMN IF NOT EXISTS notif_timezone TEXT NOT NULL DEFAULT 'Europe/Madrid';

-- 2. Restricción de rango para la hora (drop + add para que la migración sea re-ejecutable)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_notif_hour_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_notif_hour_check CHECK (notif_hour BETWEEN 0 AND 23);

-- 3. Corregir el default de notif_categories: la migración 005 omitió 'Cuidado Personal'
--    (la categoría existe en el enum desde la migración 006 y en la UI)
ALTER TABLE profiles
  ALTER COLUMN notif_categories SET DEFAULT '{"Alimentación":true,"Transporte":true,"Ropa":true,"Restaurantes":true,"Suscripciones":true,"Salud":true,"Hogar":true,"Ocio":true,"Tecnología":true,"Cuidado Personal":true,"Otro":true}';

-- 4. Backfill: agregar la clave a las filas existentes que no la tengan
UPDATE profiles
SET notif_categories = notif_categories || '{"Cuidado Personal": true}'::jsonb
WHERE NOT (notif_categories ? 'Cuidado Personal');
