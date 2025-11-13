-- Create deferred revenue table (ingreso pasivo)
CREATE TABLE IF NOT EXISTS public.deferred_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.client_subscriptions(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL,
  recognized_amount NUMERIC NOT NULL DEFAULT 0,
  deferred_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT deferred_revenue_amount_check CHECK (total_amount >= 0 AND recognized_amount >= 0 AND deferred_amount >= 0)
);

-- Create admin wallet table
CREATE TABLE IF NOT EXISTS public.admin_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT admin_wallet_balance_check CHECK (balance >= 0)
);

-- Create psychologist wallets table
CREATE TABLE IF NOT EXISTS public.psychologist_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL UNIQUE REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT psychologist_wallets_balance_check CHECK (balance >= 0)
);

-- Create wallet transactions table for audit trail
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL,
  wallet_type TEXT NOT NULL, -- 'admin' or 'psychologist'
  psychologist_id UUID REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.client_subscriptions(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  balance_before NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wallet_transactions_amount_check CHECK (amount >= 0)
);

-- Initialize admin wallet if it doesn't exist
INSERT INTO public.admin_wallet (balance) 
SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM public.admin_wallet);

-- Enable RLS on all tables
ALTER TABLE public.deferred_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychologist_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deferred_revenue
CREATE POLICY "Admins can view all deferred revenue"
  ON public.deferred_revenue FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Psychologists can view their own deferred revenue"
  ON public.deferred_revenue FOR SELECT
  USING (psychologist_id IN (
    SELECT id FROM public.psychologist_profiles WHERE user_id = auth.uid()
  ));

-- RLS Policies for admin_wallet
CREATE POLICY "Admins can view admin wallet"
  ON public.admin_wallet FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for psychologist_wallets
CREATE POLICY "Admins can view all psychologist wallets"
  ON public.psychologist_wallets FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Psychologists can view their own wallet"
  ON public.psychologist_wallets FOR SELECT
  USING (psychologist_id IN (
    SELECT id FROM public.psychologist_profiles WHERE user_id = auth.uid()
  ));

-- RLS Policies for wallet_transactions
CREATE POLICY "Admins can view all transactions"
  ON public.wallet_transactions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Psychologists can view their own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (psychologist_id IN (
    SELECT id FROM public.psychologist_profiles WHERE user_id = auth.uid()
  ));

-- Function to create deferred revenue when a session is booked
CREATE OR REPLACE FUNCTION public.create_deferred_revenue(
  _psychologist_id UUID,
  _appointment_id UUID,
  _subscription_id UUID,
  _payment_id UUID,
  _amount NUMERIC
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deferred_id UUID;
BEGIN
  -- Create deferred revenue entry
  INSERT INTO public.deferred_revenue (
    psychologist_id,
    appointment_id,
    subscription_id,
    payment_id,
    total_amount,
    deferred_amount
  ) VALUES (
    _psychologist_id,
    _appointment_id,
    _subscription_id,
    _payment_id,
    _amount,
    _amount
  )
  RETURNING id INTO _deferred_id;

  -- Ensure psychologist wallet exists
  INSERT INTO public.psychologist_wallets (psychologist_id, balance)
  VALUES (_psychologist_id, 0)
  ON CONFLICT (psychologist_id) DO NOTHING;

  RETURN _deferred_id;
END;
$$;

-- Function to recognize revenue when a session is completed (15% admin, 85% psychologist)
CREATE OR REPLACE FUNCTION public.recognize_session_revenue(
  _appointment_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deferred_record RECORD;
  _admin_amount NUMERIC;
  _psychologist_amount NUMERIC;
  _admin_balance_before NUMERIC;
  _admin_balance_after NUMERIC;
  _psych_balance_before NUMERIC;
  _psych_balance_after NUMERIC;
  _admin_wallet_id UUID;
BEGIN
  -- Get deferred revenue record
  SELECT * INTO _deferred_record
  FROM public.deferred_revenue
  WHERE appointment_id = _appointment_id
  AND deferred_amount > 0
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Calculate splits (15% admin, 85% psychologist)
  _admin_amount := _deferred_record.deferred_amount * 0.15;
  _psychologist_amount := _deferred_record.deferred_amount * 0.85;

  -- Get admin wallet
  SELECT id, balance INTO _admin_wallet_id, _admin_balance_before
  FROM public.admin_wallet
  LIMIT 1;

  -- Update admin wallet
  _admin_balance_after := _admin_balance_before + _admin_amount;
  UPDATE public.admin_wallet
  SET balance = _admin_balance_after,
      updated_at = now()
  WHERE id = _admin_wallet_id;

  -- Record admin transaction
  INSERT INTO public.wallet_transactions (
    transaction_type,
    wallet_type,
    psychologist_id,
    appointment_id,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    'revenue_recognition',
    'admin',
    _deferred_record.psychologist_id,
    _appointment_id,
    _admin_amount,
    _admin_balance_before,
    _admin_balance_after,
    'Comisión por sesión completada (15%)'
  );

  -- Get psychologist wallet balance
  SELECT balance INTO _psych_balance_before
  FROM public.psychologist_wallets
  WHERE psychologist_id = _deferred_record.psychologist_id;

  -- Update psychologist wallet
  _psych_balance_after := _psych_balance_before + _psychologist_amount;
  UPDATE public.psychologist_wallets
  SET balance = _psych_balance_after,
      updated_at = now()
  WHERE psychologist_id = _deferred_record.psychologist_id;

  -- Record psychologist transaction
  INSERT INTO public.wallet_transactions (
    transaction_type,
    wallet_type,
    psychologist_id,
    appointment_id,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    'revenue_recognition',
    'psychologist',
    _deferred_record.psychologist_id,
    _appointment_id,
    _psychologist_amount,
    _psych_balance_before,
    _psych_balance_after,
    'Pago por sesión completada (85%)'
  );

  -- Update deferred revenue
  UPDATE public.deferred_revenue
  SET recognized_amount = recognized_amount + _deferred_record.deferred_amount,
      deferred_amount = 0,
      updated_at = now()
  WHERE id = _deferred_record.id;
END;
$$;