/**
 * T20: submitting the file-stock form with a required field omitted renders
 * a .field__error element inline that names the offending field.
 * Design-guide seam: .field__error carries the field name per
 * NFR-validation-messages-name-field.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { FileStockForm } from "../../src/components/FileStockForm";

describe("T20 FileStockForm – inline validation error names the offending field", () => {
  it("shows a .field__error that names 'sku' when sku is omitted", async () => {
    render(
      <MemoryRouter>
        <FileStockForm />
      </MemoryRouter>
    );

    // Fill every field except sku
    fireEvent.change(screen.getByTestId("field-location"), { target: { value: "LOC-A" } });
    fireEvent.change(screen.getByTestId("field-quantity"), { target: { value: "10" } });
    fireEvent.change(screen.getByTestId("field-inventory-code"), { target: { value: "INV-001" } });

    fireEvent.click(screen.getByTestId("btn-submit"));

    // A .field__error element must be present and mention "sku"
    const errors = document.querySelectorAll(".field__error");
    const errorTexts = Array.from(errors).map((el) => el.textContent ?? "");
    expect(errorTexts.some((t) => /sku/i.test(t))).toBe(true);
  });

  it("shows a .field__error that names 'quantity' when quantity is omitted", async () => {
    render(
      <MemoryRouter>
        <FileStockForm />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByTestId("field-sku"), { target: { value: "SKU-X" } });
    fireEvent.change(screen.getByTestId("field-location"), { target: { value: "LOC-A" } });
    fireEvent.change(screen.getByTestId("field-inventory-code"), { target: { value: "INV-001" } });

    fireEvent.click(screen.getByTestId("btn-submit"));

    const errors = document.querySelectorAll(".field__error");
    const errorTexts = Array.from(errors).map((el) => el.textContent ?? "");
    expect(errorTexts.some((t) => /quantity/i.test(t))).toBe(true);
  });
});
