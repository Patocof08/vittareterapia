-- Fix: PostgreSQL has no MAX() aggregate for UUID type.
-- Replace MAX(wt.psychologist_id) with MAX(wt.psychologist_id::text)::uuid

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
    MAX(wt.created_at)                                                               AS transaction_date,
    MAX(wt.transaction_type)                                                         AS event_type,
    CASE
      WHEN MAX(wt.description) LIKE '%(8_sessions)%' OR MAX(wt.description) LIKE '%(package_8)%' THEN '8_sessions'
      WHEN MAX(wt.description) LIKE '%(4_sessions)%' OR MAX(wt.description) LIKE '%(package_4)%' THEN '4_sessions'
      WHEN MAX(wt.transaction_type) = 'account_deletion'                                         THEN 'account_deletion'
      ELSE 'single_session'
    END                                                                              AS session_type,
    COALESCE(MAX(pr.full_name), 'Cliente eliminado')                                 AS client_name,
    MAX(wt.psychologist_id::text)::uuid                                              AS psychologist_id,
    COALESCE(MAX(pp.first_name) || ' ' || MAX(pp.last_name), 'Psicólogo eliminado') AS psychologist_name,
    SUM(wt.amount)                                                                   AS gross_amount,
    SUM(CASE WHEN wt.wallet_type = 'admin'        THEN wt.amount ELSE 0 END)        AS admin_amount,
    SUM(CASE WHEN wt.wallet_type = 'psychologist' THEN wt.amount ELSE 0 END)        AS psychologist_amount,
    CASE WHEN SUM(wt.amount) > 0
      THEN ROUND(SUM(CASE WHEN wt.wallet_type = 'admin'        THEN wt.amount ELSE 0 END) / SUM(wt.amount) * 100, 1)
      ELSE 0 END                                                                     AS admin_percentage,
    CASE WHEN SUM(wt.amount) > 0
      THEN ROUND(SUM(CASE WHEN wt.wallet_type = 'psychologist' THEN wt.amount ELSE 0 END) / SUM(wt.amount) * 100, 1)
      ELSE 0 END                                                                     AS psychologist_percentage,
    wt.appointment_id
  FROM wallet_transactions wt
  LEFT JOIN psychologist_profiles pp ON pp.id  = wt.psychologist_id
  LEFT JOIN appointments          a  ON a.id   = wt.appointment_id
  LEFT JOIN profiles              pr ON pr.id  = a.patient_id
  WHERE wt.transaction_type IN ('session_completed', 'account_deletion')
    AND wt.appointment_id IS NOT NULL
    AND (_from_date IS NULL OR wt.created_at >= _from_date)
    AND (_to_date   IS NULL OR wt.created_at <= _to_date)
  GROUP BY wt.appointment_id

  UNION ALL

  -- Events WITHOUT appointment_id (account deletions: remaining deferred to admin)
  SELECT
    wt.created_at                                                                    AS transaction_date,
    wt.transaction_type                                                              AS event_type,
    'account_deletion'                                                               AS session_type,
    'Cliente eliminado'                                                              AS client_name,
    wt.psychologist_id                                                               AS psychologist_id,
    COALESCE(pp.first_name || ' ' || pp.last_name, 'Psicólogo eliminado')           AS psychologist_name,
    wt.amount                                                                        AS gross_amount,
    CASE WHEN wt.wallet_type = 'admin'        THEN wt.amount ELSE 0 END             AS admin_amount,
    CASE WHEN wt.wallet_type = 'psychologist' THEN wt.amount ELSE 0 END             AS psychologist_amount,
    CASE WHEN wt.wallet_type = 'admin'        THEN 100.0    ELSE 0.0  END           AS admin_percentage,
    CASE WHEN wt.wallet_type = 'psychologist' THEN 100.0    ELSE 0.0  END           AS psychologist_percentage,
    NULL::UUID                                                                       AS appointment_id
  FROM wallet_transactions wt
  LEFT JOIN psychologist_profiles pp ON pp.id = wt.psychologist_id
  WHERE wt.transaction_type IN ('session_completed', 'account_deletion')
    AND wt.appointment_id IS NULL
    AND (_from_date IS NULL OR wt.created_at >= _from_date)
    AND (_to_date   IS NULL OR wt.created_at <= _to_date)

  ORDER BY transaction_date DESC;
END;
$$;
