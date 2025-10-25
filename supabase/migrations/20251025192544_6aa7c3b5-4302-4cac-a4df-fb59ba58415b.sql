-- Actualizar process_package_purchase para separar comisión admin (15%) y monto psicólogo (85%)
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
SET search_path TO 'public'
AS $function$
DECLARE
  _admin_commission NUMERIC;
  _psychologist_amount NUMERIC;
  _price_per_session NUMERIC;
  _admin_balance_before NUMERIC;
  _admin_balance_after NUMERIC;
  _admin_wallet_id UUID;
BEGIN
  -- Calcular comisión admin (15%) y monto psicólogo (85%)
  _admin_commission := _total_amount * 0.15;
  _psychologist_amount := _total_amount * 0.85;
  _price_per_session := _psychologist_amount / _sessions_total;

  -- 1. Actualizar balance del admin con su comisión
  SELECT id, balance INTO _admin_wallet_id, _admin_balance_before
  FROM admin_wallet
  LIMIT 1;

  _admin_balance_after := _admin_balance_before + _admin_commission;

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
    _admin_commission,
    _admin_balance_before,
    _admin_balance_after,
    'Comisión 15% por paquete de ' || _sessions_total || ' sesiones'
  );

  -- 3. Crear registro de ingreso diferido (solo monto del psicólogo)
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
    _psychologist_amount,
    _psychologist_amount,
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
$function$;