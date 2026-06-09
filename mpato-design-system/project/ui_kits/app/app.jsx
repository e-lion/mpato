/* Mpato app — shell, topbar & routing */

const TITLES = {
  dashboard: { t: 'Good morning, Wanjiku', s: 'Tuesday, 04 June 2026 · Soko Mini-Mart, Westlands' },
  pos: { t: 'Point of sale', s: 'Register 1 · Wanjiku M.' },
  inventory: { t: 'Inventory', s: 'Manage products & stock levels' },
  customers: { t: 'Customers', s: 'Your customer book & marketing' },
};

function Placeholder({ id }) {
  const map = {
    reports: ['bar-chart-3', 'Reports & analytics', 'Sales trends, profit margins and store performance live here.'],
    storefront: ['store', 'Online storefront', 'Publish your catalogue as a website customers can order from.'],
    staff: ['user-round', 'Staff & permissions', 'Add cashiers and managers, set roles and track shifts.'],
    settings: ['settings', 'Settings', 'Business profile, payments, receipts and integrations.'],
  };
  const [icon, title, desc] = map[id] || ['box', 'Coming soon', ''];
  return (
    <div className="page-w" style={{ display: 'grid', placeItems: 'center', minHeight: 420 }}>
      <div style={{ textAlign: 'center', maxWidth: 360 }}>
        <div style={{ width: 64, height: 64, borderRadius: 'var(--r-xl)', background: 'var(--rose-50)', color: 'var(--rose-600)', display: 'grid', placeItems: 'center', margin: '0 auto 18px' }}><Icon name={icon} size={30} /></div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, margin: '0 0 8px', letterSpacing: '-.4px', color: 'var(--fg1)' }}>{title}</h2>
        <p style={{ color: 'var(--fg2)', fontSize: 15, margin: 0, lineHeight: 1.5 }}>{desc}</p>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = React.useState('dashboard');
  const meta = TITLES[view];

  const render = () => {
    switch (view) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS />;
      case 'inventory': return <Inventory />;
      case 'customers': return <Customers />;
      default: return <Placeholder id={view} />;
    }
  };

  return (
    <div className="app">
      <Sidebar active={view} onNavigate={setView} />
      <div className="main">
        <header className="topbar">
          <div>
            <h1>{meta ? meta.t : ''}</h1>
            <div className="sub">{meta ? meta.s : ''}</div>
          </div>
          <div className="spacer"></div>
          {view !== 'pos' && (
            <div className="topsearch">
              <Icon name="search" size={16} />
              <input placeholder="Search anything…" />
            </div>
          )}
          <button className="iconbtn"><Icon name="bell" size={18} /><span className="dot"></span></button>
          {view !== 'pos' && <Btn variant="primary" icon="plus" onClick={() => setView('pos')}>New sale</Btn>}
          <div className="avatar" title="Wanjiku Mwangi">WM</div>
        </header>
        <main className="content">{render()}</main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
