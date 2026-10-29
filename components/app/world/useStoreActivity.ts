"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WorldEvent } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/**
 * Streams live sale + delivery events across ALL the user's stores to `onEvent`.
 *
 * Primary path is Supabase Realtime (postgres_changes) over the AUTHED browser
 * client — no store filter is set, because RLS (mpato_is_store_member) already
 * limits delivered rows to stores the user belongs to, and each event carries its
 * own storeId so the right building animates. If the channel doesn't come up
 * within ~5s (realtime not enabled, flaky network), it falls back to polling
 * recent rows every 6s. Both paths dedupe by row id, so the feature is never dead
 * and never double-fires.
 */
export function useStoreActivity(enabled: boolean, onEvent: (e: WorldEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!enabled) return;
    const supabase = createSupabaseBrowserClient();
    const seen = new Set<string>();
    let watermark = new Date().toISOString();
    let subscribed = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const emitSale = (r: Row) => {
      const id = "sale_" + r.id;
      if (seen.has(id) || !r.store_id) return;
      seen.add(id);
      onEventRef.current({
        id,
        kind: "sale",
        storeId: r.store_id as string,
        amountKES: Math.round((Number(r.total_cents) || 0) / 100),
        at: (r.created_at as string) ?? new Date().toISOString(),
        method: r.method === "cash" ? "cash" : "mpesa",
      });
    };
    const emitDelivery = (r: Row) => {
      const id = "del_" + r.id;
      if (seen.has(id) || !r.store_id) return;
      seen.add(id);
      onEventRef.current({
        id,
        kind: "delivery",
        storeId: r.store_id as string,
        amountKES: Math.round((Number(r.total_cost_cents) || 0) / 100),
        at: (r.created_at as string) ?? new Date().toISOString(),
        supplierName: null,
      });
    };

    const channel = supabase
      .channel("world_activity")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mpato_sales" },
        (p) => emitSale(p.new as Row),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mpato_stock_receipts" },
        (p) => emitDelivery(p.new as Row),
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") subscribed = true;
      });

    // Poll only if realtime never came up — covers the "publication not enabled" case.
    const poll = async () => {
      const since = watermark;
      watermark = new Date().toISOString();
      const [sales, dels] = await Promise.all([
        supabase
          .from("mpato_sales")
          .select("id, store_id, total_cents, method, created_at")
          .gt("created_at", since)
          .order("created_at", { ascending: true }),
        supabase
          .from("mpato_stock_receipts")
          .select("id, store_id, total_cost_cents, created_at")
          .gt("created_at", since)
          .order("created_at", { ascending: true }),
      ]);
      ((sales.data ?? []) as Row[]).forEach(emitSale);
      ((dels.data ?? []) as Row[]).forEach(emitDelivery);
    };

    fallbackTimer = setTimeout(() => {
      if (!subscribed && !pollTimer) pollTimer = setInterval(poll, 6000);
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      if (pollTimer) clearInterval(pollTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [enabled]);
}
