"use server";

import { setActiveStore } from "@/app/actions/active-store";
import {
  getProducts,
  getCustomers,
  getStoreSettings,
  getSuppliers,
  getStockReceipts,
  getWalletBalance,
  getDashboardStats,
  getRecentSales,
  getWeekSales,
  getTopProducts,
  type StockReceiptListItem,
  type DashboardStats,
  type WeekDay,
  type TopProduct,
} from "@/lib/data/queries";
import type { Customer, Product, RecentSale } from "@/lib/data/types";
import type { StoreSettings, Supplier } from "@/lib/data/queries";

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

export type ReceiveDrawerData =
  | { ok: true; products: Product[]; suppliers: Supplier[]; recentReceipts: StockReceiptListItem[] }
  | { ok: false; error: string };

export async function loadReceiveForWorld(storeId: string): Promise<ReceiveDrawerData> {
  const sw = await setActiveStore(storeId);
  if (!sw.ok) return { ok: false, error: sw.error };
  const [products, suppliers, recentReceipts] = await Promise.all([
    getProducts(storeId),
    getSuppliers(storeId),
    getStockReceipts(storeId, 5),
  ]);
  return { ok: true, products, suppliers, recentReceipts };
}

/** Shop wallet in whole shillings: all sales in, supplier payments out. */
export async function getWalletKES(storeId: string): Promise<number> {
  return getWalletBalance(storeId);
}

export type DashboardRoomData =
  | { ok: true; stats: DashboardStats; sales: RecentSale[]; week: WeekDay[]; topProducts: TopProduct[] }
  | { ok: false; error: string };

export async function loadDashboardForWorld(storeId: string): Promise<DashboardRoomData> {
  const sw = await setActiveStore(storeId);
  if (!sw.ok) return { ok: false, error: sw.error };
  const [stats, sales, week, topProducts] = await Promise.all([
    getDashboardStats(storeId),
    getRecentSales(storeId, 6),
    getWeekSales(storeId),
    getTopProducts(storeId, 4),
  ]);
  return { ok: true, stats, sales, week, topProducts };
}

export type InventoryRoomData = { ok: true; products: Product[] } | { ok: false; error: string };

export async function loadInventoryForWorld(storeId: string): Promise<InventoryRoomData> {
  const sw = await setActiveStore(storeId);
  if (!sw.ok) return { ok: false, error: sw.error };
  return { ok: true, products: await getProducts(storeId) };
}

export type SuppliersRoomData = { ok: true; suppliers: Supplier[] } | { ok: false; error: string };

export async function loadSuppliersForWorld(storeId: string): Promise<SuppliersRoomData> {
  const sw = await setActiveStore(storeId);
  if (!sw.ok) return { ok: false, error: sw.error };
  return { ok: true, suppliers: await getSuppliers(storeId) };
}

export type CustomersRoomData = { ok: true; customers: Customer[] } | { ok: false; error: string };

export async function loadCustomersForWorld(storeId: string): Promise<CustomersRoomData> {
  const sw = await setActiveStore(storeId);
  if (!sw.ok) return { ok: false, error: sw.error };
  return { ok: true, customers: await getCustomers(storeId) };
}
