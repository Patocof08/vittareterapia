-- Agregar 'admin' al enum de roles
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin';

-- Asegurar que las funciones de verificación existan y funcionen correctamente
-- (ya están creadas según el contexto, pero verificamos que estén actualizadas)

-- Crear índices para mejorar el rendimiento de consultas admin
CREATE INDEX IF NOT EXISTS idx_psychologist_profiles_verification_status 
ON psychologist_profiles(verification_status);

CREATE INDEX IF NOT EXISTS idx_psychologist_profiles_created_at 
ON psychologist_profiles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_psychologist_documents_psychologist_id 
ON psychologist_documents(psychologist_id);

CREATE INDEX IF NOT EXISTS idx_psychologist_verifications_psychologist_id 
ON psychologist_verifications(psychologist_id, created_at DESC);

-- Agregar política para que admins puedan ver todos los user_roles
CREATE POLICY "Admins can view all user roles"
ON user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Comentario sobre seguridad: Los documentos ya tienen políticas RLS que permiten
-- a los admins verlos (policy "Admins can view all documents")