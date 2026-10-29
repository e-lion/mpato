"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { Modal } from "./Modal";
import { Btn } from "./primitives";
import { setActiveStore, createStore } from "@/app/actions/active-store";
import type { Role } from "@/lib/auth/access";
import type { SessionContext, StoreOption } from "@/lib/data/session";

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  cashier: "Cashier",
};

function storeInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "S"
  );
}

export function StoreSwitcher({ ctx }: { ctx: SessionContext | null }) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const stores: StoreOption[] = ctx?.stores ?? [];
  const activeId = ctx?.store?.id ?? null;
  const activeName = ctx?.store?.name ?? "Your shop";
  const activeArea = ctx?.store?.area ?? "";
  const subtitle =
    activeArea || (stores.length > 1 ? `${stores.length} shops` : "1 shop");

  function switchTo(storeId: string) {
    if (storeId === activeId) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      const res = await setActiveStore(storeId);
      if (res.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createStore(name);
      if (res.ok) {
        setCreating(false);
        setName("");
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div ref={wrapRef} className="menu-wrap">
      <button
        type="button"
        className="store-switch"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
      >
        <div className="av">{storeInitials(activeName)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="nm">{activeName}</div>
          <div className="sub">{subtitle}</div>
        </div>
        <Icon name="chevrons-up-down" size={16} color="var(--fg3)" />
      </button>

      {open && (
        <div role="menu" className="menu menu-stores">
          <div className="menu-label">Your shops</div>
          <div className="menu-list">
            {stores.map((s) => {
              const active = s.id === activeId;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="menuitem"
                  className={"menu-item" + (active ? " active" : "")}
                  onClick={() => switchTo(s.id)}
                  disabled={isPending}
                >
                  <div className="av menu-store-av">{storeInitials(s.name)}</div>
                  <div className="menu-id">
                    <div className="menu-nm">{s.name}</div>
                    <div className="menu-sub">
                      {ROLE_LABEL[s.role]}
                      {s.area ? `, ${s.area}` : ""}
                    </div>
                  </div>
                  {active && <Icon name="check" size={16} color="var(--rose-700)" />}
                </button>
              );
            })}
          </div>

          <div className="menu-sep" />

          <div className="menu-list">
            <button
              type="button"
              role="menuitem"
              className="menu-item"
              onClick={() => {
                setError(null);
                setCreating(true);
                setOpen(false);
              }}
            >
              <Icon name="plus" size={17} />
              Create new shop
            </button>
          </div>
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create a new shop"
        description="Add another store location. You'll be the owner and switch to it right away."
      >
        {error && <div className="m-error">{error}</div>}
        <form onSubmit={submitCreate} className="m-grid">
          <div className="m-field">
            <label htmlFor="new-shop-name">Shop name</label>
            <input
              id="new-shop-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mama Mboga Thika"
              required
              autoFocus
            />
          </div>
          <div className="m-foot">
            <Btn variant="secondary" type="button" onClick={() => setCreating(false)} disabled={isPending}>
              Cancel
            </Btn>
            <Btn variant="primary" type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create shop"}
            </Btn>
          </div>
        </form>
      </Modal>
    </div>
  );
}
