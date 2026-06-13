"use client";
import { useState } from "react";
import { Icon } from "./Icon";
import { Avatar, Badge, Btn } from "./primitives";
import { StaffForm } from "./StaffForm";
import { ROLE_META } from "./roleMeta";
import type { Staff as StaffMember } from "@/lib/data/queries";

type FormState =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; staff: StaffMember };

// Stay in the brand's warm palette while giving each avatar its own hue.
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

export function Staff({ staff }: { staff: StaffMember[] }) {
  const [form, setForm] = useState<FormState>({ kind: "closed" });
  const [q, setQ] = useState("");

  const managers = staff.filter((s) => s.role === "manager").length;
  const cashiers = staff.filter((s) => s.role === "cashier").length;
  const pending = staff.filter((s) => !s.active).length;
  const joinUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/join`;

  const filtered = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      (s.phone ?? "").toLowerCase().includes(q.toLowerCase()) ||
      (s.email ?? "").toLowerCase().includes(q.toLowerCase()) ||
      ROLE_META[s.role].label.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="page-w" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
        <div className="kpi">
          <div className="lab">Total staff</div>
          <div className="val num">{staff.length}</div>
        </div>
        <div className="kpi">
          <div className="lab">Managers</div>
          <div className="val num">{managers}</div>
        </div>
        <div className="kpi">
          <div className="lab">Cashiers</div>
          <div className="val num">{cashiers}</div>
        </div>
      </div>

      {pending > 0 && (
        <div
          className="card"
          style={{
            padding: "12px 16px",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            background: "var(--rose-50)",
            border: "1px solid var(--rose-100, var(--border))",
          }}
        >
          <span style={{ color: "var(--rose-600)", marginTop: 1 }}>
            <Icon name="send" size={16} />
          </span>
          <p style={{ margin: 0, fontSize: 13, color: "var(--fg2)", lineHeight: 1.5 }}>
            {pending === 1 ? "1 person hasn't" : `${pending} people haven't`} joined yet. Ask
            them to open <strong>{joinUrl}</strong> and sign up with the exact email you entered —
            they&apos;ll get access automatically.
          </p>
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <div
          className="section-h"
          style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", marginBottom: 0 }}
        >
          <div className="topsearch" style={{ width: 280, height: 38 }}>
            <Icon name="search" size={16} />
            <input
              placeholder="Search staff…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Btn variant="primary" icon="user-plus" onClick={() => setForm({ kind: "create" })}>
            Add staff
          </Btn>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--fg3)" }}>
            {staff.length === 0
              ? 'No staff yet — click "Add staff" to add your cashiers and managers.'
              : "No staff match your search."}
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Phone</th>
                <th>Email</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const meta = ROLE_META[s.role];
                return (
                  <tr
                    key={s.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => setForm({ kind: "edit", staff: s })}
                  >
                    <td>
                      <div className="prod">
                        <Avatar name={s.name} color={accentFor(s.name)} />
                        <span style={{ fontWeight: 600 }}>{s.name}</span>
                      </div>
                    </td>
                    <td>
                      <Badge kind={meta.badge} dot>
                        {meta.label}
                      </Badge>
                    </td>
                    <td>
                      {s.active ? (
                        <Badge kind="success" dot>
                          Active
                        </Badge>
                      ) : (
                        <Badge kind="warning" dot>
                          Invite pending
                        </Badge>
                      )}
                    </td>
                    <td className="mono" style={{ color: "var(--fg2)" }}>{s.phone ?? "—"}</td>
                    <td style={{ color: "var(--fg2)" }}>{s.email ?? "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="iconbtn"
                        style={{ width: 28, height: 28, border: "none", background: "none" }}
                        aria-label={`Edit ${s.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm({ kind: "edit", staff: s });
                        }}
                      >
                        <Icon name="pencil" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card" style={{ padding: "16px 18px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--fg1)", marginBottom: 10 }}>
          What each role can do
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(["manager", "cashier"] as const).map((role) => {
            const meta = ROLE_META[role];
            return (
              <div key={role} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ marginTop: 1 }}>
                  <Badge kind={meta.badge} dot>
                    {meta.label}
                  </Badge>
                </span>
                <p style={{ margin: 0, fontSize: 13, color: "var(--fg2)", lineHeight: 1.5 }}>
                  {meta.blurb}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {form.kind !== "closed" && (
        <StaffForm
          open
          mode={form.kind === "create" ? { kind: "create" } : { kind: "edit", staff: form.staff }}
          onClose={() => setForm({ kind: "closed" })}
        />
      )}
    </div>
  );
}
