"use client";
import { useState, useTransition } from "react";
import { Btn } from "./primitives";
import { Modal } from "./Modal";
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
  type CustomerInput,
} from "@/app/actions/customers";
import type { Customer } from "@/lib/data/types";

type Mode = { kind: "create" } | { kind: "edit"; customer: Customer };

export function CustomerForm({
  mode,
  open,
  onClose,
  onDeleted,
}: {
  mode: Mode;
  open: boolean;
  onClose: () => void;
  /** Called after a successful delete (in addition to onClose). Useful for
   *  the profile page to redirect away from the now-404 route. */
  onDeleted?: () => void;
}) {
  const initial: CustomerInput = mode.kind === "edit"
    ? { name: mode.customer.name, phone: mode.customer.phone ?? "", tag: mode.customer.tag }
    : { name: "", phone: "", tag: "Regular" };

  const [form, setForm] = useState<CustomerInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = mode.kind === "edit"
        ? await updateCustomer(mode.customer.id, form)
        : await createCustomer(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  function onDelete() {
    if (mode.kind !== "edit") return;
    if (!confirm(`Delete "${mode.customer.name}"? This can't be undone.`)) return;
    startDelete(async () => {
      const result = await deleteCustomer(mode.customer.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onDeleted?.();
      onClose();
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode.kind === "edit" ? "Edit customer" : "Add customer"}
      description={mode.kind === "edit" ? "Update their details or status." : "Your customer book starts here."}
    >
      {error && <div className="m-error">{error}</div>}
      <form onSubmit={onSubmit} className="m-grid">
        <div className="m-field">
          <label htmlFor="c-name">Name</label>
          <input
            id="c-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Grace Njeri"
            required
          />
        </div>
        <div className="m-field">
          <label htmlFor="c-phone">Phone</label>
          <input
            id="c-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0712 345 678"
          />
        </div>
        <div className="m-field">
          <label htmlFor="c-tag">Status</label>
          <select
            id="c-tag"
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value as CustomerInput["tag"] })}
          >
            <option value="Regular">Regular</option>
            <option value="VIP">VIP</option>
            <option value="Lapsing">Lapsing</option>
          </select>
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
            {isPending ? "Saving…" : mode.kind === "edit" ? "Save changes" : "Add customer"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
