import { Link, useSearchParams } from "react-router-dom";
import { useStockList } from "../hooks/useStockList";

// The home page lists stock by location as a flat table, one row per
// (sku, location, quantity) record. Every state (loading, error, empty,
// populated) is an explicit region, never a blank page. Uses the design
// system's .stock-table / .stock-table__num / .empty-state vocabulary.
export function HomePage() {
  const [searchParams] = useSearchParams();
  const location = searchParams.get("location") ?? undefined;
  const stock = useStockList(location);

  return (
    <main className="page">
      <div className="page__header">
        <h1 className="page__title">
          <img className="page__title-icon" src="/favicon.svg" alt="" />
          <span>Stock by location</span>
        </h1>
      </div>

      {stock.status === "loading" && (
        <p className="card" data-testid="stock-loading" role="status" aria-live="polite">
          Loading stock…
        </p>
      )}

      {stock.status === "error" && (
        <p className="toast toast--error" data-testid="stock-error" role="alert">
          Could not load stock: {stock.message}
        </p>
      )}

      {stock.status === "ok" && stock.records.length === 0 && (
        <div className="empty-state" data-testid="stock-empty">
          <p className="empty-state__title">No stock at this location</p>
          <p>Nothing has been filed here yet.</p>
        </div>
      )}

      {stock.status === "ok" && stock.records.length > 0 && (
        <div className="card">
          <table className="stock-table" data-testid="stock-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Location</th>
                <th>Inventory code</th>
                <th className="stock-table__num">Quantity</th>
              </tr>
            </thead>
            <tbody>
              {stock.records.map((r) => (
                <tr key={`${r.sku}::${r.location}`} data-testid={`stock-row-${r.sku}`}>
                  <td>
                    <Link to={`/sku/${encodeURIComponent(r.sku)}`}>{r.sku}</Link>
                  </td>
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
