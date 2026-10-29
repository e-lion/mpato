"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { setActiveStore } from "@/app/actions/active-store";
import Link from "next/link";
import {
  loadPosForWorld,
  loadReceiveForWorld,
  loadDashboardForWorld,
  loadInventoryForWorld,
  loadSuppliersForWorld,
  loadCustomersForWorld,
  getWalletKES,
  type PosDrawerData,
  type ReceiveDrawerData,
  type DashboardRoomData,
  type InventoryRoomData,
  type SuppliersRoomData,
  type CustomersRoomData,
} from "@/app/actions/world";
import { DashboardRoom, InventoryRoom, SuppliersRoom, CustomersRoom } from "./WorldRooms";
import { POS } from "./POS";
import { ReceiveStock } from "./ReceiveStock";
import type { SaleSceneEvent, DeliverySceneEvent, RoomSceneEvent } from "./world/bus";
import { canAccess } from "@/lib/auth/access";
import { KES } from "@/lib/format";
import type { WorldStore } from "@/lib/data/queries";
import type { WorldEvent } from "./world/types";
import { useStoreActivity } from "./world/useStoreActivity";

type EngineType = import("./world/engine").WorldEngine;
type PickInfo = { amountKES: number; method?: "mpesa" | "cash" };

// Actions on a selected shop → the real tools, gated per-store by role.
type RoomKind = "pos" | "receive" | "dashboard" | "inventory" | "suppliers" | "customers";
// Paths that open as an in-scene room (with the shop animating around the data); the rest still navigate.
const ROOM_FOR: Record<string, RoomKind> = {
  "/dashboard": "dashboard",
  "/pos": "pos",
  "/inventory": "inventory",
  "/inventory/receive": "receive",
  "/suppliers": "suppliers",
  "/customers": "customers",
};
const ROOM_META: Record<RoomKind, { title: string; path: string }> = {
  pos: { title: "Point of sale", path: "/pos" },
  receive: { title: "Receive stock", path: "/inventory/receive" },
  dashboard: { title: "Dashboard", path: "/dashboard" },
  inventory: { title: "Inventory", path: "/inventory" },
  suppliers: { title: "Suppliers", path: "/suppliers" },
  customers: { title: "Customers", path: "/customers" },
};

