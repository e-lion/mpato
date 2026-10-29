-- Security hardening from the app audit. NOT yet applied to any database:
-- review, then apply deliberately. Pairs with the code change that moves the
-- webhooks to the service-role key and authenticates them with shared secrets.

begin;

-- 1. CRITICAL: any signed-in user could insert themselves into ANY store as
--    'owner' (the `user_id = auth.uid()` branch had no store restriction).
--    All legitimate inserts go through SECURITY DEFINER functions (which bypass
--    RLS), so only the store owner needs a direct insert path.
drop policy if exists mpato_store_members_insert on public.mpato_store_members;
create policy mpato_store_members_insert on public.mpato_store_members
  for insert to authenticated
  with check (exists (
    select 1 from public.mpato_stores s
    where s.id = mpato_store_members.store_id and s.owner_id = (select auth.uid())
  ));

-- 2. Payments: webhook now uses the service role (bypasses RLS). Remove all
--    anon access and stop every shop reading every other shop's M-PESA receipts.
drop policy if exists mpato_payments_anon_webhook_insert on public.mpato_payments_transactions;
drop policy if exists mpato_payments_anon_webhook_update on public.mpato_payments_transactions;
drop policy if exists mpato_payments_anon_webhook_select on public.mpato_payments_transactions;
drop policy if exists mpato_payments_authenticated_read on public.mpato_payments_transactions;
revoke all on public.mpato_payments_transactions from anon, authenticated;
-- Signed-in staff verify a receipt only through this function (exact match,
-- returns a boolean, no listing / enumeration).
create or replace function public.mpato_receipt_exists(p_receipt text)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (
    select 1 from public.mpato_payments_transactions where receipt_number = upper(p_receipt));
$$;
revoke all on function public.mpato_receipt_exists(text) from public, anon;
grant execute on function public.mpato_receipt_exists(text) to authenticated;
-- STK polling needs the receipt for one checkout id the caller just started.
create or replace function public.mpato_receipt_for_checkout(p_checkout text)
returns text language sql stable security definer set search_path = public as $$
  select receipt_number from public.mpato_payments_transactions
  where auth.uid() is not null and checkout_request_id = p_checkout;
$$;
revoke all on function public.mpato_receipt_for_checkout(text) from public, anon;
grant execute on function public.mpato_receipt_for_checkout(text) to authenticated;

-- 3. anon holds every table privilege (incl. TRUNCATE, which RLS does not gate)
--    on all mpato_* tables. The app never uses the anon role for data.
do $$ declare t text; begin
  for t in select tablename from pg_tables where schemaname='public' and tablename like 'mpato\_%' loop
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke truncate, references, trigger on public.%I from authenticated', t);
  end loop; end $$;

-- 4. Sales are written only through mpato_record_sale (which verifies stock,
--    prices and the receipt). Block direct writes so a cashier can't forge or
--    rewrite sales over the REST API.
drop policy if exists mpato_sales_all_members on public.mpato_sales;
create policy mpato_sales_select_members on public.mpato_sales
  for select to authenticated using (mpato_is_store_member(store_id));
drop policy if exists mpato_sale_items_all_members on public.mpato_sale_items;
create policy mpato_sale_items_select_members on public.mpato_sale_items
  for select to authenticated using (exists (
    select 1 from public.mpato_sales s
    where s.id = mpato_sale_items.sale_id and mpato_is_store_member(s.store_id)));

-- 5. Cashiers read products/customers; only owners/managers change products.
drop policy if exists mpato_products_all_members on public.mpato_products;
create policy mpato_products_select_members on public.mpato_products
  for select to authenticated using (mpato_is_store_member(store_id));
create policy mpato_products_write_managers on public.mpato_products
  for all to authenticated
  using (exists (select 1 from public.mpato_store_members m where m.store_id = mpato_products.store_id
         and m.user_id = (select auth.uid()) and m.role in ('owner','manager')))
  with check (exists (select 1 from public.mpato_store_members m where m.store_id = mpato_products.store_id
         and m.user_id = (select auth.uid()) and m.role in ('owner','manager')));

-- 6. Privilege escalation: staff rows (invites) could be created with role
--    'owner' by a manager over REST, then claimed via mpato_accept_invite.
--    Invites may only grant manager/cashier, and only an owner may edit them.
alter table public.mpato_staff
  drop constraint if exists mpato_staff_role_not_owner,
  add constraint mpato_staff_role_not_owner check (role::text in ('manager','cashier')) not valid;

-- 7. Only accept invites for verified email addresses.
create or replace function public.mpato_accept_invite()
returns uuid language plpgsql security definer set search_path to 'public' as $function$
declare
  v_user uuid := auth.uid();
  v_email text := auth.email();
  v_staff public.mpato_staff%rowtype;
begin
  if v_user is null then raise exception 'no authenticated user' using errcode = '28000'; end if;
  if v_email is null or length(trim(v_email)) = 0 then return null; end if;
  if not exists (select 1 from auth.users u where u.id = v_user and u.email_confirmed_at is not null) then
    return null;
  end if;

  select * into v_staff from public.mpato_staff where user_id = v_user limit 1;
  if found then return v_staff.store_id; end if;

  select * into v_staff from public.mpato_staff
  where user_id is null and email is not null and lower(email) = lower(v_email)
  order by created_at limit 1;
  if not found then return null; end if;

  update public.mpato_staff set user_id = v_user where id = v_staff.id;
  insert into public.mpato_store_members (store_id, user_id, role)
  values (v_staff.store_id, v_user, v_staff.role::public.mpato_role)
  on conflict (store_id, user_id) do update set role = excluded.role;
  return v_staff.store_id;
end;
$function$;

commit;
