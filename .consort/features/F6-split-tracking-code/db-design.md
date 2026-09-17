# F6 Split Tracking Code — Physical DB Design

## Scope

F6 splits the combined `inventory_code` into separately addressable `batch_number`
and `serial_number` fields. It operates on the **pre-existing** `stock_records`
table (created by F1); F6 does not create any table. This is the **expand** half of
an expand/contract split — the later S2 contract story drops `inventory_code`.

## Table: `stock_records`

One table, mirroring `app/models/stock_record.py`. F1 columns are unchanged:
`id` (integer PK, autoincrement), `sku`, `location`, `quantity`, `inventory_code`
(all NOT NULL), with `UNIQUE(sku, location)` and `CHECK(quantity >= 0)`.

F6 adds two columns:

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
- **Integrity probe (AC3)**: a read-only aggregate count of rows with
  `batch_number IS NULL AND serial_number IS NULL`, exposed via the repository layer and a
  thin services reporting function. It mutates nothing and is surfaced for review before
  the change is accepted. It is not a schema change.

## Invariant realization

| Invariant | Realized by |
|-----------|-------------|
| `PI1-expand-migration-reversible` | Additive `add_column` expand; downgrade drops **only** the two added columns while all pre-existing rows persist, and re-upgrade re-adds them (round-trip, table pre-exists from F1). |
| `PI2-expand-migration-atomic` | Column adds + backfill from `inventory_code` execute in a single transaction — atomic commit-or-nothing, no dropped/torn rows (realizes R1 at the migration boundary). |

All persistence invariants are covered; none dropped or weakened. Verified against the
paired Lakebase branch with Alembic applied (NFR-R4), never a mock/in-memory substitute.
