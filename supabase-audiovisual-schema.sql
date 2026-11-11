-- Tabla para almacenar los registros diarios de creación de contenido audiovisual
CREATE TABLE IF NOT EXISTS daily_video_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- formato YYYY-MM-DD
  creator_id TEXT NOT NULL DEFAULT 'andres-m',
  creator_name TEXT NOT NULL DEFAULT 'Andrés M.',
  project_name TEXT NOT NULL DEFAULT 'Casa Luifer',
  format_disney_sub30 INTEGER NOT NULL DEFAULT 0,
  format_disney_gala INTEGER NOT NULL DEFAULT 0,
  format_movimiento INTEGER NOT NULL DEFAULT 0,
  format_avatar_yapping INTEGER NOT NULL DEFAULT 0,
  notes_disney_sub30 TEXT DEFAULT '',
  notes_disney_gala TEXT DEFAULT '',
  notes_movimiento TEXT DEFAULT '',
  notes_avatar_yapping TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indice único por día y creador y proyecto
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_video_logs_date_creator_project 
ON daily_video_logs (date, creator_id, project_name);

-- RLS y políticas
ALTER TABLE daily_video_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access daily_video_logs" ON daily_video_logs;
CREATE POLICY "Full access daily_video_logs" ON daily_video_logs FOR ALL USING (true) WITH CHECK (true);

