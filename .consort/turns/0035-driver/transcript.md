# driver (driver) – opus

## Prompt

```
Make ALL of story S1-file-stock's failing tests GREEN in one pass (simplest honest code); implement until every one of the story's tests passes, then run the story's tests once. UI track is ON: the UI must adhere to the project design guide at <PROJECT_ROOT>/.consort/design/design-guide.md (+ the design-guide.json tokens). Build to it. RUBRIC (pre-extracted; judge against THIS) :: layers=E2E, API | required NFRs, NFR-R1-migration-data-survival; NFR-R2-no-negative-no-overcommit; NFR-R3-unique-sku-location; NFR-validation-messages-name-field | design-token groups, typography, colors, spacing, radius, shadows, breakpoints, app_icon, components. The rubric above is pre-extracted from <PROJECT_ROOT>/.consort/features/F1-stock-visibility/architecture.md, <PROJECT_ROOT>/.consort/nfrs.md, and <PROJECT_ROOT>/.consort/design/design-guide.md, open those full files ONLY if you need more detail than it carries (do not re-read them by default). LAYOUT (place/judge code at THESE paths, do not scan for them) :: boundary=app/routes (react) | service=app/services | repository=app/repositories | models=app/models. RUN/REACHABILITY :: python project – source under app/. To confirm the app boots or is reachable, run `uv run uvicorn app.main:app` and GET the health path over HTTP. Reachability is an HTTP response, never just an import succeeding. TESTS :: this story's tests are under tests/step_defs/ (behavior, one file per story) and tests/architecture/ (fitness: layering, persistence invariants, migration reversibility). Read those named paths directly; do NOT find/grep/ls to locate them. Iterate against the single failing test while fixing; the honest-GREEN verify is the authoritative full run. FAILING TEST (make THIS pass; do NOT search for it) ::
```python
"""Step definitions for S1-file-stock AC2 (T10-T12, T15-T19)."""

import uuid

import pytest
from fastapi.testclient import TestClient
from pytest_bdd import given, scenarios, then, when

from app.main import app

scenarios("../features/S1-file-stock.feature")

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def http():
    return TestClient(app)


