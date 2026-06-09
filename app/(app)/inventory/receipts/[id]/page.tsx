import { notFound } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/app/Icon";
import { KES } from "@/lib/format";
import { getCurrentStoreId, getStockReceipt } from "@/lib/data/queries";

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(s: string) {
  return new Date(s).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function StockReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const storeId = await getCurrentStoreId();
  if (!storeId) notFound();

  const receipt = await getStockReceipt(storeId, id);
  if (!receipt) notFound();

  return (
    <div className="page-w" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Link
        href="/inventory/receipts"
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
        <Icon name="arrow-left" size={14} /> All stock receipts
      </Link>

      <div className="card" style={{ padding: 24 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
            flexWrap: "wrap",
            paddingBottom: 16,
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div>
            <div className="mono" style={{ color: "var(--fg3)", fontSize: 12, fontWeight: 700 }}>
              GOODS RECEIVED NOTE
            </div>
            <h1
              className="mono"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 30,
                letterSpacing: "-.5px",
                margin: "4px 0 0",
              }}
            >
              #{receipt.receiptNo}
            </h1>
            <div style={{ color: "var(--fg2)", fontSize: 13, marginTop: 4 }}>
              Logged {fmtDateTime(receipt.createdAt)}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--fg3)", fontSize: 12, fontWeight: 600, letterSpacing: ".8px", textTransform: "uppercase" }}>
              Total cost
            </div>
            <div
              className="num"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 30,
                letterSpacing: "-.5px",
              }}
            >
              {KES(Math.round(receipt.totalCostCents / 100))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            padding: "18px 0",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <Meta label="Supplier" value={receipt.supplierName ?? "Walk-in / cash-and-carry"} />
          <Meta label="Delivery date" value={fmtDate(receipt.deliveryDate)} />
          <Meta label="Reference" value={receipt.reference ?? "—"} mono={!!receipt.reference} />
          <Meta label="Items" value={`${receipt.lineCount} line${receipt.lineCount === 1 ? "" : "s"}`} />
        </div>

        <div style={{ marginTop: 18 }}>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 16,
              margin: "0 0 10px",
            }}
          >
            Line items
          </h3>
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: "right" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Unit cost</th>
                <th style={{ textAlign: "right" }}>Line total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.lines.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>
                    {l.productId ? (
                      <Link
                        href="/inventory"
                        style={{ color: "var(--fg1)", textDecoration: "none" }}
                      >
                        {l.productName}
                      </Link>
                    ) : (
                      <span style={{ color: "var(--fg2)" }}>{l.productName} (deleted)</span>
                    )}
                  </td>
                  <td className="num" style={{ textAlign: "right" }}>{l.qty}</td>
                  <td className="num" style={{ textAlign: "right" }}>
                    {KES(Math.round(l.unitCostCents / 100))}
                  </td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 700 }}>
                    {KES(Math.round((l.qty * l.unitCostCents) / 100))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {receipt.notes && (
          <div
            style={{
              marginTop: 18,
              padding: 14,
              background: "var(--bg2)",
              borderRadius: "var(--r-md)",
              fontSize: 13,
              color: "var(--fg2)",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--fg1)", marginBottom: 4 }}>Notes</div>
            {receipt.notes}
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          color: "var(--fg3)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: ".8px",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        className={mono ? "mono" : undefined}
        style={{ color: "var(--fg1)", fontSize: 14, fontWeight: 600 }}
      >
        {value}
      </div>
    </div>
  );
}
