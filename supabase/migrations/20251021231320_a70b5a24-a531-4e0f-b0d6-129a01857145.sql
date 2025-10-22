-- Fix document storage to use permanent paths instead of expiring signed URLs
-- Rename file_url to file_path and add metadata columns

ALTER TABLE public.psychologist_documents 
  RENAME COLUMN file_url TO file_path;

-- Add file metadata columns for better tracking
ALTER TABLE public.psychologist_documents
  ADD COLUMN file_size bigint,
  ADD COLUMN mime_type text;

-- Add comments for clarity
COMMENT ON COLUMN public.psychologist_documents.file_path IS 'Permanent storage path (e.g., user-id/document-timestamp.pdf)';
COMMENT ON COLUMN public.psychologist_documents.file_size IS 'File size in bytes';
COMMENT ON COLUMN public.psychologist_documents.mime_type IS 'MIME type of the uploaded file (e.g., application/pdf)';