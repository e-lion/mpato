"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/data/queries";

export type ProductInput = {
  name: string;
  category: string;
  price: number; // shillings (whole number)
  stock: number;
  glyph: string;
  tile: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

function validate(input: ProductInput): string | null {
  if (!input.name.trim()) return "Product name is required";
  if (!input.category.trim()) return "Category is required";
  if (!Number.isFinite(input.price) || input.price < 0) return "Price must be 0 or more";
  if (!Number.isInteger(input.stock) || input.stock < 0) return "Stock must be a whole number 0 or more";
  return null;
}

function revalidate() {
  revalidatePath("/inventory");
  revalidatePath("/pos");
  revalidatePath("/dashboard");
}

export async function createProduct(input: ProductInput): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const row = {
    store_id: storeId,
    name: input.name.trim(),
    category: input.category.trim(),
    price_cents: Math.round(input.price * 100),
    stock: input.stock,
    glyph: input.glyph || "package",
    tile: input.tile || "apricot",
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("mpato_products") as any).insert(row);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult> {
  const err = validate(input);
  if (err) return { ok: false, error: err };

  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const patch = {
    name: input.name.trim(),
    category: input.category.trim(),
    price_cents: Math.round(input.price * 100),
    stock: input.stock,
    glyph: input.glyph || "package",
    tile: input.tile || "apricot",
  };
  const { error } = await (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.from("mpato_products") as any
  )
    .update(patch)
    .eq("id", id)
    .eq("store_id", storeId);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("mpato_products")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId);

  if (error) return { ok: false, error: error.message };
  revalidate();
  return { ok: true };
}
