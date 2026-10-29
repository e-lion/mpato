"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Avatar, Badge, Btn } from "./primitives";
import { ProductForm } from "./ProductForm";
import { CustomerForm } from "./CustomerForm";
import { SupplierForm } from "./SupplierForm";
import { KES } from "@/lib/format";
import { TILES } from "@/lib/mockData";
import type { RoomSceneEvent, SaleSceneEvent, DeliverySceneEvent } from "./world/bus";
import type { Customer, Product } from "@/lib/data/types";
import type { Supplier } from "@/lib/data/queries";
import type { DashboardRoomData } from "@/app/actions/world";

type Emit = (e: RoomSceneEvent) => void;

function RoomSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="topsearch room-search">
      <Icon name="search" size={16} />
      <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ---------------- Dashboard: the week plays out as a bar board ---------------- */

export function DashboardRoom({
  data,
  emit,
  sale,
}: {
  data: Extract<DashboardRoomData, { ok: true }>;
  emit: Emit;
  sale: (e: SaleSceneEvent) => void;
}) {
  const { stats, week, sales, topProducts } = data;
  const [hi, setHi] = useState<number | null>(null);
  const [replaying, setReplaying] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => emit({ type: "clearAll" }), [emit]);

  useEffect(() => {
    emit({
      type: "board",
      values: week.map((w) => w.mpesa + w.cash),
      labels: week.map((w) => w.d.slice(0, 1)),
    });
    return () => timers.current.forEach(clearTimeout);
  }, [week, emit]);

  const pick = (i: number | null) => {
    setHi(i);
    emit({ type: "boardHi", index: i });
  };

  // Re-enact a past sale at the till: customer walks in, goods fly over, they pay, they leave.
  const replay = (s: Data["sales"][number]) => {
    if (replaying) return;
    setReplaying(s.id);
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    sale({ type: "start" });
    const n = Math.min(4, Math.max(1, s.items));
    for (let i = 0; i < n; i++) at(2300 + i * 550, () => sale({ type: "item", delta: 1 }));
    const payAt = 2300 + n * 550 + 500;
    if (s.method === "mpesa") at(payAt, () => sale({ type: "paying", method: "mpesa" }));
    at(payAt + (s.method === "mpesa" ? 1300 : 300), () => sale({ type: "paid", method: s.method, total: s.total }));
    at(payAt + 4600, () => {
      sale({ type: "leave" });
      setReplaying(null);
    });
  };
  type Data = typeof data;

  const days = week.map((w) => ({ d: w.d, total: w.mpesa + w.cash }));

  return (
    <div className="room">
      <div className="room-kpis">
        <div><b className="num">{KES(stats.salesToday)}</b><span>Sales today</span></div>
        <div><b className="num">{stats.ordersToday}</b><span>Orders</span></div>
        <div className={stats.lowStock > 0 ? "warn" : ""}><b className="num">{stats.lowStock}</b><span>Low stock</span></div>
      </div>

      <div className="room-h">This week <small>hover a day to light its bar</small></div>
      <div className="room-days">
        {days.map((d, i) => (
          <button
            key={i}
            type="button"
            className={hi === i ? "on" : ""}
            onMouseEnter={() => pick(i)}
            onMouseLeave={() => pick(null)}
            onFocus={() => pick(i)}
            onBlur={() => pick(null)}
            onClick={() => pick(hi === i ? null : i)}
          >
            <span>{d.d.slice(0, 3)}</span>
            <b className="num">{d.total >= 1000 ? Math.round(d.total / 100) / 10 + "k" : d.total}</b>
          </button>
        ))}
        {days.length === 0 && <div className="room-empty">No sales this week yet.</div>}
      </div>

      <div className="room-h">Recent sales <small>tap one to watch it happen at the till</small></div>
      <div className="room-list">
        {sales.map((s) => (
          <button key={s.id} type="button" className="room-row" onClick={() => replay(s)} disabled={!!replaying}>
            <div className="room-ic">{replaying === s.id ? <Icon name="zap" size={16} /> : <Icon name="play-circle" size={16} />}</div>
            <div className="room-t">
              <div className="nm">#{s.receiptNo}</div>
              <div className="sub">{s.items} {s.items === 1 ? "item" : "items"}, {s.time}</div>
            </div>
            <Badge kind={s.method === "mpesa" ? "mpesa" : "cash"}>{s.method === "mpesa" ? "M-PESA" : "Cash"}</Badge>
            <b className="num">{KES(s.total)}</b>
          </button>
        ))}
        {sales.length === 0 && <div className="room-empty">No sales yet. Open the point of sale to ring one up.</div>}
      </div>

      {topProducts.length > 0 && (
        <>
          <div className="room-h">Top sellers</div>
          <div className="room-list">
            {topProducts.map((p) => (
              <div key={p.productId} className="room-row static">
                <div className="room-ic" style={{ background: TILES[p.tile].bg, color: "#fff" }}><Icon name={p.glyph} size={16} /></div>
                <div className="room-t"><div className="nm">{p.name}</div><div className="sub">{p.sold} sold</div></div>
                <b className="num">{KES(p.revenue)}</b>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------- Inventory: the keeper fetches products off the shelf ---------------- */

export function InventoryRoom({ products, emit, reload }: { products: Product[]; emit: Emit; reload: () => Promise<number> }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [form, setForm] = useState<{ kind: "closed" } | { kind: "create" } | { kind: "edit"; product: Product }>({ kind: "closed" });
  const low = products.filter((p) => p.stock <= 6).length;
  useEffect(() => () => emit({ type: "clearAll" }), [emit]);

  useEffect(() => {
    emit({ type: "lowStock", count: low });
  }, [low, emit]);

  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const choose = (p: Product) => {
    if (sel === p.id) {
      setSel(null);
      emit({ type: "shelfClear" });
      return;
    }
    setSel(p.id);
    emit({ type: "shelf", name: p.name, cat: p.cat, stock: p.stock, low: p.stock <= 6 });
  };

  const closeForm = async () => {
    const wasCreate = form.kind === "create";
    setForm({ kind: "closed" });
    const before = products.length;
    const after = await reload();
    if (wasCreate && after > before) emit({ type: "shelfAdded" });
  };

  return (
    <div className="room">
      <div className="room-kpis two">
        <div><b className="num">{products.length}</b><span>Products</span></div>
        <div className={low > 0 ? "warn" : ""}><b className="num">{low}</b><span>Need restock</span></div>
      </div>
      <div className="room-bar">
        <RoomSearch value={q} onChange={setQ} placeholder="Search inventory…" />
        <Btn variant="primary" icon="plus" onClick={() => setForm({ kind: "create" })}>Add</Btn>
      </div>
      <div className="room-h">Tap a product <small>the shopkeeper fetches it from the shelf</small></div>
      <div className="room-list">
        {list.map((p) => (
          <div key={p.id} className={"room-row" + (sel === p.id ? " on" : "")}>
            <button type="button" className="room-main" onClick={() => choose(p)}>
              <div className="room-ic" style={{ background: TILES[p.tile].bg, color: "#fff" }}><Icon name={p.glyph} size={16} /></div>
              <div className="room-t"><div className="nm">{p.name}</div><div className="sub">{KES(p.price)}</div></div>
              <Badge kind={p.stock === 0 ? "danger" : p.stock <= 6 ? "warning" : "success"} dot>{p.stock === 0 ? "Out" : p.stock}</Badge>
            </button>
            <button type="button" className="iconbtn room-edit" aria-label={`Edit ${p.name}`} onClick={() => setForm({ kind: "edit", product: p })}>
              <Icon name="pencil" size={14} />
            </button>
          </div>
        ))}
        {list.length === 0 && <div className="room-empty">{products.length === 0 ? "No products yet. Add your first one." : "No products match."}</div>}
      </div>
      {form.kind !== "closed" && (
        <ProductForm open mode={form.kind === "create" ? { kind: "create" } : { kind: "edit", product: form.product }} onClose={closeForm} />
      )}
    </div>
  );
}

/* ---------------- Suppliers: their truck pulls up at the loading bay ---------------- */

export function SuppliersRoom({
  suppliers,
  delivery,
  reload,
  onReceive,
}: {
  suppliers: Supplier[];
  delivery: (e: DeliverySceneEvent) => void;
  reload: () => Promise<Supplier[] | null>;
  onReceive: () => void;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [form, setForm] = useState<{ kind: "closed" } | { kind: "create" } | { kind: "edit"; supplier: Supplier }>({ kind: "closed" });
  useEffect(() => () => delivery({ type: "supplier", name: null }), [delivery]);
  const list = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      (s.contact ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (s.phone ?? "").includes(q),
  );

  const choose = (s: Supplier) => {
    if (sel === s.id) {
      setSel(null);
      delivery({ type: "supplier", name: null });
      return;
    }
    setSel(s.id);
    delivery({ type: "supplier", name: s.name });
  };

  const closeForm = async () => {
    const wasCreate = form.kind === "create";
    setForm({ kind: "closed" });
    const before = new Set(suppliers.map((s) => s.id));
    const after = await reload();
    const added = wasCreate ? after?.find((s) => !before.has(s.id)) : undefined;
    if (added) {
      setSel(added.id);
      delivery({ type: "supplier", name: added.name });
    }
  };

  return (
    <div className="room">
      <div className="room-kpis two">
        <div><b className="num">{suppliers.length}</b><span>Suppliers</span></div>
        <button type="button" className="room-cta" onClick={onReceive}>
          <Icon name="truck" size={16} /> Receive a delivery
        </button>
      </div>
      <div className="room-bar">
        <RoomSearch value={q} onChange={setQ} placeholder="Search suppliers…" />
        <Btn variant="primary" icon="plus" onClick={() => setForm({ kind: "create" })}>Add</Btn>
      </div>
      <div className="room-h">Tap a supplier <small>their truck pulls up outside</small></div>
      <div className="room-list">
        {list.map((s) => (
          <div key={s.id} className={"room-row" + (sel === s.id ? " on" : "")}>
            <button type="button" className="room-main" onClick={() => choose(s)}>
              <Avatar name={s.name} color="var(--rose-500)" size={36} />
              <div className="room-t"><div className="nm">{s.name}</div><div className="sub">{[s.contact, s.phone].filter(Boolean).join(", ") || "No contact yet"}</div></div>
              <Icon name="truck" size={16} color={sel === s.id ? "var(--rose-700)" : "var(--fg3)"} />
            </button>
            <button type="button" className="iconbtn room-edit" aria-label={`Edit ${s.name}`} onClick={() => setForm({ kind: "edit", supplier: s })}>
              <Icon name="pencil" size={14} />
            </button>
          </div>
        ))}
        {list.length === 0 && <div className="room-empty">{suppliers.length === 0 ? "No suppliers yet. Add the first one." : "No suppliers match."}</div>}
      </div>
      {form.kind !== "closed" && (
        <SupplierForm open mode={form.kind === "create" ? { kind: "create" } : { kind: "edit", supplier: form.supplier }} onClose={closeForm} />
      )}
    </div>
  );
}

/* ---------------- Customers: the regular walks in and gets greeted ---------------- */

export function CustomersRoom({ customers, emit, reload }: { customers: Customer[]; emit: Emit; reload: () => Promise<Customer[] | null> }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | null>(null);
  const [form, setForm] = useState<{ kind: "closed" } | { kind: "create" } | { kind: "edit"; customer: Customer }>({ kind: "closed" });
  const list = customers.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()) || (c.phone ?? "").includes(q));
  const vip = customers.filter((c) => c.tag === "VIP").length;
  const lapsing = customers.filter((c) => c.tag === "Lapsing").length;
  useEffect(() => () => emit({ type: "clearAll" }), [emit]);

  const choose = useCallback(
    (c: Customer) => {
      if (sel === c.id) {
        setSel(null);
        emit({ type: "visitEnd" });
        return;
      }
      setSel(c.id);
      emit({ type: "visit", name: c.name, tag: c.tag, spent: c.spent });
    },
    [sel, emit],
  );

  const closeForm = async () => {
    const wasCreate = form.kind === "create";
    setForm({ kind: "closed" });
    const before = new Set(customers.map((c) => c.id));
    const after = await reload();
    const added = wasCreate ? after?.find((c) => !before.has(c.id)) : undefined;
    if (added) {
      setSel(added.id);
      emit({ type: "visit", name: added.name, tag: added.tag, spent: added.spent });
    }
  };

  return (
    <div className="room">
      <div className="room-kpis">
        <div><b className="num">{customers.length}</b><span>Customers</span></div>
        <div><b className="num">{vip}</b><span>VIP</span></div>
        <div className={lapsing > 0 ? "warn" : ""}><b className="num">{lapsing}</b><span>Lapsing</span></div>
      </div>
      <div className="room-bar">
        <RoomSearch value={q} onChange={setQ} placeholder="Search customers…" />
        <Btn variant="primary" icon="user-plus" onClick={() => setForm({ kind: "create" })}>Add</Btn>
      </div>
      <div className="room-h">Tap a customer <small>they walk into the shop</small></div>
      <div className="room-list">
        {list.map((c) => (
          <div key={c.id} className={"room-row" + (sel === c.id ? " on" : "")}>
            <button type="button" className="room-main" onClick={() => choose(c)}>
              <Avatar name={c.name} color={c.color} size={36} />
              <div className="room-t"><div className="nm">{c.name}</div><div className="sub">{c.phone ?? "No phone"}, {KES(c.spent)} spent</div></div>
              <Badge kind={c.tag === "VIP" ? "info" : c.tag === "Lapsing" ? "warning" : "success"} dot>{c.tag}</Badge>
            </button>
            <button type="button" className="iconbtn room-edit" aria-label={`Edit ${c.name}`} onClick={() => setForm({ kind: "edit", customer: c })}>
              <Icon name="pencil" size={14} />
            </button>
          </div>
        ))}
        {list.length === 0 && <div className="room-empty">{customers.length === 0 ? "No customers yet. Add your first regular." : "No customers match."}</div>}
      </div>
      {form.kind !== "closed" && (
        <CustomerForm open mode={form.kind === "create" ? { kind: "create" } : { kind: "edit", customer: form.customer }} onClose={closeForm} />
      )}
    </div>
  );
}
