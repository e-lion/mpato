import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionContext = {
  user: { id: string; email: string | null; fullName: string; firstName: string; initials: string };
  store: { id: string; name: string; area: string | null } | null;
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

  const { data: storeRow } = await supabase
    .from("mpato_stores")
    .select("id, name, area")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  const store = storeRow
    ? {
        id: (storeRow as { id: string }).id,
        name: (storeRow as { name: string }).name,
        area: (storeRow as { area: string | null }).area ?? null,
      }
    : null;

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      fullName: full,
      firstName: first,
      initials,
    },
    store,
  };
}
