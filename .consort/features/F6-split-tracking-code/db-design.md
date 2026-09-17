# F6 Split Tracking Code — Physical DB Design

## Scope

F6 splits the combined `inventory_code` into separately addressable `batch_number`
and `serial_number` fields. It operates on the **pre-existing** `stock_records`
table (created by F1); F6 does not create any table. It is an **expand/contract**
split: S1 expands (adds `batch_number` + `serial_number`, backfills), then
**S2 contracts by dropping `inventory_code`** — the accepted end state.

## Table: `stock_records` (end state, post-S2)

One table, mirroring `app/models/stock_record.py`. F1 columns are unchanged:
`id` (integer PK, autoincrement), `sku`, `location`, `quantity` (all NOT NULL),
with `UNIQUE(sku, location)` and `CHECK(quantity >= 0)`. The combined
`inventory_code` column is **dropped by S2** and is no longer part of the schema.

F6 adds two columns (S1), which remain in the end state:

| Column          | Type | Nullable | Why nullable |
|-----------------|------|----------|--------------|
| `batch_number`  | text | yes      | A nonconforming/short code has no batch segment → NULL is a valid state (AC2) |
| `serial_number` | text | yes      | A nonconforming/short code has no serial segment → NULL is a valid state (AC2) |

Both are backfilled from `inventory_code` split on `-`: segment 2 → `batch_number`,
segment 3 → `serial_number` (AC1). Codes like `X-1` or bare `c` leave both NULL,
never guessed (AC2). The canonical `location` column is **not** rewritten from the
code's leading segment (AC4); `UNIQUE(sku, location)` and `CHECK(quantity >= 0)`
are untouched (NFR-R3, NFR-R2).

## Migration plan (per story)

### S1-expand-schema — `add_column` (expand)
- **upgrade()**: `ADD COLUMN batch_number text NULL`, `ADD COLUMN serial_number text NULL`,
  then backfill both from `inventory_code` — **all in one transaction**. Either every
  pre-existing row is present with the columns added and conforming rows backfilled,
  or nothing commits: no torn/partial state, no dropped row.
- **downgrade()**: `DROP COLUMN serial_number`, `DROP COLUMN batch_number` — those two
  columns **only**. Every pre-existing row survives; a re-upgrade re-adds and re-backfills
  (additive round-trip).
- `inventory_code` is retained in this story (the backfill source); it is dropped only by
  the later contract story.
- **Integrity probe**: a read-only aggregate count of rows with
  `batch_number IS NULL AND serial_number IS NULL`, exposed via the repository layer and a
  thin services reporting function. It mutates nothing and is surfaced for review before
  the change is accepted. It is not a schema change.

### S2-contract-schema — `drop` (contract)
- **upgrade()**: `DROP COLUMN inventory_code` inside one transaction. `batch_number` and
  `serial_number` remain; `location`/`sku`/`quantity` untouched — the diff shows only
  `inventory_code` removed and no combined code column survives (AC1). Every pre-existing
  row persists with `location`/`batch_number`/`serial_number` unchanged; commit-or-nothing,
  no dropped/corrupted row (AC2, R1). `CHECK(quantity >= 0)` and `UNIQUE(sku, location)`
  stay intact (NFR-R2, NFR-R3).
- **downgrade()**: `ADD COLUMN inventory_code text`, then repopulate by **recomposing**
  `location`-`batch_number`-`serial_number` joined with `-` (the exact mirror of S1's
  decomposition, OD1): e.g. `A12` + `B7` + `S001` → `A12-B7-S001`; `location` stays
  canonical/unchanged (AC3).
- **Round-trip (AC4)**: re-applying upgrade after a downgrade re-drops `inventory_code`,
  returning to the accepted dropped end state with batch/serial present and every row
  intact — reversibility is repeatable.
- **Documented lossiness (OD2)**: a NULL-batch/serial row can only recompose from the
  columns it has, so it round-trips to a location-only `inventory_code` rather than its
  original combined string — acceptable because `inventory_code` is not part of the
  accepted end state. NULL-forever is accepted; S2 adds no remediation/backfill step.
- **Isolation**: the drop→downgrade→re-upgrade round-trip mutates the schema and must run
  on its **own isolated ephemeral migration branch** (`@pytest.mark.migration`), never the
  shared post-migration verify DB (whose `inventory_code` is already dropped).

## Invariant realization

| Invariant | Realized by |
|-----------|-------------|
| `PI1-expand-migration-reversible` | S1 additive `add_column` expand; downgrade drops **only** the two added columns while all pre-existing rows persist, and re-upgrade re-adds them (round-trip, table pre-exists from F1). |
| `PI2-expand-migration-atomic` | S1 column adds + backfill from `inventory_code` execute in a single transaction — atomic commit-or-nothing, no dropped/torn rows (realizes R1 at the migration boundary). |
| `PI3-contract-migration-reversible` | S2 `drop` of `inventory_code` is reversible: downgrade re-adds and repopulates it by recomposing `location`-`batch`-`serial` with `-`; a re-upgrade re-drops it (repeatable round-trip, AC1/AC3/AC4). |
| `PI4-contract-drop-preserves-rows` | S2 `DROP COLUMN inventory_code` runs in one transaction — column fully removed with every pre-existing row present and `location`/`batch`/`serial` unchanged, or nothing commits (AC2, R1). |

All persistence invariants are covered; none dropped or weakened. Verified against the
paired Lakebase branch with Alembic applied (NFR-R4), never a mock/in-memory substitute.
