-- Make M-PESA receipt dedup global instead of per-store.
--
-- Why: M-PESA confirmation codes are globally unique by nature. The previous
-- guard in mpato_record_sale only blocked reuse within the same store
-- (`store_id = p_store_id AND mpesa_ref = ...`). With a shared till across
-- several shops, the same payment could be claimed once per store. The
-- app-layer pre-check in sales.ts was also dead (it filtered a non-existent
-- column `mpesa_reference`), so the per-store RPC check was the only guard.
--
-- This migration:
--   1. Adds `mpesa_ref_entered` to distinguish real cashier-entered codes from
--      the synthesized placeholder refs the RPC generates. Only entered codes
--      need global uniqueness; synthesized 10-char placeholders are excluded
--      so they can never fail a legitimate sale on an astronomically-rare clash.
--   2. Backfills the flag for historical rows whose ref matches a genuinely
--      received payment in mpato_payments_transactions.
--   3. Adds a global partial unique index over entered refs (the real guarantee).
--   4. Rewrites mpato_record_sale to set the flag and check uniqueness globally.

begin;

-- 1. Discriminator: was this ref typed by a cashier (real receipt) vs synthesized?
alter table public.mpato_sales
  add column if not exists mpesa_ref_entered boolean not null default false;

-- 2. Backfill: a ref is "entered" if it corresponds to a real received payment.
--    Synthesized placeholder refs never appear in mpato_payments_transactions.
update public.mpato_sales s
   set mpesa_ref_entered = true
 where s.method = 'mpesa'
   and s.mpesa_ref is not null
   and not s.mpesa_ref_entered
   and exists (
     select 1 from public.mpato_payments_transactions t
     where t.receipt_number = s.mpesa_ref
   );

-- 3. Global uniqueness for real, cashier-entered M-PESA codes (the hard guarantee).
create unique index if not exists mpato_sales_mpesa_ref_uq
  on public.mpato_sales (mpesa_ref)
  where mpesa_ref_entered;

-- 4. Rewrite the live RPC: global (not per-store) dedup + set the flag.
create or replace function public.mpato_record_sale(
  p_store_id uuid,
  p_method text,
  p_items jsonb,
  p_mpesa_ref text default null::text,
  p_customer_id uuid default null::uuid
)
returns table(out_sale_id uuid, out_receipt_no text, out_mpesa_ref text, out_total_cents bigint)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_sale_id uuid;
  v_receipt_no text;
  v_mpesa_ref text;
  v_ref_in text;
  v_entered boolean := false;
  v_total_cents bigint := 0;
  v_seq int;
  v_item record;
  v_product record;
begin
  if v_user is null then
    raise exception 'no authenticated user' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.mpato_store_members m
    where m.store_id = p_store_id and m.user_id = v_user
  ) then
    raise exception 'not a member of this store' using errcode = '42501';
  end if;

  if p_method not in ('mpesa', 'cash') then
    raise exception 'invalid payment method: %', p_method using errcode = '22023';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'no items in cart' using errcode = '22023';
  end if;

  -- Verify the customer (if any) belongs to this store before we use them.
  if p_customer_id is not null then
    if not exists (
      select 1 from public.mpato_customers c
      where c.id = p_customer_id and c.store_id = p_store_id
    ) then
      raise exception 'customer not in this store' using errcode = '42501';
    end if;
  end if;

  for v_item in
    select (elem->>'product_id')::uuid as product_id,
           (elem->>'qty')::int as qty
    from jsonb_array_elements(p_items) elem
  loop
    if v_item.qty <= 0 then
      raise exception 'invalid qty for product %', v_item.product_id;
    end if;

    select p.id, p.name, p.price_cents, p.stock
      into v_product
      from public.mpato_products p
      where p.id = v_item.product_id and p.store_id = p_store_id
      for update;

    if not found then
      raise exception 'product not in this store: %', v_item.product_id;
    end if;
    if v_product.stock < v_item.qty then
      raise exception '% only has % in stock', v_product.name, v_product.stock;
    end if;

    v_total_cents := v_total_cents + (v_product.price_cents::bigint * v_item.qty);
  end loop;

  select count(*) + 1 into v_seq from public.mpato_sales s where s.store_id = p_store_id;
  v_receipt_no := 'INV-' || lpad(v_seq::text, 4, '0');

  if p_method = 'mpesa' then
    -- Real M-PESA confirmation codes are 6-12 char uppercase alphanumeric.
    -- Accept the cashier-entered ref if valid and not already used ANYWHERE;
    -- otherwise synthesize a placeholder so the sale still has a reference.
    v_ref_in := upper(coalesce(nullif(btrim(p_mpesa_ref), ''), ''));
    if v_ref_in <> '' then
      if v_ref_in !~ '^[A-Z0-9]{6,12}$' then
        raise exception 'M-PESA reference must be 6-12 letters/digits' using errcode = '22023';
      end if;
      -- Global dedup: a real receipt can only ever back one sale, across all stores.
      if exists (
        select 1 from public.mpato_sales s
        where s.mpesa_ref = v_ref_in and s.mpesa_ref_entered
      ) then
        raise exception 'M-PESA reference % has already been used', v_ref_in using errcode = '23505';
      end if;
      v_mpesa_ref := v_ref_in;
      v_entered := true;
    else
      v_mpesa_ref := upper(
        substr(
          md5(random()::text || clock_timestamp()::text || v_user::text),
          1, 10
        )
      );
    end if;
  end if;

  insert into public.mpato_sales
    (store_id, receipt_no, total_cents, method, mpesa_ref, cashier_id, customer_id, mpesa_ref_entered)
  values
    (p_store_id, v_receipt_no, v_total_cents, p_method::mpato_payment_method, v_mpesa_ref, v_user, p_customer_id, v_entered)
  returning id into v_sale_id;

  for v_item in
    select (elem->>'product_id')::uuid as product_id,
           (elem->>'qty')::int as qty
    from jsonb_array_elements(p_items) elem
  loop
    select p.name, p.price_cents
      into v_product
      from public.mpato_products p
      where p.id = v_item.product_id;

    insert into public.mpato_sale_items (sale_id, product_id, product_name_snapshot, qty, unit_price_cents)
    values (v_sale_id, v_item.product_id, v_product.name, v_item.qty, v_product.price_cents);

    update public.mpato_products p
       set stock = p.stock - v_item.qty
     where p.id = v_item.product_id;
  end loop;

  -- Roll the sale up into the customer's book so the dashboard / customer
  -- page reflect activity without a separate aggregation.
  if p_customer_id is not null then
    update public.mpato_customers c
       set spent_cents = c.spent_cents + v_total_cents,
           visits      = c.visits + 1,
           last_seen   = now()
     where c.id = p_customer_id and c.store_id = p_store_id;
  end if;

  return query
    select v_sale_id, v_receipt_no, v_mpesa_ref, v_total_cents;
end;
$function$;

commit;
