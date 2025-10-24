-- Update the rollover calculation function to be clearer
-- Rollover is 25% of the BASE subscription sessions (sessions_total)
-- NOT accumulated from previous periods

DROP FUNCTION IF EXISTS public.calculate_rollover(integer, integer);

CREATE OR REPLACE FUNCTION public.calculate_rollover_sessions(_sessions_total integer, _sessions_used integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _unused_sessions integer;
  _max_rollover integer;
BEGIN
  -- Calculate unused sessions in current period
  _unused_sessions := _sessions_total - _sessions_used;
  
  -- Max rollover is 25% of BASE subscription (sessions_total), rounded down
  _max_rollover := FLOOR(_sessions_total * 0.25);
  
  -- Return the LESSER of: unused sessions OR max rollover allowed
  -- This ensures rollover never exceeds 25% of base subscription
  IF _unused_sessions > 0 THEN
    RETURN LEAST(_unused_sessions, _max_rollover);
  END IF;
  
  RETURN 0;
END;
$$;

COMMENT ON FUNCTION public.calculate_rollover_sessions IS 'Calculates rollover sessions based on unused sessions, capped at 25% of base subscription. Rollover does NOT accumulate across periods.';