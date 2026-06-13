import { createSupabaseServerClient } from "@/lib/supabase/server";
import { relativeTime } from "./format";
import type { Customer, Product, RecentSale } from "./types";
import type { TileKey } from "@/lib/mockData";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const TILE_KEYS: TileKey[] = ["jade", "apricot", "peri", "lilac"];
function safeTile(t: unknown): TileKey {
  return TILE_KEYS.includes(t as TileKey) ? (t as TileKey) : "apricot";
}

export async function getCurrentStoreId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("mpato_store_members")
    .select("store_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return (data as { store_id: string }).store_id;
}

export async function getProducts(storeId: string): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mpato_products")
    .select("id, name, category, price_cents, stock, glyph, tile, created_at")
    .eq("store_id", storeId)
    .order("created_at", { ascending: true });

  if (error || !data) return [];
  return (data as Row[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    cat: r.category as string,
    price: Math.round((r.price_cents as number) / 100),
    stock: r.stock as number,
    glyph: r.glyph as string,
    tile: safeTile(r.tile),
  }));
}

export async function getCustomers(storeId: string): Promise<Customer[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mpato_customers")
    .select("id, name, phone, tag, spent_cents, visits, last_seen, color, created_at")
    .eq("store_id", storeId)
    .order("spent_cents", { ascending: false });

  if (error || !data) return [];
  return (data as Row[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    phone: r.phone as string | null,
    spent: Math.round((r.spent_cents as number) / 100),
    visits: r.visits as number,
    last: r.last_seen ? relativeTime(r.last_seen as string) : "—",
    tag: r.tag as Customer["tag"],
    color: r.color as string,
  }));
}

export type CustomerSaleItem = {
  productId: string | null;
  name: string;
  qty: number;
  unitPriceCents: number;
  category: string | null;
};

export type CustomerSale = {
  id: string;
  receiptNo: string;
  totalCents: number;
  method: "mpesa" | "cash";
  mpesaRef: string | null;
  createdAt: string; // ISO
  items: CustomerSaleItem[];
};

export type CustomerProfileData = {
  id: string;
  name: string;
  phone: string | null;
  tag: Customer["tag"];
  color: string;
  spentCents: number;
  visits: number;
  lastSeen: string | null;
  createdAt: string;
  sales: CustomerSale[];
};

/** Fetch one customer plus their full purchase history (sales + line items
 *  + category from the linked product). One round trip via PostgREST nested
 *  selects — handles "product was deleted" by leaving category null and
 *  relying on the product_name_snapshot. */
export async function getCustomerProfile(
  storeId: string,
  customerId: string,
): Promise<CustomerProfileData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: c, error: cErr } = await supabase
    .from("mpato_customers")
    .select("id, name, phone, tag, spent_cents, visits, last_seen, color, created_at")
    .eq("store_id", storeId)
    .eq("id", customerId)
    .maybeSingle();

  if (cErr || !c) return null;

  const { data: salesRows } = await supabase
    .from("mpato_sales")
    .select(
      `id, receipt_no, total_cents, method, mpesa_ref, created_at,
       mpato_sale_items (
         product_id, product_name_snapshot, qty, unit_price_cents,
         mpato_products ( category )
       )`,
    )
    .eq("store_id", storeId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  const sales: CustomerSale[] = ((salesRows ?? []) as Row[]).map((s) => ({
    id: s.id as string,
    receiptNo: s.receipt_no as string,
    totalCents: Number(s.total_cents) || 0,
    method: s.method as "mpesa" | "cash",
    mpesaRef: (s.mpesa_ref as string | null) ?? null,
    createdAt: s.created_at as string,
    items: Array.isArray(s.mpato_sale_items)
      ? (s.mpato_sale_items as Row[]).map((it) => ({
          productId: (it.product_id as string | null) ?? null,
          name: (it.product_name_snapshot as string) ?? "Item",
          qty: Number(it.qty) || 0,
          unitPriceCents: Number(it.unit_price_cents) || 0,
          category:
            it.mpato_products && typeof it.mpato_products === "object"
              ? ((it.mpato_products as Row).category as string | null) ?? null
              : null,
        }))
      : [],
  }));

  const row = c as Row;
  return {
    id: row.id as string,
    name: row.name as string,
    phone: (row.phone as string | null) ?? null,
    tag: row.tag as Customer["tag"],
    color: row.color as string,
    spentCents: Number(row.spent_cents) || 0,
    visits: Number(row.visits) || 0,
    lastSeen: (row.last_seen as string | null) ?? null,
    createdAt: row.created_at as string,
    sales,
  };
}

