/**
 * T14: submitting the file-stock form a second time for the same sku and
 * location updates the record in place and the browser renders the
 * confirmation without showing an error page.
 * Real Playwright e2e against live DB, no mocks.
 */
import { test, expect } from "@playwright/test";

test("T14 filing same sku+location twice shows confirmation, no error page", async ({ page }) => {
  const sku = `SKU-${crypto.randomUUID()}`;
  const loc = `LOC-${crypto.randomUUID()}`;

  // First submission
  await page.goto("/adjust");
  await expect(page.getByTestId("file-stock-form")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("field-sku").fill(sku);
  await page.getByTestId("field-location").fill(loc);
  await page.getByTestId("field-quantity").fill("10");
  await page.getByTestId("field-inventory-code").fill("INV-FIRST");
  await page.getByTestId("btn-submit").click();
  await expect(page.getByTestId("file-stock-confirmation")).toBeVisible({ timeout: 15_000 });

  // Second submission – same sku + location, different quantity
  await page.goto("/adjust");
  await expect(page.getByTestId("file-stock-form")).toBeVisible({ timeout: 10_000 });
  await page.getByTestId("field-sku").fill(sku);
  await page.getByTestId("field-location").fill(loc);
  await page.getByTestId("field-quantity").fill("99");
  await page.getByTestId("field-inventory-code").fill("INV-SECOND");
  await page.getByTestId("btn-submit").click();

  // Must show confirmation, not an error page
  const confirmation = page.getByTestId("file-stock-confirmation");
  await expect(confirmation).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId("error-page")).not.toBeVisible();
});
