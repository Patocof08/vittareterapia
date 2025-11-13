-- =====================================================
-- NUEVA LÓGICA FINANCIERA
-- =====================================================

-- 1. Actualizar process_single_session_payment: TODO va a diferido primero
CREATE OR REPLACE FUNCTION public.process_single_session_payment(
  _payment_id uuid,
  _appointment_id uuid,
  _psychologist_id uuid,
  _total_amount numeric
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _subscription_id UUID;
  _client_id UUID;
BEGIN
  -- Obtener client_id del appointment
  SELECT patient_id INTO _client_id
  FROM appointments
  WHERE id = _appointment_id;

  -- Crear una "suscripción" temporal de 1 sesión para trackear el ingreso diferido
  INSERT INTO client_subscriptions (
    client_id,
    psychologist_id,
    package_type,
    session_price,
    discount_percentage,
    sessions_total,
    sessions_used,
    sessions_remaining,
    current_period_start,
    current_period_end,
    status,
    auto_renew
  ) VALUES (
    _client_id,
    _psychologist_id,
    'single_session',
    _total_amount,
    0,
    1,
    0,
    1,
    now(),
    now() + interval '30 days',
    'active',
    false
  )
  RETURNING id INTO _subscription_id;

  -- Vincular el appointment a la suscripción temporal
  UPDATE appointments
  SET subscription_id = _subscription_id
  WHERE id = _appointment_id;

  -- TODO EL MONTO va a ingreso diferido (pasivo)
  INSERT INTO deferred_revenue (
    subscription_id,
    total_amount,
    deferred_amount,
    recognized_amount,
    sessions_total,
    sessions_recognized,
    price_per_session
  ) VALUES (
    _subscription_id,
    _total_amount,
    _total_amount,
    0,
    1,
    0,
    _total_amount
  );

  -- Crear wallet del psicólogo si no existe
  INSERT INTO psychologist_wallets (psychologist_id, balance, pending_balance)
  VALUES (_psychologist_id, 0, 0)
  ON CONFLICT (psychologist_id) DO NOTHING;
END;
$function$;

-- 2. Actualizar process_package_purchase: TODO va a diferido (ya lo hace, solo ajustar comentarios)
CREATE OR REPLACE FUNCTION public.process_package_purchase(
  _subscription_id uuid,
  _payment_id uuid,
  _psychologist_id uuid,
  _total_amount numeric,
  _sessions_total integer,
  _discount_percentage integer DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _price_per_session NUMERIC;
BEGIN
  -- Calcular precio por sesión
  _price_per_session := _total_amount / _sessions_total;

  -- TODO EL MONTO va a ingreso diferido (pasivo)
  INSERT INTO deferred_revenue (
    subscription_id,
    total_amount,
    deferred_amount,
    recognized_amount,
    sessions_total,
    sessions_recognized,
    price_per_session
  ) VALUES (
    _subscription_id,
    _total_amount,
    _total_amount,
    0,
    _sessions_total,
    0,
    _price_per_session
  );

  -- Crear wallet del psicólogo si no existe
  INSERT INTO psychologist_wallets (psychologist_id, balance, pending_balance)
  VALUES (_psychologist_id, 0, 0)
  ON CONFLICT (psychologist_id) DO NOTHING;
END;
$function$;

-- 3. Nueva función recognize_session_revenue con splits correctos
CREATE OR REPLACE FUNCTION public.recognize_session_revenue(
  _appointment_id uuid,
  _subscription_id uuid,
  _psychologist_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _price_per_session NUMERIC;
  _deferred_before NUMERIC;
  _deferred_after NUMERIC;
  _sessions_total INTEGER;
  _package_type TEXT;
  _admin_commission NUMERIC;
  _psychologist_amount NUMERIC;
  _admin_balance_before NUMERIC;
  _admin_balance_after NUMERIC;
  _admin_wallet_id UUID;
  _psych_balance_before NUMERIC;
  _psych_balance_after NUMERIC;
  _psych_wallet_id UUID;
  _deferred_id UUID;
BEGIN
  -- Obtener información del ingreso diferido y tipo de paquete
  SELECT 
    dr.id,
    dr.price_per_session,
    dr.deferred_amount,
    dr.sessions_total,
    cs.package_type
  INTO 
    _deferred_id,
    _price_per_session,
    _deferred_before,
    _sessions_total,
    _package_type
  FROM deferred_revenue dr
  JOIN client_subscriptions cs ON cs.id = dr.subscription_id
  WHERE dr.subscription_id = _subscription_id;

  IF _deferred_id IS NULL THEN
    RETURN;
  END IF;

  -- Calcular splits según tipo de paquete
  IF _package_type = 'single_session' THEN
    -- Sesión individual: 15% admin, 85% psicólogo
    _admin_commission := _price_per_session * 0.15;
    _psychologist_amount := _price_per_session * 0.85;
  ELSIF _package_type = 'package_4' THEN
    -- Paquete 4: 5% admin, 95% psicólogo
    _admin_commission := _price_per_session * 0.05;
    _psychologist_amount := _price_per_session * 0.95;
  ELSIF _package_type = 'package_8' THEN
    -- Paquete 8: 0% admin, 100% psicólogo
    _admin_commission := 0;
    _psychologist_amount := _price_per_session;
  ELSE
    -- Default: 15% admin, 85% psicólogo
    _admin_commission := _price_per_session * 0.15;
    _psychologist_amount := _price_per_session * 0.85;
  END IF;

  -- Actualizar ingreso diferido
  _deferred_after := _deferred_before - _price_per_session;
  UPDATE deferred_revenue
  SET 
    deferred_amount = GREATEST(0, _deferred_after),
    recognized_amount = recognized_amount + _price_per_session,
    sessions_recognized = sessions_recognized + 1
  WHERE id = _deferred_id;

  -- Obtener/crear admin wallet
  SELECT id, balance INTO _admin_wallet_id, _admin_balance_before
  FROM admin_wallet
  LIMIT 1;

  IF _admin_wallet_id IS NULL THEN
    INSERT INTO admin_wallet (balance) VALUES (0)
    RETURNING id, balance INTO _admin_wallet_id, _admin_balance_before;
  END IF;

  -- Actualizar balance admin
  _admin_balance_after := _admin_balance_before + _admin_commission;
  UPDATE admin_wallet SET balance = _admin_balance_after WHERE id = _admin_wallet_id;

  -- Registrar transacción admin
  INSERT INTO wallet_transactions (
    transaction_type,
    wallet_type,
    subscription_id,
    appointment_id,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    'session_completed',
    'admin',
    _subscription_id,
    _appointment_id,
    _admin_commission,
    _admin_balance_before,
    _admin_balance_after,
    'Comisión por sesión completada (' || _package_type || ')'
  );

  -- Obtener wallet del psicólogo
  SELECT id, balance INTO _psych_wallet_id, _psych_balance_before
  FROM psychologist_wallets
  WHERE psychologist_id = _psychologist_id;

  -- Actualizar balance psicólogo
  _psych_balance_after := _psych_balance_before + _psychologist_amount;
  UPDATE psychologist_wallets
  SET balance = _psych_balance_after
  WHERE id = _psych_wallet_id;

  -- Registrar transacción psicólogo
  INSERT INTO wallet_transactions (
    transaction_type,
    wallet_type,
    psychologist_id,
    subscription_id,
    appointment_id,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    'session_completed',
    'psychologist',
    _psychologist_id,
    _subscription_id,
    _appointment_id,
    _psychologist_amount,
    _psych_balance_before,
    _psych_balance_after,
    'Pago por sesión completada (' || _package_type || ')'
  );
END;
$function$;

-- 4. Nueva función para cancelación con reembolso
CREATE OR REPLACE FUNCTION public.process_cancellation_with_refund(
  _appointment_id uuid,
  _subscription_id uuid,
  _payment_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _price_per_session NUMERIC;
  _deferred_before NUMERIC;
  _deferred_after NUMERIC;
BEGIN
  -- Obtener precio de la sesión del ingreso diferido
  SELECT price_per_session, deferred_amount
  INTO _price_per_session, _deferred_before
  FROM deferred_revenue
  WHERE subscription_id = _subscription_id;

  -- Reducir el ingreso diferido
  _deferred_after := _deferred_before - _price_per_session;
  UPDATE deferred_revenue
  SET deferred_amount = GREATEST(0, _deferred_after)
  WHERE subscription_id = _subscription_id;

  -- Marcar payment como refunded
  UPDATE payments
  SET payment_status = 'refunded'
  WHERE id = _payment_id;

  -- Aquí se debe integrar con el sistema de pagos real para hacer el reembolso
  -- Por ahora solo registramos la intención
END;
$function$;

-- 5. Nueva función para cancelación tardía (cobra la sesión)
CREATE OR REPLACE FUNCTION public.process_late_cancellation(
  _appointment_id uuid,
  _subscription_id uuid,
  _psychologist_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Una cancelación tardía es como completar la sesión financieramente
  PERFORM recognize_session_revenue(_appointment_id, _subscription_id, _psychologist_id);
  
  -- Marcar appointment como cancelled pero cobrado
  UPDATE appointments
  SET 
    status = 'cancelled',
    session_notes = COALESCE(session_notes, '') || ' [Cancelación tardía - sesión cobrada]'
  WHERE id = _appointment_id;
END;
$function$;

-- 6. Nueva función para expiración de créditos (mueve diferido a admin)
CREATE OR REPLACE FUNCTION public.expire_client_credit(
  _credit_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  _original_appointment_id UUID;
  _subscription_id UUID;
  _amount NUMERIC;
  _admin_balance_before NUMERIC;
  _admin_balance_after NUMERIC;
  _admin_wallet_id UUID;
BEGIN
  -- Obtener info del crédito
  SELECT original_appointment_id, amount
  INTO _original_appointment_id, _amount
  FROM client_credits
  WHERE id = _credit_id;

  -- Obtener subscription del appointment original
  SELECT subscription_id INTO _subscription_id
  FROM appointments
  WHERE id = _original_appointment_id;

  IF _subscription_id IS NOT NULL THEN
    -- Mover el dinero diferido a admin
    UPDATE deferred_revenue
    SET deferred_amount = GREATEST(0, deferred_amount - _amount)
    WHERE subscription_id = _subscription_id;

    -- Agregar al balance admin
    SELECT id, balance INTO _admin_wallet_id, _admin_balance_before
    FROM admin_wallet LIMIT 1;

    _admin_balance_after := _admin_balance_before + _amount;
    UPDATE admin_wallet SET balance = _admin_balance_after WHERE id = _admin_wallet_id;

    INSERT INTO wallet_transactions (
      transaction_type,
      wallet_type,
      amount,
      balance_before,
      balance_after,
      description
    ) VALUES (
      'credit_expired',
      'admin',
      _amount,
      _admin_balance_before,
      _admin_balance_after,
      'Ingreso por crédito expirado'
    );
  END IF;

  -- Marcar crédito como expirado
  UPDATE client_credits
  SET status = 'expired'
  WHERE id = _credit_id;
END;
$function$;