const ACTIONS: { path: string; label: string; icon: string }[] = [
  { path: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { path: "/pos", label: "Point of sale", icon: "shopping-cart" },
  { path: "/inventory", label: "Inventory", icon: "package" },
  { path: "/inventory/receive", label: "Receive stock", icon: "truck" },
  { path: "/suppliers", label: "Suppliers", icon: "boxes" },
  { path: "/customers", label: "Customers", icon: "users" },
];

export function World({
  stores,
  activeStoreId,
  seedEvents,
  wallets,
}: {
  stores: WorldStore[];
  activeStoreId: string | null;
  seedEvents: WorldEvent[];
  /** Initial shop wallet (KES) per store. */
  wallets: Record<string, number>;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  // Shop we're standing inside + its POS data (null data = still loading).
  type Room =
    | { kind: "pos"; storeId: string; data: PosDrawerData | null }
    | { kind: "receive"; storeId: string; data: ReceiveDrawerData | null }
    | { kind: "dashboard"; storeId: string; data: DashboardRoomData | null }
    | { kind: "inventory"; storeId: string; data: InventoryRoomData | null }
    | { kind: "suppliers"; storeId: string; data: SuppliersRoomData | null }
    | { kind: "customers"; storeId: string; data: CustomersRoomData | null };
  const [room, setRoom] = useState<Room | null>(null);
  const [walletMap, setWalletMap] = useState<Record<string, number>>(wallets);

  const roomStoreRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<EngineType | null>(null);
  const pending3d = useRef<WorldEvent[]>([]);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable callbacks the engine captures once.
  const navTo = useCallback(
    (storeId: string, path: string) =>
      start(async () => {
        await setActiveStore(storeId);
        router.push(path);
      }),
    [router],
  );
  const onPick = useCallback((info: PickInfo) => {
    setToast(`${info.method === "cash" ? "Cash" : "M-PESA"} sale · ${KES(info.amountKES)}`);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const refreshWallet = useCallback(async (storeId: string) => {
    try {
      const v = await getWalletKES(storeId);
      setWalletMap((m) => ({ ...m, [storeId]: v }));
    } catch {
      /* keep the last known balance */
    }
  }, []);

  const sale = useCallback(
    (e: SaleSceneEvent) => {
      engineRef.current?.sale(e);
      if (e.type === "paid") {
        // wallet ticks up once the till rings in the scene
        const id = roomStoreRef.current;
        if (id) setTimeout(() => refreshWallet(id), 1600);
      }
    },
    [refreshWallet],
  );
  const delivery = useCallback(
    (e: DeliverySceneEvent) => {
      engineRef.current?.delivery(e);
      if (e.type === "received") {
        const id = roomStoreRef.current;
        if (id) setTimeout(() => refreshWallet(id), 2600);
      }
    },
    [refreshWallet],
  );

  const insetFor = useCallback(() => {
    const w = window.innerWidth;
    const h = containerRef.current?.clientHeight ?? window.innerHeight;
    return w < 900
      ? { right: 0, bottom: Math.round(h * 0.55) }
      : { right: Math.min(980, Math.round(w * 0.56)), bottom: 0 };
  }, []);

  const openRoom = useCallback(async (storeId: string, kind: RoomKind) => {
    setSelectedId(null);
    setRoom({ kind, storeId, data: null } as Room);
    // Set the dock inset first so the fly-in frames the shop in the free area.
    const ins = insetFor();
    engineRef.current?.setInset(ins.right, ins.bottom);
    engineRef.current?.focusShop(storeId);
    const loaders = {
      pos: loadPosForWorld,
      receive: loadReceiveForWorld,
      dashboard: loadDashboardForWorld,
      inventory: loadInventoryForWorld,
      suppliers: loadSuppliersForWorld,
      customers: loadCustomersForWorld,
    } as const;
    const data = await loaders[kind](storeId);
    // only apply if the user is still in this very room
    setRoom((r) => (r && r.storeId === storeId && r.kind === kind ? ({ kind, storeId, data } as Room) : r));
  }, []);

  // Re-fetch a room's data after a form saves; resolves with the fresh list so the room can react.
  const refreshRoom = useCallback(async <T,>(storeId: string, kind: RoomKind, load: (id: string) => Promise<T>) => {
    const data = await load(storeId);
    setRoom((r) => (r && r.storeId === storeId && r.kind === kind ? ({ kind, storeId, data } as Room) : r));
    return data;
  }, []);
  const roomEvent = useCallback((e: RoomSceneEvent) => engineRef.current?.roomEvent(e), []);

  const leaveRoom = useCallback(() => {
    sale({ type: "leave" });
    delivery({ type: "leave" });
    engineRef.current?.focusShop(null);
    setRoom(null);
  }, [sale, delivery]);

  // First customer walks in once the till (POS) is ready.
  const roomReady = room?.data?.ok === true;
  const roomKind = room?.kind;
  useEffect(() => {
    roomStoreRef.current = room?.storeId ?? null;
  }, [room?.storeId]);
  useEffect(() => {
    if (roomReady && roomKind === "pos") sale({ type: "start" });
  }, [roomReady, roomKind, sale]);

  // Keep the shop framed beside the drawer (right dock on desktop, bottom sheet on phones).
  useEffect(() => {
    if (!ready) return;
    const apply = () => {
      if (!room) return engineRef.current?.setInset(0, 0);
      const ins = insetFor();
      engineRef.current?.setInset(ins.right, ins.bottom);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [ready, room, insetFor]);

  const pushEvent = useCallback((e: WorldEvent) => {
    if (engineRef.current) engineRef.current.pushEvent(e);
    else pending3d.current.push(e);
  }, []);

  // Create the engine once (lazy-imports three, so it never ships in the main bundle).
  useEffect(() => {
    if (stores.length === 0 || !containerRef.current) return;
    let engine: EngineType | null = null;
    let cancelled = false;
    (async () => {
      const { WorldEngine } = await import("./world/engine");
      if (cancelled || !containerRef.current) return;
      engine = new WorldEngine(containerRef.current, {
        onSelectShop: (id) => setSelectedId(id),
        onReceive: (id) => navTo(id, "/inventory/receive"),
        onPick,
      });
      engineRef.current = engine;
      setReady(true);
      pending3d.current.forEach((e) => engine!.pushEvent(e));
      pending3d.current = [];
    })();
    return () => {
      cancelled = true;
      engine?.dispose();
      engineRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores.length > 0]);

  // Feed data to the engine whenever it changes.
  useEffect(() => {
    if (ready) engineRef.current?.setStores(stores, activeStoreId);
  }, [ready, stores, activeStoreId]);
  useEffect(() => {
    if (ready) engineRef.current?.setSelected(selectedId);
  }, [ready, selectedId]);

  // Live sales/deliveries (realtime, polling fallback) across all the user's shops.
  useStoreActivity(stores.length > 0, pushEvent);

  // Replay today's recent activity on load so the world opens with real scenarios.
  useEffect(() => {
    const timers = seedEvents.slice(0, 6).map((e, i) =>
      setTimeout(() => pushEvent({ ...e, id: "seed_" + e.id }), 1200 + i * 1400),
    );
    return () => timers.forEach(clearTimeout);
  }, [seedEvents, pushEvent]);

  const selected = stores.find((s) => s.storeId === selectedId) ?? null;
  const totals = useMemo(
    () => ({
      sales: stores.reduce((s, x) => s + x.salesToday, 0),
      orders: stores.reduce((s, x) => s + x.ordersToday, 0),
    }),
    [stores],
  );

  if (stores.length === 0) {
    return (
      <div className="world-wrap" style={{ cursor: "default" }}>
        <div className="world-empty">
          <div className="inner">
            <div className="ico">
              <Icon name="store" size={30} />
            </div>
            <h2>No shops yet</h2>
            <p>
              Create your first shop from the store switcher in the sidebar, and it&apos;ll appear
              here as a building you can step into.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="world-wrap">
      <div ref={containerRef} className="world-canvas" />
      {!ready && <div className="world-loading">Building your world…</div>}

      <div className="world-hud" style={room ? { display: "none" } : undefined}>
        <div className="lbl">Across your shops · today</div>
        <div className="big">{KES(totals.sales)}</div>
        {activeStoreId && walletMap[activeStoreId] !== undefined && (
          <div className="meta">
            Wallet · <b>{KES(walletMap[activeStoreId])}</b>
          </div>
        )}
        <div className="meta">
          {stores.length} {stores.length === 1 ? "shop" : "shops"} · {totals.orders}{" "}
          {totals.orders === 1 ? "order" : "orders"} · live
        </div>
      </div>

      <div className="world-ctrl">
        <button type="button" aria-label="Zoom in" onClick={() => engineRef.current?.zoom(1 / 1.25)}>
          <Icon name="plus" size={18} />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => engineRef.current?.zoom(1.25)}>
          <Icon name="minus" size={18} />
        </button>
        <button type="button" aria-label="Recentre" onClick={() => engineRef.current?.recenter()}>
          <Icon name="locate-fixed" size={18} />
        </button>
      </div>

      <div className="world-hint" style={room ? { display: "none" } : undefined}>Drag to orbit · scroll to zoom · tap a shop or truck</div>

      {toast && <div className="world-toast">{toast}</div>}

      {room && (
        <aside className="world-drawer" aria-label={ROOM_META[room.kind].title}>
          <div className="world-drawer-h">
            <div>
              <h3>{ROOM_META[room.kind].title}</h3>
              <div className="area">
                {stores.find((s) => s.storeId === room.storeId)?.name}
                {room.kind !== "pos" && room.kind !== "receive" && (
                  <>
                    {" · "}
                    <Link className="world-drawer-link" href={ROOM_META[room.kind].path}>Full page</Link>
                  </>
                )}
              </div>
            </div>
            <div className="world-drawer-end">
              <span className="world-wallet" title="Shop wallet: sales in, supplier payments out">
                <Icon name="wallet" size={14} /> {KES(walletMap[room.storeId] ?? 0)}
              </span>
              <button type="button" className="world-drawer-back" onClick={leaveRoom}>
                <Icon name="x" size={14} /> Back to map
              </button>
            </div>
          </div>
          <div className="world-drawer-body">
            {!room.data && <div className="world-drawer-msg">Opening…</div>}
            {room.data && !room.data.ok && (
              <div className="world-drawer-msg">{room.data.error}</div>
            )}
            {room.kind === "pos" && room.data?.ok && (
              <POS
                products={room.data.products}
                customers={room.data.customers}
                settings={room.data.settings}
                onWorld={sale}
              />
            )}
            {room.kind === "receive" && room.data?.ok && (
              <ReceiveStock
                products={room.data.products}
                suppliers={room.data.suppliers}
                recentReceipts={room.data.recentReceipts}
                onWorld={delivery}
              />
            )}
            {room.kind === "dashboard" && room.data?.ok && (
              <DashboardRoom data={room.data} emit={roomEvent} sale={sale} />
            )}
            {room.kind === "inventory" && room.data?.ok && (
              <InventoryRoom
                products={room.data.products}
                emit={roomEvent}
                reload={async () => {
                  const d = await refreshRoom(room.storeId, "inventory", loadInventoryForWorld);
                  return d.ok ? d.products.length : 0;
                }}
              />
            )}
            {room.kind === "suppliers" && room.data?.ok && (
              <SuppliersRoom
                suppliers={room.data.suppliers}
                delivery={delivery}
                reload={async () => {
                  const d = await refreshRoom(room.storeId, "suppliers", loadSuppliersForWorld);
                  return d.ok ? d.suppliers : null;
                }}
                onReceive={() => {
                  delivery({ type: "leave" });
                  openRoom(room.storeId, "receive");
                }}
              />
            )}
            {room.kind === "customers" && room.data?.ok && (
              <CustomersRoom
                customers={room.data.customers}
                emit={roomEvent}
                reload={async () => {
                  const d = await refreshRoom(room.storeId, "customers", loadCustomersForWorld);
                  return d.ok ? d.customers : null;
                }}
              />
            )}
          </div>
        </aside>
      )}

      {selected && (
        <div className="world-panel" role="dialog" aria-label={`${selected.name} actions`}>
          <div className="world-panel-h">
            <div>
              <h3>{selected.name}</h3>
              {selected.area && <div className="area">{selected.area}</div>}
            </div>
            <button
              type="button"
              className="world-panel-close"
              aria-label="Close"
              onClick={() => setSelectedId(null)}
            >
              <Icon name="x" size={16} />
            </button>
          </div>

          <div className="world-stats">
            <div className="world-stat">
              <div className="v">{KES(selected.salesToday)}</div>
              <div className="k">Sales today</div>
            </div>
            <div className="world-stat">
              <div className="v">{selected.ordersToday}</div>
              <div className="k">Orders</div>
            </div>
            <div className={"world-stat" + (selected.lowStock > 0 ? " low" : "")}>
              <div className="v">{selected.lowStock}</div>
              <div className="k">Low stock</div>
            </div>
          </div>

          <div className="world-actions">
            {ACTIONS.filter((a) => canAccess(selected.role, a.path)).map((a) => (
              <button
                key={a.path}
                type="button"
                onClick={() =>
                  ROOM_FOR[a.path]
                    ? openRoom(selected.storeId, ROOM_FOR[a.path])
                    : navTo(selected.storeId, a.path)
                }
                disabled={pending}
              >
                <Icon name={a.icon} size={16} />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
