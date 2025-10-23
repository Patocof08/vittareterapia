-- Add ON DELETE CASCADE to all patient/client related foreign keys

-- Update appointments table
ALTER TABLE public.appointments 
DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey,
ADD CONSTRAINT appointments_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Update client_subscriptions table
ALTER TABLE public.client_subscriptions 
DROP CONSTRAINT IF EXISTS client_subscriptions_client_id_fkey,
ADD CONSTRAINT client_subscriptions_client_id_fkey 
  FOREIGN KEY (client_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Update patient_preferences table
ALTER TABLE public.patient_preferences 
DROP CONSTRAINT IF EXISTS patient_preferences_user_id_fkey,
ADD CONSTRAINT patient_preferences_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Update session_clinical_notes table
ALTER TABLE public.session_clinical_notes 
DROP CONSTRAINT IF EXISTS session_clinical_notes_patient_id_fkey,
ADD CONSTRAINT session_clinical_notes_patient_id_fkey 
  FOREIGN KEY (patient_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;