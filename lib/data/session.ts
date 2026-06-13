import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isRole, type Role } from "@/lib/auth/access";

export type SessionContext = {
  user: { id: string; email: string | null; fullName: string; firstName: string; initials: string };
  store: { id: string; name: string; area: string | null } | null;
  role: Role | null;
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

  // Resolve the store + role via membership (works for owners and staff alike).
  const { data: memberRow } = await supabase
    .from("mpato_store_members")
    .select("role, mpato_stores ( id, name, area )")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const m = memberRow as any;
  const storeData = m && typeof m.mpato_stores === "object" ? m.mpato_stores : null;
  const store = storeData
    ? {
        id: storeData.id as string,
        name: storeData.name as string,
        area: (storeData.area as string | null) ?? null,
      }
    : null;
  const role: Role | null = m && isRole(m.role) ? m.role : null;

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
  };
}
