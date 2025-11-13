-- Drop the simplified table
DROP TABLE IF EXISTS admin_deferred_revenue CASCADE;

-- Recreate deferred_revenue table (tracks passive income per subscription)
CREATE TABLE deferred_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES client_subscriptions(id) ON DELETE CASCADE NOT NULL,
  total_amount NUMERIC NOT NULL,
  deferred_amount NUMERIC NOT NULL DEFAULT 0,
  recognized_amount NUMERIC NOT NULL DEFAULT 0,
  sessions_total INTEGER NOT NULL,
  sessions_recognized INTEGER NOT NULL DEFAULT 0,
  price_per_session NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate admin_wallet table (global admin balance)
CREATE TABLE admin_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate psychologist_wallets table (balance per psychologist)
CREATE TABLE psychologist_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID REFERENCES psychologist_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance NUMERIC NOT NULL DEFAULT 0,
  pending_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate wallet_transactions table (audit trail)
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL,
  wallet_type TEXT NOT NULL,
  psychologist_id UUID REFERENCES psychologist_profiles(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES client_subscriptions(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  balance_before NUMERIC,
  balance_after NUMERIC,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE deferred_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychologist_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all deferred revenue"
  ON deferred_revenue FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view admin wallet"
  ON admin_wallet FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all psychologist wallets"
  ON psychologist_wallets FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Psychologists can view their own wallet"
  ON psychologist_wallets FOR SELECT
  TO authenticated
  USING (psychologist_id IN (
    SELECT id FROM psychologist_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Psychologists can view their own transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (psychologist_id IN (
    SELECT id FROM psychologist_profiles WHERE user_id = auth.uid()
  ));

-- Initialize admin wallet
INSERT INTO admin_wallet (balance) VALUES (0);

-- Function to process package purchase
CREATE OR REPLACE FUNCTION process_package_purchase(
  _subscription_id UUID,
  _payment_id UUID,
  _psychologist_id UUID,
  _total_amount NUMERIC,
  _sessions_total INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _price_per_session NUMERIC;
BEGIN
  _price_per_session := _total_amount / _sessions_total;

  -- ALL amount goes to deferred revenue
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

  -- Create psychologist wallet if not exists
  INSERT INTO psychologist_wallets (psychologist_id, balance, pending_balance)
  VALUES (_psychologist_id, 0, 0)
  ON CONFLICT (psychologist_id) DO NOTHING;
END;
$$;

-- Function to process single session payment
CREATE OR REPLACE FUNCTION process_single_session_payment(
  _payment_id UUID,
  _appointment_id UUID,
  _psychologist_id UUID,
  _total_amount NUMERIC
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _subscription_id UUID;
  _client_id UUID;
BEGIN
  SELECT patient_id INTO _client_id FROM appointments WHERE id = _appointment_id;

  -- Create temporary 1-session subscription
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

  UPDATE appointments SET subscription_id = _subscription_id WHERE id = _appointment_id;

  -- ALL amount goes to deferred revenue
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

  INSERT INTO psychologist_wallets (psychologist_id, balance, pending_balance)
  VALUES (_psychologist_id, 0, 0)
  ON CONFLICT (psychologist_id) DO NOTHING;
END;
$$;

-- Function to recognize revenue when session is completed
CREATE OR REPLACE FUNCTION recognize_session_revenue(
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
  _package_type TEXT;
  _admin_commission NUMERIC;
  _psychologist_amount NUMERIC;
  _admin_wallet_id UUID;
  _admin_balance_before NUMERIC;
  _admin_balance_after NUMERIC;
  _psych_wallet_id UUID;
  _psych_balance_before NUMERIC;
  _psych_balance_after NUMERIC;
BEGIN
  -- Get session info
  SELECT dr.price_per_session, cs.package_type
  INTO _price_per_session, _package_type
  FROM deferred_revenue dr
  JOIN client_subscriptions cs ON cs.id = dr.subscription_id
  WHERE dr.subscription_id = _subscription_id;

  IF _price_per_session IS NULL THEN RETURN; END IF;

  -- Calculate splits based on package type
  IF _package_type = 'single_session' THEN
    _admin_commission := _price_per_session * 0.15;
    _psychologist_amount := _price_per_session * 0.85;
  ELSIF _package_type = 'package_4' THEN
    _admin_commission := _price_per_session * 0.05;
    _psychologist_amount := _price_per_session * 0.95;
  ELSIF _package_type = 'package_8' THEN
    _admin_commission := 0;
    _psychologist_amount := _price_per_session;
  ELSE
    _admin_commission := _price_per_session * 0.15;
    _psychologist_amount := _price_per_session * 0.85;
  END IF;

  -- Update deferred revenue
  UPDATE deferred_revenue
  SET 
    deferred_amount = GREATEST(0, deferred_amount - _price_per_session),
    recognized_amount = recognized_amount + _price_per_session,
    sessions_recognized = sessions_recognized + 1
  WHERE subscription_id = _subscription_id;

  -- Update admin wallet
  SELECT id, balance INTO _admin_wallet_id, _admin_balance_before FROM admin_wallet LIMIT 1;
  _admin_balance_after := _admin_balance_before + _admin_commission;
  UPDATE admin_wallet SET balance = _admin_balance_after WHERE id = _admin_wallet_id;

  INSERT INTO wallet_transactions (
    transaction_type, wallet_type, subscription_id, appointment_id,
    amount, balance_before, balance_after, description
  ) VALUES (
    'session_completed', 'admin', _subscription_id, _appointment_id,
    _admin_commission, _admin_balance_before, _admin_balance_after,
    'Comisión por sesión completada (' || _package_type || ')'
  );

  -- Update psychologist wallet
  SELECT id, balance INTO _psych_wallet_id, _psych_balance_before
  FROM psychologist_wallets WHERE psychologist_id = _psychologist_id;

  _psych_balance_after := _psych_balance_before + _psychologist_amount;
  UPDATE psychologist_wallets SET balance = _psych_balance_after WHERE id = _psych_wallet_id;

  INSERT INTO wallet_transactions (
    transaction_type, wallet_type, psychologist_id, subscription_id, appointment_id,
    amount, balance_before, balance_after, description
  ) VALUES (
    'session_completed', 'psychologist', _psychologist_id, _subscription_id, _appointment_id,
    _psychologist_amount, _psych_balance_before, _psych_balance_after,
    'Pago por sesión completada (' || _package_type || ')'
  );
END;
$$;