export type PaymentMethod = "mpesa" | "cash";

export type StoreSettings = {
  id: string;
  name: string;
  area: string | null;
  mpesaTillNumber: string | null;
  mpesaPaybillNumber: string | null;
  defaultPaymentMethod: PaymentMethod;
  receiptFooter: string | null;
  receiptShowContact: boolean;
};

export async function getStoreSettings(storeId: string): Promise<StoreSettings | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mpato_stores")
    .select(
      "id, name, area, mpesa_till_number, mpesa_paybill_number, default_payment_method, receipt_footer, receipt_show_contact",
    )
    .eq("id", storeId)
    .maybeSingle();

  if (error || !data) return null;
  const r = data as Row;
  const method = r.default_payment_method as string;
  return {
    id: r.id as string,
    name: r.name as string,
    area: (r.area as string | null) ?? null,
    mpesaTillNumber: (r.mpesa_till_number as string | null) ?? null,
    mpesaPaybillNumber: (r.mpesa_paybill_number as string | null) ?? null,
    defaultPaymentMethod: method === "cash" ? "cash" : "mpesa",
    receiptFooter: (r.receipt_footer as string | null) ?? null,
    receiptShowContact: Boolean(r.receipt_show_contact),
  };
}

export type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  contact: string | null;
  notes: string | null;
  createdAt: string;
};

