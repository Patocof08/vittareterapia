-- ============================================================
-- Tabla de reseñas: un cliente califica después de sesión completada
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  psychologist_id   UUID NOT NULL REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  patient_id        UUID NOT NULL,  -- auth user_id (sin FK por account deletion)
  rating            SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_psychologist ON public.reviews(psychologist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_patient      ON public.reviews(patient_id);

-- ============================================================
-- Vista para rating promedio por psicólogo (público)
-- ============================================================
CREATE OR REPLACE VIEW public.psychologist_ratings AS
SELECT
  psychologist_id,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating,
  COUNT(*)::int AS review_count
FROM public.reviews
GROUP BY psychologist_id;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT
  USING (true);

CREATE POLICY "patients_create_own_reviews" ON public.reviews
  FOR INSERT
  WITH CHECK (
    patient_id = (select auth.uid())
    AND appointment_id IN (
      SELECT id FROM public.appointments
      WHERE patient_id = (select auth.uid())
        AND status = 'completed'
    )
  );

CREATE POLICY "patients_update_own_reviews" ON public.reviews
  FOR UPDATE
  USING (patient_id = (select auth.uid()))
  WITH CHECK (patient_id = (select auth.uid()));

CREATE POLICY "service_role_manage_reviews" ON public.reviews
  FOR ALL
  USING ((select auth.role()) = 'service_role');
