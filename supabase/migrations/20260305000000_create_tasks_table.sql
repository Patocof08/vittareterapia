-- ============================================================
-- Tabla de tareas: psicólogo asigna, cliente completa
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL,  -- auth user_id del cliente (sin FK por account deletion)
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para queries frecuentes
CREATE INDEX IF NOT EXISTS idx_tasks_psychologist ON public.tasks(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_tasks_patient      ON public.tasks(patient_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status       ON public.tasks(status);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_tasks_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Psicólogo: CRUD sobre sus propias tareas
CREATE POLICY "psychologists_manage_own_tasks" ON public.tasks
  FOR ALL
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles WHERE user_id = auth.uid()
    )
  );

-- Cliente: puede ver sus tareas y actualizar status
CREATE POLICY "patients_view_own_tasks" ON public.tasks
  FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "patients_update_own_tasks" ON public.tasks
  FOR UPDATE
  USING (patient_id = auth.uid())
  WITH CHECK (patient_id = auth.uid());

-- Service role: todo
CREATE POLICY "service_role_manage_tasks" ON public.tasks
  FOR ALL
  USING (auth.role() = 'service_role');
