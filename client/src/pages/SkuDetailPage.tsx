import { useParams } from "react-router-dom";
import { useSkuStock } from "../hooks/useSkuStock";

// SKU detail: lists every location holding a SKU, its quantity and inventory
// (tracking) code. Par level is not tracked in V1 so it always shows an explicit
// "not tracked" empty-state, never a blank or raw null. A SKU with no stock at
// any location shows an explicit no-stock empty-state, never a blank page.
// Composes the design vocabulary (.page/.card/.stock-table/.empty-state).
export function SkuDetailPage() {
  const params = useParams<{ sku: string }>();
  const sku = params.sku ?? "";
  const stock = useSkuStock(sku);

  return (
    <main className="page">
      <div className="page__header">
        <h1 className="page__title">
          <img className="page__title-icon" src="/favicon.svg" alt="" />
          <span>SKU {sku}</span>
        </h1>
      </div>

      {/* Par level is not tracked in V1 — always an explicit indication. */}
      <div className="card">
        <p className="empty-state" data-testid="par-level-status">
          Par level: not tracked
        </p>
      </div>

      {stock.status === "loading" && (
        <p className="card" data-testid="sku-loading" role="status" aria-live="polite">
          Loading stock…
        </p>
      )}

      {stock.status === "error" && (
        <p className="toast toast--error" data-testid="sku-error" role="alert">
          Could not load stock: {stock.message}
        </p>
      )}

      {stock.status === "ok" && stock.records.length === 0 && (
        <div className="empty-state" data-testid="sku-no-stock-empty-state">
          <p className="empty-state__title">No stock for this SKU</p>
          <p>This SKU holds no stock at any location.</p>
        </div>
      )}

      {stock.status === "ok" && stock.records.length > 0 && (
        <div className="card">
          <table className="stock-table" data-testid="sku-stock-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Tracking code</th>
                <th className="stock-table__num">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {stock.records.map((r) => (
                <tr key={r.location} data-testid={`stock-row-${r.location}`}>
                  <td>{r.location}</td>
                  <td>{r.inventory_code}</td>
                  <td className="stock-table__num" data-testid="stock-cell-quantity">
                    {r.quantity}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
