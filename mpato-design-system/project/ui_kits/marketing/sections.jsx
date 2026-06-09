/* Mpato marketing site — sections */

function Icon({ name, size = 18, color, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (el && window.lucide) { el.innerHTML = ''; const i = document.createElement('i'); i.setAttribute('data-lucide', name); el.appendChild(i); window.lucide.createIcons(); }
  });
  return <span ref={ref} className="lic" style={{ width: size, height: size, color, ...style }}></span>;
}

function Nav() {
  return (
    <nav className="nav"><div className="wrap nav-in">
      <a className="brand" href="#"><img src="../../assets/logomark.svg" alt="" /><span className="wm">Mpato</span></a>
      <div className="links">
        <a href="#features">Features</a><a href="#pos">Point of sale</a><a href="#pricing">Pricing</a><a href="#">Stories</a>
      </div>
      <div className="right">
        <a className="linklike" href="#">Log in</a>
        <a className="btn btn-primary" href="#">Start free</a>
      </div>
    </div></nav>
  );
}

function Hero() {
  return (
    <header className="hero"><div className="wrap">
      <span className="eyebrow"><span className="tag">New</span>AI customer nurturing is here</span>
      <h1>Run your whole shop from <span className="hl">one place</span>.</h1>
      <p className="sub">Mpato gives Kenyan merchants a fast point of sale, live inventory, customer insights and reports — with M-PESA and cash built in from day one.</p>
      <div className="cta">
        <a className="btn btn-primary btn-lg" href="#">Start free <Icon name="arrow-right" size={18} /></a>
        <a className="btn btn-ghost btn-lg" href="#"><Icon name="play-circle" size={18} />Watch demo</a>
      </div>
      <div className="note"><Icon name="check" size={15} color="var(--rose-600)" />No card needed · Set up in 10 minutes · Works on any phone</div>
      <AppMock />
    </div></header>
  );
}

