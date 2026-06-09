import { Icon } from "../app/Icon";

type TintKey = "jade" | "apricot" | "peri" | "lilac";

const TINT: Record<TintKey, [string, string]> = {
  jade: ["var(--rose-50)", "var(--rose-700)"],
  apricot: ["var(--apricot-50)", "var(--apricot-600)"],
  peri: ["var(--peri-50)", "var(--peri-600)"],
  lilac: ["var(--lilac-100)", "var(--lilac-500)"],
};

const FEATURES: [string, TintKey, string, string][] = [
  ["shopping-cart", "jade", "Fast point of sale", "Ring up sales in seconds on any phone, tablet or till. Accept M-PESA and cash, split payments, print or SMS receipts."],
  ["package", "apricot", "Live inventory", "Stock updates with every sale. Get low-stock alerts before you run out and track value across all your stores."],
  ["users", "peri", "Know your customers", "A customer book that fills itself. See who buys what, who’s slipping away, and who your best regulars are."],
  ["sparkles", "lilac", "AI marketing", "Mpato drafts SMS offers for lapsing customers and suggests what to promote — you just review and send."],
  ["store", "jade", "Online storefront", "Turn your catalogue into a shareable shop link. Customers browse and order; you fulfil from the same dashboard."],
  ["bar-chart-3", "apricot", "Reports that make sense", "Daily takings, best sellers, profit margins and staff performance — in plain numbers, no spreadsheets."],
];

export function Features() {
  return (
    <section className="section" id="features">
      <div className="wrap">
        <div className="sec-head">
          <div className="ov">Everything in one app</div>
          <h2>Built for how Kenyan shops really work</h2>
          <p>From the duka on the corner to a chain of mini-marts — Mpato handles the day-to-day so you can grow.</p>
        </div>
        <div className="features">
          {FEATURES.map(([ic, t, h, p], i) => (
            <div className="feat" key={i}>
              <div className="ic" style={{ background: TINT[t][0], color: TINT[t][1] }}>
                <Icon name={ic} />
              </div>
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
