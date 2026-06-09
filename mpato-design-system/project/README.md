# Mpato Design System

**Mpato** (Swahili for *income · earnings · proceeds*) is a business management platform for **Kenyan SMEs and merchants** — dukas, salons, hardware stores, pharmacies, eateries and mini-marts. It brings the whole business into one place: **staff, inventory, multiple store locations, customers, sales & POS (cash and M-PESA), a storefront website, reports & performance analytics, and AI-assisted lead and customer nurturing/marketing.**

The product should feel **modern, calm, and confident** — a capable operations partner for a busy shop owner, not a flashy fintech or a stuffy enterprise tool. The look is **pastel-forward and warm**: a vibrant raspberry-rose primary, soft apricot and periwinkle accents, warm-stone neutrals, and a friendly geometric type voice (Bricolage Grotesque). Green is reserved for money moments — M-PESA and “paid” confirmations. Numbers are first-class citizens — money is always clear, tabular, and in Kenyan Shillings (KES).

> **Note on sources:** No codebase, Figma, or brand assets were provided. This system was created fresh from the product brief (*"B2B SaaS POS & business management tool for Kenyan merchants — nice pastel colors, nothing too dark, modern, no generic AI slop"*). Every token, asset, logo, and screen here is an **original v1 starting point to react to and refine**, not a recreation of an existing product.

---

## Brand at a glance

- **Name:** Mpato — Swahili for *income / earnings*. The product helps merchants grow and see their `mpato`.
- **Category:** Business management + POS SaaS for SMEs
- **Market:** Kenya — all money in Kenyan Shillings (KES); M-PESA is a first-class payment method alongside cash
- **Audience:** Shop owners, cashiers, and managers running one or several physical locations (plus an optional online storefront)
- **Personality:** Capable, warm, modern, encouraging. Helps you feel *on top of your business*.
- **Primary color:** Mpato Rose (`--rose-500` `#E12E6F`) — a vibrant raspberry: energetic, optimistic, distinctly not another fintech green or blue
- **Accents:** Apricot (`#F2683C`, warmth & energy) and Periwinkle (`#5E6CE0`, data & "new")
- **Typefaces:** Bricolage Grotesque (display/headings), Hanken Grotesk (UI/body), Spline Sans Mono (amounts, IDs)
- **Shape language:** Friendly, moderate rounding (10–18px on surfaces, pill on tags/toggles)

---

## Content fundamentals

How Mpato writes:

- **Voice:** Plain, warm, and encouraging — like a sharp business partner who's good with numbers. Clear over clever. We celebrate wins quietly ("Sales up 12% this week") without hype.
- **Person:** Address the user as **"you"**; the product is **"Mpato"** or **"we"** in support contexts. e.g. *"You sold 156 items today."*
- **Casing:** **Sentence case everywhere** — buttons, headings, menu items, table headers. ("New sale", not "New Sale".) Reserve ALL-CAPS for tiny overline labels and status tags (`LOW STOCK`, `PAID`).
- **Tone:** Concrete and reassuring. Lead with the number or the action, then context. *"KES 84,200 in sales today — 64% via M-PESA."*
- **Verbs:** Short imperatives — *New sale, Add product, Record payment, Restock, Send reminder, Charge.*
- **Money & dates:** Always explicit and tabular. Currency as `KES 12,480` with thousands separators; M-PESA refs and invoice IDs in mono (`#INV-2042`, `QGH7X2P1LM`). Dates as `04 Jun 2026` or relative (`2 min ago`, `Due in 3 days`). Use tabular-nums so columns and totals align.
- **Local register:** Comfortable with Kenyan retail language and Swahili product names in examples (*Sukari 1kg, Unga Pembe 2kg, Maziwa Fresh*). Never forced or jokey — it's the real vocabulary of the shop.
- **Empty & error states:** Helpful, never blaming. *"No products yet — add your first one to start selling."* / *"M-PESA payment didn't confirm. Ask the customer to retry, or record as cash."*
- **AI features:** Framed as a helpful assistant that drafts and suggests — *"Mpato drafted 3 SMS offers for lapsed customers. Review before sending."* The user always stays in control; AI never sends on its own without confirmation.
- **Emoji:** **Not used** in the product UI. Status is shown with colored pills + Lucide icons, never emoji.
- **Vibe words:** in control, growing, sorted, clear, no surprises, every shilling counted.

