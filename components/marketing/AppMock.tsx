import { Icon } from "../app/Icon";

export function AppMock() {
  const heights = [44, 52, 48, 62, 78, 92, 64];
  return (
    <div className="mock">
      <div className="mock-bar">
        <span className="d" style={{ background: "#FF6159" }} />
        <span className="d" style={{ background: "#FFBD2E" }} />
        <span className="d" style={{ background: "#28C840" }} />
        <span style={{ marginLeft: 12, fontSize: 12, color: "var(--fg3)", fontWeight: 600 }}>
          app.mpato.co.ke
        </span>
      </div>
      <div className="mock-body">
        <div className="mock-side">
          <div className="brand" style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 4px 10px" }}>
            <img src="/logomark.svg" width={24} height={24} alt="" />
            <b style={{ fontFamily: "var(--font-display)", letterSpacing: "-.5px" }}>Mpato</b>
          </div>
          <div className="mock-nav on"><Icon name="layout-dashboard" />Dashboard</div>
          <div className="mock-nav"><Icon name="shopping-cart" />Point of sale</div>
          <div className="mock-nav"><Icon name="package" />Inventory</div>
          <div className="mock-nav"><Icon name="users" />Customers</div>
          <div className="mock-nav"><Icon name="bar-chart-3" />Reports</div>
        </div>
        <div className="mock-main">
          <div className="mock-kpis">
            <div className="mock-kpi"><div className="l">Sales today</div><div className="v num">KES 84,200</div><div className="dlt">↑ 12.4%</div></div>
            <div className="mock-kpi"><div className="l">Orders</div><div className="v num">156</div><div className="dlt">↑ 8 more</div></div>
            <div className="mock-kpi"><div className="l">M-PESA share</div><div className="v num">64%</div><div className="dlt">↑ 3%</div></div>
          </div>
          <div className="mock-chart">
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "var(--font-display)" }}>Sales this week</div>
            <div className="mock-bars">
              {heights.map((h, i) => (
                <div
                  key={i}
                  className="bc"
                  style={{ height: h + "%", background: i === 5 ? "var(--rose-500)" : "var(--rose-300)" }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
