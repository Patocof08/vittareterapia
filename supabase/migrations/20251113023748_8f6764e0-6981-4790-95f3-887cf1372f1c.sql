-- Asegurar que todas las funciones financieras sean VOLATILE

-- 1. recognize_session_revenue
CREATE OR REPLACE FUNCTION public.recognize_session_revenue(_appointment_id uuid)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _deferred_record RECORD;
  _admin_amount NUMERIC;
  _psychologist_amount NUMERIC;
  _admin_balance_before NUMERIC;
  _admin_balance_after NUMERIC;
  _psych_balance_before NUMERIC;
  _psych_balance_after NUMERIC;
  _admin_wallet_id UUID;
BEGIN
  -- Get deferred revenue record
  SELECT * INTO _deferred_record
  FROM public.deferred_revenue
  WHERE appointment_id = _appointment_id
  AND deferred_amount > 0
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calculate splits (15% admin, 85% psychologist)
  _admin_amount := _deferred_record.deferred_amount * 0.15;
  _psychologist_amount := _deferred_record.deferred_amount * 0.85;

  -- Get admin wallet
  SELECT id, balance INTO _admin_wallet_id, _admin_balance_before
  FROM public.admin_wallet
  LIMIT 1;

  -- Update admin wallet
  _admin_balance_after := _admin_balance_before + _admin_amount;
  UPDATE public.admin_wallet
  SET balance = _admin_balance_after,
      updated_at = now()
  WHERE id = _admin_wallet_id;

  -- Record admin transaction
  INSERT INTO public.wallet_transactions (
    transaction_type,
    wallet_type,
    psychologist_id,
    appointment_id,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    'revenue_recognition',
    'admin',
    _deferred_record.psychologist_id,
    _appointment_id,
    _admin_amount,
    _admin_balance_before,
    _admin_balance_after,
    'Comisión por sesión completada (15%)'
  );

  -- Get psychologist wallet balance
  SELECT balance INTO _psych_balance_before
  FROM public.psychologist_wallets
  WHERE psychologist_id = _deferred_record.psychologist_id;

  -- Update psychologist wallet
  _psych_balance_after := _psych_balance_before + _psychologist_amount;
  UPDATE public.psychologist_wallets
  SET balance = _psych_balance_after,
      updated_at = now()
  WHERE psychologist_id = _deferred_record.psychologist_id;

  -- Record psychologist transaction
  INSERT INTO public.wallet_transactions (
    transaction_type,
    wallet_type,
    psychologist_id,
    appointment_id,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    'revenue_recognition',
    'psychologist',
    _deferred_record.psychologist_id,
    _appointment_id,
    _psychologist_amount,
    _psych_balance_before,
    _psych_balance_after,
    'Pago por sesión completada (85%)'
  );

  -- Update deferred revenue
  UPDATE public.deferred_revenue
  SET recognized_amount = recognized_amount + _deferred_record.deferred_amount,
      deferred_amount = 0,
      updated_at = now()
  WHERE id = _deferred_record.id;
END;
$function$;

-- 2. create_deferred_revenue
CREATE OR REPLACE FUNCTION public.create_deferred_revenue(
  _psychologist_id uuid,
  _appointment_id uuid,
  _subscription_id uuid,
  _payment_id uuid,
  _amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _deferred_id UUID;
BEGIN
  -- Create deferred revenue entry
  INSERT INTO public.deferred_revenue (
    psychologist_id,
    appointment_id,
    subscription_id,
    payment_id,
    total_amount,
    deferred_amount
  ) VALUES (
    _psychologist_id,
    _appointment_id,
    _subscription_id,
    _payment_id,
    _amount,
    _amount
  )
  RETURNING id INTO _deferred_id;

  -- Ensure psychologist wallet exists
  INSERT INTO public.psychologist_wallets (psychologist_id, balance)
  VALUES (_psychologist_id, 0)
  ON CONFLICT (psychologist_id) DO NOTHING;

  RETURN _deferred_id;
END;
$function$;

-- 3. process_late_cancellation
CREATE OR REPLACE FUNCTION public.process_late_cancellation(
  _appointment_id uuid,
  _subscription_id uuid,
  _psychologist_id uuid
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Una cancelación tardía es como completar la sesión financieramente
  PERFORM recognize_session_revenue(_appointment_id);
  
  -- Marcar appointment como cancelled pero cobrado
  UPDATE appointments
  SET 
    status = 'cancelled',
    session_notes = COALESCE(session_notes, '') || ' [Cancelación tardía - sesión cobrada]'
  WHERE id = _appointment_id;
END;
$function$;