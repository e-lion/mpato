# Mpato marketing site — UI kit

A high-fidelity recreation of the **public Mpato landing page**. Single-page React (Babel in-browser) using the shared design tokens.

> ⚠️ Original v1 created from the product brief — no source codebase or Figma existed. Treat as a starting point to refine.

## Open
`index.html` — a full marketing landing page. Anchor nav links jump to sections.

## Sections (top → bottom)
1. **Nav** — sticky, blurred; logo, links, log in + Start free.
2. **Hero** — eyebrow pill, big Bricolage headline with rose highlight, subcopy, dual CTA, and an **app-preview mock** (browser chrome + mini dashboard with KPIs and a bar chart).
3. **Trust strip** — merchant count and headline stats.
4. **Features** — 6-card grid (POS, inventory, customers, AI marketing, storefront, reports) with pastel-tinted Lucide icons.
5. **POS / M-PESA highlight** — split layout: checklist of payment capabilities beside a styled **receipt card** showing an M-PESA-paid sale.
6. **Pricing** — three plans (Duka / Biashara / Mtaa), middle one featured.
7. **CTA band** — rose full-width call to action.
8. **Footer** — brand blurb + link columns.

## Files
| File | Role |
|---|---|
| `index.html` | Entry point — loads fonts, tokens, site.css, then sections.jsx |
| `site.css` | All marketing-site styles |
| `sections.jsx` | Every section component + the page assembly |

## Conventions
- Icons: Lucide via CDN through the local `<Icon>` helper.
- Pastel-forward, warm; rose primary, apricot/periwinkle/lilac accents per `colors_and_type.css`.
- Sentence-case copy, KES pricing, M-PESA/cash framing, no emoji.
