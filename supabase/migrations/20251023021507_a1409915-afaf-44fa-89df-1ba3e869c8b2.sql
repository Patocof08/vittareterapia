-- Crear tabla para notas clínicas de sesión
CREATE TABLE public.session_clinical_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  psychologist_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  subjective_notes TEXT,
  objective_notes TEXT,
  assessment TEXT,
  plan TEXT,
  private_notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.session_clinical_notes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notas clínicas
CREATE POLICY "Psychologists can view their own clinical notes"
ON public.session_clinical_notes
FOR SELECT
USING (
  psychologist_id IN (
    SELECT id FROM psychologist_profiles 
    WHERE user_id = auth.uid() AND has_role(auth.uid(), 'psicologo')
  )
);

CREATE POLICY "Psychologists can insert their own clinical notes"
ON public.session_clinical_notes
FOR INSERT
WITH CHECK (
  psychologist_id IN (
    SELECT id FROM psychologist_profiles 
    WHERE user_id = auth.uid() AND has_role(auth.uid(), 'psicologo')
  )
);

CREATE POLICY "Psychologists can update their own clinical notes"
ON public.session_clinical_notes
FOR UPDATE
USING (
  psychologist_id IN (
    SELECT id FROM psychologist_profiles 
    WHERE user_id = auth.uid() AND has_role(auth.uid(), 'psicologo')
  )
);

CREATE POLICY "Psychologists can delete their own clinical notes"
ON public.session_clinical_notes
FOR DELETE
USING (
  psychologist_id IN (
    SELECT id FROM psychologist_profiles 
    WHERE user_id = auth.uid() AND has_role(auth.uid(), 'psicologo')
  )
);

-- Admins pueden ver todas las notas
CREATE POLICY "Admins can view all clinical notes"
ON public.session_clinical_notes
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Trigger para updated_at
CREATE TRIGGER update_session_clinical_notes_updated_at
BEFORE UPDATE ON public.session_clinical_notes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();