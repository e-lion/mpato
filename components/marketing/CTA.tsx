import Link from "next/link";
import { Icon } from "../app/Icon";

export function CTA() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="cta-band">
          <h2>Your shop, sorted.</h2>
          <p>Join 12,400+ Kenyan merchants running smarter with Mpato.</p>
          <div className="row">
            <Link className="btn btn-white btn-lg" href="/signup">
              Start free <Icon name="arrow-right" size={18} />
            </Link>
            <a
              className="btn btn-lg"
              href="#"
              style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,.4)" }}
            >
              Talk to sales
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
