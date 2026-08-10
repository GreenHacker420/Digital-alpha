"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { fetchAnalytics, fetchBalance, fetchTransactionMeta, fetchTransactions } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Filters, SortState, Transaction } from "@/lib/types";
import { formatCompactMoney } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { emptyFilters, FilterBar } from "./filter-bar";
import { Rewards } from "./rewards";
import { TransactionModal } from "./transaction-modal";
import { TransactionsTable } from "./transactions-table";

const Analytics = dynamic(
  () => import("./analytics").then((module) => module.Analytics),
  {
    ssr: false,
    loading: () => (
      <div className="analytics-skeleton" aria-label="Loading analytics">
        <span />
        <span />
      </div>
    ),
  },
);

export function Dashboard() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ by: "occurred_at", direction: "desc" });
  const [selected, setSelected] = useState<Transaction | null>(null);
  const debouncedSearch = useDebouncedValue(filters.q, 250);
  const queryFilters: Filters = { ...filters, q: debouncedSearch };

  const transactions = useQuery({
    queryKey: queryKeys.transactions(queryFilters, page, sort),
    queryFn: ({ signal }) => fetchTransactions(queryFilters, page, sort, signal),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const meta = useQuery({
    queryKey: queryKeys.transactionMeta,
    queryFn: ({ signal }) => fetchTransactionMeta(signal),
    staleTime: Number.POSITIVE_INFINITY,
  });

  const analytics = useQuery({
    queryKey: queryKeys.analytics(queryFilters),
    queryFn: ({ signal }) => fetchAnalytics(queryFilters, signal),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const balance = useQuery({
    queryKey: queryKeys.balance,
    queryFn: ({ signal }) => fetchBalance(signal),
    staleTime: 5_000,
  });

  const updateFilters = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  const visibleBalance = balance.isError
    ? "—"
    : (balance.data?.balance ?? 0).toLocaleString("en-IN");

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ArcPay home">
          <span className="brand-mark">A</span>
          <strong>ArcPay</strong>
        </a>
        <nav aria-label="Primary navigation">
          <a className="active" href="#transactions">Overview</a>
          <a href="#transactions">Transactions</a>
          <a href="#rewards">Rewards</a>
        </nav>
        <div
          className="header-balance"
          aria-label={balance.isError ? "Reward balance unavailable" : `${balance.data?.balance ?? 0} reward coins`}
        >
          <span>◆</span>
          <div>
            <small>Coin balance</small>
            <strong>{visibleBalance}</strong>
          </div>
        </div>
      </header>

      <div className="dashboard" id="top">
        <section className="hero-row">
          <div>
            <p className="eyebrow">Your money, in focus</p>
            <h1>Spend smarter.<br /><em>Earn on the way.</em></h1>
            <p>One clear view of card payments, patterns, and the rewards they unlock.</p>
          </div>
          <div className="hero-stats">
            <div>
              <span>Total spend</span>
              <strong>{analytics.data ? formatCompactMoney(analytics.data.total_spend) : "—"}</strong>
              <small>successful payments</small>
            </div>
            <div>
              <span>Transactions</span>
              <strong>{transactions.data?.total.toLocaleString("en-IN") ?? "—"}</strong>
              <small>matching current filters</small>
            </div>
            <div className="hero-stats__accent">
              <span>Reward balance</span>
              <strong>{visibleBalance}</strong>
              <small>coins available</small>
            </div>
          </div>
        </section>

        <Analytics
          data={analytics.data}
          loading={analytics.isPending}
          error={analytics.isError}
          activeCategory={filters.category}
          onCategory={(category) =>
            updateFilters({
              ...filters,
              category: filters.category === category ? "" : category,
            })
          }
        />

        <section className="transactions-section" id="transactions" aria-busy={transactions.isFetching}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Transactions</p>
              <h2>Every payment, easy to inspect.</h2>
            </div>
            <span className="live-dot"><i /> Live data</span>
          </div>
          <FilterBar
            filters={filters}
            meta={meta.data}
            onChange={updateFilters}
            onClear={() => updateFilters(emptyFilters)}
          />
          <TransactionsTable
            data={transactions.data}
            loading={transactions.isPending}
            fetching={transactions.isFetching}
            error={transactions.isError}
            sort={sort}
            onSort={(next) => {
              setSort(next);
              setPage(1);
            }}
            onSelect={setSelected}
            onPage={setPage}
          />
        </section>

        <Rewards />

        <footer className="app-footer">
          <span>ArcPay</span>
          <span>Digital Alpha Technologies · Take-home assignment</span>
        </footer>
      </div>

      <TransactionModal transaction={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
