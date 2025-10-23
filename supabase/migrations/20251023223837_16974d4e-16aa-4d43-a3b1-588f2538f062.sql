-- Allow clients to create their own invoices
CREATE POLICY "Clients can create their own invoices"
ON invoices
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = client_id);