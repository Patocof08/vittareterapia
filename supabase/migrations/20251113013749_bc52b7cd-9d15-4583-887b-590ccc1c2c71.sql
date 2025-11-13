-- Drop existing complex financial tracking (reset)
DROP TABLE IF EXISTS deferred_revenue CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS admin_wallet CASCADE;
DROP TABLE IF EXISTS psychologist_wallets CASCADE;

-- Create simple admin deferred revenue table
CREATE TABLE admin_deferred_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES client_subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'recognized')),
  payment_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recognized_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE admin_deferred_revenue ENABLE ROW LEVEL SECURITY;

-- Only admins can view
CREATE POLICY "Admins can view all deferred revenue"
  ON admin_deferred_revenue FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Index for performance
CREATE INDEX idx_admin_deferred_status ON admin_deferred_revenue(status);
CREATE INDEX idx_admin_deferred_created ON admin_deferred_revenue(created_at DESC);