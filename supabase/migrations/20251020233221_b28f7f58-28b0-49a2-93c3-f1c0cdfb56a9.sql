-- Create table for patient quiz preferences
CREATE TABLE public.patient_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What they want to work on
  main_concern text NOT NULL,
  main_concern_other text,
  
  -- Therapist style preferences
  accompaniment_style text NOT NULL, -- 'practical', 'conversational', 'balanced'
  session_expectations text NOT NULL, -- 'tools', 'understanding', 'relationships', 'specific_change'
  work_comfort text NOT NULL, -- 'step_by_step', 'deep', 'mixed'
  accepts_homework text NOT NULL, -- 'yes', 'sometimes', 'no'
  
  -- Availability and logistics
  preferred_time_slots text[] NOT NULL DEFAULT ARRAY[]::text[], -- 'morning', 'afternoon', 'evening', 'weekend'
  budget_min numeric,
  budget_max numeric,
  
  -- Personal preferences (optional)
  gender_preference text, -- 'female', 'male', 'any'
  wants_inclusive boolean DEFAULT false,
  context_preference text[], -- 'work', 'parental', 'student', etc.
  
  -- Urgency
  urgency text NOT NULL DEFAULT 'normal', -- 'normal', 'urgent'
  
  -- Language and modality
  preferred_language text NOT NULL,
  modality text NOT NULL, -- 'video', 'mixed'
  
  -- Active preferences flag
  is_active boolean DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.patient_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for patient_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.patient_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.patient_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.patient_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.patient_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_patient_preferences_updated_at
  BEFORE UPDATE ON public.patient_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();