export async function getSuppliers(storeId: string): Promise<Supplier[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mpato_suppliers")
    .select("id, name, phone, contact, notes, created_at")
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as Row[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    phone: (r.phone as string | null) ?? null,
    contact: (r.contact as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

export type StaffRole = "manager" | "cashier";

export type Staff = {
  id: string;
  name: string;
  role: StaffRole;
  phone: string | null;
  email: string | null;
  notes: string | null;
  /** true once the person has signed up and claimed their invite. */
  active: boolean;
  createdAt: string;
};

export async function getStaff(storeId: string): Promise<Staff[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mpato_staff")
    .select("id, name, role, phone, email, notes, user_id, created_at")
    .eq("store_id", storeId)
    .order("name", { ascending: true });

  if (error || !data) return [];
  return (data as Row[]).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    role: (r.role as string) === "manager" ? "manager" : "cashier",
    phone: (r.phone as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
    active: Boolean(r.user_id),
    createdAt: r.created_at as string,
  }));
}

export type StockReceiptLine = {
  id: string;
  productId: string | null;
  productName: string;
  qty: number;
  unitCostCents: number;
};

export type StockReceiptListItem = {
  id: string;
  receiptNo: string;
  reference: string | null;
  deliveryDate: string; // YYYY-MM-DD
  createdAt: string;
  supplierName: string | null;
  totalCostCents: number;
  amountPaidCents: number;
  paymentStatus: "unpaid" | "partial" | "paid";
  lineCount: number;
};

export type SupplierPayment = {
  id: string;
  amountCents: number;
  method: "cash" | "mpesa";
  reference: string | null;
  createdAt: string;
};

export type StockReceiptDetail = StockReceiptListItem & {
  notes: string | null;
  lines: StockReceiptLine[];
  payments: SupplierPayment[];
};

export async function getStockReceipts(
  storeId: string,
  limit = 50,
): Promise<StockReceiptListItem[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mpato_stock_receipts")
    .select(
      `id, receipt_no, reference, delivery_date, created_at, total_cost_cents, amount_paid_cents, payment_status,
       mpato_suppliers ( name ),
       mpato_stock_receipt_items ( id )`,
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return (data as Row[]).map((r) => ({
    id: r.id as string,
    receiptNo: r.receipt_no as string,
    reference: (r.reference as string | null) ?? null,
    deliveryDate: r.delivery_date as string,
    createdAt: r.created_at as string,
    supplierName:
      r.mpato_suppliers && typeof r.mpato_suppliers === "object"
        ? ((r.mpato_suppliers as Row).name as string | null) ?? null
        : null,
    totalCostCents: Number(r.total_cost_cents) || 0,
    amountPaidCents: Number(r.amount_paid_cents) || 0,
    paymentStatus: (r.payment_status as "unpaid" | "partial" | "paid") || "unpaid",
    lineCount: Array.isArray(r.mpato_stock_receipt_items)
      ? (r.mpato_stock_receipt_items as Row[]).length
      : 0,
  }));
}

export async function getStockReceipt(
  storeId: string,
  receiptId: string,
): Promise<StockReceiptDetail | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mpato_stock_receipts")
    .select(
      `id, receipt_no, reference, delivery_date, created_at, notes, total_cost_cents, amount_paid_cents, payment_status,
       mpato_suppliers ( name ),
       mpato_stock_receipt_items ( id, product_id, product_name_snapshot, qty, unit_cost_cents ),
       mpato_supplier_payments ( id, amount_cents, method, reference, created_at )`,
    )
    .eq("store_id", storeId)
    .eq("id", receiptId)
    .maybeSingle();

  if (error || !data) return null;
  const r = data as Row;
  const items = Array.isArray(r.mpato_stock_receipt_items)
    ? (r.mpato_stock_receipt_items as Row[])
    : [];
  return {
    id: r.id as string,
    receiptNo: r.receipt_no as string,
    reference: (r.reference as string | null) ?? null,
    deliveryDate: r.delivery_date as string,
    createdAt: r.created_at as string,
    notes: (r.notes as string | null) ?? null,
    supplierName:
      r.mpato_suppliers && typeof r.mpato_suppliers === "object"
        ? ((r.mpato_suppliers as Row).name as string | null) ?? null
        : null,
    totalCostCents: Number(r.total_cost_cents) || 0,
    amountPaidCents: Number(r.amount_paid_cents) || 0,
    paymentStatus: (r.payment_status as "unpaid" | "partial" | "paid") || "unpaid",
    lineCount: items.length,
    lines: items.map((it) => ({
      id: it.id as string,
      productId: (it.product_id as string | null) ?? null,
      productName: (it.product_name_snapshot as string) ?? "Item",
      qty: Number(it.qty) || 0,
      unitCostCents: Number(it.unit_cost_cents) || 0,
    })),
    payments: Array.isArray(r.mpato_supplier_payments)
      ? (r.mpato_supplier_payments as Row[]).map((p) => ({
          id: p.id as string,
          amountCents: Number(p.amount_cents) || 0,
          method: p.method as "cash" | "mpesa",
          reference: (p.reference as string | null) ?? null,
          createdAt: p.created_at as string,
        })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      : [],
  };
}

export async function getRecentSales(storeId: string, limit = 5): Promise<RecentSale[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("mpato_sales")
    .select(
      "id, receipt_no, total_cents, method, created_at, cashier_id, mpato_sale_items(qty)",
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  // Resolve cashier_id -> display name for everyone in the store (owner + staff)
  // so each sale is attributed to whoever actually rang it up.
  const { data: { user } } = await supabase.auth.getUser();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = (supabase as any).rpc.bind(supabase) as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: Row[] | null; error: { message: string } | null }>;
  const { data: cashierRows } = await rpc("mpato_store_cashiers", { p_store_id: storeId });
  const nameById = new Map<string, string>(
    ((cashierRows ?? []) as Row[]).map((c) => [c.user_id as string, c.name as string]),
  );

  function cashierLabel(cashierId: string | null): string {
    if (!cashierId) return "—";
    if (user && cashierId === user.id) return "You";
    return nameById.get(cashierId) ?? "Cashier";
  }

  return (data as Row[]).map((r) => ({
    id: r.id as string,
    receiptNo: r.receipt_no as string,
    items: Array.isArray(r.mpato_sale_items)
      ? (r.mpato_sale_items as Row[]).reduce((s, it) => s + ((it.qty as number) ?? 0), 0)
      : 0,
    total: Math.round((r.total_cents as number) / 100),
    method: r.method as "mpesa" | "cash",
    time: relativeTime(r.created_at as string),
    cashier: cashierLabel((r.cashier_id as string | null) ?? null),
  }));
}

export type WeekDay = { d: string; mpesa: number; cash: number };

export async function getWeekSales(storeId: string): Promise<WeekDay[]> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = (supabase as any).rpc.bind(supabase) as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: Row[] | null; error: { message: string } | null }>;

  const { data, error } = await rpc("mpato_week_sales", { p_store_id: storeId });
  if (error || !data) return [];
  return data.map((r) => ({
    d: r.day_label as string,
    mpesa: Number(r.mpesa) || 0,
    cash: Number(r.cash) || 0,
  }));
}

