"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_STORE_COOKIE, getMemberships } from "@/lib/data/active-store";

const ONE_YEAR = 60 * 60 * 24 * 365;

export type SetActiveStoreResult = { ok: true } | { ok: false; error: string };

/** Switch the active store. Validates membership before writing the cookie so a
 *  user can never point themselves at a store they don't belong to. */
export async function setActiveStore(storeId: string): Promise<SetActiveStoreResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const memberships = await getMemberships(supabase, user.id);
  if (!memberships.some((m) => m.storeId === storeId)) {
    return { ok: false, error: "You don't have access to that store." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_STORE_COOKIE, storeId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });

  // Every server-rendered page is scoped to the active store; refresh them all.
  revalidatePath("/", "layout");
  return { ok: true };
}

export type CreateStoreResult = { ok: true; storeId: string } | { ok: false; error: string };

/** Create a new shop owned by the current user and switch to it. */
export async function createStore(name: string, area?: string): Promise<CreateStoreResult> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Enter a shop name." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = (supabase as any).rpc.bind(supabase) as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: { message: string } | null }>;

  const { data, error } = await rpc("mpato_create_store", {
    p_shop_name: trimmed,
    p_area: area?.trim() || null,
  });
  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not create the shop." };
  }

  const storeId = data as string;
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_STORE_COOKIE, storeId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });

  revalidatePath("/", "layout");
  return { ok: true, storeId };
}
