"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useState } from "react";
import { fetchAnalytics, fetchBalance, fetchTransactionMeta, fetchTransactions } from "@/lib/api";
import { DEFAULT_SORT, EMPTY_FILTERS } from "@/lib/dashboard-defaults";
import { queryKeys } from "@/lib/query-keys";
import type { Filters, Transaction } from "@/lib/types";
import { formatCompactMoney } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { FilterBar } from "./filter-bar";
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
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(DEFAULT_SORT);
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
        <div className="topbar__inner">
          <a className="brand" href="#top" aria-label="ArcPay home">
            <span className="brand-mark">A</span>
            <span className="brand-copy">
              <strong>ArcPay</strong>
              <small>Card intelligence</small>
            </span>
          </a>

          <nav aria-label="Primary navigation">
            <a className="active" href="#top">Overview</a>
            <a href="#transactions">Transactions</a>
            <a href="#rewards">Rewards</a>
          </nav>

          <a
            className="header-balance"
            href="#rewards"
            aria-label={balance.isError ? "Reward balance unavailable" : `${balance.data?.balance ?? 0} reward coins`}
          >
            <span className="coin-mark" aria-hidden="true">◆</span>
            <div>
              <small>Coins</small>
              <strong>{visibleBalance}</strong>
            </div>
          </a>
        </div>
      </header>

      <div className="dashboard" id="top">
        <section className="hero-row" aria-labelledby="dashboard-title">
          <div className="hero-copy">
            <div className="hero-kicker">
              <p className="eyebrow">Personal spend intelligence</p>
              <span className="data-pill">
                <i aria-hidden="true" />
                {transactions.data?.total.toLocaleString("en-IN") ?? "10,000"} records synced
              </span>
            </div>
            <h1 id="dashboard-title">
              Every payment.
              <br />
              <em>Finally legible.</em>
            </h1>
            <p>
              Search your card history, understand where the money moved, and redeem the value you earned—without losing the thread.
            </p>
            <div className="hero-footnote">
              <span>PostgreSQL-backed</span>
              <span>Server-filtered</span>
              <span>Live rewards ledger</span>
            </div>
          </div>

          <div className="hero-metrics" aria-label="Account summary">
            <SpotlightCard className="metric-card metric-card--primary">
              <div className="metric-card__top">
                <span>Total spend</span>
                <i aria-hidden="true">↗</i>
              </div>
              <strong>{analytics.data ? formatCompactMoney(analytics.data.total_spend) : "—"}</strong>
              <p>Successful, positive payments in the current view.</p>
            </SpotlightCard>

            <SpotlightCard className="metric-card">
              <div className="metric-card__top">
                <span>Successful payments</span>
                <i className="metric-dot metric-dot--success" aria-hidden="true" />
              </div>
              <strong>{analytics.data?.successful_transactions.toLocaleString("en-IN") ?? "—"}</strong>
              <p>Filtered in real time from the transaction ledger.</p>
            </SpotlightCard>

            <SpotlightCard className="metric-card metric-card--coin">
              <div className="metric-card__top">
                <span>Rewards available</span>
                <i className="metric-dot metric-dot--coin" aria-hidden="true" />
              </div>
              <strong>{visibleBalance}</strong>
              <p>Coins ready to redeem from successful card payments.</p>
            </SpotlightCard>
          </div>
        </section>

        <section className="analytics-section" aria-labelledby="analytics-title">
          <div className="section-heading section-heading--analytics">
            <div>
              <p className="eyebrow">Spending</p>
              <h2 id="analytics-title">Patterns worth seeing.</h2>
            </div>
            <p>Category mix and month-by-month movement, calculated in PostgreSQL.</p>
          </div>

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
        </section>

        <section className="transactions-section" id="transactions" aria-busy={transactions.isFetching}>
          <div className="section-heading">
            <div>
              <p className="eyebrow">Transactions</p>
              <h2>Inspect the ledger, not a snapshot.</h2>
            </div>
            <span className="live-dot"><i /> Live data</span>
          </div>
          <FilterBar
            filters={filters}
            meta={meta.data}
            onChange={updateFilters}
            onClear={() => updateFilters(EMPTY_FILTERS)}
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
