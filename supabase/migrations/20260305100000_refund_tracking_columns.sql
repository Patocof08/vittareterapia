-- Columnas para trackear reembolsos en Stripe
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS refunded_at      TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN payments.stripe_refund_id IS 'ID del refund en Stripe (re_xxx)';
COMMENT ON COLUMN payments.refunded_at      IS 'Cuándo se procesó el reembolso real en Stripe';
