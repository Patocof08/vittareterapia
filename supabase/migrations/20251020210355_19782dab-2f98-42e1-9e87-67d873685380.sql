-- Create enums
CREATE TYPE document_type AS ENUM ('license', 'id', 'certificate', 'address_proof');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Create psychologist_profiles table
CREATE TABLE public.psychologist_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  country TEXT,
  languages TEXT[] DEFAULT ARRAY[]::TEXT[],
  modalities TEXT[] DEFAULT ARRAY[]::TEXT[],
  profile_photo_url TEXT,
  years_experience INTEGER,
  therapeutic_approaches TEXT[] DEFAULT ARRAY[]::TEXT[],
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],
  populations TEXT[] DEFAULT ARRAY[]::TEXT[],
  bio_short TEXT,
  bio_extended TEXT,
  onboarding_step INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT FALSE,
  verification_status verification_status DEFAULT 'pending',
  verification_notes TEXT,
  terms_accepted BOOLEAN DEFAULT FALSE,
  emergency_disclaimer_accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create psychologist_documents table
CREATE TABLE public.psychologist_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  status verification_status DEFAULT 'pending',
  rejection_reason TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Create psychologist_availability table
CREATE TABLE public.psychologist_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_exception BOOLEAN DEFAULT FALSE,
  exception_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create psychologist_pricing table
CREATE TABLE public.psychologist_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL UNIQUE REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  session_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MXN',
  package_4_price DECIMAL(10,2),
  package_8_price DECIMAL(10,2),
  first_session_price DECIMAL(10,2),
  cancellation_policy TEXT,
  refund_policy TEXT,
  late_tolerance_minutes INTEGER DEFAULT 10,
  minimum_notice_hours INTEGER DEFAULT 24,
  reschedule_window_hours INTEGER DEFAULT 24,
  session_duration_minutes INTEGER DEFAULT 50,
  fiscal_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.psychologist_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychologist_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychologist_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychologist_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies for psychologist_profiles
CREATE POLICY "Psychologists can view their own profile"
  ON public.psychologist_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Psychologists can insert their own profile"
  ON public.psychologist_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Psychologists can update their own profile"
  ON public.psychologist_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Published profiles are viewable by everyone"
  ON public.psychologist_profiles FOR SELECT
  USING (is_published = TRUE);

-- RLS Policies for psychologist_documents
CREATE POLICY "Psychologists can view their own documents"
  ON public.psychologist_documents FOR SELECT
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Psychologists can insert their own documents"
  ON public.psychologist_documents FOR INSERT
  WITH CHECK (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Psychologists can delete their own documents"
  ON public.psychologist_documents FOR DELETE
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for psychologist_availability
CREATE POLICY "Psychologists can manage their own availability"
  ON public.psychologist_availability FOR ALL
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Published psychologists availability is viewable"
  ON public.psychologist_availability FOR SELECT
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles WHERE is_published = TRUE
    )
  );

-- RLS Policies for psychologist_pricing
CREATE POLICY "Psychologists can manage their own pricing"
  ON public.psychologist_pricing FOR ALL
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Published psychologists pricing is viewable"
  ON public.psychologist_pricing FOR SELECT
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles WHERE is_published = TRUE
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_psychologist_profiles_updated_at
  BEFORE UPDATE ON public.psychologist_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_psychologist_pricing_updated_at
  BEFORE UPDATE ON public.psychologist_pricing
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for psychologist files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('psychologist-files', 'psychologist-files', false);

-- Storage policies
CREATE POLICY "Psychologists can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'psychologist-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Psychologists can view their own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'psychologist-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Psychologists can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'psychologist-files' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );