-- Crear tabla de auditoría de verificaciones
CREATE TABLE IF NOT EXISTS public.psychologist_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id uuid NOT NULL REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  previous_status verification_status NOT NULL,
  new_status verification_status NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.psychologist_verifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tabla de verificaciones
CREATE POLICY "Admins can view all verifications"
  ON public.psychologist_verifications
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert verifications"
  ON public.psychologist_verifications
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Políticas adicionales para que admins puedan ver todos los perfiles y documentos
CREATE POLICY "Admins can view all psychologist profiles"
  ON public.psychologist_profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update psychologist profiles"
  ON public.psychologist_profiles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all documents"
  ON public.psychologist_documents
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update document status"
  ON public.psychologist_documents
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Función para aprobar psicólogo (actualiza estado y registra auditoría)
CREATE OR REPLACE FUNCTION public.approve_psychologist(
  _psychologist_id uuid,
  _admin_notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _previous_status verification_status;
BEGIN
  -- Verificar que quien llama es admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden aprobar psicólogos';
  END IF;

  -- Obtener estado anterior
  SELECT verification_status INTO _previous_status
  FROM psychologist_profiles
  WHERE id = _psychologist_id;

  -- Actualizar perfil a aprobado y publicado
  UPDATE psychologist_profiles
  SET 
    verification_status = 'approved',
    is_published = true,
    verification_notes = _admin_notes
  WHERE id = _psychologist_id;

  -- Registrar auditoría
  INSERT INTO psychologist_verifications (
    psychologist_id,
    admin_id,
    previous_status,
    new_status,
    notes
  ) VALUES (
    _psychologist_id,
    auth.uid(),
    _previous_status,
    'approved',
    _admin_notes
  );
END;
$$;

-- Función para rechazar psicólogo
CREATE OR REPLACE FUNCTION public.reject_psychologist(
  _psychologist_id uuid,
  _rejection_reason text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _previous_status verification_status;
BEGIN
  -- Verificar que quien llama es admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden rechazar psicólogos';
  END IF;

  -- Obtener estado anterior
  SELECT verification_status INTO _previous_status
  FROM psychologist_profiles
  WHERE id = _psychologist_id;

  -- Actualizar perfil a rechazado y despublicar
  UPDATE psychologist_profiles
  SET 
    verification_status = 'rejected',
    is_published = false,
    verification_notes = _rejection_reason
  WHERE id = _psychologist_id;

  -- Registrar auditoría
  INSERT INTO psychologist_verifications (
    psychologist_id,
    admin_id,
    previous_status,
    new_status,
    notes
  ) VALUES (
    _psychologist_id,
    auth.uid(),
    _previous_status,
    'rejected',
    _rejection_reason
  );
END;
$$;