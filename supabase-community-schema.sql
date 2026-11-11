-- Tabla para almacenar los registros diarios de publicaciones de Community Manager
CREATE TABLE IF NOT EXISTS daily_community_logs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- formato YYYY-MM-DD
  cm_id TEXT NOT NULL DEFAULT 'valentina-c',
  cm_name TEXT NOT NULL DEFAULT 'Valentina C.',
  project_name TEXT NOT NULL DEFAULT 'Casa Luifer',
  format_historia_organica INTEGER NOT NULL DEFAULT 0,
  format_historia_producto INTEGER NOT NULL DEFAULT 0,
  format_historia_interactiva INTEGER NOT NULL DEFAULT 0,
  format_feed_organico INTEGER NOT NULL DEFAULT 0,
  format_feed_creativo INTEGER NOT NULL DEFAULT 0,
  format_video_testimonio INTEGER NOT NULL DEFAULT 0,
  format_carrusel INTEGER NOT NULL DEFAULT 0,
  format_post INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indice único por día, community manager y proyecto
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_community_logs_date_cm_project 
ON daily_community_logs (date, cm_id, project_name);

-- RLS y políticas
ALTER TABLE daily_community_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Full access daily_community_logs" ON daily_community_logs;
CREATE POLICY "Full access daily_community_logs" ON daily_community_logs FOR ALL USING (true) WITH CHECK (true);

