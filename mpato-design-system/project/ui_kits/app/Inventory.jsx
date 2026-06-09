/* Mpato app — Inventory view */

function stockBadge(stock) {
  if (stock === 0) return <Badge kind="danger" dot>Out of stock</Badge>;
  if (stock <= 6) return <Badge kind="warning" dot>Low stock</Badge>;
  return <Badge kind="success" dot>In stock</Badge>;
}

function Inventory() {
  const [q, setQ] = React.useState('');
  const list = PRODUCTS.filter(p => p.name.toLowerCase().includes(q.toLowerCase()));
  const totalValue = PRODUCTS.reduce((s, p) => s + p.price * p.stock, 0);

  return (
    <div className="page-w" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="kpi"><div className="lab">Products</div><div className="val num">{PRODUCTS.length}</div></div>
        <div className="kpi"><div className="lab">Stock value</div><div className="val num">{KES(totalValue)}</div></div>
        <div className="kpi"><div className="lab">Need restock</div><div className="val num" style={{ color: 'var(--warning-fg)' }}>3</div></div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="section-h" style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
          <div className="topsearch" style={{ width: 280, height: 38 }}>
            <Icon name="search" size={16} />
            <input placeholder="Search inventory…" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="secondary" icon="filter">Filter</Btn>
            <Btn variant="primary" icon="plus">Add product</Btn>
          </div>
        </div>
        <table className="tbl">
          <thead><tr><th>Product</th><th>Category</th><th style={{ textAlign: 'right' }}>Price</th><th style={{ textAlign: 'right' }}>Stock</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {list.map(p => (
              <tr key={p.id}>
                <td><div className="prod"><div className="thumb" style={{ background: TILES[p.tile].bg }}><Icon name={p.glyph} /></div><span style={{ fontWeight: 600 }}>{p.name}</span></div></td>
                <td><Badge kind="neutral">{p.cat}</Badge></td>
                <td className="num" style={{ textAlign: 'right', fontWeight: 600 }}>{KES(p.price)}</td>
                <td className="num" style={{ textAlign: 'right' }}>{p.stock}</td>
                <td>{stockBadge(p.stock)}</td>
                <td style={{ textAlign: 'right' }}><button className="iconbtn" style={{ width: 32, height: 32, border: 'none', background: 'none' }}><Icon name="ellipsis" size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

window.Inventory = Inventory;
