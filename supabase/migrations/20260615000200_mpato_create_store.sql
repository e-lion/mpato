-- "Create another shop" for an existing owner.
--
-- mpato_provision_store is the onboarding guard: it early-returns the user's
-- existing store, so it can never create a second one (by design — it runs on
-- every login). This function always inserts a new store + owner membership,
-- for the deliberate "add a shop" action from the store switcher.

create or replace function public.mpato_create_store(p_shop_name text, p_area text default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_store uuid;
begin
  if v_user is null then
    raise exception 'no authenticated user' using errcode = '28000';
  end if;

  insert into public.mpato_stores (name, area, owner_id)
  values (
    coalesce(nullif(trim(p_shop_name), ''), 'My Shop'),
    nullif(trim(p_area), ''),
    v_user
  )
  returning id into v_store;

  insert into public.mpato_store_members (store_id, user_id, role)
  values (v_store, v_user, 'owner')
  on conflict (store_id, user_id) do nothing;

  return v_store;
end;
$function$;

grant execute on function public.mpato_create_store(text, text) to authenticated;
