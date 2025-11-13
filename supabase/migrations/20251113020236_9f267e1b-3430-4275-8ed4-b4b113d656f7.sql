-- Add INSERT policies for deferred_revenue (needed for RPC functions)
CREATE POLICY "System can insert deferred revenue"
  ON public.deferred_revenue FOR INSERT
  WITH CHECK (true);

-- Add INSERT policies for admin_wallet
CREATE POLICY "System can insert admin wallet"
  ON public.admin_wallet FOR INSERT
  WITH CHECK (true);

-- Add UPDATE policies for admin_wallet
CREATE POLICY "System can update admin wallet"
  ON public.admin_wallet FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add INSERT policies for psychologist_wallets
CREATE POLICY "System can insert psychologist wallets"
  ON public.psychologist_wallets FOR INSERT
  WITH CHECK (true);

-- Add UPDATE policies for psychologist_wallets
CREATE POLICY "System can update psychologist wallets"
  ON public.psychologist_wallets FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add UPDATE policies for deferred_revenue
CREATE POLICY "System can update deferred revenue"
  ON public.deferred_revenue FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add INSERT policies for wallet_transactions
CREATE POLICY "System can insert wallet transactions"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (true);