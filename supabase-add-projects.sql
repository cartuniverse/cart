-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#6366f1',
  emoji TEXT NOT NULL DEFAULT '📁',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permisos RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access projects" ON projects;
CREATE POLICY "Full access projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- Agregar columna projects en people si no existe
ALTER TABLE people ADD COLUMN IF NOT EXISTS projects JSONB NOT NULL DEFAULT '[]'::jsonb;
