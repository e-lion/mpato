"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { Avatar, Badge, Btn } from "./primitives";
import { CustomerForm } from "./CustomerForm";
import { KES } from "@/lib/format";
import type { Customer } from "@/lib/data/types";

function tagKind(t: Customer["tag"]): "info" | "warning" | "success" {
  if (t === "VIP") return "info";
  if (t === "Lapsing") return "warning";
  return "success";
}

type FormState = { kind: "closed" } | { kind: "create" } | { kind: "edit"; customer: Customer };

export function Customers({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState<FormState>({ kind: "closed" });

  const lapsing = customers.filter((c) => c.tag === "Lapsing").length;
  const total = customers.length;
  const totalSpend = customers.reduce((s, c) => s + c.spent, 0);
  const totalVisits = customers.reduce((s, c) => s + c.visits, 0);
  const avgBasket = totalVisits > 0 ? Math.round(totalSpend / totalVisits) : 0;
  const repeatRate = total > 0
    ? Math.round((customers.filter((c) => c.visits >= 2).length / total) * 100)
    : 0;

  return (
    <div className="page-w" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {lapsing > 0 && (
        <div className="nudge">
          <div className="ic"><Icon name="sparkles" size={19} /></div>
          <div className="tx">
            <div className="tt">
              {sent
                ? `Sent to ${lapsing} lapsing customer${lapsing > 1 ? "s" : ""}`
                : `Mpato drafted an SMS offer for ${lapsing} lapsing customer${lapsing > 1 ? "s" : ""}`}
            </div>
            <div className="ds">
              {sent
                ? "You’ll see replies in the inbox. Nice work."
                : "“Karibu tena! Enjoy 10% off your next shop this week.”"}
            </div>
          </div>
          {!sent ? (
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="ghost">Edit</Btn>
              <Btn variant="primary" icon="send" onClick={() => setSent(true)}>
                Review &amp; send
              </Btn>
            </div>
          ) : (
            <Badge kind="success" dot>Sent</Badge>
          )}
        </div>
      )}

      <div className="kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="kpi"><div className="lab">Total customers</div><div className="val num">{total}</div></div>
        <div className="kpi"><div className="lab">Repeat rate</div><div className="val num">{repeatRate}%</div></div>
        <div className="kpi"><div className="lab">Avg. basket</div><div className="val num">{KES(avgBasket)}</div></div>
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div
          className="section-h"
          style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", marginBottom: 0 }}
        >
          <h2>Customers</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn variant="secondary" icon="download">Export</Btn>
            <Btn variant="primary" icon="user-plus" onClick={() => setForm({ kind: "create" })}>
              Add customer
            </Btn>
          </div>
        </div>
        {customers.length === 0 ? (
          <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--fg3)" }}>
            No customers yet — click &quot;Add customer&quot; to build your book.
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th style={{ textAlign: "right" }}>Total spent</th>
                <th className="num" style={{ textAlign: "right" }}>Visits</th>
                <th>Last seen</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/customers/${c.id}`)}
                >
                  <td>
                    <div className="prod">
                      <Avatar name={c.name} color={c.color} />
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                    </div>
                  </td>
                  <td className="mono" style={{ color: "var(--fg2)" }}>{c.phone ?? "—"}</td>
                  <td className="num" style={{ textAlign: "right", fontWeight: 700 }}>{KES(c.spent)}</td>
                  <td className="num" style={{ textAlign: "right" }}>{c.visits}</td>
                  <td style={{ color: "var(--fg3)" }}>{c.last}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <Badge kind={tagKind(c.tag)} dot>{c.tag}</Badge>
                      <button
                        className="iconbtn"
                        style={{ width: 28, height: 28, border: "none", background: "none" }}
                        aria-label={`Edit ${c.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm({ kind: "edit", customer: c });
                        }}
                      >
                        <Icon name="pencil" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form.kind !== "closed" && (
        <CustomerForm
          open
          mode={form.kind === "create" ? { kind: "create" } : { kind: "edit", customer: form.customer }}
          onClose={() => setForm({ kind: "closed" })}
        />
      )}
    </div>
  );
}
