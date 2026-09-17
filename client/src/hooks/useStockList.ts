import { useEffect, useState } from "react";
import { listStock, type StockRecord } from "../api/stock";

export type StockListState =
  | { status: "loading" }
  | { status: "ok"; records: StockRecord[] }
  | { status: "error"; message: string };

// Hooks hold data-fetching + UI state; they call the api/ layer and never fetch
// directly. Pass an optional location to scope the list to one location.
export function useStockList(location?: string): StockListState {
  const [state, setState] = useState<StockListState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });
    listStock(location)
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
  }, [location]);

  return state;
}
