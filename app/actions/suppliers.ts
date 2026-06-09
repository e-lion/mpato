"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/data/queries";

export type SupplierInput = {
  name: string;
  phone: string;
  contact: string;
  notes: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

function validate(input: SupplierInput): string | null {
  if (!input.name.trim()) return "Supplier name is required";
  if (input.phone.length > 30) return "Phone number is too long";
  return null;
}

function revalidate() {
  revalidatePath("/suppliers");
  revalidatePath("/inventory/receive");
  revalidatePath("/inventory/receipts");
}

export async function createSupplier(input: SupplierInput): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const row = {
    store_id: storeId,
    name: input.name.trim(),
    phone: input.phone.trim() || null,
    contact: input.contact.trim() || null,
    notes: input.notes.trim() || null,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("mpato_suppliers") as any).insert(row);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function updateSupplier(
  id: string,
  input: SupplierInput,
): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const patch = {
    name: input.name.trim(),
    phone: input.phone.trim() || null,
    contact: input.contact.trim() || null,
    notes: input.notes.trim() || null,
  };
  const { error } = await (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("mpato_suppliers") as any
  )
    .update(patch)
    .eq("id", id)
    .eq("store_id", storeId);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteSupplier(id: string): Promise<ActionResult> {
  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("mpato_suppliers")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
