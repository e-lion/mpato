"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/data/queries";

const ACCENT_COLORS = [
  "var(--rose-500)",
  "var(--apricot-500)",
  "var(--peri-500)",
  "var(--lilac-500)",
  "var(--rose-600)",
  "var(--apricot-600)",
];

export type CustomerInput = {
  name: string;
  phone: string;
  tag: "Regular" | "VIP" | "Lapsing";
};

export type ActionResult = { ok: true } | { ok: false; error: string };

function validate(input: CustomerInput): string | null {
  if (!input.name.trim()) return "Customer name is required";
  if (input.phone && input.phone.length > 30) return "Phone number is too long";
  if (!["Regular", "VIP", "Lapsing"].includes(input.tag)) return "Invalid status";
  return null;
}

function revalidate() {
  revalidatePath("/customers");
  revalidatePath("/dashboard");
}

function pickColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return ACCENT_COLORS[Math.abs(h) % ACCENT_COLORS.length];
}

export async function createCustomer(input: CustomerInput): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const row = {
    store_id: storeId,
    name: input.name.trim(),
    phone: input.phone.trim() || null,
    tag: input.tag,
    color: pickColor(input.name),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("mpato_customers") as any).insert(row);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function updateCustomer(id: string, input: CustomerInput): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const patch = {
    name: input.name.trim(),
    phone: input.phone.trim() || null,
    tag: input.tag,
  };
  const { error } = await (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("mpato_customers") as any
  )
    .update(patch)
    .eq("id", id)
    .eq("store_id", storeId);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteCustomer(id: string): Promise<ActionResult> {
  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("mpato_customers")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
