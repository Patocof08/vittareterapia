-- therapist_calendar_blocks: bloques de tiempo en el calendario del psicólogo
-- Soporta bloqueos de horario ("blocked") y citas externas ("external")
-- Pueden ser recurrentes (día de la semana) o de fecha específica

CREATE TABLE public.therapist_calendar_blocks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  block_type     TEXT NOT NULL CHECK (block_type IN ('external', 'blocked')),
  label          TEXT,
  start_time     TIME NOT NULL,
  end_time       TIME NOT NULL,
  is_recurring   BOOLEAN NOT NULL DEFAULT true,
  day_of_week    INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  specific_date  DATE,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Si es recurrente debe tener día de semana; si no, debe tener fecha específica
  CONSTRAINT recurring_xor_specific CHECK (
    (is_recurring = true  AND day_of_week IS NOT NULL AND specific_date IS NULL) OR
    (is_recurring = false AND specific_date IS NOT NULL AND day_of_week IS NULL)
  )
);

ALTER TABLE public.therapist_calendar_blocks ENABLE ROW LEVEL SECURITY;

-- El psicólogo puede insertar sus propios bloques
CREATE POLICY "Psychologists can insert their own calendar blocks"
  ON public.therapist_calendar_blocks FOR INSERT
  WITH CHECK (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles
      WHERE user_id = auth.uid() AND public.has_role(auth.uid(), 'psicologo')
    )
  );

-- El psicólogo puede ver sus propios bloques
CREATE POLICY "Psychologists can view their own calendar blocks"
  ON public.therapist_calendar_blocks FOR SELECT
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles
      WHERE user_id = auth.uid()
    )
  );

-- El psicólogo puede eliminar sus propios bloques
CREATE POLICY "Psychologists can delete their own calendar blocks"
  ON public.therapist_calendar_blocks FOR DELETE
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles
      WHERE user_id = auth.uid() AND public.has_role(auth.uid(), 'psicologo')
    )
  );
