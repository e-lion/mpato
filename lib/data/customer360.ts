// Derive the "360° view" insights for a single customer from raw sales.
// Pure functions so this can be unit-tested without Supabase. Money values
// stay in cents through the math and are formatted to shillings at the view.

import type { CustomerSale } from "./queries";

const DAY = 24 * 60 * 60 * 1000;
const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type Stats = {
  totalCents: number;
  visits: number;
  avgBasketCents: number;
  daysSinceLast: number | null;
  // Trend: spend in last 30d vs the 30d before that. Null if there's not
  // enough history to compare honestly.
  trendPct: number | null;
  trendBaseCents: number;
  trendCurrentCents: number;
};

export type CategoryShare = {
  category: string;
  cents: number;
  share: number; // 0–1
};

export type ProductBuy = {
  productId: string | null;
  name: string;
  qty: number;
  revenueCents: number;
};

export type PaymentMix = {
  mpesaCount: number;
  cashCount: number;
  mpesaPct: number; // 0–100
  cashPct: number; // 0–100
};

export type DayPreference = {
  // e.g. "Sun", "Mon" — the day-of-week they shop most.
  best: string | null;
  // Share of their visits on that day (0–1).
  share: number;
};

export type WeekBucket = {
  // Monday-anchored label like "Mar 4" (en-KE) for X-axis.
  label: string;
  cents: number;
  startISO: string;
};

export function customerStats(sales: CustomerSale[]): Stats {
  const now = Date.now();
  const totalCents = sales.reduce((s, x) => s + x.totalCents, 0);
  const visits = sales.length;
  const avgBasketCents = visits > 0 ? Math.round(totalCents / visits) : 0;

  let daysSinceLast: number | null = null;
  if (sales.length > 0) {
    const last = new Date(sales[0].createdAt).getTime();
    daysSinceLast = Math.max(0, Math.floor((now - last) / DAY));
  }

  // Trend: last 30d vs prior 30d. Need at least 1 sale in the prior window
  // to call it a trend; otherwise return null so the UI shows "new customer".
  const cutoffCurrent = now - 30 * DAY;
  const cutoffPrior = now - 60 * DAY;
  let cur = 0;
  let prior = 0;
  for (const s of sales) {
    const t = new Date(s.createdAt).getTime();
    if (t >= cutoffCurrent) cur += s.totalCents;
    else if (t >= cutoffPrior) prior += s.totalCents;
  }
  const trendPct =
    prior > 0 ? Math.round(((cur - prior) / prior) * 100) : null;

  return {
    totalCents,
    visits,
    avgBasketCents,
    daysSinceLast,
    trendPct,
    trendBaseCents: prior,
    trendCurrentCents: cur,
  };
}

export function categoryShares(sales: CustomerSale[]): CategoryShare[] {
  const map = new Map<string, number>();
  let total = 0;
  for (const s of sales) {
    for (const it of s.items) {
      const cat = it.category ?? "Uncategorised";
      const cents = it.qty * it.unitPriceCents;
      map.set(cat, (map.get(cat) ?? 0) + cents);
      total += cents;
    }
  }
  if (total === 0) return [];
  return [...map.entries()]
    .map(([category, cents]) => ({ category, cents, share: cents / total }))
    .sort((a, b) => b.cents - a.cents);
}

export function topProducts(
  sales: CustomerSale[],
  limit = 5,
): ProductBuy[] {
  const map = new Map<string, ProductBuy>();
  for (const s of sales) {
    for (const it of s.items) {
      const key = it.productId ?? `name:${it.name}`;
      const existing = map.get(key);
      if (existing) {
        existing.qty += it.qty;
        existing.revenueCents += it.qty * it.unitPriceCents;
      } else {
        map.set(key, {
          productId: it.productId,
          name: it.name,
          qty: it.qty,
          revenueCents: it.qty * it.unitPriceCents,
        });
      }
    }
  }
  return [...map.values()]
    .sort((a, b) => b.qty - a.qty || b.revenueCents - a.revenueCents)
    .slice(0, limit);
}

export function paymentMix(sales: CustomerSale[]): PaymentMix {
  let mpesa = 0;
  let cash = 0;
  for (const s of sales) {
    if (s.method === "mpesa") mpesa++;
    else cash++;
  }
  const total = mpesa + cash;
  return {
    mpesaCount: mpesa,
    cashCount: cash,
    mpesaPct: total === 0 ? 0 : Math.round((mpesa / total) * 100),
    cashPct: total === 0 ? 0 : Math.round((cash / total) * 100),
  };
}

export function dayPreference(sales: CustomerSale[]): DayPreference {
  if (sales.length === 0) return { best: null, share: 0 };
  const counts = new Array<number>(7).fill(0);
  for (const s of sales) {
    counts[new Date(s.createdAt).getDay()]++;
  }
  let bestIdx = 0;
  for (let i = 1; i < 7; i++) {
    if (counts[i] > counts[bestIdx]) bestIdx = i;
  }
  return {
    best: WEEKDAY_NAMES[bestIdx],
    share: counts[bestIdx] / sales.length,
  };
}

/** Last `weeks` Monday-anchored buckets of spend. Most-recent bucket last. */
export function weeklySpend(
  sales: CustomerSale[],
  weeks = 12,
): WeekBucket[] {
  // Monday of the current week, local time.
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // 0 = Monday
  const thisMonday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - dow,
  );

  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisMonday.getTime() - i * 7 * DAY);
    buckets.push({
      startISO: start.toISOString(),
      label: start.toLocaleDateString("en-KE", { day: "2-digit", month: "short" }),
      cents: 0,
    });
  }

  const firstStart = new Date(buckets[0].startISO).getTime();
  for (const s of sales) {
    const t = new Date(s.createdAt).getTime();
    if (t < firstStart) continue;
    const idx = Math.floor((t - firstStart) / (7 * DAY));
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx].cents += s.totalCents;
    }
  }
  return buckets;
}
