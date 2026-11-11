-- ============================================================
-- daily_design_logs
-- Registros diarios del rol "Diseñador AI" (plan de desatraso).
-- Alcance: Casa Luifer + Montana en el mismo registro diario.
-- Clave de conflicto para upsert: (date, designer_id)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.daily_design_logs (
  id              TEXT PRIMARY KEY,
  date            DATE NOT NULL,
  designer_id     TEXT NOT NULL,
  designer_name   TEXT NOT NULL,

  -- Casa Luifer
  format_cl_historias     INT NOT NULL DEFAULT 0,
  format_cl_movimiento    INT NOT NULL DEFAULT 0,
  notes_cl_historias      TEXT NOT NULL DEFAULT '',
  notes_cl_movimiento     TEXT NOT NULL DEFAULT '',

  -- Montana
  format_mt_historias     INT NOT NULL DEFAULT 0,
  format_mt_carruseles    INT NOT NULL DEFAULT 0,
  notes_mt_historias      TEXT NOT NULL DEFAULT '',
  notes_mt_carruseles     TEXT NOT NULL DEFAULT '',

  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unicidad por (día, diseñador) para que el upsert por onConflict funcione
CREATE UNIQUE INDEX IF NOT EXISTS daily_design_logs_date_designer_uk
  ON public.daily_design_logs (date, designer_id);

-- Índices de consulta frecuente
CREATE INDEX IF NOT EXISTS daily_design_logs_designer_idx
  ON public.daily_design_logs (designer_id);

CREATE INDEX IF NOT EXISTS daily_design_logs_date_idx
  ON public.daily_design_logs (date);

-- RLS: habilita y agrega las policies que correspondan a tu modelo.
-- Si tu proyecto ya usa el patrón de las otras tablas (daily_video_logs,
-- daily_community_logs), replica las mismas policies aquí.
-- ALTER TABLE public.daily_design_logs ENABLE ROW LEVEL SECURITY;
