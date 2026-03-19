-- Add cancellation tracking columns to appointments table
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id);
