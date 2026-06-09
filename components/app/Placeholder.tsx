import { Icon } from "./Icon";

const MAP: Record<string, [string, string, string]> = {
  reports: ["bar-chart-3", "Reports & analytics", "Sales trends, profit margins and store performance live here."],
  storefront: ["store", "Online storefront", "Publish your catalogue as a website customers can order from."],
  staff: ["user-round", "Staff & permissions", "Add cashiers and managers, set roles and track shifts."],
  settings: ["settings", "Settings", "Business profile, payments, receipts and integrations."],
};

export function Placeholder({ id }: { id: keyof typeof MAP | string }) {
  const [icon, title, desc] = MAP[id] ?? ["box", "Coming soon", ""];
  return (
    <div className="page-w" style={{ display: "grid", placeItems: "center", minHeight: 420 }}>
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "var(--r-xl)",
            background: "var(--rose-50)",
            color: "var(--rose-600)",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 18px",
          }}
        >
          <Icon name={icon} size={30} />
        </div>
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: 22,
            margin: "0 0 8px",
            letterSpacing: "-.4px",
            color: "var(--fg1)",
          }}
        >
          {title}
        </h2>
        <p style={{ color: "var(--fg2)", fontSize: 15, margin: 0, lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}
