-- Agregar la categoría 'Cuidado Personal' al enum ticket_categoria
ALTER TYPE ticket_categoria ADD VALUE IF NOT EXISTS 'Cuidado Personal';
