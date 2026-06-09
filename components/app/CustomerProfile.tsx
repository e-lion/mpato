"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { Avatar, Badge, Btn } from "./primitives";
import { CustomerForm } from "./CustomerForm";
import { KES } from "@/lib/format";
import type { CustomerProfileData, CustomerSale } from "@/lib/data/queries";
import type { Customer } from "@/lib/data/types";
import {
  categoryShares,
  customerStats,
  dayPreference,
  paymentMix,
  topProducts,
  weeklySpend,
} from "@/lib/data/customer360";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tagKind(t: Customer["tag"]): "info" | "warning" | "success" {
  if (t === "VIP") return "info";
  if (t === "Lapsing") return "warning";
  return "success";
}

export function CustomerProfile({ profile }: { profile: CustomerProfileData }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [openSaleId, setOpenSaleId] = useState<string | null>(null);

  // All derivations memoised — sales array is stable per render.
  const stats = useMemo(() => customerStats(profile.sales), [profile.sales]);
  const cats = useMemo(() => categoryShares(profile.sales), [profile.sales]);
  const top = useMemo(() => topProducts(profile.sales, 5), [profile.sales]);
  const pay = useMemo(() => paymentMix(profile.sales), [profile.sales]);
  const dayPref = useMemo(() => dayPreference(profile.sales), [profile.sales]);
  const weeks = useMemo(() => weeklySpend(profile.sales, 12), [profile.sales]);

  const lifetimeKES = Math.round(profile.spentCents / 100);
  const avgBasketKES = Math.round(stats.avgBasketCents / 100);
  const topCat = cats[0] ?? null;

  // Shape a synthetic Customer for the edit modal (it only reads name/phone/tag/id).
  const formCustomer: Customer = {
    id: profile.id,
    name: profile.name,
    phone: profile.phone,
    tag: profile.tag,
    color: profile.color,
    spent: lifetimeKES,
    visits: profile.visits,
    last: profile.lastSeen ? fmtDate(profile.lastSeen) : "—",
  };

  // Chart scaling — use the tallest bucket so we never divide by zero.
  const maxBucket = Math.max(1, ...weeks.map((w) => w.cents));

  const trendArrow =
    stats.trendPct === null
      ? null
      : stats.trendPct > 0
        ? "↑"
        : stats.trendPct < 0
          ? "↓"
          : "→";
  const trendColor =
    stats.trendPct === null
      ? "var(--fg3)"
      : stats.trendPct > 0
        ? "var(--success-fg)"
        : stats.trendPct < 0
          ? "var(--warning-fg)"
          : "var(--fg3)";

  return (
    <div className="page-w" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <Link
          href="/customers"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--fg3)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          <Icon name="arrow-left" size={14} /> All customers
        </Link>
      </div>

      {/* Header card */}
      <div className="card" style={{ padding: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <Avatar name={profile.name} color={profile.color} size={64} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 28,
                  letterSpacing: "-.5px",
                  margin: 0,
                  color: "var(--fg1)",
                }}
              >
                {profile.name}
              </h1>
              <Badge kind={tagKind(profile.tag)} dot>
                {profile.tag}
              </Badge>
            </div>
            <div style={{ color: "var(--fg2)", marginTop: 4, fontSize: 14 }}>
              <span className="mono">{profile.phone ?? "No phone on file"}</span>
              <span style={{ color: "var(--fg3)" }}> · </span>
              <span>Customer since {fmtDate(profile.createdAt)}</span>
              {profile.lastSeen && (
                <>
                  <span style={{ color: "var(--fg3)" }}> · </span>
                  <span>
                    Last seen{" "}
                    {stats.daysSinceLast === 0
                      ? "today"
                      : stats.daysSinceLast === 1
                        ? "yesterday"
                        : `${stats.daysSinceLast} days ago`}
                  </span>
                </>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" icon="pencil" onClick={() => setEditing(true)}>
              Edit
            </Btn>
            <Btn
              variant="primary"
              icon="plus"
              onClick={() => router.push(`/pos?customer=${profile.id}`)}
            >
              New sale
            </Btn>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        <div className="kpi">
          <div className="lab">Lifetime spend</div>
          <div className="val num">{KES(lifetimeKES)}</div>
          {stats.trendPct !== null && (
            <div style={{ fontSize: 12, color: trendColor, marginTop: 4, fontWeight: 600 }}>
              {trendArrow} {Math.abs(stats.trendPct)}% last 30 vs prior 30 days
            </div>
          )}
        </div>
        <div className="kpi">
          <div className="lab">Visits</div>
          <div className="val num">{profile.visits}</div>
          <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 4 }}>
            {profile.visits === 0
              ? "No purchases yet"
              : `${(profile.visits / Math.max(1, monthsSince(profile.createdAt))).toFixed(1)} / month avg`}
          </div>
        </div>
        <div className="kpi">
          <div className="lab">Avg basket</div>
          <div className="val num">{KES(avgBasketKES)}</div>
          <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 4 }}>
            {profile.visits === 0 ? "—" : "Across all receipts"}
          </div>
        </div>
        <div className="kpi">
          <div className="lab">Days since last visit</div>
          <div
            className="val num"
            style={{
              color:
                stats.daysSinceLast === null
                  ? "var(--fg3)"
                  : stats.daysSinceLast > 21
                    ? "var(--warning-fg)"
                    : "var(--fg1)",
            }}
          >
            {stats.daysSinceLast === null ? "—" : stats.daysSinceLast}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 4 }}>
            {stats.daysSinceLast === null
              ? "Never visited"
              : stats.daysSinceLast > 21
                ? "Consider re-engaging"
                : "Active customer"}
          </div>
        </div>
      </div>

      {/* Insights row */}
      <div className="kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="kpi">
          <div className="lab">Top category</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--fg1)" }}>
            {topCat?.category ?? "—"}
          </div>
          {topCat && (
            <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 4 }}>
              {Math.round(topCat.share * 100)}% of their spend
            </div>
          )}
        </div>
        <div className="kpi">
          <div className="lab">Preferred payment</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 22,
                color: pay.mpesaPct >= pay.cashPct ? "var(--mpesa)" : "var(--fg1)",
              }}
            >
              {pay.mpesaPct >= pay.cashPct ? "M-PESA" : "Cash"}
            </span>
            <span style={{ color: "var(--fg3)", fontSize: 13 }}>
              {Math.max(pay.mpesaPct, pay.cashPct)}%
            </span>
          </div>
          {profile.sales.length > 0 && (
            <div style={{ display: "flex", gap: 4, marginTop: 8, height: 6, borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${pay.mpesaPct}%`, background: "var(--mpesa)" }} />
              <div style={{ width: `${pay.cashPct}%`, background: "var(--stone-400)" }} />
            </div>
          )}
        </div>
        <div className="kpi">
          <div className="lab">Best day</div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--fg1)" }}>
            {dayPref.best ?? "—"}
          </div>
          {dayPref.best && (
            <div style={{ fontSize: 12, color: "var(--fg3)", marginTop: 4 }}>
              {Math.round(dayPref.share * 100)}% of their visits
            </div>
          )}
        </div>
      </div>

      {/* Spend chart + top products */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="section-h" style={{ marginBottom: 14 }}>
            <h2>Spend over the last 12 weeks</h2>
          </div>
          {profile.sales.length === 0 ? (
            <div style={{ color: "var(--fg3)", fontSize: 13, padding: "20px 0" }}>
              No purchases yet — once they buy something, you&apos;ll see the spend trend here.
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 6,
                height: 160,
                paddingTop: 8,
              }}
            >
              {weeks.map((w) => {
                const h = (w.cents / maxBucket) * 100;
                const kes = Math.round(w.cents / 100);
                return (
                  <div
                    key={w.startISO}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 6,
                      minWidth: 0,
                    }}
                    title={`${w.label}: ${KES(kes)}`}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: `${Math.max(h, w.cents > 0 ? 4 : 0)}%`,
                        background: "var(--rose-500)",
                        borderRadius: "6px 6px 2px 2px",
                        transition: "background var(--transition)",
                        minHeight: w.cents > 0 ? 4 : 0,
                      }}
                    />
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--fg3)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      }}
                    >
                      {w.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div className="section-h" style={{ marginBottom: 14 }}>
            <h2>Top products</h2>
          </div>
          {top.length === 0 ? (
            <div style={{ color: "var(--fg3)", fontSize: 13 }}>
              Nothing bought yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {top.map((p, i) => {
                const maxQty = top[0].qty;
                const pct = (p.qty / maxQty) * 100;
                return (
                  <div key={(p.productId ?? "n") + i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
                      <span style={{ fontWeight: 600, color: "var(--fg1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </span>
                      <span className="num" style={{ color: "var(--fg2)", flex: "none" }}>
                        ×{p.qty} · {KES(Math.round(p.revenueCents / 100))}
                      </span>
                    </div>
                    <div style={{ height: 6, background: "var(--stone-100)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "var(--rose-400)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Purchase history */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          className="section-h"
          style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", marginBottom: 0 }}
        >
          <h2>Purchase history</h2>
          <div style={{ color: "var(--fg3)", fontSize: 13 }}>
            {profile.sales.length} receipt{profile.sales.length === 1 ? "" : "s"}
          </div>
        </div>
        {profile.sales.length === 0 ? (
          <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--fg3)" }}>
            No purchases recorded for this customer yet.
          </div>
        ) : (
          <div>
            {profile.sales.map((s) => (
              <SaleRow
                key={s.id}
                sale={s}
                open={openSaleId === s.id}
                onToggle={() => setOpenSaleId(openSaleId === s.id ? null : s.id)}
              />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <CustomerForm
          open
          mode={{ kind: "edit", customer: formCustomer }}
          onClose={() => {
            setEditing(false);
            // Refresh so the latest name / tag show after a save.
            router.refresh();
          }}
          onDeleted={() => router.push("/customers")}
        />
      )}
    </div>
  );
}

function SaleRow({
  sale,
  open,
  onToggle,
}: {
  sale: CustomerSale;
  open: boolean;
  onToggle: () => void;
}) {
  const total = Math.round(sale.totalCents / 100);
  const itemCount = sale.items.reduce((s, it) => s + it.qty, 0);
  return (
    <div style={{ borderBottom: "1px solid var(--border)" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          width: "100%",
          padding: "14px 18px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          transition: "background var(--transition)",
        }}
        aria-expanded={open}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "var(--r-sm)",
            background: sale.method === "mpesa" ? "var(--mpesa-bg)" : "var(--cash-bg)",
            color: sale.method === "mpesa" ? "var(--mpesa)" : "var(--cash)",
            display: "grid",
            placeItems: "center",
            flex: "none",
          }}
        >
          <Icon name={sale.method === "mpesa" ? "smartphone" : "banknote"} size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="mono" style={{ fontWeight: 700, color: "var(--fg1)" }}>
              #{sale.receiptNo}
            </span>
            <span style={{ color: "var(--fg3)", fontSize: 12 }}>
              {fmtDateTime(sale.createdAt)}
            </span>
          </div>
          <div style={{ color: "var(--fg2)", fontSize: 13 }}>
            {itemCount} item{itemCount === 1 ? "" : "s"}
            {sale.method === "mpesa" && sale.mpesaRef && (
              <>
                <span style={{ color: "var(--fg3)" }}> · ref </span>
                <span className="mono">{sale.mpesaRef}</span>
              </>
            )}
          </div>
        </div>
        <div className="num" style={{ fontWeight: 700, fontSize: 16, color: "var(--fg1)" }}>
          {KES(total)}
        </div>
        <Icon
          name="chevron-down"
          size={16}
          color="var(--fg3)"
          // CSS rotate so the arrow flips when expanded.
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform .15s",
          }}
        />
      </button>
      {open && (
        <div style={{ background: "var(--stone-50)", padding: "8px 18px 14px 68px" }}>
          <table className="tbl" style={{ background: "transparent" }}>
            <thead>
              <tr>
                <th>Item</th>
                {sale.items.some((it) => it.category) && <th>Category</th>}
                <th style={{ textAlign: "right" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Unit</th>
                <th style={{ textAlign: "right" }}>Line</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((it, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>{it.name}</td>
                  {sale.items.some((x) => x.category) && (
                    <td style={{ color: "var(--fg3)" }}>{it.category ?? "—"}</td>
                  )}
                  <td className="num" style={{ textAlign: "right" }}>{it.qty}</td>
                  <td className="num" style={{ textAlign: "right" }}>
                    {KES(Math.round(it.unitPriceCents / 100))}
                  </td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>
                    {KES(Math.round((it.qty * it.unitPriceCents) / 100))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function monthsSince(iso: string): number {
  const start = new Date(iso);
  const now = new Date();
  const months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  return Math.max(1, months);
}
