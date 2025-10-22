-- Fix 1: Update psychologist_profiles policies to add role validation
DROP POLICY IF EXISTS "Psychologists can insert their own profile" ON public.psychologist_profiles;
DROP POLICY IF EXISTS "Psychologists can update their own profile" ON public.psychologist_profiles;
DROP POLICY IF EXISTS "Psychologists can view their own profile" ON public.psychologist_profiles;

CREATE POLICY "Psychologists can insert their own profile"
  ON public.psychologist_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    public.has_role(auth.uid(), 'psicologo')
  );

CREATE POLICY "Psychologists can update their own profile"
  ON public.psychologist_profiles FOR UPDATE
  USING (
    auth.uid() = user_id AND
    public.has_role(auth.uid(), 'psicologo')
  );

CREATE POLICY "Psychologists can view their own profile"
  ON public.psychologist_profiles FOR SELECT
  USING (
    auth.uid() = user_id AND
    public.has_role(auth.uid(), 'psicologo')
  );

CREATE POLICY "Psychologists can delete their own profile"
  ON public.psychologist_profiles FOR DELETE
  USING (
    auth.uid() = user_id AND
    public.has_role(auth.uid(), 'psicologo')
  );

-- Fix 2: Add role validation to related tables
DROP POLICY IF EXISTS "Psychologists can insert their own documents" ON public.psychologist_documents;
DROP POLICY IF EXISTS "Psychologists can view their own documents" ON public.psychologist_documents;
DROP POLICY IF EXISTS "Psychologists can delete their own documents" ON public.psychologist_documents;

CREATE POLICY "Psychologists can insert their own documents"
  ON public.psychologist_documents FOR INSERT
  WITH CHECK (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles 
      WHERE user_id = auth.uid() AND public.has_role(auth.uid(), 'psicologo')
    )
  );

CREATE POLICY "Psychologists can view their own documents"
  ON public.psychologist_documents FOR SELECT
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles 
      WHERE user_id = auth.uid() AND public.has_role(auth.uid(), 'psicologo')
    )
  );

CREATE POLICY "Psychologists can delete their own documents"
  ON public.psychologist_documents FOR DELETE
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles 
      WHERE user_id = auth.uid() AND public.has_role(auth.uid(), 'psicologo')
    )
  );

-- Fix 3: Add role validation to availability table
DROP POLICY IF EXISTS "Psychologists can manage their own availability" ON public.psychologist_availability;

CREATE POLICY "Psychologists can insert their own availability"
  ON public.psychologist_availability FOR INSERT
  WITH CHECK (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles 
      WHERE user_id = auth.uid() AND public.has_role(auth.uid(), 'psicologo')
    )
  );

CREATE POLICY "Psychologists can view their own availability"
  ON public.psychologist_availability FOR SELECT
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles 
      WHERE user_id = auth.uid() AND public.has_role(auth.uid(), 'psicologo')
    )
  );

CREATE POLICY "Psychologists can update their own availability"
  ON public.psychologist_availability FOR UPDATE
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles 
      WHERE user_id = auth.uid() AND public.has_role(auth.uid(), 'psicologo')
    )
  );

CREATE POLICY "Psychologists can delete their own availability"
  ON public.psychologist_availability FOR DELETE
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles 
      WHERE user_id = auth.uid() AND public.has_role(auth.uid(), 'psicologo')
    )
  );

-- Fix 4: Add role validation to pricing table
DROP POLICY IF EXISTS "Psychologists can manage their own pricing" ON public.psychologist_pricing;

CREATE POLICY "Psychologists can upsert their own pricing"
  ON public.psychologist_pricing FOR INSERT
  WITH CHECK (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles 
      WHERE user_id = auth.uid() AND public.has_role(auth.uid(), 'psicologo')
    )
  );

CREATE POLICY "Psychologists can view their own pricing"
  ON public.psychologist_pricing FOR SELECT
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles 
      WHERE user_id = auth.uid() AND public.has_role(auth.uid(), 'psicologo')
    )
  );

CREATE POLICY "Psychologists can update their own pricing"
  ON public.psychologist_pricing FOR UPDATE
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles 
      WHERE user_id = auth.uid() AND public.has_role(auth.uid(), 'psicologo')
    )
  );

-- Fix 5: Prevent role modification by users
CREATE POLICY "Users cannot update roles"
  ON public.user_roles FOR UPDATE
  USING (false);

CREATE POLICY "Users cannot delete roles"
  ON public.user_roles FOR DELETE
  USING (false);

-- Fix 6: Add DELETE policy to profiles table
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Fix 7: Add database constraints for input validation
ALTER TABLE public.psychologist_profiles
  ADD CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  ADD CONSTRAINT bio_short_length CHECK (char_length(bio_short) <= 400),
  ADD CONSTRAINT bio_extended_length CHECK (char_length(bio_extended) <= 1200),
  ADD CONSTRAINT years_experience_valid CHECK (years_experience >= 0 AND years_experience <= 70),
  ADD CONSTRAINT first_name_length CHECK (char_length(first_name) <= 100),
  ADD CONSTRAINT last_name_length CHECK (char_length(last_name) <= 100),
  ADD CONSTRAINT city_length CHECK (char_length(city) <= 100),
  ADD CONSTRAINT country_length CHECK (char_length(country) <= 100);