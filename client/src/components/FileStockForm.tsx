import { useState } from "react";
import { fileStock, type StockRecord } from "../api/stock";
import { ApiError } from "../api/client";

// The file-stock form. Composes the design vocabulary (.page/.card/.field/.btn)
// from global.css; every state (validation, error, success) is an explicit,
// labelled region , never a blank one. Client-side required validation renders
// a `.field__error` that NAMES the offending field (NFR-validation-messages-
// name-field); a server refusal maps its `field` to the same seam.

type FieldName = "sku" | "location" | "quantity" | "inventory_code";

const FIELDS: { name: FieldName; label: string; testid: string; type: string }[] = [
  { name: "sku", label: "SKU", testid: "field-sku", type: "text" },
  { name: "location", label: "Location", testid: "field-location", type: "text" },
  { name: "quantity", label: "Quantity", testid: "field-quantity", type: "number" },
  { name: "inventory_code", label: "Inventory code", testid: "field-inventory-code", type: "text" },
];

export function FileStockForm() {
  const [values, setValues] = useState<Record<FieldName, string>>({
    sku: "",
    location: "",
    quantity: "",
    inventory_code: "",
  });
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<StockRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set(name: FieldName, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function validate(): Partial<Record<FieldName, string>> {
    const next: Partial<Record<FieldName, string>> = {};
    for (const f of FIELDS) {
      if (values[f.name].trim() === "") {
        next[f.name] = `${f.label} (${f.name}) is required`;
      }
    }
    return next;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setConfirmation(null);

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      const record = await fileStock({
        sku: values.sku.trim(),
        location: values.location.trim(),
        quantity: Number(values.quantity),
        inventory_code: values.inventory_code.trim(),
      });
      setConfirmation(record);
    } catch (err) {
      if (err instanceof ApiError && err.field) {
        setErrors({ [err.field as FieldName]: err.message });
      } else {
        setFormError(err instanceof Error ? err.message : "Failed to file stock");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card" data-testid="file-stock-form" onSubmit={onSubmit} noValidate>
      {FIELDS.map((f) => (
        <div className="field" key={f.name}>
          <label className="field__label" htmlFor={f.testid}>
            {f.label}
          </label>
          <input
            id={f.testid}
            className="field__input"
            data-testid={f.testid}
            type={f.type}
            value={values[f.name]}
            onChange={(e) => set(f.name, e.target.value)}
          />
          {errors[f.name] && (
            <span className="field__error" data-testid={`field-${f.name}-error`} role="alert">
              {errors[f.name]}
            </span>
          )}
        </div>
      ))}

      <button className="btn btn--primary" type="submit" data-testid="btn-submit" disabled={submitting}>
        {submitting ? "Filing…" : "File stock"}
      </button>

      {formError && (
        <p className="toast toast--error" data-testid="error-page" role="alert">
          {formError}
        </p>
      )}

      {confirmation && (
        <div className="toast toast--ok" data-testid="file-stock-confirmation" role="status" aria-live="polite">
          Filed {confirmation.quantity} of {confirmation.sku} at {confirmation.location} (
          {confirmation.inventory_code}).
        </div>
      )}
    </form>
  );
}
