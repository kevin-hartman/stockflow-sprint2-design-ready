import { useEffect, useState } from "react";
import { listStockBySku, type StockRecord } from "../api/stock";

export type SkuStockState =
  | { status: "loading" }
  | { status: "ok"; records: StockRecord[] }
  | { status: "error"; message: string };

// Holds the stock records for a single SKU across all locations. Calls the api/
// layer, never fetches directly.
export function useSkuStock(sku: string): SkuStockState {
  const [state, setState] = useState<SkuStockState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    listStockBySku(sku)
      .then((records) => {
        if (!cancelled) setState({ status: "ok", records });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "unknown error",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [sku]);

  return state;
}
