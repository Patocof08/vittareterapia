-- Add subscription_id column to appointments table
ALTER TABLE appointments 
ADD COLUMN subscription_id UUID REFERENCES client_subscriptions(id) ON DELETE SET NULL;