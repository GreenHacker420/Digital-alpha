export type Money = number | string;

export type Transaction = {
  id: string;
  merchant_name: string;
  category: string;
  amount: Money;
  currency: string;
  status: string;
  occurred_at: string;
  payment_method: string | null;
  reference_id: string | null;
  description: string | null;
};

export type TransactionsPage = {
  items: Transaction[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
};

export type TransactionMeta = {
  categories: string[];
  statuses: string[];
  min_amount: Money | null;
  max_amount: Money | null;
  min_date: string | null;
  max_date: string | null;
};

export type SpendAnalytics = {
  total_spend: Money;
  successful_transactions: number;
  categories: Array<{ category: string; amount: Money; count: number }>;
  monthly: Array<{ month: string; amount: Money; count: number }>;
};

export type Reward = {
  id: string;
  title: string;
  description: string;
  coin_cost: number;
  kind: string;
  value_label: string;
};

export type CoinBalance = { balance: number };

export type RedeemResponse = {
  redemption_id: string;
  reward: Reward;
  balance: number;
  redeemed_at: string;
};

export type Filters = {
  q: string;
  category: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  amountMin: string;
  amountMax: string;
};

export type SortState = {
  by: "occurred_at" | "amount";
  direction: "asc" | "desc";
};
