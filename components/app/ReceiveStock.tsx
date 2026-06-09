"use client";
import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { Btn } from "./primitives";
import { ProductForm } from "./ProductForm";
import { SupplierForm } from "./SupplierForm";
import { KES } from "@/lib/format";
import { TILES } from "@/lib/mockData";
import type { Product } from "@/lib/data/types";
import type { StockReceiptListItem, Supplier } from "@/lib/data/queries";
import { receiveStock } from "@/app/actions/stock-receipts";

type Line = {
  // Stable key for the row even before a product is picked.
  rowKey: string;
  productId: string;
  qty: number;
  unitCost: number; // shillings
};

function todayISO() {
  // YYYY-MM-DD in local time so the <input type="date"> behaves naturally.
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReceiveStock({
  products,
  suppliers,
  recentReceipts,
}: {
  products: Product[];
  suppliers: Supplier[];
  recentReceipts: StockReceiptListItem[];
}) {
  const router = useRouter();
  const [supplierId, setSupplierId] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState(todayISO());
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { rowKey: crypto.randomUUID(), productId: "", qty: 1, unitCost: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ receiptNo: string; total: number; lines: number } | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const productById = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    return m;
  }, [products]);

  const total = useMemo(
    () =>
      lines.reduce(
        (s, l) =>
          s + (Number.isFinite(l.qty) ? l.qty : 0) * (Number.isFinite(l.unitCost) ? l.unitCost : 0),
        0,
      ),
    [lines],
  );

  const lineCount = lines.filter((l) => l.productId && l.qty > 0).length;

  const updateLine = (rowKey: string, patch: Partial<Line>) => {
    setLines((prev) => prev.map((l) => (l.rowKey === rowKey ? { ...l, ...patch } : l)));
  };
  const removeLine = (rowKey: string) => {
    setLines((prev) =>
      prev.length <= 1
        ? prev
        : prev.filter((l) => l.rowKey !== rowKey),
    );
  };
  const addLine = () =>
    setLines((prev) => [
      ...prev,
      { rowKey: crypto.randomUUID(), productId: "", qty: 1, unitCost: 0 },
    ]);

  const reset = () => {
    setSupplierId("");
    setDeliveryDate(todayISO());
    setReference("");
    setNotes("");
    setLines([{ rowKey: crypto.randomUUID(), productId: "", qty: 1, unitCost: 0 }]);
    setError(null);
    setSuccess(null);
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const items = lines
      .filter((l) => l.productId)
      .map((l) => ({
        productId: l.productId,
        qty: Number.isFinite(l.qty) ? Math.round(l.qty) : 0,
        unitCost: Number.isFinite(l.unitCost) ? l.unitCost : 0,
      }));

    if (items.length === 0) {
      setError("Add at least one product to receive.");
      return;
    }

    startTransition(async () => {
      const result = await receiveStock({
        supplierId: supplierId || null,
        reference,
        deliveryDate,
        notes,
        items,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess({
        receiptNo: result.receiptNo,
        total: Math.round(result.totalCents / 100),
        lines: result.lineCount,
      });
      // Refresh the recent receipts list at the bottom + new product stock.
      router.refresh();
    });
  }

  // -------- Empty product catalogue --------
  if (products.length === 0) {
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
        <div className="card" style={{ padding: 32, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "var(--r-lg)",
              background: "var(--rose-50)",
              color: "var(--rose-700)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Icon name="package" size={24} />
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 22,
              margin: "0 0 6px",
            }}
          >
            Add a product first
          </h2>
          <p style={{ color: "var(--fg2)", fontSize: 14, margin: "0 auto 18px", maxWidth: 380 }}>
            Receiving goods tops up stock on products you already sell. Add at least
            one product to your inventory, then come back to log the delivery.
          </p>
          <Btn variant="primary" icon="plus" onClick={() => setShowProductModal(true)}>
            Add product
          </Btn>
        </div>
        {showProductModal && (
          <ProductForm
            open
            mode={{ kind: "create" }}
            onClose={() => {
              setShowProductModal(false);
              router.refresh();
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="page-w" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
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
      </div>

      <div className="card" style={{ padding: 22 }}>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Header — supplier + dates + reference */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr",
              gap: 14,
            }}
          >
            <div className="m-field" style={{ marginBottom: 0 }}>
              <label htmlFor="rs-supplier">Supplier (optional)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  id="rs-supplier"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">Walk-in / cash-and-carry</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="iconbtn"
                  onClick={() => setShowSupplierModal(true)}
                  aria-label="Add a new supplier"
                  title="Add a new supplier"
                  style={{
                    width: 38,
                    height: 38,
                    border: "1px solid var(--border)",
                    background: "var(--bg1)",
                    borderRadius: "var(--r-md)",
                    cursor: "pointer",
                  }}
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>
            <div className="m-field" style={{ marginBottom: 0 }}>
              <label htmlFor="rs-date">Delivery date</label>
              <input
                id="rs-date"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </div>
            <div className="m-field" style={{ marginBottom: 0 }}>
              <label htmlFor="rs-ref">Reference / invoice no.</label>
              <input
                id="rs-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. INV-2398 from supplier"
              />
            </div>
          </div>

          {/* Items table */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 16,
                  margin: 0,
                  letterSpacing: "-.2px",
                }}
              >
                Items delivered
              </h3>
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--rose-700)",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Icon name="plus" size={14} /> New product
              </button>
            </div>

            <div className="card" style={{ overflow: "hidden", border: "1px solid var(--border)", boxShadow: "none" }}>
              <table className="tbl" style={{ background: "transparent" }}>
                <thead>
                  <tr>
                    <th style={{ width: "45%" }}>Product</th>
                    <th style={{ width: "15%", textAlign: "right" }}>Qty</th>
                    <th style={{ width: "20%", textAlign: "right" }}>Unit cost</th>
                    <th style={{ width: "15%", textAlign: "right" }}>Line total</th>
                    <th style={{ width: "5%" }} />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => {
                    const product = productById.get(l.productId);
                    const lineTotal = l.qty * l.unitCost;
                    return (
                      <tr key={l.rowKey}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {product && (
                              <div
                                className="thumb"
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: "var(--r-sm)",
                                  background: TILES[product.tile].bg,
                                  color: "#fff",
                                  display: "grid",
                                  placeItems: "center",
                                  flex: "none",
                                }}
                              >
                                <Icon name={product.glyph} size={14} />
                              </div>
                            )}
                            <select
                              value={l.productId}
                              onChange={(e) =>
                                updateLine(l.rowKey, {
                                  productId: e.target.value,
                                  // Default unit cost = product's last known cost
                                  // (in shillings). Easy to override per line.
                                  unitCost:
                                    e.target.value && l.unitCost === 0
                                      ? lastCostFor(productById.get(e.target.value))
                                      : l.unitCost,
                                })
                              }
                              style={{ flex: 1, minWidth: 0 }}
                            >
                              <option value="">Pick a product…</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={l.qty}
                            onChange={(e) =>
                              updateLine(l.rowKey, {
                                qty: Number.parseInt(e.target.value, 10),
                              })
                            }
                            style={{ width: "100%", textAlign: "right" }}
                            className="num"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={l.unitCost}
                            onChange={(e) =>
                              updateLine(l.rowKey, {
                                unitCost: Number.parseFloat(e.target.value),
                              })
                            }
                            style={{ width: "100%", textAlign: "right" }}
                            className="num"
                          />
                        </td>
                        <td
                          className="num"
                          style={{ textAlign: "right", fontWeight: 600, color: "var(--fg1)" }}
                        >
                          {Number.isFinite(lineTotal) ? KES(Math.round(lineTotal)) : "—"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => removeLine(l.rowKey)}
                            disabled={lines.length <= 1}
                            aria-label="Remove line"
                            style={{
                              border: "none",
                              background: "none",
                              cursor: lines.length <= 1 ? "not-allowed" : "pointer",
                              color: lines.length <= 1 ? "var(--fg-disabled)" : "var(--fg3)",
                              padding: 4,
                              borderRadius: "var(--r-sm)",
                            }}
                          >
                            <Icon name="trash" size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={addLine}
              style={{
                marginTop: 10,
                background: "none",
                border: "1px dashed var(--border-strong)",
                color: "var(--fg2)",
                padding: "10px 14px",
                width: "100%",
                borderRadius: "var(--r-md)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Icon name="plus" size={14} /> Add another item
            </button>
          </div>

          <div className="m-field" style={{ marginBottom: 0 }}>
            <label htmlFor="rs-notes">Notes</label>
            <textarea
              id="rs-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything to remember about this delivery (damaged crates, partial delivery…)"
              style={{ resize: "vertical", minHeight: 60 }}
            />
          </div>

          {error && <div className="m-error">{error}</div>}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid var(--border)",
              paddingTop: 16,
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ color: "var(--fg3)", fontSize: 12, fontWeight: 600 }}>
                Total cost · {lineCount} item{lineCount === 1 ? "" : "s"}
              </span>
              <span
                className="num"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 26,
                  letterSpacing: "-.5px",
                }}
              >
                {KES(Math.round(total))}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" type="button" onClick={reset} disabled={isPending}>
                Clear
              </Btn>
              <Btn variant="primary" type="submit" icon="check" disabled={isPending}>
                {isPending ? "Saving…" : "Receive stock"}
              </Btn>
            </div>
          </div>
        </form>
      </div>

      {/* Recent receipts */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div
          className="section-h"
          style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", marginBottom: 0 }}
        >
          <h2>Recent deliveries</h2>
          <Link
            href="/inventory/receipts"
            style={{
              color: "var(--rose-700)",
              fontWeight: 600,
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            View all →
          </Link>
        </div>
        {recentReceipts.length === 0 ? (
          <div style={{ padding: "24px 20px", textAlign: "center", color: "var(--fg3)", fontSize: 13 }}>
            No deliveries logged yet — your next one will appear here.
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Receipt</th>
                <th>Supplier</th>
                <th>Delivered</th>
                <th style={{ textAlign: "right" }}>Items</th>
                <th style={{ textAlign: "right" }}>Cost</th>
              </tr>
            </thead>
            <tbody>
              {recentReceipts.map((r) => (
                <tr
                  key={r.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/inventory/receipts/${r.id}`)}
                >
                  <td className="mono" style={{ fontWeight: 700, color: "var(--fg1)" }}>
                    #{r.receiptNo}
                  </td>
                  <td>{r.supplierName ?? <span style={{ color: "var(--fg3)" }}>Walk-in</span>}</td>
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

      {/* Success modal */}
      {success && (
        <div className="scrim" onClick={reset}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-ic">
              <Icon name="check" />
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 24,
                margin: "0 0 4px",
                letterSpacing: "-.6px",
              }}
            >
              Stock received
            </h2>
            <div
              className="num"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 32,
                letterSpacing: "-1.2px",
                margin: "6px 0",
              }}
            >
              {KES(success.total)}
            </div>
            <p style={{ color: "var(--fg2)", fontSize: 14, margin: "0 0 4px" }}>
              {success.lines} item{success.lines === 1 ? "" : "s"} added to stock
            </p>
            <p className="mono" style={{ color: "var(--fg3)", fontSize: 13, margin: "0 0 20px" }}>
              #{success.receiptNo}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" block onClick={reset}>
                Log another
              </Btn>
              <Btn variant="primary" block icon="package" onClick={() => router.push("/inventory")}>
                Back to inventory
              </Btn>
            </div>
          </div>
        </div>
      )}

      {showProductModal && (
        <ProductForm
          open
          mode={{ kind: "create" }}
          onClose={() => {
            setShowProductModal(false);
            router.refresh();
          }}
        />
      )}
      {showSupplierModal && (
        <SupplierForm
          open
          mode={{ kind: "create" }}
          onClose={() => {
            setShowSupplierModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// Pull the most recent cost out of a product so the unit-cost input
// pre-fills with something sensible. Product.price is in shillings; we
// don't have cost on the type yet (only on the row), so default to 0
// when unavailable — the user can override per line.
function lastCostFor(_p: Product | undefined): number {
  return 0;
}