@pytest.fixture()
def ctx():
    """Mutable shared context bag for steps within a scenario."""
    return {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_BASE = "/api/stock"
_VALID = {
    "sku": "SKU-DEFAULT",
    "location": "LOC-DEFAULT",
    "quantity": 1,
    "inventory_code": "IC-DEFAULT",
}


def _file(http_client, sku, location, quantity, inventory_code):
    return http_client.post(
        _BASE,
        json={
            "sku": sku,
            "location": location,
            "quantity": quantity,
            "inventory_code": inventory_code,
        },
    )


def _get(http_client, sku, location):
    return http_client.get(_BASE, params={"sku": sku, "location": location})


def _cleanup(http_client, *pairs):
    """Best-effort DELETE after each scenario to avoid row leakage."""
    for sku, location in pairs:
        http_client.delete(_BASE, params={"sku": sku, "location": location})


# ---------------------------------------------------------------------------
# T10 – happy-path read-back
# ---------------------------------------------------------------------------


@given("a unique SKU and location for this run")
def t10_seed_keys(ctx):
    run = uuid.uuid4().hex[:8]
    ctx["sku"] = f"T10-SKU-{run}"
    ctx["location"] = f"T10-LOC-{run}"


@when("I file a stock record with quantity 42 and inventory_code \"IC-ALPHA\"")
def t10_file(ctx, http):
    run_sku = ctx["sku"]
    run_loc = ctx["location"]
    # ensure idempotency: delete any leftover row first
    http.delete(_BASE, params={"sku": run_sku, "location": run_loc})
    resp = _file(http, run_sku, run_loc, 42, "IC-ALPHA")
    ctx["file_resp"] = resp


@when("I retrieve the stock record by sku and location")
def t10_retrieve(ctx, http):
    ctx["get_resp"] = _get(http, ctx["sku"], ctx["location"])


@then("the response quantity is 42")
def t10_qty(ctx, http):
    resp = ctx["get_resp"]
    assert resp.status_code == 200, resp.text
    assert resp.json()["quantity"] == 42
    _cleanup(http, (ctx["sku"], ctx["location"]))


@then("the response inventory_code is \"IC-ALPHA\"")
def t10_inv(ctx):
    assert ctx["get_resp"].json()["inventory_code"] == "IC-ALPHA"


# ---------------------------------------------------------------------------
# T11 – same SKU, two locations
# ---------------------------------------------------------------------------


@given("a unique SKU and two distinct locations for this run")
def t11_seed_keys(ctx):
    run = uuid.uuid4().hex[:8]
    ctx["sku"] = f"T11-SKU-{run}"
    ctx["loc_a"] = f"T11-LOCA-{run}"
    ctx["loc_b"] = f"T11-LOCB-{run}"


@when("I file the SKU at location A with quantity 10 and inventory_code \"IC-A\"")
def t11_file_a(ctx, http):
    http.delete(_BASE, params={"sku": ctx["sku"], "location": ctx["loc_a"]})
    _file(http, ctx["sku"], ctx["loc_a"], 10, "IC-A")


@when("I file the SKU at location B with quantity 20 and inventory_code \"IC-B\"")
def t11_file_b(ctx, http):
    http.delete(_BASE, params={"sku": ctx["sku"], "location": ctx["loc_b"]})
    _file(http, ctx["sku"], ctx["loc_b"], 20, "IC-B")


@when("I retrieve the stock record for location A")
def t11_get_a(ctx, http):
    ctx["resp_a"] = _get(http, ctx["sku"], ctx["loc_a"])


@then("the response quantity is 10 and inventory_code is \"IC-A\"")
def t11_assert_a(ctx):
    d = ctx["resp_a"].json()
    assert ctx["resp_a"].status_code == 200, ctx["resp
… (truncated; read the full file if needed)
``` Be terse: produce ONLY the required artifact file(s) on disk, then stop with at most a one-line confirmation. Do NOT print a plan, a summary of what you did, rationale, tables, or restate the artifacts to stdout, that output is wasted latency. The files on disk are the deliverable, not your prose.
```

## Tools used

- Bash {"command":"git log --oneline -5 && echo \"---\" && ls app/ 2>/dev/null && echo \"--- routes ---\" && ls app/routes app/services app/repositories app/models 2>/dev/null && echo \"--- tests ---\" && cat tests/step_defs/test_S1_file_stock.py 2>/dev/null | head -300","description":"Inspect repo state"}
- Bash {"command":"for f in app/routes/stock.py app/services/stock_service.py app/repositories/stock_repository.py app/models/stock_record.py; do echo \"===== $f =====\"; cat \"$f\"; done","description":"Read existing stock code"}
- Read {"file_path":"<PROJECT_ROOT>/app/routes/stock.py"}
- Read {"file_path":"<PROJECT_ROOT>/app/services/stock_service.py"}
- Read {"file_path":"<PROJECT_ROOT>/app/repositories/stock_repository.py"}
- Read {"file_path":"<PROJECT_ROOT>/app/models/stock_record.py"}
- Bash {"command":"echo \"=== test tail ===\" && tail -20 tests/step_defs/test_S1_file_stock.py && echo \"=== feature ===\" && cat tests/features/S1-file-stock.feature","description":"Read test tail and feature file"}
- Edit {"replace_all":false,"file_path":"<PROJECT_ROOT>/app/repositories/stock_repository.py","old_string":"def add_or_update_stock(","new_string":"def delete_by_sku_location(db: Session, sku: str, location: str) -> bool:\n    \"\"\"Delete the row for (sku, location) if present. Returns True when a row was\n    removed. Flushes; the caller (service) owns the commit.\"\"\"\n    record = get_by_sku_location(db, sku, location)\n    if record is None:\n        return False\n    db.delete(record)\n    db.flush()\n    return True\n\n\ndef add_or_update_stock("}
- Edit {"replace_all":false,"file_path":"<PROJECT_ROOT>/app/services/stock_service.py","old_string":"    return stock_repository.add_or_update_stock(\n        db, sku=sku, location=location, quantity=quantity, inventory_code=inventory_code\n    )","new_string":"    return stock_repository.add_or_update_stock(\n        db, sku=sku, location=location, quantity=quantity, inventory_code=inventory_code\n    )\n\n\ndef get_stock(db: Session, sku: str, location: str) -> StockRecord | None:\n    \"\"\"Read the stock record for a (sku, location) pair, or None if absent.\"\"\"\n    return stock_repository.get_by_sku_location(db, sku, location)\n\n\ndef delete_stock(db: Session, sku: str, location: str) -> bool:\n    \"\"\"Delete the stock record for a (sku, location) pair. Returns True when a\n    row was removed.\"\"\"\n    return stock_repository.delete_by_sku_location(db, sku, location)"}
- Edit {"replace_all":false,"file_path":"<PROJECT_ROOT>/app/routes/stock.py","old_string":"from fastapi import APIRouter, Depends, HTTPException","new_string":"from fastapi import APIRouter, Depends, HTTPException, Query, Response"}
- Edit {"replace_all":false,"file_path":"<PROJECT_ROOT>/app/routes/stock.py","old_string":"    return StockRecordResponse(\n        id=record.id,\n        sku=record.sku,\n        location=record.location,\n        quantity=record.quantity,\n        inventory_code=record.inventory_code,\n    )","new_string":"    return StockRecordResponse(\n        id=record.id,\n        sku=record.sku,\n        location=record.location,\n        quantity=record.quantity,\n        inventory_code=record.inventory_code,\n    )\n\n\n@router.get(\"\", response_model=StockRecordResponse)\ndef get_stock(\n    sku: str = Query(...),\n    location: str = Query(...),\n    db: Session = Depends(get_db),\n):\n    record = stock_service.get_stock(db, sku=sku, location=location)\n    if record is None:\n        raise HTTPException(\n            status_code=404,\n            detail={\"field\": \"sku\", \"message\": \"stock record not found\"},\n        )\n    return StockRecordResponse(\n        id=record.id,\n        sku=record.sku,\n        location=record.location,\n        quantity=record.quantity,\n        inventory_code=record.inventory_code,\n    )\n\n\n@router.delete(\"\", status_code=204)\ndef delete_stock(\n    sku: str = Query(...),\n    location: str = Query(...),\n    db: Session = Depends(get_db),\n):\n    stock_service.delete_stock(db, sku=sku, location=location)\n    db.commit()\n    return Response(status_code=204)"}
- Bash {"command":"uv run pytest tests/step_defs/test_S1_file_stock.py -q 2>&1 | tail -25","description":"Run story tests"}

## Final reasoning

All 8 scenarios (T10–T12, T15–T19) pass GREEN.
