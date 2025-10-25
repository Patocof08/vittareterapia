-- Función para obtener el balance del wallet del psicólogo
CREATE OR REPLACE FUNCTION public.get_psychologist_wallet_balance(
  _psychologist_id uuid
)
RETURNS TABLE (
  balance numeric,
  pending_balance numeric,
  deferred_revenue numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_deferred numeric;
BEGIN
  -- Obtener ingreso diferido total de todas las suscripciones del psicólogo
  SELECT COALESCE(SUM(dr.deferred_amount), 0)
  INTO _total_deferred
  FROM deferred_revenue dr
  JOIN client_subscriptions cs ON cs.id = dr.subscription_id
  WHERE cs.psychologist_id = _psychologist_id;

  -- Retornar balance del wallet + ingreso diferido
  RETURN QUERY
  SELECT 
    COALESCE(pw.balance, 0) as balance,
    COALESCE(pw.pending_balance, 0) as pending_balance,
    _total_deferred as deferred_revenue
  FROM psychologist_wallets pw
  WHERE pw.psychologist_id = _psychologist_id
  UNION ALL
  SELECT 0, 0, _total_deferred
  WHERE NOT EXISTS (
    SELECT 1 FROM psychologist_wallets
    WHERE psychologist_id = _psychologist_id
  )
  LIMIT 1;
END;
$$;