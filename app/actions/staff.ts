"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/data/queries";
import type { StaffRole } from "@/lib/data/queries";

export type StaffInput = {
  name: string;
  role: StaffRole;
  phone: string;
  email: string;
  notes: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

function validate(input: StaffInput): string | null {
  if (!input.name.trim()) return "Staff name is required";
  if (input.role !== "manager" && input.role !== "cashier") return "Pick a role";
  // Email is the login address — required so the person can claim their invite.
  if (!input.email.trim()) return "A login email is required so they can sign in";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    return "Enter a valid email address";
  }
  if (input.phone.length > 30) return "Phone number is too long";
  return null;
}

function revalidate() {
  revalidatePath("/staff");
}

export async function createStaff(input: StaffInput): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const row = {
    store_id: storeId,
    name: input.name.trim(),
    role: input.role,
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    notes: input.notes.trim() || null,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("mpato_staff") as any).insert(row);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function updateStaff(id: string, input: StaffInput): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const patch = {
    name: input.name.trim(),
    role: input.role,
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    notes: input.notes.trim() || null,
  };
  const { error } = await (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("mpato_staff") as any
  )
    .update(patch)
    .eq("id", id)
    .eq("store_id", storeId);

  if (error) return { ok: false, error: error.message };

  // If this person has already signed in, push the (possibly changed) role
  // onto their live access grant too.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = (supabase as any).rpc.bind(supabase);
  const { error: syncError } = await rpc("mpato_sync_member_role", { p_staff_id: id });
  if (syncError) return { ok: false, error: syncError.message };

  revalidate();
  return { ok: true };
}

export async function deleteStaff(id: string): Promise<ActionResult> {
  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  // Revoke store access for the linked account (if any) and delete the row.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = (supabase as any).rpc.bind(supabase);
  const { error } = await rpc("mpato_remove_staff", { p_staff_id: id });

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
