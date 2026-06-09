/* Mpato app — sidebar navigation */

function Sidebar({ active, onNavigate }) {
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { id: 'pos', label: 'Point of sale', icon: 'shopping-cart' },
    { id: 'inventory', label: 'Inventory', icon: 'package', badge: '3' },
    { id: 'customers', label: 'Customers', icon: 'users' },
  ];
  const more = [
    { id: 'reports', label: 'Reports', icon: 'bar-chart-3' },
    { id: 'storefront', label: 'Storefront', icon: 'store' },
    { id: 'staff', label: 'Staff', icon: 'user-round' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  const Item = ({ it }) => (
    <button className={'navitem' + (active === it.id ? ' active' : '')} onClick={() => onNavigate(it.id)}>
      <Icon name={it.icon} size={18} />
      {it.label}
      {it.badge && <span className="badge-n">{it.badge}</span>}
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="../../assets/logomark.svg" alt="Mpato" />
        <span className="wm">Mpato</span>
      </div>
      {items.map(it => <Item key={it.id} it={it} />)}
      <div className="navlabel">Manage</div>
      {more.map(it => <Item key={it.id} it={it} />)}

      <div className="sidebar-foot">
        <div className="store-switch">
          <div className="av">SM</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="nm">Soko Mini-Mart</div>
            <div className="sub">Westlands · 2 stores</div>
          </div>
          <Icon name="chevrons-up-down" size={16} color="var(--fg3)" />
        </div>
      </div>
    </aside>
  );
}

window.Sidebar = Sidebar;
