-- ============================================================
-- CARTERA — Corregir política RLS tickets_insert (BOLA/IDOR)
-- ============================================================

-- 1. Eliminamos la política insegura anterior que solo validaba estar autenticado
DROP POLICY IF EXISTS "tickets_insert" ON tickets;

-- 2. Creamos la nueva política restrictiva que fuerza que el user_id coincida con la sesión
CREATE POLICY "tickets_insert" ON tickets FOR INSERT
  WITH CHECK (auth.uid() = user_id);
