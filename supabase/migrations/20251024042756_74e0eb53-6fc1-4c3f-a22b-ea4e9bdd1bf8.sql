-- Update rollover calculation with package-specific rules
DROP FUNCTION IF EXISTS public.calculate_rollover_sessions(integer, integer);

CREATE OR REPLACE FUNCTION public.calculate_rollover_sessions(_sessions_total integer, _sessions_used integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _unused_sessions integer;
BEGIN
  -- Calculate unused sessions in current period
  _unused_sessions := _sessions_total - _sessions_used;
  
  -- Package of 4: if 3 or 4 sessions remain → rollover 1
  IF _sessions_total = 4 THEN
    IF _unused_sessions >= 3 THEN
      RETURN 1;
    END IF;
    RETURN 0;
  END IF;
  
  -- Package of 8: 
  -- if 7 or 8 sessions remain → rollover 2
  -- if 5 or 6 sessions remain → rollover 1
  IF _sessions_total = 8 THEN
    IF _unused_sessions >= 7 THEN
      RETURN 2;
    ELSIF _unused_sessions >= 5 THEN
      RETURN 1;
    END IF;
    RETURN 0;
  END IF;
  
  -- Default: no rollover for other package sizes
  RETURN 0;
END;
$$;

COMMENT ON FUNCTION public.calculate_rollover_sessions IS 'Package 4: 3-4 unused → 1 rollover. Package 8: 7-8 unused → 2 rollover, 5-6 unused → 1 rollover.';