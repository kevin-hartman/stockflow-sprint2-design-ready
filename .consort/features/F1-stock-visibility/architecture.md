# Architecture — F1 Record and view stock by SKU and location

This is the **first feature**; the layered layout declared here becomes the
project-wide convention every later feature inherits.

## Layering summary

A service-backed, UI-track feature (persists domain entities + carries business
logic). Inward dependency direction only: boundary → service → repository → models.

| Role | Module | May import | Notes |
|------|--------|-----------|-------|
| boundary | `app/routes/` (`renders_via: react`) | service | Returns **JSON** (R5); validation + request shaping. Never touches the ORM session. |
| service | `app/services/` | repository, models | Business logic + transaction ownership (create / upsert). |
| repository | `app/repositories/` | models | The **only** layer that touches the ORM session (ORM containment). |
| models | `app/models/` (package, one module per entity: `app/models/stock_record.py`) | — | Domain entities / ORM mappings. |

The React SPA lives under `client/` and renders responses from the JSON boundary.

## Architectural Concerns Mapping

| Concern | Owner layer | Notes |
|---------|-------------|-------|
| Input validation (field-named messages) | boundary (`app/routes/`) | Preference: messages name the offending field. |
| Business rules (create, update-in-place/upsert) | service (`app/services/`) | Transaction ownership here, never the domain/model. |
| Persistence + ORM session | repository (`app/repositories/`) | Only layer touching the session; enforces PI1–PI4 via schema. |
| Uniqueness of (sku, location) | schema (repository) | DB UNIQUE constraint (PI1), not application-level checks. |
| Rendering / navigation | client (`client/`, React SPA) | Single-page, client-side nav (R5). |
| Config (DATABASE_URL) | env (twelve-factor) | Substrate-provisioned `databricks_postgres`; connection defaults untouched. |
| Observability (agent/substrate) | substrate | Not a feature NFR. |

## Pattern proposals

- Single `stock_records` table keyed by a UNIQUE `(sku, location)`; write path is an
  **upsert** (create-or-update-in-place) so the collision case (AC3) is resolved at
  write time by the constraint, not by pre-read-then-write races.
- Thin boundary → service (transaction + rules) → repository (session/CRUD) → models.
- Read-back (AC2) is a straight repository read verified end-to-end against the branch.

## Risks

- **inventory_code composition** is opaque for S1 (OD2). If a later story must decompose
  or derive it, the column may need structuring/normalizing — revisit before S2/S3 depend on it.
- **SKU/location catalog authority** (OD1): S1 lets the first filing establish a pair. A
  later "unknown SKU" rule could contradict this if it rejects a fresh SKU — flagged as an
  open decision so a resolving story reconciles against S1 rather than silently overriding it.
- R2 overcommit/no-negative is only partially exercised by S1 (non-negative CHECK, PI3); the
  overcommit-at-pick half lands in the pick/adjustment story.

## Decisions (for PO at the design gate)

- **Layout convention** — adopt `app/routes` / `app/services` / `app/repositories` /
  `app/models/` (package) as the project-wide layered layout. *Recommendation: proceed.*
- **Upsert vs. reject-on-collision** — resolve the (sku, location) collision by update-in-place
  (R3, AC3). *Recommendation: proceed (upsert).*
- **OD1 / OD2** recorded as open decisions in `architecture.json`; no S1 AC depends on their
  resolution. *Recommendation: defer, reconcile when a later story touches them.*

## Test strategy

Acceptance tests are **real integration tests against the paired Lakebase branch** (R4) —
no mocks / stubs / in-memory DB. Python: pytest-bdd (Gherkin `.feature` + `tests/step_defs/`
+ `tests/conftest.py`), Alembic migrations applied to the branch first, FK-aware
targeted-DELETE cleanup. Verified through this suite:

- **AC1** (E2E) — file a new stock record via the form → JSON API → persisted row (PI2).
- **AC2** (API) — read-back returns persisted quantity + inventory_code unchanged.
- **AC3** (E2E) — repeat write updates in place; exactly one row (PI1), no error page.
- Persistence invariants PI1–PI4 each get a real-branch test; NFR fitness clauses (R1–R5,
  layering, config-in-env, validation messages) as noted in `architecture.json`.

## Sign-off

**Recommendation: proceed.** Layer assignments complete, NFRs proposed for PO adjudication
at the design gate, no cross-cutting concern left unowned.

— Architect Reviewer
