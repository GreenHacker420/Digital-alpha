import type { Filters, SortState } from "./types";

export const EMPTY_FILTERS: Filters = {
  q: "",
  category: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
};

export const DEFAULT_SORT: SortState = {
  by: "occurred_at",
  direction: "desc",
};
