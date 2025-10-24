-- Create table for individual session credits
CREATE TABLE IF NOT EXISTS public.client_credits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  psychologist_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  reason TEXT NOT NULL,
  original_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE,
  used_at TIMESTAMP WITH TIME ZONE,
  used_for_appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_credits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_credits
CREATE POLICY "Clients can view their own credits"
  ON public.client_credits
  FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert their own credits"
  ON public.client_credits
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update their own credits"
  ON public.client_credits
  FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Psychologists can view credits for their services"
  ON public.client_credits
  FOR SELECT
  USING (
    psychologist_id IN (
      SELECT id FROM psychologist_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX idx_client_credits_client_id ON public.client_credits(client_id);
CREATE INDEX idx_client_credits_status ON public.client_credits(status);

-- Add trigger for updated_at
CREATE TRIGGER update_client_credits_updated_at
  BEFORE UPDATE ON public.client_credits
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();