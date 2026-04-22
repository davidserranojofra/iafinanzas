-- La DB setea user_id automáticamente desde auth.uid()
-- Así no dependemos de que el cliente lo pase correctamente
ALTER TABLE tickets ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE tickets ALTER COLUMN user_id DROP NOT NULL;

-- Política más robusta: separar SELECT/INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "Cada usuario gestiona sus propios tickets" ON tickets;

CREATE POLICY "tickets_select" ON tickets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "tickets_insert" ON tickets FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tickets_update" ON tickets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "tickets_delete" ON tickets FOR DELETE
  USING (auth.uid() = user_id);
