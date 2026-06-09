/* Mpato app — Customers view (CRM + AI nurture) */

function tagKind(t) {
  return t === 'VIP' ? 'info' : t === 'Lapsing' ? 'warning' : 'success';
}

function Customers() {
  const [sent, setSent] = React.useState(false);
  const lapsing = CUSTOMERS.filter(c => c.tag === 'Lapsing').length;

  return (
    <div className="page-w" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="nudge">
        <div className="ic"><Icon name="sparkles" size={19} /></div>
        <div className="tx">
          <div className="tt">{sent ? 'Sent to ' + lapsing + ' lapsing customers' : 'Mpato drafted an SMS offer for ' + lapsing + ' lapsing customers'}</div>
          <div className="ds">{sent ? 'You\u2019ll see replies in the inbox. Nice work.' : '"Karibu tena! Enjoy 10% off your next shop at Soko Mini-Mart this week."'}</div>
        </div>
        {!sent
          ? <div style={{ display: 'flex', gap: 8 }}><Btn variant="ghost">Edit</Btn><Btn variant="primary" icon="send" onClick={() => setSent(true)}>Review &amp; send</Btn></div>
          : <Badge kind="success" dot>Sent</Badge>}
      </div>

      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi"><div className="lab">Total customers</div><div className="val num">1,284</div></div>
        <div className="kpi"><div className="lab">Repeat rate</div><div className="val num">62%</div></div>
        <div className="kpi"><div className="lab">Avg. basket</div><div className="val num">{KES(540)}</div></div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="section-h" style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
          <h2>Customers</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="secondary" icon="download">Export</Btn>
            <Btn variant="primary" icon="user-plus">Add customer</Btn>
          </div>
        </div>
        <table className="tbl">
          <thead><tr><th>Customer</th><th>Phone</th><th style={{ textAlign: 'right' }}>Total spent</th><th className="num" style={{ textAlign: 'right' }}>Visits</th><th>Last seen</th><th>Status</th></tr></thead>
          <tbody>
            {CUSTOMERS.map((c, i) => (
              <tr key={i}>
                <td><div className="prod"><Avatar name={c.name} color={c.color} /><span style={{ fontWeight: 600 }}>{c.name}</span></div></td>
                <td className="mono" style={{ color: 'var(--fg2)' }}>{c.phone}</td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 700 }}>{KES(c.spent)}</td>
                <td className="num" style={{ textAlign: 'right' }}>{c.visits}</td>
                <td style={{ color: 'var(--fg3)' }}>{c.last}</td>
                <td><Badge kind={tagKind(c.tag)} dot>{c.tag}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.Customers = Customers;
