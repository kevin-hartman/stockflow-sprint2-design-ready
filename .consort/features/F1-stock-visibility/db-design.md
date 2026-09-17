# F1-stock-visibility — Physical DB Design

## Tables

### `stock_records`
Mirrors `app/models/stock_record`. One row per uniquely addressable `(sku, location)` pair.

| column | type | nullable | default | notes |
|---|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` | surrogate PK |
| `sku` | text | no | — | pair key |
| `location` | text | no | — | pair key |
| `quantity` | integer | no | — | non-negative stock level |
| `inventory_code` | text | no | — | combined code, opaque for S1 |

- PK: `id`
- UNIQUE: `(sku, location)` (also backed by unique index `uq_stock_records_sku_location`)
- CHECK: `ck_stock_records_quantity_non_negative` — `quantity >= 0`

## Per-story migration plan

### S1-file-stock
- `create_table stock_records` — the story with the API/data-layer ACs (AC1 write, AC2 read, AC3 upsert-collision) that first reads/writes the table.
- Reversible in a single step: `upgrade` creates the table + constraints; `downgrade` drops it. Initial migration, no rows to preserve.

## Invariant realization

| invariant | physical construct |
|---|---|
| PI1-unique-sku-location | UNIQUE `(sku, location)` + unique index; upsert-in-place (AC3) targets this constraint, so a repeat write updates rather than duplicating. |
| PI2-required-fields-not-null | `sku`, `location`, `quantity`, `inventory_code` all NOT NULL (AC1 requires the full pair + quantity + code). |
| PI3-quantity-non-negative | CHECK `quantity >= 0` (schema-level non-negative half of R2). |
| PI4-migration-reversible | Initial `create_table` with matching `downgrade` drop; single-step downgrade→upgrade recreates the table and constraints (schema-recreation semantics; no pre-existing rows). |
