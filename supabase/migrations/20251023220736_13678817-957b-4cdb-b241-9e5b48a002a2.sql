-- Create payments table to track all transactions
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  psychologist_id UUID NOT NULL,
  appointment_id UUID,
  subscription_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('single_session', 'package_4', 'package_8')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  transaction_reference TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT fk_payment_client FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_psychologist FOREIGN KEY (psychologist_id) REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_payment_appointment FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL,
  CONSTRAINT fk_payment_subscription FOREIGN KEY (subscription_id) REFERENCES public.client_subscriptions(id) ON DELETE SET NULL
);

-- Create index for faster queries
CREATE INDEX idx_payments_client ON public.payments(client_id);
CREATE INDEX idx_payments_psychologist ON public.payments(psychologist_id);
CREATE INDEX idx_payments_status ON public.payments(payment_status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at DESC);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Clients can view their own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can insert their own payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Psychologists can view their payments"
  ON public.payments
  FOR SELECT
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payments"
  ON public.payments
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Create invoices table for downloadable receipts
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  client_id UUID NOT NULL,
  psychologist_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'MXN',
  issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  due_at TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_invoice_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoice_client FOREIGN KEY (client_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  CONSTRAINT fk_invoice_psychologist FOREIGN KEY (psychologist_id) REFERENCES public.psychologist_profiles(id) ON DELETE CASCADE
);

-- Create index for invoices
CREATE INDEX idx_invoices_client ON public.invoices(client_id);
CREATE INDEX idx_invoices_psychologist ON public.invoices(psychologist_id);
CREATE INDEX idx_invoices_payment ON public.invoices(payment_id);

-- Enable RLS for invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Clients can view their own invoices"
  ON public.invoices
  FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Psychologists can view their invoices"
  ON public.invoices
  FOR SELECT
  USING (
    psychologist_id IN (
      SELECT id FROM public.psychologist_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all invoices"
  ON public.invoices
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_number FROM public.invoices;
  invoice_num := 'INV-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(next_number::TEXT, 6, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();