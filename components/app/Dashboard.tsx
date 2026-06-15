import { Icon } from "./Icon";
import { Badge } from "./primitives";
import { KES } from "@/lib/format";
import { TILES } from "@/lib/mockData";
import type { DashboardStats, OwnerOverview, TopProduct, WeekDay } from "@/lib/data/queries";
import type { RecentSale } from "@/lib/data/types";

function storeInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "S"
  );
}

function StoresOverview({ overview }: { overview: OwnerOverview }) {
  const { stores, combined } = overview;
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="section-h">
        <h2>Across your shops</h2>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--fg3)" }}>
          {stores.length} shops · today
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "4px 0 18px" }}>
        <div className="num" style={{ fontWeight: 800, fontFamily: "var(--font-display)", fontSize: 28 }}>
          {KES(combined.salesToday)}
        </div>
        <div style={{ fontSize: 13, color: "var(--fg3)" }}>
          {combined.ordersToday} orders · {KES(combined.mpesaToday)} M-PESA · {KES(combined.cashToday)} cash
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {stores.map((s) => {
          const pct = combined.salesToday > 0 ? Math.round((s.salesToday / combined.salesToday) * 100) : 0;
          return (
            <div key={s.storeId} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                className="av"
                style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "var(--r-md)", background: "var(--rose-50)", color: "var(--rose-700)", fontWeight: 700 }}
              >
                {storeInitials(s.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.name}
                    {s.area ? <span style={{ color: "var(--fg3)", fontWeight: 400 }}> · {s.area}</span> : null}
                  </div>
                  <div className="num" style={{ fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{KES(s.salesToday)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                  <div style={{ flex: 1, height: 6, borderRadius: "var(--r-pill)", background: "var(--stone-100, var(--border))", overflow: "hidden" }}>
                    <div style={{ width: pct + "%", height: "100%", background: "var(--mpesa)" }} />
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg3)", width: 78, textAlign: "right", flexShrink: 0 }}>
                    {s.ordersToday} {s.ordersToday === 1 ? "order" : "orders"}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KpiTile({
  icon,
  tint,
  lab,
  val,
  delta,
  up,
}: {
  icon: string;
  tint: { bg: string; fg: string };
  lab: string;
  val: string;
  delta: string;
  up: boolean;
}) {
  return (
    <div className="kpi">
      <div className="ic" style={{ background: tint.bg, color: tint.fg }}>
        <Icon name={icon} />
      </div>
      <div className="lab">{lab}</div>
      <div className="val num">{val}</div>
      <div className={"delta " + (up ? "up" : "down")}>
        <Icon name={up ? "arrow-up-right" : "arrow-down-right"} />
        {delta}
      </div>
    </div>
  );
}

function WeekChart({ week }: { week: WeekDay[] }) {
  const maxRaw = Math.max(0, ...week.map((w) => w.mpesa + w.cash));
  const max = maxRaw === 0 ? 1 : maxRaw;
  const anySales = maxRaw > 0;

  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="section-h">
        <h2>Sales this week</h2>
        <div style={{ display: "flex", gap: 14, fontSize: 12, fontWeight: 600, color: "var(--fg2)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--mpesa)" }} />
            M-PESA
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--stone-300)" }} />
            Cash
          </span>
        </div>
      </div>
      {anySales ? (
        <div className="bars">
          {week.map((w) => {
            const total = w.mpesa + w.cash;
            const heightPct = total === 0 ? 0 : (total / max) * 100;
            return (
              <div className="bar-col" key={w.d}>
                <div className="bar-stack" style={{ height: heightPct + "%" }}>
                  {total > 0 && (
                    <>
                      <div className="bar-seg" style={{ height: (w.cash / total) * 100 + "%", background: "var(--stone-300)" }} />
                      <div className="bar-seg" style={{ height: (w.mpesa / total) * 100 + "%", background: "var(--mpesa)" }} />
                    </>
                  )}
                </div>
                <div className="bar-x">{w.d}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ height: 150, display: "grid", placeItems: "center", color: "var(--fg3)", fontSize: 14 }}>
          No sales in the last 7 days yet.
        </div>
      )}
    </div>
  );
}

function PaymentSplit({ mpesa, cash }: { mpesa: number; cash: number }) {
  const mpesaPct = Math.round((mpesa / Math.max(mpesa + cash, 1)) * 100);
  const cashPct = 100 - mpesaPct;
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="section-h"><h2>Payment mix</h2></div>
      <div style={{ display: "flex", height: 14, borderRadius: "var(--r-pill)", overflow: "hidden", marginBottom: 18 }}>
        <div style={{ width: mpesaPct + "%", background: "var(--mpesa)" }} />
        <div style={{ width: cashPct + "%", background: "var(--stone-300)" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "var(--r-md)", background: "var(--mpesa-bg)", color: "#0C744F", display: "grid", placeItems: "center" }}>
            <Icon name="smartphone" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>M-PESA</div>
            <div style={{ fontSize: 12, color: "var(--fg3)" }}>{mpesaPct}% of today</div>
          </div>
          <div className="num" style={{ fontWeight: 800, fontFamily: "var(--font-display)", fontSize: 18 }}>{KES(mpesa)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "var(--r-md)", background: "var(--cash-bg)", color: "var(--fg2)", display: "grid", placeItems: "center" }}>
            <Icon name="banknote" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Cash</div>
            <div style={{ fontSize: 12, color: "var(--fg3)" }}>{cashPct}% of today</div>
          </div>
          <div className="num" style={{ fontWeight: 800, fontFamily: "var(--font-display)", fontSize: 18 }}>{KES(cash)}</div>
        </div>
      </div>
    </div>
  );
}

function TopProducts({ items }: { items: TopProduct[] }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="section-h">
        <h2>Top products</h2>
        <span className="btn btn-ghost" style={{ height: 30, fontSize: 13, padding: "0 10px" }}>This week</span>
      </div>
      {items.length === 0 ? (
        <div style={{ padding: "16px 0", color: "var(--fg3)", fontSize: 14 }}>
          No sales yet — make a few sales in the POS and your top sellers will show up here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((p) => (
            <div key={p.productId} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="thumb" style={{ width: 36, height: 36, borderRadius: "var(--r-sm)", display: "grid", placeItems: "center", color: "#fff", background: TILES[p.tile].bg }}>
                <Icon name={p.glyph} size={17} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "var(--fg3)" }}>{p.sold} sold</div>
              </div>
              <div className="num" style={{ fontWeight: 700, fontSize: 14 }}>{KES(p.revenue)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentSales({ sales }: { sales: RecentSale[] }) {
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div className="section-h" style={{ padding: "18px 20px 4px" }}><h2>Recent sales</h2></div>
      {sales.length === 0 ? (
        <div style={{ padding: "12px 20px 24px", color: "var(--fg3)", fontSize: 14 }}>No sales yet — make your first one in the point of sale.</div>
      ) : (
        <table className="tbl">
          <thead>
            <tr>
              <th>Receipt</th><th>Items</th><th>Method</th><th>Cashier</th><th>When</th>
              <th style={{ textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td className="mono" style={{ fontWeight: 500 }}>#{s.receiptNo}</td>
                <td className="num">{s.items}</td>
                <td>
                  {s.method === "mpesa" ? (
                    <Badge kind="mpesa"><Icon name="smartphone" size={12} />M-PESA</Badge>
                  ) : (
                    <Badge kind="cash"><Icon name="banknote" size={12} />Cash</Badge>
                  )}
                </td>
                <td>{s.cashier}</td>
                <td style={{ color: "var(--fg3)" }}>{s.time}</td>
                <td className="num" style={{ textAlign: "right", fontWeight: 700 }}>{KES(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function Dashboard({
  stats,
  sales,
  week,
  topProducts,
  overview,
}: {
  stats: DashboardStats;
  sales: RecentSale[];
  week: WeekDay[];
  topProducts: TopProduct[];
  overview?: OwnerOverview | null;
}) {
  return (
    <div className="page-w" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {overview && <StoresOverview overview={overview} />}
      <div className="kpis">
        <KpiTile
          icon="trending-up"
          tint={{ bg: "var(--rose-50)", fg: "var(--rose-700)" }}
          lab="Sales today"
          val={KES(stats.salesToday)}
          delta={stats.salesToday > 0 ? "Trending today" : "No sales yet"}
          up
        />
        <KpiTile
          icon="receipt"
          tint={{ bg: "var(--peri-50)", fg: "var(--peri-600)" }}
          lab="Orders"
          val={String(stats.ordersToday)}
          delta={stats.ordersToday > 0 ? `${stats.ordersToday} today` : "—"}
          up
        />
        <KpiTile
          icon="users"
          tint={{ bg: "var(--lilac-100)", fg: "var(--lilac-500)" }}
          lab="New customers"
          val={String(stats.newCustomers)}
          delta={stats.newCustomers > 0 ? `${stats.newCustomers} today` : "—"}
          up
        />
        <KpiTile
          icon="package"
          tint={{ bg: "var(--apricot-50)", fg: "var(--apricot-600)" }}
          lab="Low stock"
          val={String(stats.lowStock)}
          delta={stats.lowStock > 0 ? "Restock soon" : "All stocked"}
          up={stats.lowStock === 0}
        />
      </div>
      <div className="grid-2">
        <WeekChart week={week} />
        <PaymentSplit mpesa={stats.mpesaToday} cash={stats.cashToday} />
      </div>
      <div className="grid-2">
        <RecentSales sales={sales} />
        <TopProducts items={topProducts} />
      </div>
    </div>
  );
}
