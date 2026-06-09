# Mpato app — UI kit

A high-fidelity, interactive recreation of the **Mpato merchant web dashboard** — the core product. Built with React (Babel in-browser) + the shared design tokens in `../../colors_and_type.css`.

> ⚠️ Original v1 created from the product brief — no source codebase or Figma existed. Treat as a starting point to refine.

## Open
`index.html` — boots into the **Dashboard**. Use the left sidebar to move between surfaces. Everything is click-through fake (no backend).

## Surfaces
- **Dashboard** — greeting, 4 KPI tiles (sales, orders, new customers, low stock), a stacked weekly sales bar chart (M-PESA vs cash), payment-mix breakdown, recent-sales table, and top products.
- **Point of sale** — the register. Category tabs + search filter a tappable product grid; tapping adds to the cart on the right. Adjust quantities, then **pay by M-PESA or Cash** → animated success modal with receipt ref. Fully interactive.
- **Inventory** — product table with pastel thumbnails, category, price, stock count and status badges (in stock / low / out), search, plus stock-value KPIs.
- **Customers** — CRM table (spend, visits, last seen, lifecycle tag) topped by an **AI nurture nudge** banner that drafts an SMS offer for lapsing customers (click *Review & send*).
- **Reports / Storefront / Staff / Settings** — empty-state placeholders (out of scope for v1).

## Files
| File | Role |
|---|---|
| `index.html` | Entry point — loads fonts, tokens, kit.css, then JSX |
| `kit.css` | All app-chrome + component styles |
| `components.jsx` | Shared primitives (`Icon`, `Btn`, `Badge`, `Avatar`, `KES`) + mock data (products, sales, customers, week) |
| `Sidebar.jsx` | Left navigation |
| `Dashboard.jsx` | Dashboard view + KPI / chart / table sub-components |
| `POS.jsx` | Interactive point-of-sale + checkout modal |
| `Inventory.jsx` | Inventory table view |
| `Customers.jsx` | Customers CRM + AI nudge |
| `app.jsx` | Shell, topbar, routing |

## Conventions
- Icons: Lucide via CDN, rendered through the `<Icon name="…" size={…} />` helper.
- Money: always `KES(n)` → `KES 12,480`, tabular numerals.
- All components export onto `window` for cross-file sharing (Babel scope isolation).
