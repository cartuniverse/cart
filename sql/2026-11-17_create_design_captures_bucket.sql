-- Bucket público para capturas de piezas gráficas del Diseñador AI
-- Ejecutar una sola vez desde el SQL Editor de Supabase

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'design-captures',
  'design-captures',
  true,
  10485760,  -- 10 MB máx por archivo
  ARRAY['image/jpeg','image/jpg','image/png','image/gif','image/webp','image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública (para mostrar thumbnails sin auth)
CREATE POLICY "Public read design captures"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'design-captures');

-- Subida sin restricción de usuario (anon y authenticated)
CREATE POLICY "Allow insert design captures"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'design-captures');

-- Eliminación (para borrar capturas desde la UI)
CREATE POLICY "Allow delete design captures"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'design-captures');
