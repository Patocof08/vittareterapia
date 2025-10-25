-- Tabla de wallet del admin
CREATE TABLE IF NOT EXISTS public.admin_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insertar registro inicial del admin
INSERT INTO public.admin_wallet (balance) VALUES (0)
ON CONFLICT DO NOTHING;

-- Tabla de wallets de psicólogos
CREATE TABLE IF NOT EXISTS public.psychologist_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  psychologist_id UUID NOT NULL REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL DEFAULT 0,
  pending_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(psychologist_id)
);

-- Tabla de ingresos diferidos (pasivos)
CREATE TABLE IF NOT EXISTS public.deferred_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.client_subscriptions(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL,
  deferred_amount NUMERIC NOT NULL,
  recognized_amount NUMERIC NOT NULL DEFAULT 0,
  sessions_total INTEGER NOT NULL,
  sessions_recognized INTEGER NOT NULL DEFAULT 0,
  price_per_session NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(subscription_id)
);

-- Tabla de transacciones del wallet
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL,
  wallet_type TEXT NOT NULL,
  psychologist_id UUID REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.client_subscriptions(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  balance_before NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS para admin_wallet
ALTER TABLE public.admin_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin wallet"
ON public.admin_wallet FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS para psychologist_wallets
ALTER TABLE public.psychologist_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Psychologists can view their own wallet"
ON public.psychologist_wallets FOR SELECT
USING (psychologist_id IN (
  SELECT id FROM psychologist_profiles
  WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all psychologist wallets"
ON public.psychologist_wallets FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS para deferred_revenue
ALTER TABLE public.deferred_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all deferred revenue"
ON public.deferred_revenue FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Psychologists can view their deferred revenue"
ON public.deferred_revenue FOR SELECT
USING (subscription_id IN (
  SELECT id FROM client_subscriptions
  WHERE psychologist_id IN (
    SELECT id FROM psychologist_profiles
    WHERE user_id = auth.uid()
  )
));

-- RLS para wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all transactions"
ON public.wallet_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Psychologists can view their transactions"
ON public.wallet_transactions FOR SELECT
USING (psychologist_id IN (
  SELECT id FROM psychologist_profiles
  WHERE user_id = auth.uid()
));

-- Función para procesar compra de paquete
CREATE OR REPLACE FUNCTION public.process_package_purchase(
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
  _admin_balance_before NUMERIC;
  _admin_balance_after NUMERIC;
  _admin_wallet_id UUID;
BEGIN
  -- Calcular precio por sesión
  _price_per_session := _total_amount / _sessions_total;

  -- 1. Obtener y actualizar balance del admin
  SELECT id, balance INTO _admin_wallet_id, _admin_balance_before
  FROM admin_wallet
  LIMIT 1;

  _admin_balance_after := _admin_balance_before + _total_amount;

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
    _total_amount,
    _admin_balance_before,
    _admin_balance_after,
    'Compra de paquete de ' || _sessions_total || ' sesiones'
  );

  -- 3. Crear registro de ingreso diferido
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

  -- 4. Crear wallet del psicólogo si no existe
  INSERT INTO psychologist_wallets (psychologist_id, balance, pending_balance)
  VALUES (_psychologist_id, 0, 0)
  ON CONFLICT (psychologist_id) DO NOTHING;
END;
$$;

-- Función para reconocer ingreso de sesión
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
BEGIN
  -- Obtener información del ingreso diferido
  SELECT 
    id, 
    price_per_session, 
    deferred_amount, 
    recognized_amount,
    sessions_recognized
  INTO 
    _deferred_id,
    _price_per_session, 
    _deferred_before, 
    _recognized_before,
    _sessions_recognized_before
  FROM deferred_revenue
  WHERE subscription_id = _subscription_id;

  -- Si no hay ingreso diferido, salir
  IF _deferred_id IS NULL THEN
    RETURN;
  END IF;

  -- Calcular nuevos montos
  _deferred_after := _deferred_before - _price_per_session;
  _recognized_after := _recognized_before + _price_per_session;

  -- Actualizar ingreso diferido
  UPDATE deferred_revenue
  SET 
    deferred_amount = GREATEST(0, _deferred_after),
    recognized_amount = _recognized_after,
    sessions_recognized = _sessions_recognized_before + 1
  WHERE id = _deferred_id;

  -- Obtener wallet del psicólogo
  SELECT id, balance INTO _psych_wallet_id, _psych_balance_before
  FROM psychologist_wallets
  WHERE psychologist_id = _psychologist_id;

  -- Calcular nuevo balance (por ahora 100% va al psicólogo, luego se puede ajustar con fees)
  _psych_balance_after := _psych_balance_before + _price_per_session;

  -- Actualizar balance del psicólogo
  UPDATE psychologist_wallets
  SET balance = _psych_balance_after
  WHERE id = _psych_wallet_id;

  -- Registrar transacción del psicólogo
  INSERT INTO wallet_transactions (
    transaction_type,
    wallet_type,
    psychologist_id,
    subscription_id,
    appointment_id,
    amount,
    balance_before,
    balance_after,
    description
  ) VALUES (
    'session_completed',
    'psychologist',
    _psychologist_id,
    _subscription_id,
    _appointment_id,
    _price_per_session,
    _psych_balance_before,
    _psych_balance_after,
    'Pago por sesión completada'
  );
END;
$$;

-- Función para obtener balance del psicólogo
CREATE OR REPLACE FUNCTION public.get_psychologist_wallet_balance(_psychologist_id UUID)
RETURNS TABLE (
  balance NUMERIC,
  pending_balance NUMERIC,
  deferred_revenue NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_deferred NUMERIC;
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