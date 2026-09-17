/**
 * T25 [AC2-shows-tracking-code]: navigating to the SKU detail route for a SKU
 * whose stock record carries an inventory_code shows the tracking code in the
 * stock-table row alongside location and quantity (real Playwright e2e against
 * live paired-branch DB, no mocks).
 *
 * STATE OWNERSHIP: seeds one SKU+location with a per-run-unique inventory_code.
 * Asserts only that row. Cleans up after.
 */
import { test, expect } from "@playwright/test";

test("T25 SKU detail route shows inventory_code tracking code in stock-table row", async ({ page, request }) => {
  const sku = `SKU-T25-${crypto.randomUUID()}`;
  const loc = `LOC-T25-${crypto.randomUUID()}`;
  const code = `INV-T25-${crypto.randomUUID()}`;

  const res = await request.post("/api/stock", {
    data: { sku, location: loc, quantity: 8, inventory_code: code },
  });
  expect(res.ok()).toBeTruthy();

  try {
    await page.goto(`/sku/${encodeURIComponent(sku)}`);

    const table = page.getByTestId("sku-stock-table");
    await expect(table).toBeVisible({ timeout: 15_000 });

    const row = table.getByTestId(`stock-row-${loc}`);
    await expect(row).toBeVisible();

    // Row must show location, quantity, AND the tracking code
    await expect(row).toContainText(loc);
    await expect(row).toContainText("8");
    await expect(row).toContainText(code);
  } finally {
    await request.delete(`/api/stock/${encodeURIComponent(sku)}/${encodeURIComponent(loc)}`).catch(() => {});
  }
});
