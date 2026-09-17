/**
 * T24 [AC1-lists-stock-across-locations]: navigating to the SKU detail route
 * for a SKU with stock at multiple locations renders one stock-table row per
 * location with location and quantity visible (real Playwright e2e against live
 * paired-branch DB, no mocks).
 *
 * STATE OWNERSHIP: seeds one SKU at two per-run-unique locations via the real
 * API. Asserts only those rows appear in the SKU detail view. Cleans up after.
 */
import { test, expect } from "@playwright/test";

test("T24 SKU detail route renders one row per location with location and quantity", async ({ page, request }) => {
  const sku = `SKU-T24-${crypto.randomUUID()}`;
  const loc1 = `LOC-T24A-${crypto.randomUUID()}`;
  const loc2 = `LOC-T24B-${crypto.randomUUID()}`;

  // Seed two stock records for the same SKU at two different locations
  for (const [loc, qty] of [[loc1, 5], [loc2, 15]] as [string, number][]) {
    const res = await request.post("/api/stock", {
      data: { sku, location: loc, quantity: qty, inventory_code: "INV-T24" },
    });
    expect(res.ok()).toBeTruthy();
  }

  try {
    // Navigate to the SKU detail route
    await page.goto(`/sku/${encodeURIComponent(sku)}`);

    // The stock table for this SKU must be visible
    const table = page.getByTestId("sku-stock-table");
    await expect(table).toBeVisible({ timeout: 15_000 });

    // One row per location – keyed by location
    const row1 = table.getByTestId(`stock-row-${loc1}`);
    const row2 = table.getByTestId(`stock-row-${loc2}`);
    await expect(row1).toBeVisible();
    await expect(row2).toBeVisible();

    // Each row shows location and quantity
    await expect(row1).toContainText(loc1);
    await expect(row1).toContainText("5");
    await expect(row2).toContainText(loc2);
    await expect(row2).toContainText("15");
  } finally {
    for (const loc of [loc1, loc2]) {
      await request.delete(`/api/stock/${encodeURIComponent(sku)}/${encodeURIComponent(loc)}`).catch(() => {});
    }
  }
});
