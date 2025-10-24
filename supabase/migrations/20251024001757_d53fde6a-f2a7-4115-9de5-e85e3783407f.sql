-- Add foreign key constraint for psychologist_id
ALTER TABLE public.client_credits
  DROP CONSTRAINT IF EXISTS client_credits_psychologist_id_fkey;

ALTER TABLE public.client_credits
  ADD CONSTRAINT client_credits_psychologist_id_fkey
  FOREIGN KEY (psychologist_id)
  REFERENCES public.psychologist_profiles(id)
  ON DELETE CASCADE;