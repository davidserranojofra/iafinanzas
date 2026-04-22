-- ============================================================
-- CARTERA — Schema inicial
-- Pegar en: Supabase Dashboard → SQL Editor → New query
-- ============================================================


-- ── ENUM: categorías de tickets ─────────────────────────────
CREATE TYPE ticket_categoria AS ENUM (
  'Alimentación',
  'Transporte',
  'Ropa',
  'Restaurantes',
  'Suscripciones',
  'Salud',
  'Hogar',
  'Ocio',
  'Tecnología',
  'Otro'
);


-- ── TABLA: profiles ─────────────────────────────────────────
-- Se crea automáticamente al registrar un usuario (ver trigger)
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     TEXT,
  telefono   TEXT,
  ciudad     TEXT,
  divisa     TEXT NOT NULL DEFAULT 'EUR',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario ve y edita su propio perfil"
  ON profiles FOR ALL
  USING  (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ── TABLA: tickets ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tickets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comercio         TEXT NOT NULL,
  fecha            DATE NOT NULL,
  total            NUMERIC(10, 2) NOT NULL,
  iva              NUMERIC(10, 2),
  categoria        ticket_categoria NOT NULL DEFAULT 'Otro',
  metodo_pago      TEXT,
  notas            TEXT,
  image_url        TEXT,
  items            JSONB,             -- TicketItem[]
  extracted_by_ai  BOOLEAN NOT NULL DEFAULT FALSE,
  ai_confidence    NUMERIC(3, 2),     -- 0.00 – 1.00
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cada usuario gestiona sus propios tickets"
  ON tickets FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índices útiles para las queries más frecuentes
CREATE INDEX tickets_user_fecha_idx ON tickets (user_id, fecha DESC);
CREATE INDEX tickets_user_categoria_idx ON tickets (user_id, categoria);


-- ── TRIGGER: crear perfil al registrarse ────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, nombre)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── STORAGE: bucket para imágenes de tickets ────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('tickets', 'tickets', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Usuarios suben sus propias imágenes"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'tickets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuarios leen sus propias imágenes"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'tickets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Usuarios borran sus propias imágenes"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'tickets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
