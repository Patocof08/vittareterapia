-- Update get_therapist_patients to only count completed sessions
CREATE OR REPLACE FUNCTION public.get_therapist_patients()
RETURNS TABLE(
  patient_id uuid,
  full_name text,
  avatar_url text,
  email text,
  session_count integer,
  last_session timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select
    a.patient_id,
    p.full_name,
    p.avatar_url,
    p.email,
    count(*) FILTER (WHERE a.status = 'completed')::int as session_count,
    max(a.start_time) as last_session
  from public.appointments a
  join public.profiles p on p.id = a.patient_id
  where a.psychologist_id in (
    select id from public.psychologist_profiles
    where public.psychologist_profiles.user_id = auth.uid()
      and public.has_role(auth.uid(), 'psicologo')
  )
  group by a.patient_id, p.full_name, p.avatar_url, p.email
$function$;