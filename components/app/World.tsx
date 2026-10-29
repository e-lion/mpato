"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { setActiveStore } from "@/app/actions/active-store";
import {
  loadPosForWorld,
  loadReceiveForWorld,
  getWalletKES,
  type PosDrawerData,
  type ReceiveDrawerData,
} from "@/app/actions/world";
import { POS } from "./POS";
import { ReceiveStock } from "./ReceiveStock";
import type { SaleSceneEvent, DeliverySceneEvent } from "./world/bus";
import { canAccess } from "@/lib/auth/access";
import { KES } from "@/lib/format";
import type { WorldStore } from "@/lib/data/queries";
import type { WorldEvent } from "./world/types";
import { useStoreActivity } from "./world/useStoreActivity";

type EngineType = import("./world/engine").WorldEngine;
type PickInfo = { amountKES: number; method?: "mpesa" | "cash" };

// Actions on a selected shop → the real tools, gated per-store by role.
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
    | { kind: "receive"; storeId: string; data: ReceiveDrawerData | null };
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

  const openRoom = useCallback(async (storeId: string, kind: "pos" | "receive") => {
    setSelectedId(null);
    setRoom({ kind, storeId, data: null } as Room);
    engineRef.current?.focusShop(storeId);
    if (kind === "pos") {
      const data = await loadPosForWorld(storeId);
      setRoom((r) => (r && r.storeId === storeId && r.kind === "pos" ? { kind, storeId, data } : r));
    } else {
      const data = await loadReceiveForWorld(storeId);
      setRoom((r) => (r && r.storeId === storeId && r.kind === "receive" ? { kind, storeId, data } : r));
    }
  }, []);

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
      const w = window.innerWidth;
      const h = containerRef.current?.clientHeight ?? window.innerHeight;
      if (w < 900) engineRef.current?.setInset(0, Math.round(h * 0.55));
      else engineRef.current?.setInset(Math.min(980, Math.round(w * 0.56)), 0);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [ready, room]);

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

      <div className="world-hud">
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

      <div className="world-hint">Drag to orbit · scroll to zoom · tap a shop or truck</div>

      {toast && <div className="world-toast">{toast}</div>}

      {room && (
        <aside
          className="world-drawer"
          aria-label={room.kind === "pos" ? "Point of sale" : "Receive stock"}
        >
          <div className="world-drawer-h">
            <div>
              <h3>{room.kind === "pos" ? "Point of sale" : "Receive stock"}</h3>
              <div className="area">{stores.find((s) => s.storeId === room.storeId)?.name}</div>
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
          </div>
        </aside>
      )}
    </div>
  );
}
