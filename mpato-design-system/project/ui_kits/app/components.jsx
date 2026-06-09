/* Mpato app — shared primitives, helpers, mock data */

function Icon({ name, size = 18, color, style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (el && window.lucide) {
      el.innerHTML = '';
      const i = document.createElement('i');
      i.setAttribute('data-lucide', name);
      el.appendChild(i);
      window.lucide.createIcons();
    }
  });
  return <span ref={ref} className="lic" style={{ width: size, height: size, color, ...style }}></span>;
}

const KES = (n) => 'KES ' + n.toLocaleString('en-KE');

function Btn({ variant = 'primary', size, block, icon, children, ...rest }) {
  const cls = ['btn', 'btn-' + variant, size === 'lg' && 'btn-lg', block && 'btn-block'].filter(Boolean).join(' ');
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} />}
      {children}
    </button>
  );
}

function Badge({ kind = 'neutral', dot, children }) {
  return (
    <span className={'badge b-' + kind}>
      {dot && <span className="bd" style={{ background: 'currentColor' }}></span>}
      {children}
    </span>
  );
}

function Avatar({ name, color = 'var(--peri-500)', size = 34 }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return <div className="avatar-sm" style={{ background: color, width: size, height: size, fontSize: size * 0.38 }}>{initials}</div>;
}

/* ---- product imagery: pastel tint + glyph ---- */
const TILES = {
  jade:    { bg: 'linear-gradient(135deg,var(--rose-300),var(--rose-500))' },
  apricot: { bg: 'linear-gradient(135deg,var(--apricot-300),var(--apricot-500))' },
  peri:    { bg: 'linear-gradient(135deg,var(--peri-300),var(--peri-500))' },
  lilac:   { bg: 'linear-gradient(135deg,var(--lilac-300),var(--lilac-500))' },
};

const PRODUCTS = [
  { id: 1, name: 'Maziwa Fresh 500ml', price: 60, stock: 42, cat: 'Drinks', glyph: 'milk', tile: 'jade' },
  { id: 2, name: 'Unga Pembe 2kg', price: 175, stock: 18, cat: 'Groceries', glyph: 'wheat', tile: 'apricot' },
  { id: 3, name: 'Soda 500ml', price: 70, stock: 6, cat: 'Drinks', glyph: 'cup-soda', tile: 'peri' },
  { id: 4, name: 'Biskut Pack', price: 45, stock: 90, cat: 'Snacks', glyph: 'cookie', tile: 'lilac' },
  { id: 5, name: 'Sukari 1kg', price: 165, stock: 24, cat: 'Groceries', glyph: 'package', tile: 'apricot' },
  { id: 6, name: 'Chai Leaves 500g', price: 230, stock: 12, cat: 'Groceries', glyph: 'leaf', tile: 'jade' },
  { id: 7, name: 'Maji 1L', price: 50, stock: 120, cat: 'Drinks', glyph: 'droplet', tile: 'peri' },
  { id: 8, name: 'Mkate Loaf', price: 65, stock: 8, cat: 'Bakery', glyph: 'sandwich', tile: 'apricot' },
  { id: 9, name: 'Crisps 100g', price: 55, stock: 64, cat: 'Snacks', glyph: 'cookie', tile: 'lilac' },
  { id: 10, name: 'Cooking Oil 1L', price: 320, stock: 15, cat: 'Groceries', glyph: 'flame', tile: 'jade' },
  { id: 11, name: 'Energy Drink', price: 110, stock: 4, cat: 'Drinks', glyph: 'zap', tile: 'peri' },
  { id: 12, name: 'Chocolate Bar', price: 80, stock: 38, cat: 'Snacks', glyph: 'candy', tile: 'lilac' },
];

const CATEGORIES = ['All', 'Groceries', 'Drinks', 'Snacks', 'Bakery'];

const RECENT_SALES = [
  { id: 'INV-2042', items: 4, total: 1240, method: 'mpesa', time: '2 min ago', cashier: 'Wanjiku M.' },
  { id: 'INV-2041', items: 2, total: 320, method: 'cash', time: '11 min ago', cashier: 'Wanjiku M.' },
  { id: 'INV-2040', items: 7, total: 2185, method: 'mpesa', time: '24 min ago', cashier: 'Brian O.' },
  { id: 'INV-2039', items: 1, total: 165, method: 'cash', time: '38 min ago', cashier: 'Wanjiku M.' },
  { id: 'INV-2038', items: 3, total: 540, method: 'mpesa', time: '52 min ago', cashier: 'Brian O.' },
];

const TOP_PRODUCTS = [
  { name: 'Maziwa Fresh 500ml', sold: 84, revenue: 5040, tile: 'jade', glyph: 'milk' },
  { name: 'Soda 500ml', sold: 71, revenue: 4970, tile: 'peri', glyph: 'cup-soda' },
  { name: 'Mkate Loaf', sold: 58, revenue: 3770, tile: 'apricot', glyph: 'sandwich' },
  { name: 'Maji 1L', sold: 46, revenue: 2300, tile: 'peri', glyph: 'droplet' },
];

/* last 7 days: mpesa + cash sales (KES, thousands) */
const WEEK = [
  { d: 'Mon', mpesa: 38, cash: 22 },
  { d: 'Tue', mpesa: 44, cash: 19 },
  { d: 'Wed', mpesa: 41, cash: 25 },
  { d: 'Thu', mpesa: 52, cash: 24 },
  { d: 'Fri', mpesa: 66, cash: 31 },
  { d: 'Sat', mpesa: 78, cash: 42 },
  { d: 'Sun', mpesa: 54, cash: 30 },
];

const CUSTOMERS = [
  { name: 'Grace Njeri', phone: '0712 345 678', spent: 18450, visits: 32, last: '2 days ago', tag: 'Regular', color: 'var(--rose-500)' },
  { name: 'Samuel Otieno', phone: '0723 998 211', spent: 9220, visits: 14, last: '5 days ago', tag: 'Regular', color: 'var(--apricot-500)' },
  { name: 'Faith Kamau', phone: '0701 552 040', spent: 31200, visits: 58, last: 'Today', tag: 'VIP', color: 'var(--peri-500)' },
  { name: 'Daniel Mwangi', phone: '0733 120 887', spent: 2150, visits: 4, last: '3 weeks ago', tag: 'Lapsing', color: 'var(--lilac-500)' },
  { name: 'Mary Achieng', phone: '0715 770 333', spent: 14800, visits: 27, last: '1 day ago', tag: 'Regular', color: 'var(--rose-600)' },
  { name: 'Peter Kariuki', phone: '0728 401 559', spent: 760, visits: 2, last: '6 weeks ago', tag: 'Lapsing', color: 'var(--apricot-600)' },
];

Object.assign(window, {
  Icon, KES, Btn, Badge, Avatar, TILES,
  PRODUCTS, CATEGORIES, RECENT_SALES, TOP_PRODUCTS, WEEK, CUSTOMERS,
});
