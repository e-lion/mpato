export type TileKey = "jade" | "apricot" | "peri" | "lilac";

export const TILES: Record<TileKey, { bg: string }> = {
  jade: { bg: "linear-gradient(135deg,var(--rose-300),var(--rose-500))" },
  apricot: { bg: "linear-gradient(135deg,var(--apricot-300),var(--apricot-500))" },
  peri: { bg: "linear-gradient(135deg,var(--peri-300),var(--peri-500))" },
  lilac: { bg: "linear-gradient(135deg,var(--lilac-300),var(--lilac-500))" },
};

export type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
  cat: string;
  glyph: string;
  tile: TileKey;
};

export const PRODUCTS: Product[] = [
  { id: 1, name: "Maziwa Fresh 500ml", price: 60, stock: 42, cat: "Drinks", glyph: "milk", tile: "jade" },
  { id: 2, name: "Unga Pembe 2kg", price: 175, stock: 18, cat: "Groceries", glyph: "wheat", tile: "apricot" },
  { id: 3, name: "Soda 500ml", price: 70, stock: 6, cat: "Drinks", glyph: "cup-soda", tile: "peri" },
  { id: 4, name: "Biskut Pack", price: 45, stock: 90, cat: "Snacks", glyph: "cookie", tile: "lilac" },
  { id: 5, name: "Sukari 1kg", price: 165, stock: 24, cat: "Groceries", glyph: "package", tile: "apricot" },
  { id: 6, name: "Chai Leaves 500g", price: 230, stock: 12, cat: "Groceries", glyph: "leaf", tile: "jade" },
  { id: 7, name: "Maji 1L", price: 50, stock: 120, cat: "Drinks", glyph: "droplet", tile: "peri" },
  { id: 8, name: "Mkate Loaf", price: 65, stock: 8, cat: "Bakery", glyph: "sandwich", tile: "apricot" },
  { id: 9, name: "Crisps 100g", price: 55, stock: 64, cat: "Snacks", glyph: "cookie", tile: "lilac" },
  { id: 10, name: "Cooking Oil 1L", price: 320, stock: 15, cat: "Groceries", glyph: "flame", tile: "jade" },
  { id: 11, name: "Energy Drink", price: 110, stock: 4, cat: "Drinks", glyph: "zap", tile: "peri" },
  { id: 12, name: "Chocolate Bar", price: 80, stock: 38, cat: "Snacks", glyph: "candy", tile: "lilac" },
];

export const CATEGORIES = ["All", "Groceries", "Drinks", "Snacks", "Bakery"] as const;

export type RecentSale = {
  id: string;
  items: number;
  total: number;
  method: "mpesa" | "cash";
  time: string;
  cashier: string;
};

export const RECENT_SALES: RecentSale[] = [
  { id: "INV-2042", items: 4, total: 1240, method: "mpesa", time: "2 min ago", cashier: "Wanjiku M." },
  { id: "INV-2041", items: 2, total: 320, method: "cash", time: "11 min ago", cashier: "Wanjiku M." },
  { id: "INV-2040", items: 7, total: 2185, method: "mpesa", time: "24 min ago", cashier: "Brian O." },
  { id: "INV-2039", items: 1, total: 165, method: "cash", time: "38 min ago", cashier: "Wanjiku M." },
  { id: "INV-2038", items: 3, total: 540, method: "mpesa", time: "52 min ago", cashier: "Brian O." },
];

export type TopProduct = { name: string; sold: number; revenue: number; tile: TileKey; glyph: string };

export const TOP_PRODUCTS: TopProduct[] = [
  { name: "Maziwa Fresh 500ml", sold: 84, revenue: 5040, tile: "jade", glyph: "milk" },
  { name: "Soda 500ml", sold: 71, revenue: 4970, tile: "peri", glyph: "cup-soda" },
  { name: "Mkate Loaf", sold: 58, revenue: 3770, tile: "apricot", glyph: "sandwich" },
  { name: "Maji 1L", sold: 46, revenue: 2300, tile: "peri", glyph: "droplet" },
];

export const WEEK = [
  { d: "Mon", mpesa: 38, cash: 22 },
  { d: "Tue", mpesa: 44, cash: 19 },
  { d: "Wed", mpesa: 41, cash: 25 },
  { d: "Thu", mpesa: 52, cash: 24 },
  { d: "Fri", mpesa: 66, cash: 31 },
  { d: "Sat", mpesa: 78, cash: 42 },
  { d: "Sun", mpesa: 54, cash: 30 },
];

export type Customer = {
  name: string;
  phone: string;
  spent: number;
  visits: number;
  last: string;
  tag: "Regular" | "VIP" | "Lapsing";
  color: string;
};

export const CUSTOMERS: Customer[] = [
  { name: "Grace Njeri", phone: "0712 345 678", spent: 18450, visits: 32, last: "2 days ago", tag: "Regular", color: "var(--rose-500)" },
  { name: "Samuel Otieno", phone: "0723 998 211", spent: 9220, visits: 14, last: "5 days ago", tag: "Regular", color: "var(--apricot-500)" },
  { name: "Faith Kamau", phone: "0701 552 040", spent: 31200, visits: 58, last: "Today", tag: "VIP", color: "var(--peri-500)" },
  { name: "Daniel Mwangi", phone: "0733 120 887", spent: 2150, visits: 4, last: "3 weeks ago", tag: "Lapsing", color: "var(--lilac-500)" },
  { name: "Mary Achieng", phone: "0715 770 333", spent: 14800, visits: 27, last: "1 day ago", tag: "Regular", color: "var(--rose-600)" },
  { name: "Peter Kariuki", phone: "0728 401 559", spent: 760, visits: 2, last: "6 weeks ago", tag: "Lapsing", color: "var(--apricot-600)" },
];
