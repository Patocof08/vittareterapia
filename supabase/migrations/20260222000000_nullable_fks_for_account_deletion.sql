-- Allow profile/psychologist deletion while preserving financial audit trail.
-- Change ON DELETE CASCADE → ON DELETE SET NULL so that deleting a user's
-- profile keeps their payment and appointment records (with NULLed FKs).

-- 1. appointments.patient_id: make nullable + ON DELETE SET NULL
ALTER TABLE public.appointments
  ALTER COLUMN patient_id DROP NOT NULL;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey,
  ADD CONSTRAINT appointments_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. appointments.psychologist_id: make nullable + ON DELETE SET NULL
ALTER TABLE public.appointments
  ALTER COLUMN psychologist_id DROP NOT NULL;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_psychologist_id_fkey,
  ADD CONSTRAINT appointments_psychologist_id_fkey
    FOREIGN KEY (psychologist_id) REFERENCES public.psychologist_profiles(id) ON DELETE SET NULL;

-- 3. payments.client_id: make nullable + ON DELETE SET NULL
ALTER TABLE public.payments
  ALTER COLUMN client_id DROP NOT NULL;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS fk_payment_client,
  ADD CONSTRAINT fk_payment_client
    FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. payments.psychologist_id: make nullable + ON DELETE SET NULL
ALTER TABLE public.payments
  ALTER COLUMN psychologist_id DROP NOT NULL;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS fk_payment_psychologist,
  ADD CONSTRAINT fk_payment_psychologist
    FOREIGN KEY (psychologist_id) REFERENCES public.psychologist_profiles(id) ON DELETE SET NULL;

-- 5. Clean up any existing ghost "Cuenta eliminada" profiles
DELETE FROM public.profiles WHERE full_name ILIKE 'Cuenta eliminada%';
