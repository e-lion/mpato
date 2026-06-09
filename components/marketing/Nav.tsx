import Link from "next/link";

export function Nav() {
  return (
    <nav className="nav">
      <div className="wrap nav-in">
        <Link className="brand" href="/">
          <img src="/logomark.svg" alt="" />
          <span className="wm">Mpato</span>
        </Link>
        <div className="links">
          <a href="#features">Features</a>
          <a href="#pos">Point of sale</a>
          <a href="#pricing">Pricing</a>
          <a href="#">Stories</a>
        </div>
        <div className="right">
          <Link className="linklike" href="/login">Log in</Link>
          <Link className="btn btn-primary" href="/signup">Start free</Link>
        </div>
      </div>
    </nav>
  );
}
