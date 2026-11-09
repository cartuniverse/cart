-- Agregar columna "projects" a la tabla people
-- Ejecutar en Supabase SQL Editor

ALTER TABLE people ADD COLUMN IF NOT EXISTS projects JSONB NOT NULL DEFAULT '[]'::jsonb;

