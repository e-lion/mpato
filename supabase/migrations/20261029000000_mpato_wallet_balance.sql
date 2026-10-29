-- Shop wallet, derived (no new write path): every sale is money in, every
-- supplier payment is money out. SECURITY INVOKER so the caller's RLS decides
-- which stores' rows are visible; returns cents.
create or replace function public.mpato_wallet_balance(p_store_id uuid)
returns bigint
language sql
stable
security invoker
set search_path = public
as $$
  select
    coalesce((select sum(total_cents) from public.mpato_sales where store_id = p_store_id), 0)
    - coalesce((select sum(amount_cents) from public.mpato_supplier_payments where store_id = p_store_id), 0);
$$;

revoke all on function public.mpato_wallet_balance(uuid) from public, anon;
grant execute on function public.mpato_wallet_balance(uuid) to authenticated;
