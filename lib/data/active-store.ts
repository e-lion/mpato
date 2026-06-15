// Active-store resolution. The schema is multi-store (a user can belong to many
// stores via mpato_store_members, with a different role in each), so "which
// store am I looking at right now" is a real choice. We persist that choice in a
// cookie and validate it against the user's actual memberships on every read —
// a tampered or stale cookie simply falls back to the user's first store, and
// RLS independently blocks any data access outside their memberships.
//
// Pure + client-agnostic on purpose: both the server client and the middleware
// client are SupabaseClient<Database>, and the cookie value is read at the call
// site (next/headers in server code, request.cookies in middleware) so this
// module never imports next/headers.

import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRole, type Role } from "@/lib/auth/access";

export const ACTIVE_STORE_COOKIE = "mpato_active_store";

export type Membership = { storeId: string; role: Role };

// Inferred so it matches exactly what both client factories produce (server and
// middleware build structurally identical SupabaseClient<Database> instances).
// `import type` is fully erased, so this never pulls next/headers into middleware.
type Client = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Every store this user belongs to, oldest first, with their per-store role. */
export async function getMemberships(supabase: Client, userId: string): Promise<Membership[]> {
  const { data } = await supabase
    .from("mpato_store_members")
    .select("store_id, role, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as { store_id: string; role: string }[]).map((m) => ({
    storeId: m.store_id,
    role: isRole(m.role) ? m.role : "cashier",
  }));
}

/** Pick the active store: the cookie's store if the user is still a member of
 *  it, otherwise the first (oldest) membership. Null when they have no stores. */
export function pickActiveStore(
  memberships: Membership[],
  cookieStoreId: string | undefined,
): Membership | null {
  if (memberships.length === 0) return null;
  if (cookieStoreId) {
    const match = memberships.find((m) => m.storeId === cookieStoreId);
    if (match) return match;
  }
  return memberships[0];
}
