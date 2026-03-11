-- Store psychologist name directly in wallet_transactions so it persists after account deletion.

-- 1. Add column
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS psychologist_name TEXT;

-- 2. Back-fill existing rows from psychologist_profiles
UPDATE public.wallet_transactions wt
SET psychologist_name = pp.first_name || ' ' || pp.last_name
FROM public.psychologist_profiles pp
WHERE pp.id = wt.psychologist_id
  AND wt.psychologist_name IS NULL;

-- 3. Update get_financial_report to use stored name as primary source
DROP FUNCTION IF EXISTS public.get_financial_report(TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION public.get_financial_report(
  _from_date TIMESTAMPTZ DEFAULT NULL,
  _to_date   TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  transaction_date        TIMESTAMPTZ,
  event_type              TEXT,
  session_type            TEXT,
  client_name             TEXT,
  psychologist_id         UUID,
  psychologist_name       TEXT,
  gross_amount            NUMERIC,
  admin_amount            NUMERIC,
  psychologist_amount     NUMERIC,
  admin_percentage        NUMERIC,
  psychologist_percentage NUMERIC,
  appointment_id          UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Events WITH appointment_id
  SELECT
    MAX(wt.created_at)                                                                        AS transaction_date,
    MAX(wt.transaction_type)                                                                  AS event_type,
    CASE
      WHEN MAX(wt.description) LIKE '%(8_sessions)%' OR MAX(wt.description) LIKE '%(package_8)%' THEN '8_sessions'
      WHEN MAX(wt.description) LIKE '%(4_sessions)%' OR MAX(wt.description) LIKE '%(package_4)%' THEN '4_sessions'
      WHEN MAX(wt.transaction_type) = 'account_deletion'                                          THEN 'account_deletion'
      ELSE 'single_session'
    END                                                                                       AS session_type,
    COALESCE(MAX(pr.full_name), 'Cliente eliminado')                                          AS client_name,
    MAX(wt.psychologist_id::text)::uuid                                                       AS psychologist_id,
    COALESCE(
      MAX(wt.psychologist_name),
      MAX(pp.first_name) || ' ' || MAX(pp.last_name),
      'Psicólogo eliminado'
    )                                                                                         AS psychologist_name,
    SUM(wt.amount)                                                                            AS gross_amount,
    SUM(CASE WHEN wt.wallet_type = 'admin'        THEN wt.amount ELSE 0 END)                 AS admin_amount,
    SUM(CASE WHEN wt.wallet_type = 'psychologist' THEN wt.amount ELSE 0 END)                 AS psychologist_amount,
    CASE WHEN SUM(wt.amount) > 0
      THEN ROUND(SUM(CASE WHEN wt.wallet_type = 'admin'        THEN wt.amount ELSE 0 END) / SUM(wt.amount) * 100, 1)
      ELSE 0 END                                                                              AS admin_percentage,
    CASE WHEN SUM(wt.amount) > 0
      THEN ROUND(SUM(CASE WHEN wt.wallet_type = 'psychologist' THEN wt.amount ELSE 0 END) / SUM(wt.amount) * 100, 1)
      ELSE 0 END                                                                              AS psychologist_percentage,
    wt.appointment_id
  FROM wallet_transactions wt
  LEFT JOIN psychologist_profiles pp ON pp.id = wt.psychologist_id
  LEFT JOIN appointments          a  ON a.id  = wt.appointment_id
  LEFT JOIN profiles              pr ON pr.id = a.patient_id
  WHERE wt.transaction_type IN ('session_completed', 'account_deletion')
    AND wt.appointment_id IS NOT NULL
    AND (_from_date IS NULL OR wt.created_at >= _from_date)
    AND (_to_date   IS NULL OR wt.created_at <= _to_date)
  GROUP BY wt.appointment_id

  UNION ALL

  -- Events WITHOUT appointment_id (account deletions)
  SELECT
    wt.created_at                                                                             AS transaction_date,
    wt.transaction_type                                                                       AS event_type,
    'account_deletion'                                                                        AS session_type,
    'Cliente eliminado'                                                                       AS client_name,
    wt.psychologist_id                                                                        AS psychologist_id,
    COALESCE(
      wt.psychologist_name,
      pp.first_name || ' ' || pp.last_name,
      'Psicólogo eliminado'
    )                                                                                         AS psychologist_name,
    wt.amount                                                                                 AS gross_amount,
    CASE WHEN wt.wallet_type = 'admin'        THEN wt.amount ELSE 0 END                      AS admin_amount,
    CASE WHEN wt.wallet_type = 'psychologist' THEN wt.amount ELSE 0 END                      AS psychologist_amount,
    CASE WHEN wt.wallet_type = 'admin'        THEN 100.0    ELSE 0.0  END                    AS admin_percentage,
    CASE WHEN wt.wallet_type = 'psychologist' THEN 100.0    ELSE 0.0  END                    AS psychologist_percentage,
    NULL::UUID                                                                                AS appointment_id
  FROM wallet_transactions wt
  LEFT JOIN psychologist_profiles pp ON pp.id = wt.psychologist_id
  WHERE wt.transaction_type IN ('session_completed', 'account_deletion')
    AND wt.appointment_id IS NULL
    AND (_from_date IS NULL OR wt.created_at >= _from_date)
    AND (_to_date   IS NULL OR wt.created_at <= _to_date)

  ORDER BY transaction_date DESC;
END;
$$;

-- 4. Also update recognize_session_revenue to populate psychologist_name going forward
CREATE OR REPLACE FUNCTION public.recognize_session_revenue(
  _appointment_id UUID,
  _subscription_id UUID,
  _psychologist_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _price_per_session NUMERIC;
  _deferred_before NUMERIC;
  _deferred_after NUMERIC;
  _recognized_before NUMERIC;
  _recognized_after NUMERIC;
  _sessions_recognized_before INTEGER;
  _psych_balance_before NUMERIC;
  _psych_balance_after NUMERIC;
  _psych_wallet_id UUID;
  _deferred_id UUID;
  _psych_full_name TEXT;
BEGIN
  SELECT id, price_per_session, deferred_amount, recognized_amount, sessions_recognized
  INTO _deferred_id, _price_per_session, _deferred_before, _recognized_before, _sessions_recognized_before
  FROM deferred_revenue
  WHERE subscription_id = _subscription_id;

  IF _deferred_id IS NULL THEN RETURN; END IF;

  _deferred_after := _deferred_before - _price_per_session;
  _recognized_after := _recognized_before + _price_per_session;

  UPDATE deferred_revenue
  SET deferred_amount = GREATEST(0, _deferred_after),
      recognized_amount = _recognized_after,
      sessions_recognized = _sessions_recognized_before + 1
  WHERE id = _deferred_id;

  SELECT id, balance INTO _psych_wallet_id, _psych_balance_before
  FROM psychologist_wallets
  WHERE psychologist_id = _psychologist_id;

  _psych_balance_after := _psych_balance_before + _price_per_session;

  UPDATE psychologist_wallets
  SET balance = _psych_balance_after
  WHERE id = _psych_wallet_id;

  SELECT first_name || ' ' || last_name INTO _psych_full_name
  FROM psychologist_profiles WHERE id = _psychologist_id;

  INSERT INTO wallet_transactions (
    transaction_type, wallet_type, psychologist_id, psychologist_name,
    subscription_id, appointment_id, amount, balance_before, balance_after, description
  ) VALUES (
    'session_completed', 'psychologist', _psychologist_id, _psych_full_name,
    _subscription_id, _appointment_id, _price_per_session,
    _psych_balance_before, _psych_balance_after, 'Pago por sesión completada'
  );
END;
$$;
