import type { StaffRole } from "@/lib/data/queries";

type BadgeKind = "info" | "neutral";

export const ROLE_META: Record<
  StaffRole,
  { label: string; blurb: string; badge: BadgeKind; icon: string }
> = {
  manager: {
    label: "Manager",
    blurb: "Runs the shop day-to-day — sells, manages inventory, suppliers and customers, and views reports.",
    badge: "info",
    icon: "users",
  },
  cashier: {
    label: "Cashier",
    blurb: "Rings up sales at the point of sale and looks after customers.",
    badge: "neutral",
    icon: "shopping-cart",
  },
};
