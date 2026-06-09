"use client";
import { useState, useTransition } from "react";
import { Icon } from "./Icon";
import { Btn } from "./primitives";
import { Modal } from "./Modal";
import { TILES } from "@/lib/mockData";
import { createProduct, deleteProduct, updateProduct, type ProductInput } from "@/app/actions/products";
import { CATEGORIES, type Product } from "@/lib/data/types";

const GLYPHS = [
  "package", "milk", "wheat", "cup-soda", "cookie", "candy",
  "sandwich", "leaf", "droplet", "flame", "zap", "box",
];

const TILE_OPTIONS: { key: keyof typeof TILES; label: string }[] = [
  { key: "jade", label: "Rose" },
  { key: "apricot", label: "Apricot" },
  { key: "peri", label: "Periwinkle" },
  { key: "lilac", label: "Lilac" },
];

type Mode = { kind: "create" } | { kind: "edit"; product: Product };

export function ProductForm({
  mode,
  open,
  onClose,
}: {
  mode: Mode;
  open: boolean;
  onClose: () => void;
}) {
  const initial: ProductInput = mode.kind === "edit"
    ? {
        name: mode.product.name,
        category: mode.product.cat,
        price: mode.product.price,
        stock: mode.product.stock,
        glyph: mode.product.glyph,
        tile: mode.product.tile,
      }
    : { name: "", category: "Beverages", price: 0, stock: 0, glyph: "package", tile: "apricot" };

  const [form, setForm] = useState<ProductInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = mode.kind === "edit"
        ? await updateProduct(mode.product.id, form)
        : await createProduct(form);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    });
  }

  function onDelete() {
    if (mode.kind !== "edit") return;
    if (!confirm(`Delete "${mode.product.name}"? This can't be undone.`)) return;
    startDelete(async () => {
      const result = await deleteProduct(mode.product.id);
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
      title={mode.kind === "edit" ? "Edit product" : "Add product"}
      description={mode.kind === "edit" ? "Update details, stock or pricing." : "What are you selling?"}
    >
      {error && <div className="m-error">{error}</div>}
      <form onSubmit={onSubmit} className="m-grid">
        <div className="m-field">
          <label htmlFor="p-name">Name</label>
          <input
            id="p-name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Soda 500ml"
            required
          />
        </div>
        <div className="m-grid-2">
          <div className="m-field">
            <label htmlFor="p-cat">Category</label>
            <select
              id="p-cat"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              {CATEGORIES.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="m-field">
            <label htmlFor="p-stock">Stock</label>
            <input
              id="p-stock"
              type="number"
              min={0}
              step={1}
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Math.max(0, parseInt(e.target.value || "0", 10)) })}
              required
            />
          </div>
        </div>
        <div className="m-field">
          <label htmlFor="p-price">Price (KES)</label>
          <input
            id="p-price"
            type="number"
            min={0}
            step={1}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: Math.max(0, parseFloat(e.target.value || "0")) })}
            required
          />
        </div>
        <div className="m-field">
          <label>Icon</label>
          <div className="m-glyph-grid">
            {GLYPHS.map((g) => (
              <button
                key={g}
                type="button"
                className={"m-glyph-btn" + (form.glyph === g ? " on" : "")}
                onClick={() => setForm({ ...form, glyph: g })}
                aria-label={g}
              >
                <Icon name={g} size={18} />
              </button>
            ))}
          </div>
        </div>
        <div className="m-field">
          <label>Tile color</label>
          <div className="m-tile-row">
            {TILE_OPTIONS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={"m-tile-btn" + (form.tile === t.key ? " on" : "")}
                style={{ background: TILES[t.key].bg }}
                onClick={() => setForm({ ...form, tile: t.key })}
                aria-label={t.label}
                title={t.label}
              />
            ))}
          </div>
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
            {isPending ? "Saving…" : mode.kind === "edit" ? "Save changes" : "Add product"}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}
