"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { canAccess, type Role } from "@/lib/auth/access";
import type { SessionContext } from "@/lib/data/session";

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  cashier: "Cashier",
};

export function AccountMenu({ ctx }: { ctx: SessionContext | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSigningOut, startSignOut] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

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

  const role: Role | null = ctx?.role ?? null;
  const canSettings = role ? canAccess(role, "/settings") : false;

  function onSignOut() {
    startSignOut(async () => {
      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        className="avatar"
        title={ctx?.user.fullName ?? "Account"}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {ctx?.user.initials ?? "?"}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 244,
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-lg)",
            boxShadow: "var(--shadow-md, var(--shadow-sm))",
            padding: 6,
            zIndex: 50,
          }}
        >
          <div style={{ padding: "10px 10px 12px", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "var(--fg1)", lineHeight: 1.2 }}>
              {ctx?.user.fullName ?? "Account"}
            </div>
            {ctx?.user.email && (
              <div
                style={{
                  fontSize: 12.5,
                  color: "var(--fg3)",
                  marginTop: 2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {ctx.user.email}
              </div>
            )}
            {role && (
              <div style={{ marginTop: 8 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "var(--rose-700)",
                    background: "var(--rose-50)",
                    border: "1px solid var(--rose-100, var(--border))",
                    borderRadius: "var(--r-pill)",
                    padding: "2px 9px",
                  }}
                >
                  {ROLE_LABEL[role]}
                </span>
              </div>
            )}
          </div>

          {canSettings && (
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="acct-item"
              style={menuItemStyle}
            >
              <Icon name="settings" size={16} />
              Settings
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            className="acct-item"
            onClick={onSignOut}
            disabled={isSigningOut}
            style={{ ...menuItemStyle, width: "100%", background: "none", border: "none", color: "var(--danger-fg)" }}
          >
            <Icon name="log-out" size={16} />
            {isSigningOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      )}
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "9px 10px",
  borderRadius: "var(--r-md)",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--fg1)",
  textDecoration: "none",
  cursor: "pointer",
};
