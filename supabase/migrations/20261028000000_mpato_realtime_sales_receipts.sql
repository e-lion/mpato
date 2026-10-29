-- Enable Supabase Realtime for the Mpato world (3D live events).
-- Additive + reversible: adds sales + stock receipts to the realtime publication
-- so authed store members receive INSERT events (RLS still scopes to their store).
-- Reverse with: ALTER PUBLICATION supabase_realtime DROP TABLE public.mpato_sales, public.mpato_stock_receipts;

alter publication supabase_realtime add table public.mpato_sales;
alter publication supabase_realtime add table public.mpato_stock_receipts;
