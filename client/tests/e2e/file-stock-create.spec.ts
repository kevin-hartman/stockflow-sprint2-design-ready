/**
 * T13: navigating to /adjust and submitting the file-stock form with valid
 * sku, location, quantity, and inventory_code creates a stock record and the
 * browser renders the created-record confirmation from the live API response.
 * Real Playwright e2e, no mocks.
 */
import { test, expect } from "@playwright/test";

test("T13 file-stock form creates a record and shows confirmation", async ({ page }) => {
  const sku = `SKU-${crypto.randomUUID()}`;
  const loc = `LOC-${crypto.randomUUID()}`;

  await page.goto("/adjust");

  // Form must be present
  await expect(page.getByTestId("file-stock-form")).toBeVisible({ timeout: 10_000 });

  await page.getByTestId("field-sku").fill(sku);
  await page.getByTestId("field-location").fill(loc);
  await page.getByTestId("field-quantity").fill("42");
  await page.getByTestId("field-inventory-code").fill("INV-E2E");

  await page.getByTestId("btn-submit").click();

  // Confirmation element must appear with the filed SKU
  const confirmation = page.getByTestId("file-stock-confirmation");
  await expect(confirmation).toBeVisible({ timeout: 15_000 });
  await expect(confirmation).toContainText(sku);
});
