-- 1. Crear tipos solo si no existen previamente
DO $$ BEGIN
  CREATE TYPE person_phase AS ENUM ('maduro', 'veterano', 'medio', 'capacitacion');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pendiente', 'en_progreso', 'revision', 'hecho');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE client_status AS ENUM ('activo', 'pausado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Tabla personas
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  role TEXT NOT NULL,
  age INTEGER NOT NULL,
  phase person_phase NOT NULL DEFAULT 'medio',
  personality TEXT NOT NULL,
  emotionality TEXT NOT NULL,
  potential_score INTEGER NOT NULL,
  potential_note TEXT NOT NULL,
  advantages JSONB NOT NULL DEFAULT '[]'::jsonb,
  discomforts JSONB NOT NULL DEFAULT '[]'::jsonb,
  functions JSONB NOT NULL DEFAULT '[]'::jsonb,
  interests JSONB NOT NULL DEFAULT '[]'::jsonb,
  reports_to TEXT REFERENCES people(id) ON DELETE SET NULL,
  is_ceo BOOLEAN NOT NULL DEFAULT FALSE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Tabla tareas
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due TEXT,
  status task_status NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Tabla clientes
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT NOT NULL,
  industry TEXT NOT NULL,
  status client_status NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tabla para persistir las posiciones de los nodos (X, Y)
