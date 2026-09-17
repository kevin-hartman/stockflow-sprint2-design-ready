import { getJson, postJson } from "./client";

// api/ layer: the only layer that issues fetch. Pages/components call this typed
// wrapper, never fetch directly.
export interface StockRecord {
  id: number;
  sku: string;
  location: string;
  quantity: number;
  inventory_code: string;
}

export interface FileStockInput {
  sku: string;
  location: string;
  quantity: number;
  inventory_code: string;
}

export function fileStock(input: FileStockInput): Promise<StockRecord> {
  return postJson<StockRecord>("/api/stock", input);
}

/** List stock records, optionally scoped to a single location. */
export function listStock(location?: string): Promise<StockRecord[]> {
  const query = location ? `?location=${encodeURIComponent(location)}` : "";
  return getJson<StockRecord[]>(`/api/stock/list${query}`);
}

/** List every stock record for one SKU, across all locations. */
export function listStockBySku(sku: string): Promise<StockRecord[]> {
  return getJson<StockRecord[]>(`/api/stock/list?sku=${encodeURIComponent(sku)}`);
}
