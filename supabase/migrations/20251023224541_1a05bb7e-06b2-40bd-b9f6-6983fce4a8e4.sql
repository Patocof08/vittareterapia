-- Allow clients to update their own payments to reflect checkout completion
CREATE POLICY "Clients can update their own payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);