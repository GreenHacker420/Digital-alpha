import type { Filters, SortState } from "./types";

export const queryKeys = {
  transactions: (filters: Filters, page: number, sort: SortState) =>
    ["transactions", filters, page, sort] as const,
  transactionMeta: ["transaction-meta"] as const,
  analytics: (filters: Filters) => ["analytics", filters] as const,
  balance: ["balance"] as const,
  rewards: ["rewards"] as const,
};
