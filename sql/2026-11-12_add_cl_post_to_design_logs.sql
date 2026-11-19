-- Migración: agrega formato "Post" (CL) al plan de desatraso del Diseñador AI
-- Si la tabla ya existe, ejecuta solo este archivo.

ALTER TABLE public.daily_design_logs
  ADD COLUMN IF NOT EXISTS format_cl_post  INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes_cl_post   TEXT NOT NULL DEFAULT '';