---

## Visual foundations

- **Color usage:** Neutral-dominant and bright. The canvas is a warm off-white (`--bg2 #F8F7F4`), surfaces are white, and **rose is used purposefully** — primary actions, active nav, brand moments. Apricot adds warmth (secondary CTAs, highlights, a chart series); periwinkle/lilac carry data viz, "new", and info. Most of any screen is warm ink-on-white; color earns attention. Green appears only for payment/positive states (M-PESA, "paid", success). **Nothing is dark** — even the deepest text is a warm near-black (`--stone-900 #211E18`), never pure black, and large dark fills are avoided.
- **Type:** Bricolage Grotesque for display and headings — its slightly condensed, characterful grotesk gives confidence and personality at large sizes (weights 700–800, tight negative tracking). Hanken Grotesk handles all UI and body — friendly, highly legible, neutral but not cold. Spline Sans Mono carries amounts, IDs, and receipt data. Numbers always use tabular-nums.
- **Spacing:** 4px base grid. Comfortable, breathable density — cards pad 16–24px, page gutters 24–32px. The POS grid is denser (12px) for fast tapping.
- **Backgrounds:** Flat, clean, warm. No photographic hero washes inside the app; no heavy or bluish-purple gradients. Sanctioned color: **soft pastel tints** (`--rose-50`, `--apricot-50`, `--peri-50`) as section fills and as the placeholder fill behind product images. The one decorative gradient is a **subtle two-tone pastel** used on POS product tiles and the marketing hero (jade→jade, apricot→apricot — always within one hue family, never rainbow). **No noise, grain, or texture.**
- **Cards:** White surface, `1px --border (#E6E2D9)`, radius `--r-lg` (14px), `--shadow-sm`. Hover lifts to `--shadow-md` and `translateY(-2px)` over 160ms. Cards **never** use a colored left-border accent.
- **Corner radii:** Friendly, moderate. Surfaces 14–18px, inputs/buttons 8–10px, tags & toggles fully pill. Avoid sharp 0–4px corners except hairline dividers.
- **Elevation / shadows:** Soft, low-opacity, warm-tinted (`rgba(33,30,24,.04–.13)`), vertically offset. Diffuse, never hard or dark. Five steps xs→xl: cards → dropdowns → modals → popovers.
- **Borders:** Hairline `1px` in `--stone-200`; `--stone-300` for input outlines and stronger separation.
- **Focus:** A `4px` rose ring at 22% opacity (`--ring`) plus a solid rose border. Always visible for keyboard users.
- **Animation:** Restrained and functional. `160ms cubic-bezier(.4,0,.2,1)` for hovers, toggles, menu reveals, and tab switches. Gentle fades and 2–8px slides/lifts. **No bounce, no springy overshoot, no long durations, no infinite decorative loops.** Motion confirms an action; it never performs. One exception: a brief check-mark/confirmation animation on a completed sale is welcome.
- **Hover states:** Primary buttons darken one step (rose-500 → rose-600); secondary/ghost fill with a faint tint (`--stone-50` / `--rose-50`); cards raise shadow + lift 2px; nav items get a `--rose-50` fill.
- **Press states:** Slight darken to rose-700; optional `scale(.98)`. Quick (~100ms).
- **Transparency & blur:** Used lightly — sticky headers and modal scrims use a white/ink overlay at 70–92% with `backdrop-filter: blur(8px)`. Don't over-glass.
- **Imagery vibe:** When real photos appear (products, storefronts, owners), they're **bright, warm, natural daylight** — real Kenyan shops and goods, lived-in but tidy. No moody/B&W treatment. Always inside a rounded mask. Before upload, product images fall back to a pastel-tinted tile with a Lucide product glyph.
- **Iconography:** Lucide, 2px rounded strokes (see below).

---

## Iconography

