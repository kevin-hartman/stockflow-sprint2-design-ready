import { postJson } from "./client";

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
