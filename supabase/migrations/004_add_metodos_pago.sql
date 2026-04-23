-- Agrega metodos_pago al perfil del usuario
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS metodos_pago TEXT[] NOT NULL DEFAULT ARRAY['Efectivo','Tarjeta débito'];
