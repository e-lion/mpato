-- Remove anon/PUBLIC EXECUTE on the SECURITY DEFINER mpato_* functions.
--
-- These functions are only ever invoked by logged-in users via the cookie-based
-- (authenticated) server client (see app/actions/* and lib/data/queries.ts).
-- Removing anon/PUBLIC EXECUTE stops anonymous callers from hitting them over
-- /rest/v1/rpc. authenticated retains EXECUTE -- it is also required where
-- mpato_is_store_member() is referenced inside authenticated-only RLS policies
-- (mpato_stores, mpato_products, mpato_customers, mpato_sales, mpato_sale_items).

REVOKE EXECUTE ON FUNCTION public.mpato_create_store(text, text)                            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mpato_is_store_member(uuid)                               FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mpato_provision_store(text)                               FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mpato_receive_stock(uuid, uuid, text, date, text, jsonb)  FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mpato_record_sale(uuid, text, jsonb, text, uuid)          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mpato_top_products(uuid, integer)                         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mpato_week_sales(uuid)                                    FROM PUBLIC, anon;
