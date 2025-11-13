-- Drop all financial tracking tables and functions
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS psychologist_wallets CASCADE;
DROP TABLE IF EXISTS admin_wallet CASCADE;
DROP TABLE IF EXISTS deferred_revenue CASCADE;

-- Drop financial functions
DROP FUNCTION IF EXISTS process_package_purchase(UUID, UUID, UUID, NUMERIC, INTEGER);
DROP FUNCTION IF EXISTS process_single_session_payment(UUID, UUID, UUID, NUMERIC);
DROP FUNCTION IF EXISTS recognize_session_revenue(UUID, UUID, UUID);