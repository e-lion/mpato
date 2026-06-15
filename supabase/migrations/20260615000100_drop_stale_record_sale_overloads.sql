-- Drop the unused mpato_record_sale overloads.
--
-- The app only ever calls the 5-arg version (p_store_id, p_method, p_items,
-- p_mpesa_ref, p_customer_id). The older 3-arg and 4-arg overloads are dead
-- code, and the 4-arg one still carries the old per-store double-spend check —
-- a latent footgun if anything ever resolved to it. Remove both.

drop function if exists public.mpato_record_sale(uuid, text, jsonb);
drop function if exists public.mpato_record_sale(uuid, text, jsonb, text);
