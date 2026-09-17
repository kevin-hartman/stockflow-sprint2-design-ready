import { test, expect } from "@playwright/test";

// The home route ('/') renders the real stock-by-location table. This spec
// supersedes the placeholder status-badge starter: it seeds a row via the real
// API, confirms it appears in the table, then cleans up. No mocks.
test("home page renders the stock table", async ({ page, request }) => {
  const sku = `SKU-HOME-${crypto.randomUUID()}`;
  const loc = `LOC-HOME-${crypto.randomUUID()}`;

  const res = await request.post("/api/stock", {
    data: { sku, location: loc, quantity: 7, inventory_code: "INV-HOME" },
  });
  expect(res.ok()).toBeTruthy();

  try {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const table = page.getByTestId("stock-table");
    await expect(table).toBeVisible({ timeout: 15_000 });
    await expect(table.getByTestId(`stock-row-${sku}`)).toBeVisible();
  } finally {
    await request
      .delete(`/api/stock/${encodeURIComponent(sku)}/${encodeURIComponent(loc)}`)
      .catch(() => {});
  }
});
