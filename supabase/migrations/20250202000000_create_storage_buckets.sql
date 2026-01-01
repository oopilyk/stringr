-- Create storage bucket for request photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-photos', 'request-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload request photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to request photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own request photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own request photos" ON storage.objects;

-- Policy: Allow authenticated users to upload to request-photos
CREATE POLICY "Authenticated users can upload request photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'request-photos');

-- Policy: Allow public read access to request photos
CREATE POLICY "Public read access to request photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'request-photos');

-- Policy: Allow users to update their own photos
CREATE POLICY "Users can update their own request photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'request-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Allow users to delete their own photos
CREATE POLICY "Users can delete their own request photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'request-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