export type TopProduct = {
  productId: string;
  name: string;
  glyph: string;
  tile: TileKey;
  sold: number;
  revenue: number;
};

export async function getTopProducts(storeId: string, limit = 4): Promise<TopProduct[]> {
  const supabase = await createSupabaseServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rpc = (supabase as any).rpc.bind(supabase) as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: Row[] | null; error: { message: string } | null }>;

  const { data, error } = await rpc("mpato_top_products", {
    p_store_id: storeId,
    p_limit: limit,
  });
  if (error || !data) return [];
  return data.map((r) => ({
    productId: r.product_id as string,
    name: r.name as string,
    glyph: r.glyph as string,
    tile: safeTile(r.tile),
    sold: Number(r.sold) || 0,
    revenue: Number(r.revenue) || 0,
  }));
}

export type DashboardStats = {
  salesToday: number;
  ordersToday: number;
  newCustomers: number;
  lowStock: number;
  mpesaToday: number;
  cashToday: number;
};

export async function getDashboardStats(storeId: string): Promise<DashboardStats> {
  const supabase = await createSupabaseServerClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const iso = startOfDay.toISOString();

  const [{ data: todaySales }, { data: products }, { data: newCust }] = await Promise.all([
    supabase
      .from("mpato_sales")
      .select("total_cents, method")
      .eq("store_id", storeId)
      .gte("created_at", iso),
    supabase
      .from("mpato_products")
      .select("stock")
      .eq("store_id", storeId),
    supabase
      .from("mpato_customers")
      .select("id")
      .eq("store_id", storeId)
      .gte("created_at", iso),
  ]);

  const sales = (todaySales ?? []) as Row[];
  const salesToday = sales.reduce((s, r) => s + (r.total_cents as number), 0) / 100;
  const ordersToday = sales.length;
  const mpesaToday = sales.filter((r) => r.method === "mpesa").reduce((s, r) => s + (r.total_cents as number), 0) / 100;
  const cashToday = sales.filter((r) => r.method === "cash").reduce((s, r) => s + (r.total_cents as number), 0) / 100;

  const lowStock = ((products ?? []) as Row[]).filter((p) => (p.stock as number) <= 6).length;
  const newCustomers = ((newCust ?? []) as Row[]).length;

  return { salesToday, ordersToday, newCustomers, lowStock, mpesaToday, cashToday };
}
