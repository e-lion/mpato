import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { type Role } from "@/lib/auth/access";
import {
  ACTIVE_STORE_COOKIE,
  getMemberships,
  pickActiveStore,
} from "./active-store";

export type StoreOption = { id: string; name: string; area: string | null; role: Role };

export type SessionContext = {
  user: { id: string; email: string | null; fullName: string; firstName: string; initials: string };
  store: { id: string; name: string; area: string | null } | null;
  role: Role | null;
  /** Every store this user belongs to, for the store switcher. */
  stores: StoreOption[];
};

function deriveName(fullName: string | null, email: string | null): { full: string; first: string; initials: string } {
  const raw = (fullName ?? email?.split("@")[0] ?? "Friend").trim();
  const parts = raw.split(/\s+/).filter(Boolean);
  const first = parts[0] ?? "Friend";
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "U";
  return { full: raw, first, initials };
}

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = user.user_metadata as any;
  const fullNameRaw =
    (meta?.full_name as string | undefined) ||
    (meta?.name as string | undefined) ||
    null;

  const { full, first, initials } = deriveName(fullNameRaw, user.email ?? null);

  // Resolve the active store + the role *for that store* (a user can be owner of
  // one shop and cashier of another). Works for owners and staff alike.
  const memberships = await getMemberships(supabase, user.id);
  const cookieStore = await cookies();
  const active = pickActiveStore(
    memberships,
    cookieStore.get(ACTIVE_STORE_COOKIE)?.value,
  );

  let stores: StoreOption[] = [];
  if (memberships.length > 0) {
    const ids = memberships.map((mm) => mm.storeId);
    const { data: storeRows } = await supabase
      .from("mpato_stores")
      .select("id, name, area")
      .in("id", ids);
    const byId = new Map(
      ((storeRows ?? []) as { id: string; name: string; area: string | null }[]).map(
        (s) => [s.id, s],
      ),
    );
    stores = memberships.map((mm) => {
      const s = byId.get(mm.storeId);
      return {
        id: mm.storeId,
        name: s?.name ?? "Shop",
        area: s?.area ?? null,
        role: mm.role,
      };
    });
  }

  const activeOption = active
    ? stores.find((s) => s.id === active.storeId) ?? null
    : null;
  const store = activeOption
    ? { id: activeOption.id, name: activeOption.name, area: activeOption.area }
    : null;
  const role: Role | null = active?.role ?? null;

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      fullName: full,
      firstName: first,
      initials,
    },
    store,
    role,
    stores,
  };
}