function AppMock() {
  const heights = [44, 52, 48, 62, 78, 92, 64];
  return (
    <div className="mock">
      <div className="mock-bar">
        <span className="d" style={{ background: '#FF6159' }}></span>
        <span className="d" style={{ background: '#FFBD2E' }}></span>
        <span className="d" style={{ background: '#28C840' }}></span>
        <span style={{ marginLeft: 12, fontSize: 12, color: 'var(--fg3)', fontWeight: 600 }}>app.mpato.co.ke</span>
      </div>
      <div className="mock-body">
        <div className="mock-side">
          <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 4px 10px' }}><img src="../../assets/logomark.svg" width="24" height="24" /><b style={{ fontFamily: 'var(--font-display)', letterSpacing: '-.5px' }}>Mpato</b></div>
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
            <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>Sales this week</div>
            <div className="mock-bars">{heights.map((h, i) => <div key={i} className="bc" style={{ height: h + '%', background: i === 5 ? 'var(--rose-500)' : 'var(--rose-300)' }}></div>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Trust() {
  const stats = [['12,400+', 'Active merchants'], ['KES 3.8B', 'Processed yearly'], ['47', 'Counties'], ['4.8/5', 'Merchant rating']];
  return (
    <section className="trust"><div className="wrap trust-in">
      <span className="lbl">Trusted by shops across Kenya</span>
      {stats.map(([n, c], i) => <div className="stat" key={i}><div className="n num">{n}</div><div className="c">{c}</div></div>)}
    </div></section>
  );
}

const FEATURES = [
  ['shopping-cart', 'jade', 'Fast point of sale', 'Ring up sales in seconds on any phone, tablet or till. Accept M-PESA and cash, split payments, print or SMS receipts.'],
  ['package', 'apricot', 'Live inventory', 'Stock updates with every sale. Get low-stock alerts before you run out and track value across all your stores.'],
  ['users', 'peri', 'Know your customers', 'A customer book that fills itself. See who buys what, who\u2019s slipping away, and who your best regulars are.'],
  ['sparkles', 'lilac', 'AI marketing', 'Mpato drafts SMS offers for lapsing customers and suggests what to promote — you just review and send.'],
  ['store', 'jade', 'Online storefront', 'Turn your catalogue into a shareable shop link. Customers browse and order; you fulfil from the same dashboard.'],
  ['bar-chart-3', 'apricot', 'Reports that make sense', 'Daily takings, best sellers, profit margins and staff performance — in plain numbers, no spreadsheets.'],
];
const TINT = { jade: ['var(--rose-50)', 'var(--rose-700)'], apricot: ['var(--apricot-50)', 'var(--apricot-600)'], peri: ['var(--peri-50)', 'var(--peri-600)'], lilac: ['var(--lilac-100)', 'var(--lilac-500)'] };

function Features() {
  return (
    <section className="section" id="features"><div className="wrap">
      <div className="sec-head">
        <div className="ov">Everything in one app</div>
        <h2>Built for how Kenyan shops really work</h2>
        <p>From the duka on the corner to a chain of mini-marts — Mpato handles the day-to-day so you can grow.</p>
      </div>
      <div className="features">
        {FEATURES.map(([ic, t, h, p], i) => (
          <div className="feat" key={i}>
            <div className="ic" style={{ background: TINT[t][0], color: TINT[t][1] }}><Icon name={ic} /></div>
            <h3>{h}</h3><p>{p}</p>
          </div>
        ))}
      </div>
    </div></section>
  );
}

function POSHighlight() {
  return (
    <section className="section alt" id="pos"><div className="wrap split">
      <div>
        <div className="ov" style={{ color: 'var(--rose-600)', fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' }}>Point of sale</div>
        <h2>M-PESA and cash, settled in one tap</h2>
        <p className="lead">Start an STK push, confirm payment, and the sale, stock and receipt are all updated together. No reconciling at the end of the day.</p>
        <ul className="checklist">
          {['Send an M-PESA STK push straight from the cart', 'Record cash and give change with a tap', 'Auto-generated receipts by SMS or print', 'Works offline — syncs when you\u2019re back online'].map((t, i) => (
            <li key={i}><span className="ck"><Icon name="check" /></span>{t}</li>
          ))}
        </ul>
      </div>
      <div className="pay-visual">
        <div className="receipt">
          <div className="rh"><img src="../../assets/logomark.svg" alt="" /><div><div style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}>Soko Mini-Mart</div><div style={{ fontSize: 12, color: 'var(--fg3)' }}>Westlands · #INV-2043</div></div></div>
          <div className="ri"><span>Maziwa Fresh 500ml ×2</span><span className="num">120</span></div>
          <div className="ri"><span>Unga Pembe 2kg</span><span className="num">175</span></div>
          <div className="ri"><span>Soda 500ml ×3</span><span className="num">210</span></div>
          <div className="rt"><span>Total</span><span className="num">KES 505</span></div>
          <div className="paid"><Icon name="smartphone" />Paid via M-PESA · QGH7X2P1LM</div>
        </div>
      </div>
    </div></section>
  );
}

const PLANS = [
  ['Duka', 'KES 0', '/month', 'For a single till getting started.', ['1 store, 1 user', 'Unlimited sales & receipts', 'M-PESA + cash', 'Basic reports'], 'btn-ghost', false],
  ['Biashara', 'KES 1,500', '/month', 'For a growing shop with staff.', ['Up to 3 stores', 'Unlimited staff & roles', 'Full inventory & alerts', 'Customer book + reports', 'Online storefront'], 'btn-primary', true],
  ['Mtaa', 'KES 4,500', '/month', 'For multi-branch businesses.', ['Unlimited stores', 'AI marketing & nurturing', 'Advanced analytics', 'API & integrations', 'Priority support'], 'btn-ghost', false],
];

function Pricing() {
  return (
    <section className="section" id="pricing"><div className="wrap">
      <div className="sec-head">
        <div className="ov">Pricing</div>
        <h2>Simple plans that grow with you</h2>
        <p>Start free forever. Upgrade only when your business does. No setup fees, cancel anytime.</p>
      </div>
      <div className="plans">
        {PLANS.map(([n, amt, per, d, feats, btn, pop], i) => (
          <div className={'plan' + (pop ? ' feat-plan' : '')} key={i}>
            {pop && <span className="pop">Most popular</span>}
            <div className="pn">{n}</div>
            <div className="pp"><span className="amt num">{amt}</span> <span className="per">{per}</span></div>
            <div className="pd">{d}</div>
            <ul>{feats.map((f, j) => <li key={j}><Icon name="check" />{f}</li>)}</ul>
            <a className={'btn ' + btn} href="#" style={{ width: '100%' }}>{i === 0 ? 'Start free' : 'Choose ' + n}</a>
          </div>
        ))}
      </div>
    </div></section>
  );
}

function CTA() {
  return (
    <section className="section"><div className="wrap">
      <div className="cta-band">
        <h2>Your shop, sorted.</h2>
        <p>Join 12,400+ Kenyan merchants running smarter with Mpato.</p>
        <div className="row">
          <a className="btn btn-white btn-lg" href="#">Start free <Icon name="arrow-right" size={18} /></a>
          <a className="btn btn-lg" href="#" style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,.4)' }}>Talk to sales</a>
        </div>
      </div>
    </div></section>
  );
}

function Footer() {
  const cols = [
    ['Product', ['Point of sale', 'Inventory', 'Customers', 'Storefront', 'Reports']],
    ['Company', ['About', 'Stories', 'Careers', 'Contact']],
    ['Support', ['Help centre', 'WhatsApp us', 'Status', 'Terms']],
  ];
  return (
    <footer className="footer"><div className="wrap">
      <div className="foot-grid">
        <div>
          <div className="brand"><img src="../../assets/logomark.svg" alt="" /><span className="wm">Mpato</span></div>
          <p style={{ fontSize: 14, color: 'var(--fg2)', maxWidth: 280, marginTop: 14, lineHeight: 1.6 }}>Business management & POS for Kenyan merchants. Every shilling counted.</p>
        </div>
        {cols.map(([h, links], i) => (
          <div className="foot-col" key={i}><h4>{h}</h4>{links.map((l, j) => <a href="#" key={j}>{l}</a>)}</div>
        ))}
      </div>
      <div className="foot-bottom"><span>© 2026 Mpato Technologies Ltd · Nairobi, Kenya</span><span>Made in Nairobi for biashara everywhere</span></div>
    </div></footer>
  );
}

function Site() {
  return <React.Fragment><Nav /><Hero /><Trust /><Features /><POSHighlight /><Pricing /><CTA /><Footer /></React.Fragment>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Site />);
