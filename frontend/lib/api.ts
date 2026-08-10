import type {
  CoinBalance,
  Filters,
  RedeemResponse,
  Reward,
  SortState,
  SpendAnalytics,
  TransactionMeta,
  TransactionsPage,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function readErrorMessage(status: number, detail: unknown) {
  if (typeof detail === "object" && detail !== null && "detail" in detail) {
    const value = (detail as { detail?: unknown }).detail;
    if (typeof value === "string" && value.trim()) return value;
  }
  return `Request failed with ${status}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = undefined;
    }
    throw new ApiError(readErrorMessage(response.status, detail), response.status, detail);
  }

  return response.json() as Promise<T>;
}

function addFilters(params: URLSearchParams, filters: Filters) {
  const search = filters.q.trim();
  if (search) params.set("q", search);
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.dateFrom) params.set("date_from", `${filters.dateFrom}T00:00:00Z`);
  if (filters.dateTo) params.set("date_to", `${filters.dateTo}T23:59:59.999Z`);
  if (filters.amountMin.trim()) params.set("amount_min", filters.amountMin.trim());
  if (filters.amountMax.trim()) params.set("amount_max", filters.amountMax.trim());
}

export async function fetchTransactions(
  filters: Filters,
  page: number,
  sort: SortState,
  signal?: AbortSignal,
): Promise<TransactionsPage> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: "50",
    sort_by: sort.by,
    sort_direction: sort.direction,
  });
  addFilters(params, filters);
  return request(`/transactions?${params}`, { signal });
}

export const fetchTransactionMeta = (signal?: AbortSignal) =>
  request<TransactionMeta>("/transactions/meta", { signal });

export async function fetchAnalytics(filters: Filters, signal?: AbortSignal): Promise<SpendAnalytics> {
  const params = new URLSearchParams();
  addFilters(params, filters);
  const suffix = params.size ? `?${params}` : "";
  return request(`/analytics/spend${suffix}`, { signal });
}

export const fetchBalance = (signal?: AbortSignal) =>
  request<CoinBalance>("/rewards/balance", { signal });

export const fetchRewards = (signal?: AbortSignal) =>
  request<Reward[]>("/rewards/catalog", { signal });

export const redeemReward = (rewardId: string) =>
  request<RedeemResponse>("/rewards/redeem", {
    method: "POST",
    body: JSON.stringify({ reward_id: rewardId }),
  });
