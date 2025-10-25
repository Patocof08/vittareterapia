-- Función para procesar la compra de un paquete y registrar contabilidad
CREATE OR REPLACE FUNCTION public.process_package_purchase(
  _subscription_id uuid,
  _payment_id uuid,
  _psychologist_id uuid,
  _total_amount numeric,
  _sessions_total integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _price_per_session numeric;
  _admin_balance_before numeric;
  _admin_balance_after numeric;
  _admin_wallet_id uuid;
BEGIN
  -- Calcular precio por sesión
  _price_per_session := _total_amount / _sessions_total;

  -- 1. Obtener y actualizar balance del admin
  SELECT id, balance INTO _admin_wallet_id, _admin_balance_before
  FROM admin_wallet
  LIMIT 1;

  _admin_balance_after := _admin_balance_before + _total_amount;

  UPDATE admin_wallet
  SET balance = _admin_balance_after
  WHERE id = _admin_wallet_id;

  -- 2. Registrar transacción del admin
  INSERT INTO wallet_transactions (
    transaction_type,
    wallet_type,
    subscription_id,
    payment_id,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    'package_purchase',
    'admin',
    _subscription_id,
    _payment_id,
    _total_amount,
    _admin_balance_before,
    _admin_balance_after,
    'Compra de paquete de ' || _sessions_total || ' sesiones'
  );

  -- 3. Crear registro de ingreso diferido
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

  -- 4. Crear wallet del psicólogo si no existe
  INSERT INTO psychologist_wallets (psychologist_id, balance, pending_balance)
  VALUES (_psychologist_id, 0, 0)
  ON CONFLICT (psychologist_id) DO NOTHING;
END;
$$;

-- Función para reconocer ingreso y liberar pago al psicólogo cuando se completa una sesión
CREATE OR REPLACE FUNCTION public.recognize_session_revenue(
  _appointment_id uuid,
  _subscription_id uuid,
  _psychologist_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _price_per_session numeric;
  _deferred_before numeric;
  _deferred_after numeric;
  _recognized_before numeric;
  _recognized_after numeric;
  _sessions_recognized_before integer;
  _psych_balance_before numeric;
  _psych_balance_after numeric;
  _psych_wallet_id uuid;
  _deferred_id uuid;
BEGIN
  -- Obtener información del ingreso diferido
  SELECT 
    id, 
    price_per_session, 
    deferred_amount, 
    recognized_amount,
    sessions_recognized
  INTO 
    _deferred_id,
    _price_per_session, 
    _deferred_before, 
    _recognized_before,
    _sessions_recognized_before
  FROM deferred_revenue
  WHERE subscription_id = _subscription_id;

  -- Si no hay ingreso diferido, salir
  IF _deferred_id IS NULL THEN
    RETURN;
  END IF;

  -- Calcular nuevos montos
  _deferred_after := _deferred_before - _price_per_session;
  _recognized_after := _recognized_before + _price_per_session;

  -- Actualizar ingreso diferido
  UPDATE deferred_revenue
  SET 
    deferred_amount = GREATEST(0, _deferred_after),
    recognized_amount = _recognized_after,
    sessions_recognized = _sessions_recognized_before + 1
  WHERE id = _deferred_id;

  -- Obtener wallet del psicólogo
  SELECT id, balance INTO _psych_wallet_id, _psych_balance_before
  FROM psychologist_wallets
  WHERE psychologist_id = _psychologist_id;

  -- Calcular nuevo balance (por ahora 100% va al psicólogo, luego se puede ajustar con fees)
  _psych_balance_after := _psych_balance_before + _price_per_session;

  -- Actualizar balance del psicólogo
  UPDATE psychologist_wallets
  SET balance = _psych_balance_after
  WHERE id = _psych_wallet_id;

  -- Registrar transacción del psicólogo
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
    _price_per_session,
    _psych_balance_before,
    _psych_balance_after,
    'Pago por sesión completada'
  );
END;
$$;