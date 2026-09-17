# F6 Split tracking code — Architecture (Architect Reviewer)

Expand-then-contract schema refactor. **S1 (expand)** adds nullable `batch_number` +
`serial_number` to the pre-existing `stock_records` table, backfills them from
`inventory_code` by delimiter, and runs an integrity probe — all while `inventory_code`
still exists. S2 (contract) later drops `inventory_code`; S3 surfaces the split fields in
the SPA. This file is authored at S1; later stories append.

`service_backed: true` — the feature persists data (a schema migration on `stock_records`).
Layers reuse the project convention established by F1-stock-visibility (boundary=`app/routes/`
react, service=`app/services/`, repository=`app/repositories/`, models=`app/models/`); no
layer is remapped or renamed.

## Layer assignment (S1)

All four S1 ACs are **Infra**: S1 is a pure schema/migration + data-store story with no HTTP
or UI boundary. Each AC is a contract on the migrated `stock_records` shape/state, verified
against the paired Lakebase branch. (The feature's E2E surface lives in S3-split-fields-ui,
which renders the split fields in the SPA.)

- AC1-backfill-conforming-code → **Infra** (backfill DDL + delimiter parse, owner: Alembic migration under `migrations/versions/`; nullable columns on `app/models/` stock model).
- AC2-nonconforming-code-left-null → **Infra** (nonconforming code leaves both columns NULL, row survives; same migration).
- AC3-integrity-probe-reports-count → **Infra** (read-only integrity probe over the table; owner: repository query in `app/repositories/` surfaced by a service reporting function in `app/services/`).
- AC4-location-unchanged → **Infra** (migration touches only batch/serial; canonical `location` untouched).

## Architectural Concerns Mapping

| Concern | Owner layer / module | Notes |
| --- | --- | --- |
| Schema change + backfill (DDL/DML) | Alembic migration, `migrations/versions/` | Additive, transactional, reversible (PI1, PI2). |
| ORM model shape (nullable columns) | models, `app/models/` (stock model) | `batch_number`/`serial_number` nullable — NULL is a valid state (AC2). |
| Data-store access for the probe | repository, `app/repositories/` | Only layer touching the ORM/session; probe is a read query. |
| Integrity-probe reporting | service, `app/services/` | Aggregates the nonconforming count; no raw SQL in boundary/domain. |
| Data integrity / no silent loss (R1) | migration + tests | Every pre-existing row survives; unparsed codes → NULL, never guessed/dropped. |
| Preserved existing constraints (R2, R3) | schema / migration | CHECK(quantity>=0) and UNIQUE(sku,location) must survive the refactor. |
| Real-branch integration tests (R4) | test suite | Alembic applied to the paired branch; no mock/in-memory DB. |
| Config in env | env / `DATABASE_URL` | Migration connects to substrate `databricks_postgres`; name untouched. |
| Authn/authz | — | Out of bounds for V1; no actor identity assumed. |

## Pattern proposals (SOLID module boundaries)

- Keep DDL + backfill in the Alembic migration; keep the **integrity probe** as a read-only
  repository query surfaced by a thin service reporting function — the probe is not a domain
  behavior and must not leak SQL into the service/boundary.
- Nullable columns on the models package (one module per aggregate) — the model change is
  additive and does not alter the `(sku, location)` identity.

## Risks

- **Contract-drop data loss (S2):** dropping `inventory_code` in S2 permanently discards the
  only source for rows the backfill could not parse (NULL batch/serial). The integrity-probe
  count (AC3) is the gate on whether that loss is acceptable. Tracked as open decision
  OD2-nonconforming-remediation; must be adjudicated before S2 is accepted.
- **Variable-width parsing:** codes are variable width (`X-1`, bare `c`), not fixed. Backfill
  must split on `-` and treat missing segments as NULL, never index blindly.
- **Reversibility flavour:** S1's migration is ADDITIVE on a pre-existing table, so PI1 asserts
  row-preservation on downgrade. The reversibility ROUND-TRIP that reconstructs `inventory_code`
  is S2's (contract) concern, not S1's — do not conflate.

## Decisions (for the PO at Gate 2)

- **OD1-inventory-code-composition (RESOLVED by S1):** `inventory_code` = hyphen-delimited
  `location-batch-serial`, variable width; segment 2 = batch, segment 3 = serial; leading
  segment is NOT authoritative for `location` (canonical column stays). Resolves F1's deferred
  OD2; consistent with F1's canonical `location` column — no contradiction with gated F1 ACs.
  **Recommendation: accept.**
- **OD2-nonconforming-remediation (DEFERRED):** whether NULL batch/serial rows need a
  remediation path before S2 drops `inventory_code`. **Recommendation: defer to S2 review,
  gated on the AC3 probe count** — proceed with S1 as specified regardless.

## Test strategy

Real integration tests against the paired Lakebase branch (pytest-bdd; Alembic applied to the
branch first; FK-aware targeted-DELETE cleanup). No mocks/stubs/in-memory DB (R4). ACs verified
through this suite: AC1 (conforming backfill), AC2 (nonconforming → NULL + row survival),
AC3 (integrity-probe count over mixed rows), AC4 (canonical location untouched). Persistence
invariants get a real-branch test each: PI1 (additive downgrade/upgrade round-trip preserving
rows), PI2 (migration atomicity). NFR fitness tests: R1 row survival + reversibility, R2
preserved non-negative CHECK, R3 preserved UNIQUE(sku,location).

**Test isolation (PI1 / R1 reversibility):** the reversibility round-trip is the ONLY F6 test
that mutates schema (it runs `alembic downgrade -1` then re-upgrades). It MUST be marked as a
schema-mutating migration test (`@pytest.mark.migration`) so it runs on its own isolated
ephemeral branch, NOT the shared post-migration verify DB. All other F6 tests (AC1 backfill,
AC2 NULL-survival, AC3 probe, AC4 location) assume the post-migration schema is intact; a
downgrade on the shared branch would drop `batch_number`/`serial_number` and break them with
'column batch_number does not exist' on an otherwise-correct migration.

## Sign-off

**Recommendation: proceed.** Layer assignments, layering (reused F1 convention), and NFR
coverage (R1–R5 + config-in-env) are in place; the one substantive open item
(OD2-nonconforming-remediation) is correctly deferred to S2 and gated on the AC3 probe count.
— Architect Reviewer
