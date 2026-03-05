-- ============================================================
-- Columnas de tracking para evitar enviar recordatorios duplicados
-- ============================================================
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS client_reminder_sent_at  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS psych_reminder_sent_at   TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN appointments.client_reminder_sent_at IS 'Cuándo se envió el recordatorio de 12h al cliente';
COMMENT ON COLUMN appointments.psych_reminder_sent_at  IS 'Cuándo se envió el recordatorio de 10min al psicólogo';
