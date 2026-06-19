-- Replace the always-true "Enable all for anon" policy on
-- mpato_payments_transactions with least-privilege access.
--
-- The M-Pesa callback webhook (app/api/mpesa/callback/route.ts) runs
-- UNAUTHENTICATED (anon role) and only upserts (INSERT + ON CONFLICT UPDATE).
-- Logged-in cashiers (authenticated role) only read the table for STK-push
-- polling and sale-receipt verification.

DROP POLICY IF EXISTS "Enable all for anon" ON public.mpato_payments_transactions;

-- Tighten table-level grants to the minimum each role needs.
REVOKE ALL ON public.mpato_payments_transactions FROM anon, authenticated;
GRANT INSERT, UPDATE ON public.mpato_payments_transactions TO anon;
GRANT SELECT ON public.mpato_payments_transactions TO authenticated;

-- RLS policies (RLS is already enabled on the table).
CREATE POLICY "mpato_payments_anon_webhook_insert"
  ON public.mpato_payments_transactions
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "mpato_payments_anon_webhook_update"
  ON public.mpato_payments_transactions
  FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "mpato_payments_authenticated_read"
  ON public.mpato_payments_transactions
  FOR SELECT TO authenticated
  USING (true);
