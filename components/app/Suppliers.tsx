"use client";
import { useState } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import { Avatar, Btn } from "./primitives";
import { SupplierForm } from "./SupplierForm";
import type { Supplier } from "@/lib/data/queries";

type FormState = { kind: "closed" } | { kind: "create" } | { kind: "edit"; supplier: Supplier };

// Stone-palette accent picker so the supplier avatars stay in the
// monochrome family but still feel distinct.
const ACCENT_COLORS = [
  "var(--rose-500)",
  "var(--rose-700)",
  "var(--stone-500)",
  "var(--stone-600)",
  "var(--apricot-500)",
];
function accentFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return ACCENT_COLORS[Math.abs(h) % ACCENT_COLORS.length];
}

export function Suppliers({ suppliers }: { suppliers: Supplier[] }) {
  const [form, setForm] = useState<FormState>({ kind: "closed" });
  const [q, setQ] = useState("");

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      (s.phone ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (s.contact ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="page-w" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
        <div className="kpi">
          <div className="lab">Total suppliers</div>
          <div className="val num">{suppliers.length}</div>
        </div>
        <div className="kpi">
          <div className="lab">Quick action</div>
          <div style={{ marginTop: 8 }}>
            <Link
              href="/inventory/receive"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "var(--rose-700)",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              <Icon name="package" size={16} /> Receive new delivery →
            </Link>
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
              placeholder="Search suppliers…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Btn variant="primary" icon="plus" onClick={() => setForm({ kind: "create" })}>
            Add supplier
          </Btn>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--fg3)" }}>
            {suppliers.length === 0
              ? 'No suppliers yet — click "Add supplier" to start your delivery book.'
              : "No suppliers match your search."}
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact person</th>
                <th>Phone</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => setForm({ kind: "edit", supplier: s })}
                >
                  <td>
                    <div className="prod">
                      <Avatar name={s.name} color={accentFor(s.name)} />
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--fg2)" }}>{s.contact ?? "—"}</td>
                  <td className="mono" style={{ color: "var(--fg2)" }}>{s.phone ?? "—"}</td>
                  <td
                    style={{
                      color: "var(--fg3)",
                      fontSize: 13,
                      maxWidth: 320,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.notes ?? "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="iconbtn"
                      style={{ width: 28, height: 28, border: "none", background: "none" }}
                      aria-label={`Edit ${s.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm({ kind: "edit", supplier: s });
                      }}
                    >
                      <Icon name="pencil" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form.kind !== "closed" && (
        <SupplierForm
          open
          mode={form.kind === "create" ? { kind: "create" } : { kind: "edit", supplier: form.supplier }}
          onClose={() => setForm({ kind: "closed" })}
        />
      )}
    </div>
  );
}
