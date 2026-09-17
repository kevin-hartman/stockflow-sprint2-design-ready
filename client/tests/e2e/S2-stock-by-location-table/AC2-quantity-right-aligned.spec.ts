/**
 * T22 [AC2-quantity-right-aligned]: navigating to the home route ('/') in a
 * live browser against the real API with rows present confirms each quantity
 * cell carries the design-guide class 'stock-table__num' (real Playwright e2e,
 * no mocks).
 *
 * STATE OWNERSHIP: seeds one row with a per-run-unique SKU, asserts only on
 * that row's quantity cell, then deletes it after.
 */
import { test, expect } from "@playwright/test";

test("T22 quantity cells carry class stock-table__num", async ({ page, request }) => {
  const sku = `SKU-T22-${crypto.randomUUID()}`;
  const loc = `LOC-T22-${crypto.randomUUID()}`;

  const res = await request.post("/api/stock", {
    data: { sku, location: loc, quantity: 55, inventory_code: "INV-T22" },
  });
  expect(res.ok()).toBeTruthy();

  try {
    await page.goto("/");
    const table = page.getByTestId("stock-table");
    await expect(table).toBeVisible({ timeout: 15_000 });

    // Locate the seeded row and its quantity cell
    const row = table.getByTestId(`stock-row-${sku}`);
    await expect(row).toBeVisible();

    const qtyCell = row.getByTestId("stock-cell-quantity");
    await expect(qtyCell).toBeVisible();

    // The quantity cell must carry the design-guide class
    await expect(qtyCell).toHaveClass(/stock-table__num/);
  } finally {
    await request.delete(`/api/stock/${encodeURIComponent(sku)}/${encodeURIComponent(loc)}`).catch(() => {});
  }
});
