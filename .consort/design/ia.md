# StockFlow Information Architecture

Screens, navigation, and primary flows for the StockFlow SPA. Every screen maps
to an `App.tsx` route and a navbar affordance; every flow seeds an E2E scenario.

## Screens

- **Home — Stock by location** (`/`) — the read-mostly landing view: a calm,
  scannable stock-by-location table (SKU, location, quantity, stock-state pill)
  across the warehouse. Quantity columns right-aligned in tabular figures. Empty
  warehouse shows an explicit empty state. Entry point for scanning and for
  drilling into a SKU.
- **SKU detail** (`/sku/:skuId`) — a single narrow column: the SKU's quantities
  by location in a card, stock-state pills, and batch/serial (tracking-code)
  detail — or a clear "not tracked" when absent. Actions to Receive, Pick, or
  Adjust this SKU.
- **Receive** (`/receive`) — inbound receipt form: supplier, SKU, location,
  quantity. On save → confirmation; validation (unknown SKU) shows inline.
- **Pick** (`/pick`) — outbound pick form: SKU, location, quantity. Refuses to
  overcommit; an overcommitting pick shows an inline error naming the field.
- **Adjust** (`/adjust`) — stock adjustment / cycle-count form: SKU, location,
  counted quantity. On save → inline green flash confirmation.
- **Search** (`/search`) — search/scan entry to find a SKU or location; a
  barcode scan resolves to the SKU detail (green flash) or raises a persistent
  error toast (unknown/locked barcode).

## Navigation

- **Navbar** (persistent, all screens): app icon + "StockFlow" (links to Home) on
  the left; links on the right → Home (`/`), Search (`/search`), Receive
  (`/receive`), Pick (`/pick`), Adjust (`/adjust`). The active route carries the
  brand-red `navbar__link--active` state.
- **Routing** (`App.tsx` `<Routes>`): `/` Home, `/search` Search, `/sku/:skuId`
  SKU detail, `/receive` Receive, `/pick` Pick, `/adjust` Adjust. No full-page
  reloads.
- **Cross-screen entry:** Home rows and Search results link to SKU detail; SKU
  detail's action buttons deep-link to Receive/Pick/Adjust prefilled with the
  SKU. The scan zone (Home/Search) routes to SKU detail on a successful scan.

## User flows

1. **See stock at a warehouse.** Open Home → scan the stock table → drill into a
   SKU. (Empty warehouse → explicit empty state with a Receive CTA.)
2. **Receive inbound.** Navbar → Receive → enter supplier/SKU/location/quantity
   → Save → confirmation; stock goes up at the chosen location. Unknown SKU →
   inline error.
3. **Pick outbound.** Navbar → Pick → enter SKU/location/quantity → Save; system
   refuses to overcommit → inline error naming the quantity field.
4. **Adjust / cycle count.** Navbar → Adjust → enter counted quantity → Save →
   inline green flash; the stock row updates in place.
5. **Scan on the floor.** Search/Home scan zone → scan a barcode → success:
   green flash, resolve to SKU detail, row updates in place; failure: red flash +
   persistent error toast.
6. **Inspect a SKU.** Home/Search → SKU detail → quantities by location +
   batch/serial detail (or "not tracked") → act (Receive/Pick/Adjust).
