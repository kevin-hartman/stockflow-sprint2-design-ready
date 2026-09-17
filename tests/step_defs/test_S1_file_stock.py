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
    assert ctx["resp_a"].status_code == 200, ctx["resp_a"].text
    assert d["quantity"] == 10
    assert d["inventory_code"] == "IC-A"


@when("I retrieve the stock record for location B")
def t11_get_b(ctx, http):
    ctx["resp_b"] = _get(http, ctx["sku"], ctx["loc_b"])


@then("the response quantity is 20 and inventory_code is \"IC-B\"")
def t11_assert_b(ctx, http):
    d = ctx["resp_b"].json()
    assert ctx["resp_b"].status_code == 200, ctx["resp_b"].text
    assert d["quantity"] == 20
    assert d["inventory_code"] == "IC-B"
    _cleanup(http, (ctx["sku"], ctx["loc_a"]), (ctx["sku"], ctx["loc_b"]))


# ---------------------------------------------------------------------------
# T12 – re-file updates in place
# ---------------------------------------------------------------------------


@given("a unique SKU and location for re-file")
def t12_seed_keys(ctx):
    run = uuid.uuid4().hex[:8]
    ctx["sku"] = f"T12-SKU-{run}"
    ctx["location"] = f"T12-LOC-{run}"


@when("I file a stock record with quantity 5 and inventory_code \"IC-ORIG\"")
def t12_file_first(ctx, http):
    http.delete(_BASE, params={"sku": ctx["sku"], "location": ctx["location"]})
    _file(http, ctx["sku"], ctx["location"], 5, "IC-ORIG")


@when("I file the same sku and location again with quantity 99 and inventory_code \"IC-NEW\"")
def t12_file_second(ctx, http):
    _file(http, ctx["sku"], ctx["location"], 99, "IC-NEW")


@when("I retrieve the stock record by sku and location", target_fixture="t12_retrieve")
def t12_retrieve_step(ctx, http):
    ctx["get_resp"] = _get(http, ctx["sku"], ctx["location"])
    return ctx["get_resp"]


@then("the response quantity is 99")
def t12_qty(ctx, http):
    resp = ctx["get_resp"]
    assert resp.status_code == 200, resp.text
    assert resp.json()["quantity"] == 99
    _cleanup(http, (ctx["sku"], ctx["location"]))


@then("the response inventory_code is \"IC-NEW\"")
def t12_inv(ctx):
    assert ctx["get_resp"].json()["inventory_code"] == "IC-NEW"


# ---------------------------------------------------------------------------
# T15-T19 – validation errors (4xx + named field)
# ---------------------------------------------------------------------------


@when("I POST a file-stock payload with quantity -1")
def t15_post(ctx, http):
    ctx["resp"] = http.post(
        _BASE,
        json={**_VALID, "sku": f"T15-{uuid.uuid4().hex[:6]}", "quantity": -1},
    )


@when('I POST a file-stock payload omitting field "sku"')
def t16_post(ctx, http):
    payload = {**_VALID, "location": f"T16-{uuid.uuid4().hex[:6]}"}
    payload.pop("sku")
    ctx["resp"] = http.post(_BASE, json=payload)


@when('I POST a file-stock payload omitting field "location"')
def t17_post(ctx, http):
    payload = {**_VALID, "sku": f"T17-{uuid.uuid4().hex[:6]}"}
    payload.pop("location")
    ctx["resp"] = http.post(_BASE, json=payload)


@when('I POST a file-stock payload omitting field "inventory_code"')
def t18_post(ctx, http):
    payload = {**_VALID, "sku": f"T18-{uuid.uuid4().hex[:6]}"}
    payload.pop("inventory_code")
    ctx["resp"] = http.post(_BASE, json=payload)


@when('I POST a file-stock payload omitting field "quantity"')
def t19_post(ctx, http):
    payload = {**_VALID, "sku": f"T19-{uuid.uuid4().hex[:6]}"}
    payload.pop("quantity")
    ctx["resp"] = http.post(_BASE, json=payload)


@then("the response is 4xx")
def assert_4xx(ctx):
    assert 400 <= ctx["resp"].status_code < 500, ctx["resp"].text


@then('the error detail names field "quantity"')
def names_quantity(ctx):
    detail = ctx["resp"].json().get("detail", {})
    assert detail.get("field") == "quantity", ctx["resp"].text


@then('the error detail names field "sku"')
def names_sku(ctx):
    detail = ctx["resp"].json().get("detail", {})
    assert detail.get("field") == "sku", ctx["resp"].text


@then('the error detail names field "location"')
def names_location(ctx):
    detail = ctx["resp"].json().get("detail", {})
    assert detail.get("field") == "location", ctx["resp"].text


@then('the error detail names field "inventory_code"')
def names_inventory_code(ctx):
    detail = ctx["resp"].json().get("detail", {})
    assert detail.get("field") == "inventory_code", ctx["resp"].text
