-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  psychologist_id UUID NOT NULL REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
  modality TEXT NOT NULL CHECK (modality IN ('Videollamada', 'Presencial')),
  session_notes TEXT,
  video_link TEXT,
  cancellation_reason TEXT,
  cancelled_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT no_overlapping_times CHECK (end_time > start_time)
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Patients can view their own appointments
CREATE POLICY "Patients can view their own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (auth.uid() = patient_id);

-- Patients can insert their own appointments
CREATE POLICY "Patients can insert their own appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = patient_id);

-- Patients can update their own appointments (for cancellation/rescheduling)
CREATE POLICY "Patients can update their own appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (auth.uid() = patient_id);

-- Psychologists can view appointments for their sessions
CREATE POLICY "Psychologists can view their appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  psychologist_id IN (
    SELECT id FROM public.psychologist_profiles 
    WHERE user_id = auth.uid() AND has_role(auth.uid(), 'psicologo')
  )
);

-- Psychologists can update their appointments (confirm, complete, cancel)
CREATE POLICY "Psychologists can update their appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  psychologist_id IN (
    SELECT id FROM public.psychologist_profiles 
    WHERE user_id = auth.uid() AND has_role(auth.uid(), 'psicologo')
  )
);

-- Admins can view all appointments
CREATE POLICY "Admins can view all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_psychologist ON public.appointments(psychologist_id);
CREATE INDEX idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_appointments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_appointments_updated_at();