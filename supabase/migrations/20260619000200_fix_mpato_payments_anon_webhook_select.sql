-- Corrective fix for 20260619000000_harden_mpato_payments_transactions_rls.sql
--
-- The M-Pesa callback webhook (app/api/mpesa/callback/route.ts) runs as anon and
-- writes with an upsert (INSERT ... ON CONFLICT DO UPDATE). Postgres requires
-- SELECT -- both the table privilege AND an RLS SELECT policy -- for the conflict
-- path to read the existing row. The hardening migration removed anon SELECT,
-- which broke the webhook ("permission denied for table") and left STK-push
-- polling stuck on "Waiting for customer to enter PIN...".
--
-- Restore anon SELECT. anon still has NO DELETE on this table, and the mpato_*
-- SECURITY DEFINER functions remain revoked from anon (see
-- 20260619000100_revoke_anon_execute_mpato_functions.sql).
--
-- Longer-term: move the webhook to the service_role key (server-only) and drop
-- anon access to this table entirely.

GRANT SELECT ON public.mpato_payments_transactions TO anon;

CREATE POLICY "mpato_payments_anon_webhook_select"
  ON public.mpato_payments_transactions
  FOR SELECT TO anon
  USING (true);
