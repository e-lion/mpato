"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { Btn } from "./primitives";
import { KES } from "@/lib/format";
import type { StockReceiptListItem } from "@/lib/data/queries";

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function StockReceiptList({ receipts }: { receipts: StockReceiptListItem[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return receipts;
    const needle = q.trim().toLowerCase();
    return receipts.filter(
      (r) =>
        r.receiptNo.toLowerCase().includes(needle) ||
        (r.supplierName ?? "").toLowerCase().includes(needle) ||
        (r.reference ?? "").toLowerCase().includes(needle),
    );
  }, [q, receipts]);

  const totalCost = receipts.reduce((s, r) => s + r.totalCostCents, 0);
  const totalItems = receipts.reduce((s, r) => s + r.lineCount, 0);

  return (
    <div className="page-w" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Link
        href="/inventory"
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
        <Icon name="arrow-left" size={14} /> Back to inventory
      </Link>

      <div className="kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="kpi">
          <div className="lab">Receipts logged</div>
          <div className="val num">{receipts.length}</div>
        </div>
        <div className="kpi">
          <div className="lab">Items received</div>
          <div className="val num">{totalItems}</div>
        </div>
        <div className="kpi">
          <div className="lab">Total spend</div>
          <div className="val num">{KES(Math.round(totalCost / 100))}</div>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div
          className="section-h"
          style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", marginBottom: 0 }}
        >
          <div className="topsearch" style={{ width: 320, height: 38 }}>
            <Icon name="search" size={16} />
            <input
              placeholder="Search by receipt #, supplier or reference…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Btn variant="primary" icon="plus" onClick={() => router.push("/inventory/receive")}>
            Receive stock
          </Btn>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--fg3)" }}>
            {receipts.length === 0
              ? 'No deliveries logged yet — click "Receive stock" to log your first one.'
              : "No receipts match your search."}
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Supplier</th>
                <th>Reference</th>
                <th>Delivered</th>
                <th style={{ textAlign: "right" }}>Items</th>
                <th style={{ textAlign: "right" }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/inventory/receipts/${r.id}`)}
                >
                  <td className="mono" style={{ fontWeight: 700, color: "var(--fg1)" }}>
                    #{r.receiptNo}
                  </td>
                  <td>
                    {r.supplierName ?? (
                      <span style={{ color: "var(--fg3)" }}>Walk-in</span>
                    )}
                  </td>
                  <td style={{ color: "var(--fg2)" }}>{r.reference ?? "—"}</td>
                  <td style={{ color: "var(--fg2)" }}>{fmtDate(r.deliveryDate)}</td>
                  <td className="num" style={{ textAlign: "right" }}>{r.lineCount}</td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 700 }}>
                    {KES(Math.round(r.totalCostCents / 100))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
