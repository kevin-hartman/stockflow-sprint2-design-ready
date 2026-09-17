---
author: Spec Author
---

# Sprint proposal — StockFlow foundation

Candidate features for the **next sprint only**: the simplest coherent,
demonstrable increment that lets the warehouse team *see and adjust stock
at one warehouse* — the V1 the PO says "goes into use." Nothing has
shipped yet (greenfield), so this sprint is the foundation the rest of the
backlog builds on. UI track is ON: this product is a single-page app
(`nfrs.md` R5), so every candidate below is a user-facing increment that
must be deliverable end to end as an **E2E (UI) story** — a real
browser/tablet interaction the operator performs, not merely an API.

Deferred to later sprints (fold in this sprint's learning first, do NOT
pull forward): F3-inbound-receipt and F4-outbound-pick (the inbound/
outbound loop — the natural *next* increment once see + adjust is real),
then F5-cycle-count, F6-split-tracking-code, F7-multi-warehouse,
F8-barcode-scan, F9-stock-search (all explicitly beyond V1 in the
overview).

## F1-stock-visibility

- **Ask:** Record a SKU's stock at a physical location and read it back — a
  scannable stock-by-location home table and a per-SKU detail view.
- **Rationale:** The overview's first V1 bullet ("file, retrieve … the
  stock level of one SKU at one location") and "hold stock … at multiple
  locations within one warehouse." Serves NFR R3 (each `(sku, location)`
  uniquely addressable, collision resolved at write time) and R1 (records
  survive later schema changes). This is the foundation — until stock can
  be recorded and read back, nothing else in the warehouse works.
- **E2E (UI) story:** Yes. The home stock-by-location table, the empty-
  location state, and the SKU detail view are browser screens the operator
  reads; filing a record is a client form round-trip.
- **Priority:** P0 — must land first; every other feature reads or writes
  these stock records.

## F2-stock-adjustment

- **Ask:** Correct the stock level of a SKU at a location (to a value or by
  a delta), with a validation-first form that shows the corrected row move
  in place.
- **Rationale:** The overview's V1 phrasing is "see **and adjust** stock at
  one warehouse"; adjustment is what makes the inventory trustworthy when
  the shelf and the system disagree. Serves NFR R2 (never below zero,
  rejected at write time) and R1 (unmodifiable timestamp + actor on every
  adjustment). Because V1 rules out authentication (`nfrs.md` Out of
  bounds), the "who made it" actor is an explicit operator-supplied input,
  not an authenticated identity — flag for PO confirmation.
- **E2E (UI) story:** Yes. The adjustment form (persistent labels, inline
  field-named errors, green save flash) and the in-place optimistic row
  update (R5) are the core client interaction the PO wants to sign off by
  watching a stock row move in real time.
- **Priority:** P0 — completes the "see and adjust" increment; small,
  builds directly on F1's stock records.
