-- ================================================================
-- Platform fee (5%) + transaction_category + platform_settings
-- ================================================================

-- 1. New columns on payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS base_amount           NUMERIC,
  ADD COLUMN IF NOT EXISTS platform_fee_rate     NUMERIC DEFAULT 0.05,
  ADD COLUMN IF NOT EXISTS platform_fee          NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS processor             TEXT    DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS processor_payment_id  TEXT,
  ADD COLUMN IF NOT EXISTS processor_client_secret TEXT;

-- Back-fill existing rows: base_amount = amount, platform_fee = 0
UPDATE public.payments SET base_amount = amount WHERE base_amount IS NULL;
ALTER TABLE public.payments ALTER COLUMN base_amount SET NOT NULL;

-- 2. transaction_category on wallet_transactions
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS transaction_category TEXT DEFAULT 'session_commission';

UPDATE public.wallet_transactions
  SET transaction_category = 'platform_fee'
  WHERE transaction_type = 'platform_fee';

-- 3. platform_settings table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key   TEXT PRIMARY KEY,
  value NUMERIC NOT NULL
);

INSERT INTO public.platform_settings (key, value)
  VALUES ('platform_fee_rate', 0.05)
  ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins_read_settings"  ON public.platform_settings;
DROP POLICY IF EXISTS "public_read_fee_rate"  ON public.platform_settings;

-- Anyone can read the fee rate (needed during booking)
CREATE POLICY "public_read_fee_rate" ON public.platform_settings
  FOR SELECT USING (key = 'platform_fee_rate');

-- Admins can read/write all settings
CREATE POLICY "admins_manage_settings" ON public.platform_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'));

-- 4. Function: record_platform_fee
CREATE OR REPLACE FUNCTION public.record_platform_fee(
  _payment_id      UUID,
  _psychologist_id UUID,
  _fee_amount      NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id      UUID;
  v_balance_before NUMERIC;
BEGIN
  IF _fee_amount IS NULL OR _fee_amount <= 0 THEN RETURN; END IF;

  SELECT id, balance
    INTO v_wallet_id, v_balance_before
    FROM admin_wallet
    LIMIT 1;

  IF v_wallet_id IS NULL THEN
    INSERT INTO admin_wallet (balance) VALUES (0)
      RETURNING id, balance INTO v_wallet_id, v_balance_before;
  END IF;

  UPDATE admin_wallet
    SET balance = balance + _fee_amount, updated_at = NOW()
    WHERE id = v_wallet_id;

  INSERT INTO wallet_transactions (
    transaction_type, transaction_category, wallet_type,
    psychologist_id, payment_id,
    amount, balance_before, balance_after, description
  ) VALUES (
    'platform_fee', 'platform_fee', 'admin',
    _psychologist_id, _payment_id,
    _fee_amount, v_balance_before, v_balance_before + _fee_amount,
    'Cargo de servicio (5%)'
  );
END;
$$;

-- 5. Recreate get_platform_financial_summary with platform_fee_total
DROP FUNCTION IF EXISTS public.get_platform_financial_summary(TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION public.get_platform_financial_summary(
  _from_date TIMESTAMPTZ DEFAULT NULL,
  _to_date   TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
  gross_income            NUMERIC,
  admin_commission        NUMERIC,
  psychologist_payments   NUMERIC,
  pending_deferred        NUMERIC,
  completed_sessions      BIGINT,
  account_deletion_income NUMERIC,
  platform_fee_total      NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(wt.amount), 0)
      AS gross_income,
    COALESCE(SUM(CASE WHEN wt.wallet_type = 'admin'        THEN wt.amount ELSE 0 END), 0)
      AS admin_commission,
    COALESCE(SUM(CASE WHEN wt.wallet_type = 'psychologist' THEN wt.amount ELSE 0 END), 0)
      AS psychologist_payments,
    (SELECT COALESCE(SUM(dr.deferred_amount), 0) FROM deferred_revenue dr)
      AS pending_deferred,
    COUNT(DISTINCT CASE
      WHEN wt.transaction_type = 'session_completed'
       AND wt.wallet_type      = 'psychologist'
      THEN wt.appointment_id
    END)::BIGINT
      AS completed_sessions,
    COALESCE(SUM(CASE WHEN wt.transaction_type = 'account_deletion' THEN wt.amount ELSE 0 END), 0)
      AS account_deletion_income,
    (SELECT COALESCE(SUM(wt2.amount), 0)
       FROM wallet_transactions wt2
      WHERE wt2.transaction_category = 'platform_fee'
        AND (_from_date IS NULL OR wt2.created_at >= _from_date)
        AND (_to_date   IS NULL OR wt2.created_at <= _to_date)
    ) AS platform_fee_total
  FROM wallet_transactions wt
  WHERE wt.transaction_type IN ('session_completed', 'account_deletion')
    AND (_from_date IS NULL OR wt.created_at >= _from_date)
    AND (_to_date   IS NULL OR wt.created_at <= _to_date);
END;
$$;
