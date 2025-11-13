-- Recrear la función con VOLATILE explícito
DROP FUNCTION IF EXISTS public.process_cancellation_with_refund(uuid, uuid, uuid);

CREATE OR REPLACE FUNCTION public.process_cancellation_with_refund(
  _appointment_id uuid,
  _subscription_id uuid DEFAULT NULL,
  _payment_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
VOLATILE -- Importante: permite modificar datos
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _price_per_session NUMERIC;
  _deferred_before NUMERIC;
  _deferred_after NUMERIC;
  _psychologist_id UUID;
  _deferred_id UUID;
BEGIN
  -- Obtener información del ingreso diferido
  -- Primero intentar con subscription_id
  IF _subscription_id IS NOT NULL THEN
    SELECT id, price_per_session, deferred_amount, psychologist_id
    INTO _deferred_id, _price_per_session, _deferred_before, _psychologist_id
    FROM deferred_revenue
    WHERE subscription_id = _subscription_id
    LIMIT 1;
  END IF;

  -- Si no hay subscription_id o no se encontró, buscar por appointment_id
  IF _deferred_id IS NULL THEN
    SELECT id, total_amount, deferred_amount, psychologist_id
    INTO _deferred_id, _price_per_session, _deferred_before, _psychologist_id
    FROM deferred_revenue
    WHERE appointment_id = _appointment_id
    LIMIT 1;
  END IF;

  -- Si no se encontró ingreso diferido, salir
  IF _deferred_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ingreso diferido para appointment_id: %, subscription_id: %', _appointment_id, _subscription_id;
  END IF;

  -- Reducir el ingreso diferido
  _deferred_after := GREATEST(0, _deferred_before - _price_per_session);
  
  UPDATE deferred_revenue
  SET deferred_amount = _deferred_after,
      updated_at = now()
  WHERE id = _deferred_id;

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

  -- Marcar payment como refunded si existe
  IF _payment_id IS NOT NULL THEN
    UPDATE payments
    SET payment_status = 'refunded',
        completed_at = now()
    WHERE id = _payment_id;
  END IF;
END;
$function$;