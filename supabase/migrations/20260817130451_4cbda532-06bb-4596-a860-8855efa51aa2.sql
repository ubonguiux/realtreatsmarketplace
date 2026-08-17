
CREATE POLICY "marketplace_read" ON storage.objects FOR SELECT USING (bucket_id = 'marketplace');
CREATE POLICY "marketplace_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'marketplace' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "marketplace_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'marketplace' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "marketplace_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'marketplace' AND (storage.foldername(name))[1] = auth.uid()::text);
