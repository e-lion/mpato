"use client";
import { useState, useTransition } from "react";
import { Btn } from "./primitives";
import { Modal } from "./Modal";
import { ROLE_META } from "./roleMeta";
import {
  createStaff,
  deleteStaff,
  updateStaff,
  type StaffInput,
} from "@/app/actions/staff";
import type { Staff, StaffRole } from "@/lib/data/queries";

type Mode = { kind: "create" } | { kind: "edit"; staff: Staff };

const ROLES: StaffRole[] = ["cashier", "manager"];

export function StaffForm({
  mode,
  open,
  onClose,
}: {
  mode: Mode;
  open: boolean;
  onClose: () => void;
}) {
  const initial: StaffInput =
    mode.kind === "edit"
      ? {
          name: mode.staff.name,
          role: mode.staff.role,
          phone: mode.staff.phone ?? "",
          email: mode.staff.email ?? "",
          notes: mode.staff.notes ?? "",
        }
      : { name: "", role: "cashier", phone: "", email: "", notes: "" };

  const [form, setForm] = useState<StaffInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode.kind === "edit"
          ? await updateStaff(mode.staff.id, form)
          : await createStaff(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  function onDelete() {
    if (mode.kind !== "edit") return;
    const msg = mode.staff.active
      ? `Remove "${mode.staff.name}"? They'll lose access to your shop immediately.`
      : `Remove "${mode.staff.name}" from your staff list?`;
    if (!confirm(msg)) return;
    startDelete(async () => {
      const result = await deleteStaff(mode.staff.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode.kind === "edit" ? "Edit staff member" : "Add staff member"}
      description={
        mode.kind === "edit"
          ? "Update this person's details and role."
          : "Add a cashier or manager to your team."
      }
    >
      {error && <div className="m-error">{error}</div>}
      <form onSubmit={onSubmit} className="m-grid">
        <div className="m-field">
          <label htmlFor="st-name">Full name</label>
          <input
            id="st-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Mary Wanjiru"
            required
            autoFocus
          />
        </div>
        <div className="m-field">
          <label htmlFor="st-role">Role</label>
          <select
            id="st-role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r].label}
              </option>
            ))}
          </select>
          <p
            style={{
              margin: "6px 2px 0",
              fontSize: 12.5,
              color: "var(--fg3)",
              lineHeight: 1.45,
            }}
          >
            {ROLE_META[form.role].blurb}
          </p>
        </div>
        <div className="m-field">
          <label htmlFor="st-phone">Phone</label>
          <input
            id="st-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0712 345 678"
          />
        </div>
        <div className="m-field">
          <label htmlFor="st-email">Login email</label>
          <input
            id="st-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="mary@example.com"
            required
            disabled={mode.kind === "edit" && mode.staff.active}
          />
          <p
            style={{
              margin: "6px 2px 0",
              fontSize: 12.5,
              color: "var(--fg3)",
              lineHeight: 1.45,
            }}
          >
            {mode.kind === "edit" && mode.staff.active
              ? "This person has signed in — their login email can't be changed here."
              : "They sign in with this email to get access. It must match the email they use to join."}
          </p>
        </div>
        <div className="m-field">
          <label htmlFor="st-notes">Notes</label>
          <textarea
            id="st-notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Shift days, ID number, next of kin…"
            rows={3}
            style={{ resize: "vertical", minHeight: 70 }}
          />
        </div>
        <div className="m-foot">
          {mode.kind === "edit" && (
            <Btn
              variant="ghost"
              type="button"
              icon="trash"
              onClick={onDelete}
              disabled={isPending || isDeleting}
              style={{ marginRight: "auto", color: "var(--danger-fg)" }}
            >
              {isDeleting ? "Removing…" : "Remove"}
            </Btn>
          )}
          <Btn variant="secondary" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Btn>
          <Btn variant="primary" type="submit" disabled={isPending}>
            {isPending ? "Saving…" : mode.kind === "edit" ? "Save changes" : "Add staff member"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
