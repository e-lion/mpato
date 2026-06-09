import type { TileKey } from "@/lib/mockData";

export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  cat: string;
  glyph: string;
  tile: TileKey;
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  spent: number;
  visits: number;
  last: string;
  tag: "Regular" | "VIP" | "Lapsing";
  color: string;
};

export type RecentSale = {
  id: string;
  receiptNo: string;
  items: number;
  total: number;
  method: "mpesa" | "cash";
  time: string;
  cashier: string;
};

export const CATEGORIES = ["All", "Groceries", "Drinks", "Snacks", "Bakery"] as const;

// Re-export the static mock helpers that aren't tied to a store row (chart data, etc.)
export { TILES, WEEK, TOP_PRODUCTS } from "@/lib/mockData";
