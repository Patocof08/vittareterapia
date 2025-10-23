-- Allow psychologists to view profiles of their patients
CREATE POLICY "Psychologists can view their patients profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT DISTINCT a.patient_id
    FROM public.appointments a
    WHERE a.psychologist_id IN (
      SELECT pp.id 
      FROM public.psychologist_profiles pp
      WHERE pp.user_id = auth.uid()
    )
  )
);