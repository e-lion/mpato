---
name: mpato-design
description: Use this skill to generate well-branded interfaces and assets for Mpato, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. Mpato is a business management + POS platform for Kenyan SMEs (modern, pastel, warm, jade-green primary).
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files (`colors_and_type.css`, `assets/`, `preview/`, `ui_kits/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

Key facts to internalise before designing:
- **Brand:** Mpato (Swahili for *income/earnings*) — business management + POS for Kenyan merchants. Voice is plain, warm, encouraging; sentence case; money always in KES with tabular numerals; M-PESA and cash are first-class.
- **Color:** Raspberry-rose primary (`--rose-500 #E12E6F`), apricot + periwinkle accents, warm-stone neutrals, warm off-white canvas. Green reserved for M-PESA/paid/success. Pastel-forward, nothing dark, no bluish-purple gradients, no emoji.
- **Type:** Bricolage Grotesque (display/headings), Hanken Grotesk (UI/body), Spline Sans Mono (amounts/IDs) — all on Google Fonts.
- **Shape & motion:** Friendly moderate rounding (14-18px cards, pill tags), soft warm-tinted shadows, restrained 160ms motion, no bounce.
- **Icons:** Lucide, 2px stroke, from CDN.

Always load fonts + `colors_and_type.css` first, then build with the design tokens.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask a few focused questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.
