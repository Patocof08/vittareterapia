-- ================================================================
-- Session transcripts table + Daily.co columns on appointments
-- These were created directly in the DB; migration added for tracking
-- ================================================================

-- 1. Add Daily.co video room columns to appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS daily_room_name    TEXT,
  ADD COLUMN IF NOT EXISTS daily_room_url     TEXT,
  ADD COLUMN IF NOT EXISTS daily_recording_id TEXT,
  ADD COLUMN IF NOT EXISTS daily_transcript_id TEXT;

-- 2. Session transcripts table (AI-processed transcripts from Daily.co)
CREATE TABLE IF NOT EXISTS public.session_transcripts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id        UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  psychologist_id       UUID NOT NULL,
  patient_id            UUID NOT NULL,
  transcript_raw        TEXT,
  transcript_format     TEXT,
  ai_summary            TEXT,
  ai_clinical_notes     JSONB,
  ai_key_topics         TEXT[],
  ai_risk_indicators    TEXT[],
  ai_patient_tasks      TEXT[],
  ai_followup_suggestions TEXT[],
  ai_progress_notes     TEXT,
  ai_model              TEXT,
  duration_minutes      INTEGER,
  word_count            INTEGER,
  language              TEXT DEFAULT 'es',
  status                TEXT DEFAULT 'pending',
  error_message         TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS: psychologist can read their own session transcripts
ALTER TABLE public.session_transcripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "psychologist_read_own_transcripts" ON public.session_transcripts;
DROP POLICY IF EXISTS "service_role_all_transcripts"      ON public.session_transcripts;

-- psychologist_id = psychologist_profiles.id (NOT auth.uid()), so must join
CREATE POLICY "psychologists_view_own_transcripts" ON public.session_transcripts
  FOR SELECT
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles WHERE user_id = auth.uid()
    )
  );

-- patient_id = auth.uid() directly
CREATE POLICY "patients_view_own_transcripts" ON public.session_transcripts
  FOR SELECT
  USING (patient_id = auth.uid());

-- Service role (edge functions) can do everything
CREATE POLICY "service_role_manage_transcripts" ON public.session_transcripts
  FOR ALL
  USING (auth.role() = 'service_role');
