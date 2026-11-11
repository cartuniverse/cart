-- Esquema de autenticación con roles para Orbit
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de crear los usuarios en Authentication > Users

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'admin',
    'director_area',
    'disenador_ai',
    'community_manager',
    'creador_audiovisual'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabla de perfiles, 1 a 1 con auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'creador_audiovisual',
  -- Solo aplica para creador_audiovisual: a qué proyecto queda limitado
  project_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- El admin inserta/edita perfiles manualmente desde el dashboard de Supabase (tabla profiles),
-- no hace falta policy de escritura desde el cliente.
