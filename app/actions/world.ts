"use server";

import { setActiveStore } from "@/app/actions/active-store";
import { getProducts, getCustomers, getStoreSettings } from "@/lib/data/queries";
import type { Customer, Product } from "@/lib/data/types";
import type { StoreSettings } from "@/lib/data/queries";

export type PosDrawerData =
  | { ok: true; products: Product[]; customers: Customer[]; settings: StoreSettings | null }
  | { ok: false; error: string };

/**
 * Data the in-world POS drawer needs. Switches the active store first (this
 * validates membership), because recordSale resolves the store from that
 * cookie — so the sale lands in the shop the user is standing in.
 */
export async function loadPosForWorld(storeId: string): Promise<PosDrawerData> {
  const sw = await setActiveStore(storeId);
  if (!sw.ok) return { ok: false, error: sw.error };
  const [products, customers, settings] = await Promise.all([
    getProducts(storeId),
    getCustomers(storeId),
    getStoreSettings(storeId),
  ]);
  return { ok: true, products, customers, settings };
}
