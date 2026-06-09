/* Mpato app — Point of sale (interactive checkout) */

function POS() {
  const [cat, setCat] = React.useState('All');
  const [cart, setCart] = React.useState({}); // id -> qty
  const [query, setQuery] = React.useState('');
  const [done, setDone] = React.useState(null); // {method,total}

  const add = (p) => setCart(c => ({ ...c, [p.id]: (c[p.id] || 0) + 1 }));
  const bump = (id, d) => setCart(c => {
    const n = (c[id] || 0) + d;
    const next = { ...c };
    if (n <= 0) delete next[id]; else next[id] = n;
    return next;
  });

  const list = PRODUCTS.filter(p =>
    (cat === 'All' || p.cat === cat) &&
    (query === '' || p.name.toLowerCase().includes(query.toLowerCase()))
  );
  const lines = Object.entries(cart).map(([id, q]) => ({ p: PRODUCTS.find(x => x.id == id), q }));
  const subtotal = lines.reduce((s, l) => s + l.p.price * l.q, 0);
  const count = lines.reduce((s, l) => s + l.q, 0);

  const pay = (method) => { setDone({ method, total: subtotal }); };
  const reset = () => { setDone(null); setCart({}); };

  return (
    <div className="pos">
      {/* catalogue */}
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="topsearch" style={{ width: '100%', marginBottom: 14 }}>
          <Icon name="search" size={16} />
          <input placeholder="Search products or scan barcode…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="pos-cats">
          {CATEGORIES.map(c => (
            <button key={c} className={'cat' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>{c}</button>
          ))}
        </div>
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4 }}>
          <div className="pos-grid">
            {list.map(p => (
              <button className="pcard" key={p.id} onClick={() => add(p)}>
                <div className="ph" style={{ background: TILES[p.tile].bg }}><Icon name={p.glyph} /></div>
                <div className="bd">
                  <div className="nm">{p.name}</div>
                  <div className="pr num">{KES(p.price)}</div>
                  <div className="st">{p.stock <= 6 ? <span style={{ color: 'var(--warning-fg)' }}>Low · {p.stock} left</span> : p.stock + ' in stock'}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* cart */}
      <div className="cart">
        <div className="cart-h">
          <span className="ttl">Current sale</span>
          {count > 0 && <Badge kind="success">{count} item{count > 1 ? 's' : ''}</Badge>}
        </div>
        <div className="cart-items">
          {lines.length === 0 ? (
            <div className="cart-empty">
              <Icon name="shopping-cart" />
              <div style={{ fontWeight: 600, color: 'var(--fg2)' }}>No items yet</div>
              <div style={{ fontSize: 13 }}>Tap a product to start a sale</div>
            </div>
          ) : lines.map(l => (
            <div className="citem" key={l.p.id}>
              <div className="thumb" style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', display: 'grid', placeItems: 'center', color: '#fff', background: TILES[l.p.tile].bg, flex: 'none' }}><Icon name={l.p.glyph} size={15} /></div>
              <div className="ci-mid" style={{ flex: 1, minWidth: 0 }}>
                <div className="ci-nm">{l.p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--fg3)' }} className="num">{KES(l.p.price)} each</div>
              </div>
              <div className="qty">
                <button onClick={() => bump(l.p.id, -1)}><Icon name="minus" size={13} /></button>
                <span className="n num">{l.q}</span>
                <button onClick={() => bump(l.p.id, 1)}><Icon name="plus" size={13} /></button>
              </div>
              <div className="ci-pr num" style={{ width: 72, textAlign: 'right' }}>{KES(l.p.price * l.q)}</div>
            </div>
          ))}
        </div>
        <div className="cart-foot">
          <div className="totrow"><span>Subtotal</span><span className="num">{KES(subtotal)}</span></div>
          <div className="totrow"><span>VAT included</span><span className="num">{KES(Math.round(subtotal * 0.16 / 1.16))}</span></div>
          <div className="totrow grand"><span>Total</span><span className="num">{KES(subtotal)}</span></div>
          <div className="pay-row">
            <Btn variant="mpesa" size="lg" icon="smartphone" disabled={count === 0} onClick={() => pay('mpesa')}>M-PESA</Btn>
            <Btn variant="secondary" size="lg" icon="banknote" disabled={count === 0} onClick={() => pay('cash')}>Cash</Btn>
          </div>
        </div>
      </div>

      {done && (
        <div className="scrim" onClick={reset}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="success-ic"><Icon name="check" /></div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, margin: '0 0 4px', letterSpacing: '-.6px' }}>Sale complete</h2>
            <div className="num" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, letterSpacing: '-1.2px', margin: '6px 0' }}>{KES(done.total)}</div>
            <p style={{ color: 'var(--fg2)', fontSize: 14, margin: '0 0 6px' }}>
              {done.method === 'mpesa' ? 'Paid via M-PESA · ref ' : 'Paid in cash · '}
              {done.method === 'mpesa' && <span className="mono">QGH7X2P1LM</span>}
            </p>
            <p style={{ color: 'var(--fg3)', fontSize: 13, margin: '0 0 20px' }} className="mono">#INV-2043</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="secondary" block icon="printer">Receipt</Btn>
              <Btn variant="primary" block icon="plus" onClick={reset}>New sale</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.POS = POS;
