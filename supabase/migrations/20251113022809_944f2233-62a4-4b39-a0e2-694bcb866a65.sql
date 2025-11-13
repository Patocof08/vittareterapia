-- Actualizar función de reembolso para registrar transacciones
CREATE OR REPLACE FUNCTION public.process_cancellation_with_refund(
  _appointment_id UUID,
  _subscription_id UUID,
  _payment_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _price_per_session NUMERIC;
  _deferred_before NUMERIC;
  _deferred_after NUMERIC;
  _psychologist_id UUID;
BEGIN
  -- Obtener precio de la sesión del ingreso diferido
  SELECT price_per_session, deferred_amount, psychologist_id
  INTO _price_per_session, _deferred_before, _psychologist_id
  FROM deferred_revenue
  WHERE subscription_id = _subscription_id;

  -- Reducir el ingreso diferido
  _deferred_after := _deferred_before - _price_per_session;
  UPDATE deferred_revenue
  SET deferred_amount = GREATEST(0, _deferred_after),
      updated_at = now()
  WHERE subscription_id = _subscription_id;

  -- Registrar transacción de reembolso (sale del sistema)
  INSERT INTO wallet_transactions (
    transaction_type,
    wallet_type,
    psychologist_id,
    appointment_id,
    subscription_id,
    payment_id,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    'refund',
    'deferred',
    _psychologist_id,
    _appointment_id,
    _subscription_id,
    _payment_id,
    -_price_per_session, -- Negativo porque sale del sistema
    _deferred_before,
    _deferred_after,
    'Reembolso por cancelación >24h'
  );

  -- Marcar payment como refunded
  UPDATE payments
  SET payment_status = 'refunded',
      completed_at = now()
  WHERE id = _payment_id;
END;
$$;

-- Crear vista para tracking financiero completo
CREATE OR REPLACE VIEW public.financial_summary AS
SELECT 
  'deferred' as category,
  SUM(deferred_amount) as total
FROM deferred_revenue
UNION ALL
SELECT 
  'admin' as category,
  SUM(balance) as total
FROM admin_wallet
UNION ALL
SELECT 
  'psychologist' as category,
  SUM(balance) as total
FROM psychologist_wallets;