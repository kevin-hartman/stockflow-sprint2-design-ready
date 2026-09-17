# StockFlow Design Guide

The project-level visual + interaction standard for the StockFlow UI. Tokens in
`design-guide.json` are the source of truth; `client/src/styles/theme.css` is
GENERATED from it (`./scripts/lk consort-apply-design-theme`) and
`client/src/styles/global.css` realizes the component classes. Downstream UI is
checked against this guide at the E2E (Playwright) layer.

**Provenance.** Per the design brief, BRAND and COLOR are taken from the
Databricks-brand default (`client/src/styles/STYLE_GUIDE.md` + `theme.css`): DM
Sans, navy-900 `#1B3139` text, warm-oat `#F9F7F4` page, white cards, brand red
`#FF3621` for the primary action only. LAYOUT and INFORMATION DENSITY are taken
from clean warehouse/inventory dashboards — verified by browsing
fishbowlinventory.com (observed: near-white light page surface `#f7f7f7`, dark
near-black body text, a clean single sans family, generous whitespace and a
calm, scannable content column), which grounds the calm high-contrast stock
table, right-aligned tabular numerics, and the narrow single-column detail/form.

## Design Philosophy

- **Scannable and calm.** The home stock-by-location table is read-mostly; keep
  it high-contrast and quiet so SKUs and quantities are read at a glance. Brand
  red is reserved for the primary action / active state, never decoration.
- **One branded product.** Every screen composes the same named component
  vocabulary; the warehouse app icon appears in the navbar, page titles, and the
  browser tab.
- **No silent states.** Empty, loading, success, and validation error are each
  an explicit, teaching component state — never a blank region and never an
  unacknowledged action.
- **Floor-first.** The warehouse-floor tablet is the primary device: large tap
  targets, barcode scanning as the primary input, readable at 200% zoom.

## UI Framework and Templating

StockFlow is a React + TypeScript single-page application (Vite) under
`client/`, client-side routed (no full-page reloads), talking to a JSON API.
The exact framework record (`renders_via`) is the Architect's; the product
intent is a component-rendered SPA. No hand-assembled HTML strings. Every state
is a component with a stable `data-testid` seam so the E2E layer can select it.
Rendering stays in the boundary layer.

## Typography

- **UI font:** DM Sans (`--font-sans`); the only UI family. No custom web font
  beyond what `theme.css` loads.
- **Numeric / mono font:** DM Mono (`--font-mono`) for quantities and tracking
  codes, always with `font-variant-numeric: tabular-nums` so columns align.
- **Scale:** `text-xs` 10px, `text-sm` 13px, `text-base` 15px, `text-md` 16px,
  `text-lg` 20px, `text-xl` 24px.
- **Line heights:** body 1.5, heading 1.25. **Weights:** 400 regular, 500
  medium, 600 semibold, 700 bold.

## Color Palette

- **Brand:** `brand-red` `#FF3621` (primary action / active state ONLY),
  `brand-hover` `#EB1600`, `brand-light` for tinted pill/toast backgrounds.
- **Semantic (meaning always carried by text too, never color alone):**
  `success` `#2E844A`, `warning` `#FFAB00`, `info` `#0176D3` (focus ring),
  `error` `#FF3621`, each with a light background tint.
- **Surface / text:** page warm-oat `#F9F7F4`, card `#FFFFFF`, cool header
  `#F0F2F5`, navy scale 900/700/500/300/200/100, text navy-900 `#1B3139`.

## Spacing

A 4px base grid: `space-1` 4px, `space-2` 8px, `space-3` 12px, `space-4` 16px,
`space-5` 20px, `space-6` 24px, `space-8` 32px, `space-12` 48px.

## Radius & Shadows

- **Radius:** `sm` 4px (inputs), `md` 8px, `lg` 12px (cards), `pill` 999px
  (badges), `sharp` 0 (the primary CTA — a Databricks brand signature).
- **Shadows** (navy-tinted for warmth): `sm` for cards, `md` for toasts, `lg`
  for raised/overlay surfaces.

## Components

Each maps to a `design-guide.json` `components` entry and a class in
`global.css`; feature pages COMPOSE these, never hand-rolled markup.

- **Navbar** (`.navbar`) — navy-900 bar, 64px, 2px brand-red bottom border; app
  icon + "StockFlow" on the left (`.navbar__brand`/`.navbar__icon`), nav links
  right (`.navbar__link`, `.navbar__link--active` in brand red).
- **Page** (`.page`) — warm-oat background, centered ~960px column,
  `.page__header` > `.page__title` with `.page__title-icon`.
- **Card** (`.card`) — white surface, soft navy shadow, `--radius-lg`,
  `--space-5` padding.
- **Buttons** (`.btn`) — `.btn--primary` (solid brand-red, sharp 0 corners),
  `.btn--secondary` (outlined), `.btn--ghost` (text). Tap targets ≥ 44×44px.
- **Form input** (`.field`) — `.field__label` (persistent, visible),
  `.field__input` (focus ring in info blue), `.field__error` (inline, names the
  field).
- **Stock table** (`.stock-table`) — cool uppercase header, quantity cells
  (`.stock-table__num`) right-aligned in mono/tabular figures.
- **Status pills** (`.badge`) — the FIVE stock states, each text + color:
  `--in-stock`, `--low` (warning), `--out` (error), `--on-order`,
  `--quarantined`.
- **Empty state** (`.empty-state`) — icon + teaching heading + copy + CTA.
- **Toast** (`.toast`) — fixed top-right; `--ok` auto-dismiss, `--error`
  persists; never shifts layout.
- **Scan zone** (`.scan-zone`) — barcode input; `--success` green flash + row
  updates in place, `--error` red flash + persistent error toast.

## Iconography

- **App icon (brand mark).** The warehouse mark ships at
  `.consort/design/assets/warehouse.png`, is installed to
  `client/public/warehouse.png`, rendered in the navbar next to "StockFlow" and
  in page titles, and set as the **browser-tab favicon** in `index.html`. A
  shell without the icon actually rendering (navbar image + favicon) has not met
  the brand requirement.
- **Icon set.** A single line-style set used consistently (inbound/outbound,
  scan, warehouse, stock-level states). Do not mix icon styles.

## User Feedback Principles

- **No silent failure, no unacknowledged success.** Every action surface (form,
  scan) gives feedback: a successful save lands on a confirmation view or an
  inline green flash; a validation problem shows inline next to the offending
  field, naming it (an overcommitting pick, an unknown SKU).
- **Barcode scans** are primary: success = green flash + stock row updates in
  place; failure (unknown barcode, locked SKU) = red flash + persistent error
  toast.
- **Explicit empty/absent states**: an empty location teaches ("No stock at this
  location, receive an inbound shipment"); a SKU with no batch/serial reads "not
  tracked". Never a blank region.

## Accessibility

- Persistent visible labels (not placeholder-only). Tap targets ≥ 44×44px.
- Stock-level pills and quantity cells communicate state by BOTH shape/text and
  color, never color alone ("out" + error, "low" + warning).
- Keyboard-reachable actions; readable at 200% zoom (tablet default large text).
- Tabular figures for aligned numeric columns.
