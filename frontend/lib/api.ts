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
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = undefined;
    }
    throw new ApiError(`Request failed with ${response.status}`, response.status, detail);
  }

  return response.json() as Promise<T>;
}

function addFilters(params: URLSearchParams, filters: Filters) {
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (filters.status) params.set("status", filters.status);
  if (filters.dateFrom) params.set("date_from", `${filters.dateFrom}T00:00:00Z`);
  if (filters.dateTo) params.set("date_to", `${filters.dateTo}T23:59:59Z`);
  if (filters.amountMin) params.set("amount_min", filters.amountMin);
  if (filters.amountMax) params.set("amount_max", filters.amountMax);
}

export async function fetchTransactions(
  filters: Filters,
  page: number,
  sort: SortState,
): Promise<TransactionsPage> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: "50",
    sort_by: sort.by,
    sort_direction: sort.direction,
  });
  addFilters(params, filters);
  return request(`/transactions?${params}`);
}

export const fetchTransactionMeta = () => request<TransactionMeta>("/transactions/meta");

export async function fetchAnalytics(filters: Filters): Promise<SpendAnalytics> {
  const params = new URLSearchParams();
  addFilters(params, filters);
  const suffix = params.size ? `?${params}` : "";
  return request(`/analytics/spend${suffix}`);
}

export const fetchBalance = () => request<CoinBalance>("/rewards/balance");
export const fetchRewards = () => request<Reward[]>("/rewards/catalog");

export const redeemReward = (rewardId: string) =>
  request<RedeemResponse>("/rewards/redeem", {
    method: "POST",
    body: JSON.stringify({ reward_id: rewardId }),
  });
