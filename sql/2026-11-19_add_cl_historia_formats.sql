-- Agrega Historia de producto e Historia interactiva de Casa Luifer al registro diario del diseñador
ALTER TABLE public.daily_design_logs
  ADD COLUMN IF NOT EXISTS format_cl_historia_producto   INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS format_cl_historia_interactiva INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes_cl_historia_producto    TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes_cl_historia_interactiva TEXT NOT NULL DEFAULT '';
