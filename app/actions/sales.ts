"use server";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentStoreId } from "@/lib/data/queries";

export type RecordSaleInput = {
  method: "mpesa" | "cash";
  items: { productId: string; qty: number }[];
  /** Optional. The M-PESA confirmation code typed in by the cashier
   * (e.g. "QGH7X2P1LM"). If omitted on an M-PESA sale, the DB synthesises
   * one so the receipt still has a reference. */
  mpesaRef?: string;
  /** Optional customer attached to the sale. When set, the DB bumps the
   * customer's spent_cents / visits / last_seen automatically. */
  customerId?: string | null;
};

export type RecordSaleResult =
  | { ok: true; saleId: string; receiptNo: string; mpesaRef: string | null; totalCents: number }
  | { ok: false; error: string };

export async function recordSale(input: RecordSaleInput): Promise<RecordSaleResult> {
  if (input.items.length === 0) {
    return { ok: false, error: "Cart is empty" };
  }

  // Light client-side check; the DB enforces the canonical rule too.
  const ref = (input.mpesaRef ?? "").trim().toUpperCase();
  if (input.method === "mpesa" && ref && !/^[A-Z0-9]{6,12}$/.test(ref)) {
    return { ok: false, error: "M-PESA reference must be 6–12 letters/digits" };
  }

  const storeId = await getCurrentStoreId();
  if (!storeId) {
    return { ok: false, error: "No active store. Sign in and try again." };
  }

  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = (supabase as any).rpc.bind(supabase) as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{
    data:
      | {
          out_sale_id: string;
          out_receipt_no: string;
          out_mpesa_ref: string | null;
          out_total_cents: number;
        }[]
      | null;
    error: { message: string } | null;
  }>;

  const { data, error } = await rpc("mpato_record_sale", {
    p_store_id: storeId,
    p_method: input.method,
    p_items: input.items.map((i) => ({ product_id: i.productId, qty: i.qty })),
    p_mpesa_ref: input.method === "mpesa" && ref ? ref : null,
    p_customer_id: input.customerId ?? null,
  });

  if (error) return { ok: false, error: error.message };
  const row = data?.[0];
  if (!row) return { ok: false, error: "Sale was not recorded" };

  // Bust the cached server-rendered pages that show sales data.
  revalidatePath("/dashboard");
  revalidatePath("/pos");
  revalidatePath("/inventory");
  if (input.customerId) revalidatePath("/customers");

  return {
    ok: true,
    saleId: row.out_sale_id,
    receiptNo: row.out_receipt_no,
    mpesaRef: row.out_mpesa_ref,
    totalCents: row.out_total_cents,
  };
}
