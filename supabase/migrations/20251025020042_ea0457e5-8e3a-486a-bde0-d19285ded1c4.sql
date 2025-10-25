-- Actualizar función de rollover para calcular 25% del total
-- cuando hay sesiones sin usar
DROP FUNCTION IF EXISTS public.calculate_rollover_sessions(integer, integer);

CREATE OR REPLACE FUNCTION public.calculate_rollover_sessions(_sessions_total integer, _sessions_used integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _unused_sessions integer;
  _rollover_amount integer;
BEGIN
  -- Calcular sesiones sin usar en el período actual
  _unused_sessions := _sessions_total - _sessions_used;
  
  -- Si no hay sesiones sin usar, no hay rollover
  IF _unused_sessions <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Calcular 25% del total de sesiones (redondeado)
  -- Paquete de 4: 25% = 1 sesión
  -- Paquete de 8: 25% = 2 sesiones
  _rollover_amount := ROUND(_sessions_total * 0.25);
  
  -- El rollover no puede ser mayor a las sesiones sin usar
  IF _rollover_amount > _unused_sessions THEN
    RETURN _unused_sessions;
  END IF;
  
  RETURN _rollover_amount;
END;
$$;