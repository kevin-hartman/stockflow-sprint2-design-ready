/**
 * T21 [AC1-table-lists-stock-by-location]: navigating to the home route ('/')
 * in a live browser against the real API renders a flat stock table listing one
 * row per (sku, location, quantity) record for every record returned by the
 * global unfiltered stock-list endpoint (real Playwright e2e, no mocks).
 *
 * STATE OWNERSHIP: seeds two rows with per-run-unique SKUs, asserts only those
 * own rows appear in the table (scoped assertion), then deletes them via the
 * API after the test.
 */
import { test, expect } from "@playwright/test";

test("T21 home route renders a stock table row for each seeded record", async ({ page, request }) => {
  const sku1 = `SKU-T21A-${crypto.randomUUID()}`;
  const sku2 = `SKU-T21B-${crypto.randomUUID()}`;
  const loc = `LOC-T21-${crypto.randomUUID()}`;

  // Seed via the real API
  for (const [sku, qty] of [[sku1, 10], [sku2, 20]] as [string, number][]) {
    const res = await request.post("/api/stock", {
      data: { sku, location: loc, quantity: qty, inventory_code: "INV-T21" },
    });
    expect(res.ok()).toBeTruthy();
  }

  try {
    await page.goto("/");
    // The stock table must be present
    const table = page.getByTestId("stock-table");
    await expect(table).toBeVisible({ timeout: 15_000 });

    // Both seeded rows must appear (scoped to our unique SKUs)
    await expect(table.getByTestId(`stock-row-${sku1}`)).toBeVisible();
    await expect(table.getByTestId(`stock-row-${sku2}`)).toBeVisible();
  } finally {
    // Clean up seeded rows so state does not leak
    for (const sku of [sku1, sku2]) {
      await request.delete(`/api/stock/${encodeURIComponent(sku)}/${encodeURIComponent(loc)}`).catch(() => {});
    }
  }
});
