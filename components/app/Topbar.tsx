"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { Btn } from "./primitives";
import type { SessionContext } from "@/lib/data/session";

function greetingForHour(h: number): string {
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function titleFor(
  pathname: string,
  ctx: SessionContext | null,
): { t: string; s: string } {
  const greeting = greetingForHour(new Date().getHours());
  const today = formatToday(new Date());
  const storeLine = ctx?.store
    ? `${ctx.store.name}${ctx.store.area ? `, ${ctx.store.area}` : ""}`
    : "Your shop";

  // Dynamic routes — keyed by prefix instead of exact match.
  if (pathname.startsWith("/customers/")) {
    return { t: "Customer profile", s: "360° view of activity, spend and history" };
  }
  if (pathname === "/inventory/receive") {
    return { t: "Receive stock", s: "Log a delivery and top up inventory" };
  }
  if (pathname.startsWith("/inventory/receipts/")) {
    return { t: "Stock receipt", s: "Goods received note details" };
  }
  if (pathname === "/inventory/receipts") {
    return { t: "Stock receipts", s: "Every delivery you've logged" };
  }

  switch (pathname) {
    case "/dashboard":
      return {
        t: `${greeting}, ${ctx?.user.firstName ?? "there"}`,
        s: `${today} · ${storeLine}`,
      };
    case "/pos":
      return {
        t: "Point of sale",
        s: `Register 1 · ${ctx?.user.fullName ?? "Cashier"}`,
      };
    case "/inventory":
      return { t: "Inventory", s: "Manage products & stock levels" };
    case "/customers":
      return { t: "Customers", s: "Your customer book & marketing" };
    case "/suppliers":
      return { t: "Suppliers", s: "Your delivery book — who brings what" };
    case "/reports":
      return { t: "Reports", s: "Sales trends, profit margins and store performance" };
    case "/storefront":
      return { t: "Online storefront", s: "Publish your catalogue" };
    case "/staff":
      return { t: "Staff & permissions", s: "Add cashiers and managers" };
    case "/settings":
      return { t: "Settings", s: "Business profile, payments, receipts and integrations" };
    default:
      return { t: storeLine, s: "" };
  }
}

export function Topbar({ ctx }: { ctx: SessionContext | null }) {
  const pathname = usePathname() ?? "/dashboard";
  const router = useRouter();
  const meta = titleFor(pathname, ctx);
  const isPos = pathname === "/pos";

  return (
    <header className="topbar">
      <div>
        <h1>{meta.t}</h1>
        <div className="sub">{meta.s}</div>
      </div>
      <div className="spacer" />
      {!isPos && (
        <div className="topsearch">
          <Icon name="search" size={16} />
          <input placeholder="Search anything…" />
        </div>
      )}
      <button className="iconbtn" aria-label="Notifications">
        <Icon name="bell" size={18} />
        <span className="dot" />
      </button>
      {!isPos && (
        <Btn variant="primary" icon="plus" onClick={() => router.push("/pos")}>
          New sale
        </Btn>
      )}
      <Link
        href="/settings"
        className="avatar"
        title={ctx?.user.fullName ?? "Account"}
      >
        {ctx?.user.initials ?? "?"}
      </Link>
    </header>
  );
}
