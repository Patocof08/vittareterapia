-- Create subscriptions table for therapist-specific packages
CREATE TABLE IF NOT EXISTS public.client_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  psychologist_id UUID NOT NULL REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  package_type TEXT NOT NULL CHECK (package_type IN ('4_sessions', '8_sessions')),
  session_price NUMERIC NOT NULL,
  discount_percentage INTEGER NOT NULL CHECK (discount_percentage IN (10, 20)),
  sessions_total INTEGER NOT NULL,
  sessions_used INTEGER NOT NULL DEFAULT 0,
  sessions_remaining INTEGER NOT NULL,
  rollover_sessions NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  next_billing_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(client_id, psychologist_id, status)
);

-- Create index for faster queries
CREATE INDEX idx_client_subscriptions_client ON public.client_subscriptions(client_id);
CREATE INDEX idx_client_subscriptions_psychologist ON public.client_subscriptions(psychologist_id);
CREATE INDEX idx_client_subscriptions_status ON public.client_subscriptions(status);

-- Create subscription history table for tracking renewals
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.client_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('created', 'renewed', 'cancelled', 'expired', 'rollover')),
  sessions_added INTEGER,
  rollover_amount NUMERIC,
  amount_charged NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_subscriptions
CREATE POLICY "Clients can view their own subscriptions"
  ON public.client_subscriptions
  FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert their own subscriptions"
  ON public.client_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own subscriptions"
  ON public.client_subscriptions
  FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Psychologists can view subscriptions for their services"
  ON public.client_subscriptions
  FOR SELECT
  USING (psychologist_id IN (
    SELECT id FROM public.psychologist_profiles
    WHERE user_id = auth.uid()
  ));

-- RLS Policies for subscription_history
CREATE POLICY "Users can view their subscription history"
  ON public.subscription_history
  FOR SELECT
  USING (
    subscription_id IN (
      SELECT id FROM public.client_subscriptions
      WHERE client_id = auth.uid()
      OR psychologist_id IN (
        SELECT id FROM public.psychologist_profiles
        WHERE user_id = auth.uid()
      )
    )
  );

-- Function to calculate rollover (25% of total sessions, not remaining)
CREATE OR REPLACE FUNCTION calculate_rollover(
  _total_sessions INTEGER,
  _sessions_used INTEGER
) RETURNS NUMERIC AS $$
BEGIN
  -- Rollover is 25% of TOTAL sessions if there are unused sessions
  IF (_total_sessions - _sessions_used) > 0 THEN
    RETURN (_total_sessions * 0.25);
  END IF;
  RETURN 0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_client_subscriptions_updated_at
  BEFORE UPDATE ON public.client_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();