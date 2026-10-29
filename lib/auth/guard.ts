import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/data/queries";
import { getMemberships } from "@/lib/data/active-store";
import type { Role } from "@/lib/auth/access";

export type Guard = { ok: true; userId: string; storeId: string; role: Role } | { ok: false; error: string };

/**
 * Server actions are public POST endpoints: the middleware page guard does not
 * protect them. Call this first. With `storeId` it checks membership of that
 * store (e.g. a client-supplied WhatsApp session id); without, it uses the
 * active store. Either way the caller's role in that store must be allowed.
 */
export async function requireRole(allowed: Role[], storeId?: string): Promise<Guard> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const target = storeId ?? (await getCurrentStoreId());
  if (!target) return { ok: false, error: "No active store" };

  const memberships = await getMemberships(supabase, user.id);
  const m = memberships.find((x) => x.storeId === target);
  if (!m || !allowed.includes(m.role)) {
    return { ok: false, error: "You don't have permission to do that." };
  }
  return { ok: true, userId: user.id, storeId: target, role: m.role };
}

export const MANAGE: Role[] = ["owner", "manager"];
export const OWNER: Role[] = ["owner"];