CREATE TABLE IF NOT EXISTS node_positions (
  id TEXT PRIMARY KEY,
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Habilitar permisos completos (SELECT, INSERT, UPDATE, DELETE) para ti en tu app
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Full access people" ON people;
DROP POLICY IF EXISTS "Public full access people" ON people;
DROP POLICY IF EXISTS "Public read-only people" ON people;
CREATE POLICY "Full access people" ON people FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access tasks" ON tasks;
DROP POLICY IF EXISTS "Public full access tasks" ON tasks;
DROP POLICY IF EXISTS "Public read-only tasks" ON tasks;
CREATE POLICY "Full access tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access clients" ON clients;
DROP POLICY IF EXISTS "Public full access clients" ON clients;
DROP POLICY IF EXISTS "Public read-only clients" ON clients;
CREATE POLICY "Full access clients" ON clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Full access node_positions" ON node_positions;
CREATE POLICY "Full access node_positions" ON node_positions FOR ALL USING (true) WITH CHECK (true);

-- 6.1 Bucket de Supabase Storage para fotos de perfil / avatars (S3)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permisos públicos para storage.objects
DROP POLICY IF EXISTS "Full access storage avatars" ON storage.objects;
CREATE POLICY "Full access storage avatars" ON storage.objects
  FOR ALL USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

-- Añadir columna avatar_url si no existe
ALTER TABLE people ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 7. Semilla inicial de datos (Seed data)
INSERT INTO people (
  id, name, initials, role, age, phase, personality, emotionality,
  potential_score, potential_note, advantages, discomforts, functions, interests,
  reports_to, is_ceo
) VALUES 
(
  'ceo', 'Cristian A.', 'CA', 'CEO · Fundador', 32, 'maduro', 'Visionario', 'Estable',
  94, 'Visión estratégica · escalar equipos',
  '["Visión clara de producto y largo plazo", "Construye confianza con equipo y clientes"]'::jsonb,
  '["Tareas administrativas repetitivas", "Cambios de contexto con plazos cortos"]'::jsonb,
  '["Estrategia", "Fundraising", "Contratación"]'::jsonb,
  '["Ajedrez", "Correr", "Lectura"]'::jsonb,
  NULL, TRUE
),
(
  'p-lm', 'Laura M.', 'LM', 'Diseño', 29, 'veterano', 'Metódica', 'Calmada',
  81, 'Sistemas de diseño · dirección',
  '["Pensamiento sistémico", "Facilita decisiones de UI"]'::jsonb,
  '["Briefs ambiguos", "Múltiples revisiones"]'::jsonb,
  '["UI", "Design system", "Research"]'::jsonb,
  '["Cerámica", "Yoga"]'::jsonb,
  'ceo', FALSE
),
(
  'p-dr', 'Diego R.', 'DR', 'CTO', 34, 'maduro', 'Analítico', 'Firme',
  90, 'Arquitectura · escalabilidad',
  '["Decisiones técnicas rápidas", "Mentoría al equipo"]'::jsonb,
  '["Reuniones sin agenda", "Cambios de prioridad"]'::jsonb,
  '["Arquitectura", "Infra", "Seguridad"]'::jsonb,
  '["Ciclismo", "Open source"]'::jsonb,
  'ceo', FALSE
),
(
  'p-sp', 'Sofía P.', 'SP', 'Producto', 27, 'medio', 'Curiosa', 'Resiliente',
  77, 'Discovery · descubrimiento',
  '["Prioriza con datos", "Buena síntesis"]'::jsonb,
  '["Falta de contexto", "Decisiones por comité"]'::jsonb,
  '["Discovery", "Roadmap", "UX writing"]'::jsonb,
  '["Cine", "Café"]'::jsonb,
  'ceo', FALSE
),
(
  'p-mg', 'Mateo G.', 'MG', 'Ingeniería', 31, 'veterano', 'Pragmático', 'Tranquilo',
  78, 'Backend · APIs',
  '["Código mantenible", "Debugging rápido"]'::jsonb,
  '["Alcance que cambia", "Tareas sin dueño"]'::jsonb,
  '["Backend", "APIs", "Testing"]'::jsonb,
  '["Fútbol", "Música"]'::jsonb,
  'ceo', FALSE
),
(
  'p-ek', 'Elena K.', 'EK', 'Operaciones', 36, 'maduro', 'Organizada', 'Empática',
  85, 'Operaciones · procesos',
  '["Diseña procesos limpios", "Gestiona proveedores"]'::jsonb,
  '["Herramientas desorganizadas", "Falta de métricas"]'::jsonb,
  '["Procesos", "Finanzas", "People"]'::jsonb,
  '["Jardinería", "Lectura"]'::jsonb,
  'ceo', FALSE
),
(
  'p-cv', 'Carlos Vargas', 'CV', 'Marketing', 24, 'capacitacion', 'Creativo', 'Entusiasta',
  72, 'Alto · creatividad',
  '["Comunicador nato, buena narrativa", "Rápido para aprender nuevas herramientas", "Energía positiva, contagia al equipo"]'::jsonb,
  '["Procesos muy estructurados o repetitivos", "Falta de feedback después de entregar", "Micromanagement en entregables"]'::jsonb,
  '["Contenido", "Social media", "Branding", "Campañas"]'::jsonb,
  '["Analitic", "Música", "Fotografía", "Diseño", "Cine"]'::jsonb,
  'ceo', FALSE
),
(
  'p-yw', 'Yara W.', 'YW', 'Diseñadora Jr.', 22, 'capacitacion', 'Detallista', 'Positiva',
  70, 'Creatividad visual',
  '["Rápida iteración", "Gusto tipográfico"]'::jsonb,
  '["Reuniones largas"]'::jsonb,
  '["Branding", "Redes"]'::jsonb,
  '["Ilustración", "Moda"]'::jsonb,
  'p-cv', FALSE
),
(
  'p-fb', 'Felipe B.', 'FB', 'Copywriter Jr.', 23, 'medio', 'Curioso', 'Entusiasta',
  74, 'Storytelling',
  '["Escritura ágil", "Creativo"]'::jsonb,
  '["Falta de directrices"]'::jsonb,
  '["Contenido", "Copy"]'::jsonb,
  '["Literatura", "Podcast"]'::jsonb,
  'p-cv', FALSE
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  initials = EXCLUDED.initials,
  role = EXCLUDED.role,
  age = EXCLUDED.age,
  phase = EXCLUDED.phase,
  personality = EXCLUDED.personality,
  emotionality = EXCLUDED.emotionality,
  potential_score = EXCLUDED.potential_score,
  potential_note = EXCLUDED.potential_note,
  advantages = EXCLUDED.advantages,
  discomforts = EXCLUDED.discomforts,
  functions = EXCLUDED.functions,
  interests = EXCLUDED.interests,
  reports_to = EXCLUDED.reports_to,
  is_ceo = EXCLUDED.is_ceo;

-- Tareas iniciales
INSERT INTO tasks (id, person_id, title, due, status) VALUES
('t1-ceo', 'ceo', 'Definir roadmap Q1', 'Vence 18 nov', 'en_progreso'),
('t2-ceo', 'ceo', 'Contratar 2 ingenieros senior', NULL, 'revision'),
('t3-ceo', 'ceo', 'Pitch deck Serie A', NULL, 'en_progreso'),
('t4-ceo', 'ceo', 'Review mensual con inversores', 'Vence 30 nov', 'pendiente'),
('t1-lm', 'p-lm', 'Refresco de design tokens', NULL, 'en_progreso'),
('t2-lm', 'p-lm', 'Auditar formularios internos', NULL, 'pendiente'),
('t1-dr', 'p-dr', 'Migración de base de datos', NULL, 'en_progreso'),
('t2-dr', 'p-dr', 'Revisión de permisos IAM', NULL, 'revision'),
('t3-dr', 'p-dr', 'RFC de nuevo servicio', NULL, 'pendiente'),
('t1-sp', 'p-sp', 'Discovery de onboarding', NULL, 'en_progreso'),
('t1-ek', 'p-ek', 'Cerrar nómina de noviembre', 'Vence 28 nov', 'en_progreso'),
('t2-ek', 'p-ek', 'Plan de beneficios 2027', NULL, 'pendiente'),
('t1-cv', 'p-cv', 'Preparar campaña de lanzamiento beta', 'Vence 18 nov', 'en_progreso'),
('t2-cv', 'p-cv', 'Grabar video explicativo del producto', 'Vence 22 nov', 'en_progreso'),
('t3-cv', 'p-cv', 'Diseñar kit de redes sociales', 'Vence 25 nov', 'revision'),
('t4-cv', 'p-cv', 'Investigar 5 competidores directos', 'Sin vencimiento', 'pendiente')
ON CONFLICT (id) DO UPDATE SET
  person_id = EXCLUDED.person_id,
  title = EXCLUDED.title,
  due = EXCLUDED.due,
  status = EXCLUDED.status;

-- Clientes iniciales
INSERT INTO clients (id, name, initials, industry, status) VALUES
('c-nova', 'Nova Studio', 'NOVA', 'SaaS · B2B', 'activo'),
('c-atl', 'Atlas Retail', 'ATL', 'Comercio', 'activo'),
('c-krn', 'Kernel Labs', 'KRN', 'Investigación', 'pausado'),
('c-orb', 'Órbita Digital', 'ORB', 'Agencia', 'activo')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  initials = EXCLUDED.initials,
  industry = EXCLUDED.industry,
  status = EXCLUDED.status;
