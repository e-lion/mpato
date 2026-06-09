export function Footer() {
  const cols: [string, string[]][] = [
    ["Product", ["Point of sale", "Inventory", "Customers", "Storefront", "Reports"]],
    ["Company", ["About", "Stories", "Careers", "Contact"]],
    ["Support", ["Help centre", "WhatsApp us", "Status", "Terms"]],
  ];
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <div className="brand">
              <img src="/logomark.svg" alt="" />
              <span className="wm">Mpato</span>
            </div>
            <p style={{ fontSize: 14, color: "var(--fg2)", maxWidth: 280, marginTop: 14, lineHeight: 1.6 }}>
              Business management & POS for Kenyan merchants. Every shilling counted.
            </p>
          </div>
          {cols.map(([h, links], i) => (
            <div className="foot-col" key={i}>
              <h4>{h}</h4>
              {links.map((l, j) => (
                <a href="#" key={j}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        <div className="foot-bottom">
          <span>© 2026 Mpato Technologies Ltd · Nairobi, Kenya</span>
          <span>Made in Nairobi for biashara everywhere</span>
        </div>
      </div>
    </footer>
  );
}