- **Set:** [Lucide](https://lucide.dev) — clean, open-source, 24px grid, **2px strokes** with soft rounded terminals that match Mpato's friendly shape language.
- **Delivery:** Loaded from CDN (`https://unpkg.com/lucide@0.460.0`). No bespoke icon font or sprite is bundled — no source product existed to extract one from. In production, install `lucide-react` / `lucide`.
- **Usage:** Line icons at 16–24px, inheriting text color (`currentColor`). Stroke width stays 2px; don't mix filled and outline styles. Green-tinted icons only for payment/positive meaning; otherwise icons take the surrounding text color.
- **Common glyphs:** `layout-dashboard`, `shopping-cart`, `package`, `box`, `users`, `user-round`, `store`, `bar-chart-3`, `trending-up`, `smartphone` (M-PESA), `banknote` (cash), `receipt`, `wallet`, `tag`, `truck`, `bell`, `calendar`, `map-pin`, `sparkles` (AI), `settings`, `search`, `plus`, `check`, `arrow-up-right`.
- **Product-tile glyphs:** `milk`, `wheat`, `cup-soda`, `cookie`, `package` — used as warm pastel placeholders before a product photo is uploaded.
- **Emoji:** Never used as iconography or decoration.
- **Substitution flag:** ⚠️ Lucide is a **chosen default**, not extracted from a real Mpato product — swap it if you adopt a different set.

---

## Logo

A rounded-square tile (rose, `--r-lg`) holding a white **"M"** drawn as a single soft path — the dip in the middle reads as a friendly smile and a small upward valley (growth). Reads as *Mpato + momentum*.

- `assets/logomark.svg` / `logomark-white.svg` — square mark (app icon, avatars, favicon)
- `assets/logo-full.svg` / `logo-full-white.svg` — mark + "Mpato" wordmark (Bricolage Grotesque 800, -1.6 tracking)
- `assets/favicon.svg`
- **Clearspace:** keep at least the mark's corner radius of space around it. **Min size:** 20px mark / 110px full lockup. Don't recolor, stretch, rotate, or add effects.
- ⚠️ The logo is an **original starting point** created for this system — refine or replace if you have brand work in progress.

---

## Font substitution note

⚠️ Bricolage Grotesque, Hanken Grotesk, and Spline Sans Mono were **chosen** for this brand (no source product existed) and are loaded from **Google Fonts** — they are the real, intended typefaces, not stand-ins. If you adopt different brand fonts, swap the `--font-display` / `--font-sans` / `--font-mono` vars in `colors_and_type.css` and the `<link>` in each file.

---

## File index

| Path | What it is |
|---|---|
| `README.md` | This file — context, content + visual foundations, iconography, logo, index |
| `colors_and_type.css` | All design tokens: color scales, semantic + payment roles, type scale + classes, radii, spacing, shadows |
| `SKILL.md` | Agent Skill manifest for use in Claude Code |
| `assets/` | Logos (mark, lockup, white variants), favicon |
| `preview/` | Design System tab cards — foundations + components |
| `ui_kits/app/` | **Mpato app** UI kit — the merchant web dashboard (sidebar, dashboard, POS, inventory, customers) |
| `ui_kits/marketing/` | **Mpato marketing site** UI kit — public landing page |

### UI kits
- **`ui_kits/app`** — the core product. Sidebar nav + click-through across **Dashboard** (KPIs, sales chart, M-PESA vs cash split, top products), **Point of sale** (product grid → cart → M-PESA/cash checkout with confirmation), **Inventory** (product table, stock levels, low-stock flags), and **Customers** (CRM list with AI nurture nudges). Open `ui_kits/app/index.html`.
- **`ui_kits/marketing`** — public landing page: nav, hero, trust strip, feature grid, POS/M-PESA highlight, pricing, CTA, footer. Open `ui_kits/marketing/index.html`.

---

## Quick start

```html
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="colors_and_type.css">
```

Then use the tokens: `background: var(--bg2)`, `color: var(--fg1)`, `border-radius: var(--r-lg)`, `box-shadow: var(--shadow-sm)`, payment tints `var(--mpesa)` / `var(--cash)`, and type classes like `class="ds-h1"`, `class="ds-body"`, `class="ds-num"`.
