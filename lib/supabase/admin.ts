import "server-only";
import { createClient } from "@supabase/supabase-js";

/** Service-role client for trusted server-to-server work (webhooks). Bypasses
 *  RLS, so never import it from client code or expose the key via NEXT_PUBLIC_. */
export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase admin client is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
