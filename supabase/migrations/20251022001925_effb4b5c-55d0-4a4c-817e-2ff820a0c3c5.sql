-- Add RLS policies for storage.objects to secure psychologist-files bucket

-- Policy 1: Block anonymous access - only authenticated users can access
CREATE POLICY "Block anonymous access to psychologist files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'psychologist-files' 
  AND auth.role() = 'authenticated'
);

-- Policy 2: Admins and document owners can read files
CREATE POLICY "Admins and owners can read psychologist documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'psychologist-files' 
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Policy 3: Only psychologists can upload to their own folder
CREATE POLICY "Psychologists can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'psychologist-files'
  AND has_role(auth.uid(), 'psicologo'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Only psychologists can update/delete their own files
CREATE POLICY "Psychologists can update own files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'psychologist-files'
  AND has_role(auth.uid(), 'psicologo'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Psychologists can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'psychologist-files'
  AND has_role(auth.uid(), 'psicologo'::app_role)
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 5: Admins can manage all files
CREATE POLICY "Admins can update psychologist files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'psychologist-files'
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete psychologist files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'psychologist-files'
  AND has_role(auth.uid(), 'admin'::app_role)
);