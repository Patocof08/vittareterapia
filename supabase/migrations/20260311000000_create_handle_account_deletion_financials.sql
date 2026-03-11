-- Creates the missing financial cleanup function called by the delete-user-account edge function.
-- This function handles wallet audit trail before account deletion.
CREATE OR REPLACE FUNCTION public.handle_account_deletion_financials(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _psych_profile_id UUID;
  _psych_balance NUMERIC;
  _psych_wallet_id UUID;
  _admin_balance_before NUMERIC;
  _admin_balance_after NUMERIC;
  _admin_wallet_id UUID;
  _psych_full_name TEXT;
BEGIN
  -- Check if user is a psychologist with a wallet
  SELECT pp.id, pp.first_name || ' ' || pp.last_name
  INTO _psych_profile_id, _psych_full_name
  FROM psychologist_profiles pp
  WHERE pp.user_id = _user_id
  LIMIT 1;

  IF _psych_profile_id IS NOT NULL THEN
    -- Get psychologist wallet balance
    SELECT id, balance INTO _psych_wallet_id, _psych_balance
    FROM psychologist_wallets
    WHERE psychologist_id = _psych_profile_id;

    -- If they have a positive balance, log a closing transaction for audit purposes
    IF _psych_wallet_id IS NOT NULL AND _psych_balance > 0 THEN
      SELECT id, balance INTO _admin_wallet_id, _admin_balance_before
      FROM admin_wallet
      LIMIT 1;

      _admin_balance_after := COALESCE(_admin_balance_before, 0);

      -- Record closing transaction — store name so it persists after profile deletion
      INSERT INTO wallet_transactions (
        transaction_type,
        wallet_type,
        psychologist_id,
        psychologist_name,
        amount,
        balance_before,
        balance_after,
        description
      ) VALUES (
        'account_deletion',
        'psychologist',
        _psych_profile_id,
        _psych_full_name,
        _psych_balance,
        _psych_balance,
        0,
        'Saldo al cierre de cuenta'
      );

      -- Zero out the psychologist wallet
      UPDATE psychologist_wallets
      SET balance = 0, pending_balance = 0
      WHERE id = _psych_wallet_id;
    END IF;
  END IF;

  -- No financial action needed for client-only accounts;
  -- their deferred_revenue and subscriptions are cleaned up by the edge function directly.
END;
$$;
