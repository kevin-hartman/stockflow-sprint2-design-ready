/**
 * T27 [AC4-sku-with-no-stock-empty-state]: navigating to the SKU detail route
 * for a SKU that holds no stock at any location renders an element carrying the
 * empty-state class indicating no stock, never a blank page or an error (real
 * Playwright e2e against live paired-branch DB, no mocks).
 *
 * STATE OWNERSHIP: navigates to a per-run-unique SKU that was never seeded.
 * No rows exist for that SKU so the empty state is owned by this test run.
 * Nothing to clean up (no rows written).
 */
import { test, expect } from "@playwright/test";

test("T27 SKU detail route renders empty-state element for a SKU with no stock", async ({ page }) => {
  // A UUID-keyed SKU that was never seeded – guaranteed no stock rows
  const sku = `SKU-T27-EMPTY-${crypto.randomUUID()}`;

  await page.goto(`/sku/${encodeURIComponent(sku)}`);

  // An explicit empty-state element must be present, not a blank page or error
  const emptyState = page.getByTestId("sku-no-stock-empty-state");
  await expect(emptyState).toBeVisible({ timeout: 15_000 });
  await expect(emptyState).toHaveClass(/empty-state/);

  // Must carry some meaningful text (not blank)
  const text = await emptyState.innerText();
  expect(text.trim()).not.toBe("");
  expect(text.toLowerCase()).not.toContain("error");

  // The stock table must NOT be rendered (no rows to show)
  await expect(page.getByTestId("sku-stock-table")).not.toBeVisible();
});
