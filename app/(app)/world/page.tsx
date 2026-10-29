import { World } from "@/components/app/World";
import {
  getWorldStores,
  getRecentSales,
  getStockReceipts,
  getCurrentStoreId,
  getWalletBalance,
} from "@/lib/data/queries";
import { getSessionContext } from "@/lib/data/session";
import type { WorldEvent } from "@/components/app/world/types";

// Live data — never cache the world.
export const dynamic = "force-dynamic";

export default async function WorldPage() {
  const [stores, ctx, storeId] = await Promise.all([
    getWorldStores(),
    getSessionContext(),
    getCurrentStoreId(),
  ]);

  // Seed the world with today's recent activity for the active store so it opens
  // mid-scene rather than empty. Live events (all stores) stream in after.
  let seedEvents: WorldEvent[] = [];
  if (storeId) {
    const [sales, deliveries] = await Promise.all([
      getRecentSales(storeId, 6),
      getStockReceipts(storeId, 4),
    ]);
    const saleEvents: WorldEvent[] = sales.map((s) => ({
      id: "sale_" + s.id,
      kind: "sale",
      storeId,
      amountKES: s.total,
      at: s.at,
      method: s.method,
    }));
    const deliveryEvents: WorldEvent[] = deliveries.map((d) => ({
      id: "del_" + d.id,
      kind: "delivery",
      storeId,
      amountKES: Math.round(d.totalCostCents / 100),
      at: d.createdAt,
      supplierName: d.supplierName,
    }));
    seedEvents = [...saleEvents, ...deliveryEvents].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }

  const balances = await Promise.all(stores.map((s) => getWalletBalance(s.storeId).catch(() => 0)));
  const wallets = Object.fromEntries(stores.map((s, i) => [s.storeId, balances[i]]));

  return (
    <World
      stores={stores}
      activeStoreId={ctx?.store?.id ?? null}
      seedEvents={seedEvents}
      wallets={wallets}
    />
  );
}
