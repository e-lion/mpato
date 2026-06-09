/* Mpato app — Dashboard view */

function KpiTile({ icon, tint, lab, val, delta, up }) {
  return (
    <div className="kpi">
      <div className="ic" style={{ background: tint.bg, color: tint.fg }}><Icon name={icon} /></div>
      <div className="lab">{lab}</div>
      <div className="val num">{val}</div>
      <div className={'delta ' + (up ? 'up' : 'down')}>
        <Icon name={up ? 'arrow-up-right' : 'arrow-down-right'} />{delta}
      </div>
    </div>
  );
}

function WeekChart() {
  const max = Math.max(...WEEK.map(w => w.mpesa + w.cash));
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="section-h">
        <h2>Sales this week</h2>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, fontWeight: 600, color: 'var(--fg2)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--mpesa)' }}></span>M-PESA</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--stone-300)' }}></span>Cash</span>
        </div>
      </div>
      <div className="bars">
        {WEEK.map(w => (
          <div className="bar-col" key={w.d}>
            <div className="bar-stack" style={{ height: ((w.mpesa + w.cash) / max * 100) + '%' }}>
              <div className="bar-seg" style={{ height: (w.cash / (w.mpesa + w.cash) * 100) + '%', background: 'var(--stone-300)' }}></div>
              <div className="bar-seg" style={{ height: (w.mpesa / (w.mpesa + w.cash) * 100) + '%', background: 'var(--mpesa)' }}></div>
            </div>
            <div className="bar-x">{w.d}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentSplit() {
  const mpesa = 64, cash = 36;
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="section-h"><h2>Payment mix</h2></div>
      <div style={{ display: 'flex', height: 14, borderRadius: 'var(--r-pill)', overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ width: mpesa + '%', background: 'var(--mpesa)' }}></div>
        <div style={{ width: cash + '%', background: 'var(--stone-300)' }}></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="kpi-mini" style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: 'var(--mpesa-bg)', color: '#0C744F', display: 'grid', placeItems: 'center' }}><Icon name="smartphone" size={18} /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>M-PESA</div><div style={{ fontSize: 12, color: 'var(--fg3)' }}>100 orders today</div></div>
          <div className="num" style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: 18 }}>{KES(53890)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 'var(--r-md)', background: 'var(--cash-bg)', color: 'var(--fg2)', display: 'grid', placeItems: 'center' }}><Icon name="banknote" size={18} /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 14 }}>Cash</div><div style={{ fontSize: 12, color: 'var(--fg3)' }}>56 orders today</div></div>
          <div className="num" style={{ fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: 18 }}>{KES(30310)}</div>
        </div>
      </div>
    </div>
  );
}

function TopProducts() {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className="section-h"><h2>Top products</h2><span className="btn btn-ghost" style={{ height: 30, fontSize: 13, padding: '0 10px' }}>This week</span></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {TOP_PRODUCTS.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="thumb" style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', color: '#fff', background: TILES[p.tile].bg }}><Icon name={p.glyph} size={17} /></div>
            <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div><div style={{ fontSize: 12, color: 'var(--fg3)' }}>{p.sold} sold</div></div>
            <div className="num" style={{ fontWeight: 700, fontSize: 14 }}>{KES(p.revenue)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentSales() {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div className="section-h" style={{ padding: '18px 20px 4px' }}><h2>Recent sales</h2></div>
      <table className="tbl">
        <thead><tr><th>Receipt</th><th>Items</th><th>Method</th><th>Cashier</th><th>When</th><th style={{ textAlign: 'right' }}>Total</th></tr></thead>
        <tbody>
          {RECENT_SALES.map(s => (
            <tr key={s.id}>
              <td className="mono" style={{ fontWeight: 500 }}>#{s.id}</td>
              <td className="num">{s.items}</td>
              <td>{s.method === 'mpesa' ? <Badge kind="mpesa"><Icon name="smartphone" size={12} />M-PESA</Badge> : <Badge kind="cash"><Icon name="banknote" size={12} />Cash</Badge>}</td>
              <td>{s.cashier}</td>
              <td style={{ color: 'var(--fg3)' }}>{s.time}</td>
              <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{KES(s.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="page-w" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="kpis">
        <KpiTile icon="trending-up" tint={{ bg: 'var(--rose-50)', fg: 'var(--rose-700)' }} lab="Sales today" val={KES(84200)} delta="12.4% vs yest." up />
        <KpiTile icon="receipt" tint={{ bg: 'var(--peri-50)', fg: 'var(--peri-600)' }} lab="Orders" val="156" delta="8 more" up />
        <KpiTile icon="users" tint={{ bg: 'var(--lilac-100)', fg: 'var(--lilac-500)' }} lab="New customers" val="14" delta="3 more" up />
        <KpiTile icon="package" tint={{ bg: 'var(--apricot-50)', fg: 'var(--apricot-600)' }} lab="Low stock" val="7" delta="Restock soon" up={false} />
      </div>
      <div className="grid-2">
        <WeekChart />
        <PaymentSplit />
      </div>
      <div className="grid-2">
        <RecentSales />
        <TopProducts />
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
