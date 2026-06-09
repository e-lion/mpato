import Link from "next/link";
import { Icon } from "../app/Icon";

type Plan = [
  name: string,
  amt: string,
  per: string,
  desc: string,
  feats: string[],
  btnVariant: "btn-ghost" | "btn-primary",
  popular: boolean,
];

const PLANS: Plan[] = [
  ["Duka", "KES 0", "/month", "For a single till getting started.",
    ["1 store, 1 user", "Unlimited sales & receipts", "M-PESA + cash", "Basic reports"], "btn-ghost", false],
  ["Biashara", "KES 1,500", "/month", "For a growing shop with staff.",
    ["Up to 3 stores", "Unlimited staff & roles", "Full inventory & alerts", "Customer book + reports", "Online storefront"], "btn-primary", true],
  ["Mtaa", "KES 4,500", "/month", "For multi-branch businesses.",
    ["Unlimited stores", "AI marketing & nurturing", "Advanced analytics", "API & integrations", "Priority support"], "btn-ghost", false],
];

export function Pricing() {
  return (
    <section className="section" id="pricing">
      <div className="wrap">
        <div className="sec-head">
          <div className="ov">Pricing</div>
          <h2>Simple plans that grow with you</h2>
          <p>Start free forever. Upgrade only when your business does. No setup fees, cancel anytime.</p>
        </div>
        <div className="plans">
          {PLANS.map(([n, amt, per, d, feats, btn, pop], i) => (
            <div className={"plan" + (pop ? " feat-plan" : "")} key={i}>
              {pop && <span className="pop">Most popular</span>}
              <div className="pn">{n}</div>
              <div className="pp">
                <span className="amt num">{amt}</span> <span className="per">{per}</span>
              </div>
              <div className="pd">{d}</div>
              <ul>
                {feats.map((f, j) => (
                  <li key={j}><Icon name="check" />{f}</li>
                ))}
              </ul>
              <Link className={"btn " + btn} href="/signup" style={{ width: "100%" }}>
                {i === 0 ? "Start free" : "Choose " + n}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
