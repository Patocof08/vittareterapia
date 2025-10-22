-- Drop trigger first, then recreate function with proper search_path

DROP TRIGGER IF EXISTS update_client_subscriptions_updated_at ON public.client_subscriptions;

-- Fix search_path for calculate_rollover function
DROP FUNCTION IF EXISTS calculate_rollover(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION calculate_rollover(
  _total_sessions INTEGER,
  _sessions_used INTEGER
) RETURNS NUMERIC 
LANGUAGE plpgsql 
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Rollover is 25% of TOTAL sessions if there are unused sessions
  IF (_total_sessions - _sessions_used) > 0 THEN
    RETURN (_total_sessions * 0.25);
  END IF;
  RETURN 0;
END;
$$;

-- Fix search_path for update_subscription_updated_at function
DROP FUNCTION IF EXISTS update_subscription_updated_at();

CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER update_client_subscriptions_updated_at
  BEFORE UPDATE ON public.client_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();