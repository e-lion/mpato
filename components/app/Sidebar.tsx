"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { StoreSwitcher } from "./StoreSwitcher";
import { canAccess, type Role } from "@/lib/auth/access";
import type { SessionContext } from "@/lib/data/session";

type NavItem = { href: string; label: string; icon: string; badge?: string };

const PRIMARY: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
  { href: "/pos", label: "Point of sale", icon: "shopping-cart" },
  { href: "/inventory", label: "Inventory", icon: "package" },
  { href: "/customers", label: "Customers", icon: "users" },
  { href: "/messages", label: "Messages", icon: "message-circle" },
];

const MANAGE: NavItem[] = [
  { href: "/reports", label: "Reports", icon: "bar-chart-3" },
  { href: "/storefront", label: "Storefront", icon: "store" },
  { href: "/suppliers", label: "Suppliers", icon: "truck" },
  { href: "/staff", label: "Staff", icon: "user-round" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar({ ctx }: { ctx: SessionContext | null }) {
  const pathname = usePathname() ?? "";

  // Track which nav item the user clicked so we can show a spinner
  // until Next.js finishes streaming the new route. (Next 15.0.3 ships
  // before useLinkStatus, so we roll our own.)
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  useEffect(() => {
    // Route has landed — clear any pending cue.
    setPendingHref(null);
  }, [pathname]);

  const Item = ({ it }: { it: NavItem }) => {
    const active = pathname.startsWith(it.href);
    const pending = pendingHref === it.href && !active;
    return (
      <Link
        href={it.href}
        className={
          "navitem" +
          (active ? " active" : "") +
          (pending ? " is-loading" : "")
        }
        aria-busy={pending || undefined}
        onClick={() => {
          if (!active) setPendingHref(it.href);
        }}
      >
        {pending ? (
          <span className="navitem-spinner" aria-hidden="true" />
        ) : (
          <Icon name={it.icon} size={18} />
        )}
        {it.label}
        {it.badge && <span className="badge-n">{it.badge}</span>}
      </Link>
    );
  };

  // Show only what this role can open. Default to "owner" while role is
  // resolving; middleware is the real gate, this just hides dead links.
  const role: Role = ctx?.role ?? "owner";
  const primary = PRIMARY.filter((it) => canAccess(role, it.href));
  const manage = MANAGE.filter((it) => canAccess(role, it.href));

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/logomark.svg" alt="Mpato" />
        <span className="wm">Mpato</span>
      </div>
      {primary.map((it) => (
        <Item key={it.href} it={it} />
      ))}
      {manage.length > 0 && <div className="navlabel">Manage</div>}
      {manage.map((it) => (
        <Item key={it.href} it={it} />
      ))}

      <div className="sidebar-foot">
        <StoreSwitcher ctx={ctx} />
      </div>
    </aside>
  );
}
