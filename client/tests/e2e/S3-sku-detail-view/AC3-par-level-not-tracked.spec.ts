/**
 * T26 [AC3-par-level-not-tracked]: navigating to the SKU detail route for a
 * SKU with no par level shows an element carrying the empty-state class with
 * 'not tracked' text, never a blank region, raw null, or error (real Playwright
 * e2e against live paired-branch DB, no mocks).
 *
 * STATE OWNERSHIP: seeds one SKU+location (par level is not a stock_records
 * column in V1 – it is always absent). Asserts the par-level region shows an
 * explicit "not tracked" indication. Cleans up after.
 */
import { test, expect } from "@playwright/test";

test("T26 SKU detail route shows 'not tracked' for absent par level, not blank or null", async ({ page, request }) => {
  const sku = `SKU-T26-${crypto.randomUUID()}`;
  const loc = `LOC-T26-${crypto.randomUUID()}`;

  const res = await request.post("/api/stock", {
    data: { sku, location: loc, quantity: 3, inventory_code: "INV-T26" },
  });
  expect(res.ok()).toBeTruthy();

  try {
    await page.goto(`/sku/${encodeURIComponent(sku)}`);

    // The par-level region must carry the empty-state class
    const parLevelEl = page.getByTestId("par-level-status");
    await expect(parLevelEl).toBeVisible({ timeout: 15_000 });
    await expect(parLevelEl).toHaveClass(/empty-state/);

    // Must say "not tracked" (case-insensitive), never blank, null, or an error
    await expect(parLevelEl).toContainText("not tracked", { ignoreCase: true });

    // Must NOT contain raw "null" or be an error boundary
    const text = await parLevelEl.innerText();
    expect(text.toLowerCase()).not.toContain("null");
    expect(text.toLowerCase()).not.toContain("error");
    expect(text.trim()).not.toBe("");
  } finally {
    await request.delete(`/api/stock/${encodeURIComponent(sku)}/${encodeURIComponent(loc)}`).catch(() => {});
  }
});
