"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { Badge, Btn } from "./primitives";
import { ProductForm } from "./ProductForm";
import { KES } from "@/lib/format";
import { TILES } from "@/lib/mockData";
import type { Product } from "@/lib/data/types";

function stockBadge(stock: number) {
  if (stock === 0) return <Badge kind="danger" dot>Out of stock</Badge>;
  if (stock <= 6) return <Badge kind="warning" dot>Low stock</Badge>;
  return <Badge kind="success" dot>In stock</Badge>;
}

type FormState = { kind: "closed" } | { kind: "create" } | { kind: "edit"; product: Product };

export function Inventory({ products }: { products: Product[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [form, setForm] = useState<FormState>({ kind: "closed" });

  const list = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const needRestock = products.filter((p) => p.stock <= 6).length;

  return (
    <div className="page-w" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="kpi">
          <div className="lab">Products</div>
          <div className="val num">{products.length}</div>
        </div>
        <div className="kpi">
          <div className="lab">Stock value</div>
          <div className="val num">{KES(totalValue)}</div>
        </div>
        <div className="kpi">
          <div className="lab">Need restock</div>
          <div
            className="val num"
            style={{ color: needRestock > 0 ? "var(--warning-fg)" : "var(--fg1)" }}
          >
            {needRestock}
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div
          className="section-h"
          style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", marginBottom: 0 }}
        >
          <div className="topsearch" style={{ width: 280, height: 38 }}>
            <Icon name="search" size={16} />
            <input
              placeholder="Search inventory…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn
              variant="secondary"
              icon="receipt"
              onClick={() => router.push("/inventory/receipts")}
            >
              Stock receipts
            </Btn>
            <Btn
              variant="secondary"
              icon="truck"
              onClick={() => router.push("/inventory/receive")}
            >
              Receive stock
            </Btn>
            <Btn variant="primary" icon="plus" onClick={() => setForm({ kind: "create" })}>
              Add product
            </Btn>
          </div>
        </div>
        {list.length === 0 ? (
          <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--fg3)" }}>
            {products.length === 0
              ? "No products yet — click \"Add product\" to start your inventory."
              : "No products match your search."}
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "right" }}>Stock</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr
                  key={p.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setForm({ kind: "edit", product: p })}
                >
                  <td>
                    <div className="prod">
                      <div className="thumb" style={{ background: TILES[p.tile].bg }}>
                        <Icon name={p.glyph} />
                      </div>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                    </div>
                  </td>
                  <td><Badge kind="neutral">{p.cat}</Badge></td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 600 }}>{KES(p.price)}</td>
                  <td className="num" style={{ textAlign: "right" }}>{p.stock}</td>
                  <td>{stockBadge(p.stock)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="iconbtn"
                      style={{ width: 32, height: 32, border: "none", background: "none" }}
                      aria-label={`Edit ${p.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm({ kind: "edit", product: p });
                      }}
                    >
                      <Icon name="ellipsis" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form.kind !== "closed" && (
        <ProductForm
          open
          mode={form.kind === "create" ? { kind: "create" } : { kind: "edit", product: form.product }}
          onClose={() => setForm({ kind: "closed" })}
        />
      )}
    </div>
  );
}
