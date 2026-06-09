"use client";
import { useState, useTransition } from "react";
import { Btn } from "./primitives";
import { Modal } from "./Modal";
import {
  createSupplier,
  deleteSupplier,
  updateSupplier,
  type SupplierInput,
} from "@/app/actions/suppliers";
import type { Supplier } from "@/lib/data/queries";

type Mode = { kind: "create" } | { kind: "edit"; supplier: Supplier };

export function SupplierForm({
  mode,
  open,
  onClose,
}: {
  mode: Mode;
  open: boolean;
  onClose: () => void;
}) {
  const initial: SupplierInput =
    mode.kind === "edit"
      ? {
          name: mode.supplier.name,
          phone: mode.supplier.phone ?? "",
          contact: mode.supplier.contact ?? "",
          notes: mode.supplier.notes ?? "",
        }
      : { name: "", phone: "", contact: "", notes: "" };

  const [form, setForm] = useState<SupplierInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result =
        mode.kind === "edit"
          ? await updateSupplier(mode.supplier.id, form)
          : await createSupplier(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  function onDelete() {
    if (mode.kind !== "edit") return;
    if (!confirm(`Delete "${mode.supplier.name}"? Past receipts stay but lose their supplier link.`)) {
      return;
    }
    startDelete(async () => {
      const result = await deleteSupplier(mode.supplier.id);
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
      title={mode.kind === "edit" ? "Edit supplier" : "Add supplier"}
      description={
        mode.kind === "edit"
          ? "Update contact details for this supplier."
          : "Add a supplier to your delivery book."
      }
    >
      {error && <div className="m-error">{error}</div>}
      <form onSubmit={onSubmit} className="m-grid">
        <div className="m-field">
          <label htmlFor="s-name">Supplier name</label>
          <input
            id="s-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Bidco Africa"
            required
            autoFocus
          />
        </div>
        <div className="m-field">
          <label htmlFor="s-contact">Contact person</label>
          <input
            id="s-contact"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            placeholder="e.g. James Kamau"
          />
        </div>
        <div className="m-field">
          <label htmlFor="s-phone">Phone</label>
          <input
            id="s-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0712 345 678"
          />
        </div>
        <div className="m-field">
          <label htmlFor="s-notes">Notes</label>
          <textarea
            id="s-notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Payment terms, delivery days, account number…"
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
              {isDeleting ? "Deleting…" : "Delete"}
            </Btn>
          )}
          <Btn variant="secondary" type="button" onClick={onClose} disabled={isPending}>
            Cancel
          </Btn>
          <Btn variant="primary" type="submit" disabled={isPending}>
            {isPending ? "Saving…" : mode.kind === "edit" ? "Save changes" : "Add supplier"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
