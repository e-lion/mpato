import { Icon } from "../app/Icon";

export function POSHighlight() {
  const items = [
    "Send an M-PESA STK push straight from the cart",
    "Record cash and give change with a tap",
    "Auto-generated receipts by SMS or print",
    "Works offline — syncs when you’re back online",
  ];
  return (
    <section className="section alt" id="pos">
      <div className="wrap split">
        <div>
          <div
            className="ov"
            style={{ color: "var(--rose-600)", fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}
          >
            Point of sale
          </div>
          <h2>M-PESA and cash, settled in one tap</h2>
          <p className="lead">
            Start an STK push, confirm payment, and the sale, stock and receipt are all updated together.
            No reconciling at the end of the day.
          </p>
          <ul className="checklist">
            {items.map((t, i) => (
              <li key={i}>
                <span className="ck"><Icon name="check" /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="pay-visual">
          <div className="receipt">
            <div className="rh">
              <img src="/logomark.svg" alt="" />
              <div>
                <div style={{ fontWeight: 700, fontFamily: "var(--font-display)" }}>Soko Mini-Mart</div>
                <div style={{ fontSize: 12, color: "var(--fg3)" }}>Westlands · #INV-2043</div>
              </div>
            </div>
            <div className="ri"><span>Maziwa Fresh 500ml ×2</span><span className="num">120</span></div>
            <div className="ri"><span>Unga Pembe 2kg</span><span className="num">175</span></div>
            <div className="ri"><span>Soda 500ml ×3</span><span className="num">210</span></div>
            <div className="rt"><span>Total</span><span className="num">KES 505</span></div>
            <div className="paid">
              <Icon name="smartphone" />Paid via M-PESA · QGH7X2P1LM
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
