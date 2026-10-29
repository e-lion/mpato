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
    <div ref={wrapRef} className="menu-wrap">
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
        <div role="menu" className="menu menu-account">
          <div className="menu-head">
            <div className="menu-av">{ctx?.user.initials ?? "?"}</div>
            <div className="menu-id">
              <div className="menu-nm">{ctx?.user.fullName ?? "Account"}</div>
              {ctx?.user.email && <div className="menu-sub">{ctx.user.email}</div>}
              {role && <span className="menu-role">{ROLE_LABEL[role]}</span>}
            </div>
          </div>

          <div className="menu-list">
            {canSettings && (
              <Link
                href="/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="menu-item"
              >
                <Icon name="settings" size={17} />
                Settings
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              className="menu-item danger"
              onClick={onSignOut}
              disabled={isSigningOut}
            >
              <Icon name="log-out" size={17} />
              {isSigningOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
