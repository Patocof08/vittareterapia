-- Create function to recalculate package financials even if deferred revenue already exists
CREATE OR REPLACE FUNCTION public.recalculate_package_financials(
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
SET search_path TO 'public'
AS $function$
DECLARE
  _total_without_discount NUMERIC;
  _admin_commission NUMERIC;
  _psychologist_amount NUMERIC;
  _price_per_session NUMERIC;
  _admin_balance_before NUMERIC;
  _admin_balance_after NUMERIC;
  _admin_wallet_id UUID;
  _existing_deferred RECORD;
  _existing_admin_tx RECORD;
  _recognized_amount NUMERIC;
  _sessions_recognized INTEGER;
  _deferred_after NUMERIC;
  _current_admin_balance NUMERIC;
  _delta NUMERIC;
BEGIN
  -- Only allow admins to run this recalculation
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden recalcular pagos';
  END IF;

  -- Compute split using pre-discount base so discount is absorbed by admin
  IF _discount_percentage > 0 THEN
    _total_without_discount := _total_amount / (1 - (_discount_percentage::numeric / 100));
  ELSE
    _total_without_discount := _total_amount;
  END IF;

  _psychologist_amount := _total_without_discount * 0.85; -- 85% of pre-discount
  _admin_commission := _total_amount - _psychologist_amount; -- admin absorbs discount
  _price_per_session := _psychologist_amount / _sessions_total;

  -- Ensure admin wallet exists
  SELECT id, balance INTO _admin_wallet_id, _admin_balance_before
  FROM admin_wallet
  LIMIT 1;

  IF _admin_wallet_id IS NULL THEN
    INSERT INTO admin_wallet (balance) VALUES (0)
    RETURNING id, balance INTO _admin_wallet_id, _admin_balance_before;
  END IF;

  -- Existing deferred revenue for this subscription?
  SELECT * INTO _existing_deferred
  FROM deferred_revenue
  WHERE subscription_id = _subscription_id
  LIMIT 1;

  -- Check existing admin transaction for this payment/subscription
  SELECT id, amount
  INTO _existing_admin_tx
  FROM wallet_transactions
  WHERE wallet_type = 'admin'
    AND transaction_type = 'package_purchase'
    AND subscription_id = _subscription_id
    AND payment_id = _payment_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF _existing_deferred IS NULL THEN
    -- First-time process behavior
    _admin_balance_after := _admin_balance_before + _admin_commission;
    UPDATE admin_wallet SET balance = _admin_balance_after WHERE id = _admin_wallet_id;

    INSERT INTO wallet_transactions (
      transaction_type, wallet_type, subscription_id, payment_id, amount,
      balance_before, balance_after, description
    ) VALUES (
      'package_purchase', 'admin', _subscription_id, _payment_id, _admin_commission,
      _admin_balance_before, _admin_balance_after,
      'Comisión (' || _discount_percentage || '% desc.) por paquete de ' || _sessions_total || ' sesiones (recalc)'
    );

    INSERT INTO deferred_revenue (
      subscription_id, total_amount, deferred_amount, recognized_amount,
      sessions_total, sessions_recognized, price_per_session
    ) VALUES (
      _subscription_id, _psychologist_amount, _psychologist_amount, 0,
      _sessions_total, 0, _price_per_session
    );
  ELSE
    -- Update existing deferred preserving recognized sessions/amount
    _recognized_amount := COALESCE(_existing_deferred.recognized_amount, 0);
    _sessions_recognized := COALESCE(_existing_deferred.sessions_recognized, 0);
    _deferred_after := GREATEST(0, _psychologist_amount - _recognized_amount);

    UPDATE deferred_revenue
    SET
      total_amount = _psychologist_amount,
      deferred_amount = _deferred_after,
      price_per_session = _price_per_session,
      sessions_total = _sessions_total,
      updated_at = now()
    WHERE id = _existing_deferred.id;

    -- Adjust admin wallet by delta vs existing commission (if any)
    IF _existing_admin_tx.id IS NULL THEN
      _delta := _admin_commission;
    ELSE
      _delta := _admin_commission - COALESCE(_existing_admin_tx.amount, 0);
    END IF;

    IF _delta <> 0 THEN
      SELECT balance INTO _current_admin_balance FROM admin_wallet WHERE id = _admin_wallet_id;
      _admin_balance_after := _current_admin_balance + _delta;

      UPDATE admin_wallet SET balance = _admin_balance_after WHERE id = _admin_wallet_id;

      INSERT INTO wallet_transactions (
        transaction_type, wallet_type, subscription_id, payment_id, amount,
        balance_before, balance_after, description
      ) VALUES (
        'adjustment', 'admin', _subscription_id, _payment_id, _delta,
        _current_admin_balance, _admin_balance_after,
        'Ajuste por recálculo de paquete (' || _discount_percentage || '% desc.)'
      );
    END IF;
  END IF;

  -- Ensure psychologist wallet exists
  INSERT INTO psychologist_wallets (psychologist_id, balance, pending_balance)
  VALUES (_psychologist_id, 0, 0)
  ON CONFLICT (psychologist_id) DO NOTHING;
END;
$function$;