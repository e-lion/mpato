import Link from "next/link";
import { Icon } from "../app/Icon";
import { AppMock } from "./AppMock";

export function Hero() {
  return (
    <header className="hero">
      <div className="wrap">
        <span className="eyebrow">
          <span className="tag">New</span>AI customer nurturing is here
        </span>
        <h1>
          Run your whole shop from <span className="hl">one place</span>.
        </h1>
        <p className="sub">
          Mpato gives Kenyan merchants a fast point of sale, live inventory, customer insights and
          reports — with M-PESA and cash built in from day one.
        </p>
        <div className="cta">
          <Link className="btn btn-primary btn-lg" href="/signup">
            Start free <Icon name="arrow-right" size={18} />
          </Link>
          <a className="btn btn-ghost btn-lg" href="#">
            <Icon name="play-circle" size={18} />Watch demo
          </a>
        </div>
        <div className="note">
          <Icon name="check" size={15} color="var(--rose-600)" />
          No card needed · Set up in 10 minutes · Works on any phone
        </div>
        <AppMock />
      </div>
    </header>
  );
}
