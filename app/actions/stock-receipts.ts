"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/data/queries";

export type ReceiveStockInput = {
  supplierId: string | null;
  reference: string;
  deliveryDate: string; // YYYY-MM-DD
  notes: string;
  items: { productId: string; qty: number; unitCost: number }[]; // unitCost in shillings
};

export type ReceiveStockResult =
  | {
      ok: true;
      receiptId: string;
      receiptNo: string;
      totalCents: number;
      lineCount: number;
    }
  | { ok: false; error: string };

export async function receiveStock(
  input: ReceiveStockInput,
): Promise<ReceiveStockResult> {
  if (input.items.length === 0) {
    return { ok: false, error: "Add at least one line item" };
  }
  for (const it of input.items) {
    if (!it.productId) return { ok: false, error: "Every line needs a product" };
    if (!Number.isInteger(it.qty) || it.qty <= 0) {
      return { ok: false, error: "Qty must be a whole number greater than 0" };
    }
    if (!Number.isFinite(it.unitCost) || it.unitCost < 0) {
      return { ok: false, error: "Unit cost must be 0 or more" };
    }
  }

  const storeId = await getCurrentStoreId();
  if (!storeId) return { ok: false, error: "No active store" };

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = (supabase as any).rpc.bind(supabase) as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{
    data:
      | {
          out_receipt_id: string;
          out_receipt_no: string;
          out_total_cents: number;
          out_line_count: number;
        }[]
      | null;
    error: { message: string } | null;
  }>;

  const { data, error } = await rpc("mpato_receive_stock", {
    p_store_id: storeId,
    p_supplier_id: input.supplierId || null,
    p_reference: input.reference,
    p_delivery_date: input.deliveryDate || null,
    p_notes: input.notes,
    p_items: input.items.map((it) => ({
      product_id: it.productId,
      qty: it.qty,
      unit_cost_cents: Math.round(it.unitCost * 100),
    })),
  });

  if (error) return { ok: false, error: error.message };
  const row = data?.[0];
  if (!row) return { ok: false, error: "Receipt was not created" };

  revalidatePath("/inventory");
  revalidatePath("/inventory/receive");
  revalidatePath("/inventory/receipts");
  revalidatePath("/dashboard");

  return {
    ok: true,
    receiptId: row.out_receipt_id,
    receiptNo: row.out_receipt_no,
    totalCents: row.out_total_cents,
    lineCount: row.out_line_count,
  };
}
