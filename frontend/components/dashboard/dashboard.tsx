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
import { GlowBorder } from "@/components/ui/glow-border";
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

function OverviewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </svg>
  );
}

function TransactionsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M5 12h14M5 17h9" />
      <path d="M3.5 7h.01M3.5 12h.01M3.5 17h.01" />
    </svg>
  );
}

function RewardsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s7-3.6 7-10V5l-7-2-7 2v6c0 6.4 7 10 7 10Z" />
      <path d="m9.4 11.4 1.7 1.7 3.7-4" />
    </svg>
  );
}

function RailNav() {
  return (
    <nav className="rail-nav" aria-label="Primary navigation">
      <a className="active" href="#top">
        <OverviewIcon />
        <span>Overview</span>
      </a>
      <a href="#transactions">
        <TransactionsIcon />
        <span>Transactions</span>
      </a>
      <a href="#rewards">
        <RewardsIcon />
        <span>Rewards</span>
      </a>
    </nav>
  );
}

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

  const matchingTransactions = transactions.data?.total.toLocaleString("en-IN") ?? "—";
  const successfulTransactions = analytics.data?.successful_transactions.toLocaleString("en-IN") ?? "—";

  return (
    <main className="app-shell">
      <aside className="app-rail">
        <a className="rail-brand" href="#top" aria-label="ArcPay home">
          <span className="brand-mark">A</span>
          <span>
            <strong>ArcPay</strong>
            <small>Personal finance</small>
          </span>
        </a>

        <RailNav />

        <div className="rail-status">
          <div className="rail-status__pulse"><i /> Connected</div>
          <p>10k-row PostgreSQL ledger with live server filtering.</p>
        </div>

        <a className="rail-balance" href="#rewards">
          <span className="coin-mark" aria-hidden="true">◆</span>
          <div>
            <small>Reward balance</small>
            <strong>{visibleBalance}</strong>
          </div>
          <span aria-hidden="true">→</span>
        </a>
      </aside>

      <div className="workspace">
        <header className="workspace-topbar">
          <div>
            <span className="workspace-breadcrumb">Workspace / Overview</span>
            <h1>Spending overview</h1>
          </div>
          <div className="workspace-actions">
            <span className="live-pill"><i /> Live data</span>
            <a className="mobile-balance" href="#rewards">
              <span className="coin-mark" aria-hidden="true">◆</span>
              <strong>{visibleBalance}</strong>
            </a>
          </div>
        </header>

        <div className="workspace-content" id="top">
          <section className="overview-section" aria-label="Account summary">
            <article className="spend-overview-card">
              <div className="ambient-grid" aria-hidden="true" />
              <div className="spend-overview-card__head">
                <div>
                  <span className="overline">Total eligible spend</span>
                  <strong>{analytics.data ? formatCompactMoney(analytics.data.total_spend) : "—"}</strong>
                </div>
                <span className="period-chip">Jul 2025 — Jul 2026</span>
              </div>
              <p>Successful, positive, non-anomalous card payments in the current filter context.</p>
              <div className="spend-overview-card__meta">
                <span><b>{successfulTransactions}</b> successful</span>
                <span><b>{matchingTransactions}</b> matching records</span>
                <span><b>11</b> spend categories</span>
              </div>
            </article>

            <article className="summary-card">
              <div className="summary-card__icon"><TransactionsIcon /></div>
              <span>Matching transactions</span>
              <strong>{matchingTransactions}</strong>
              <p>Server-filtered and paginated, never 10,000 DOM rows at once.</p>
              <a href="#transactions">Open ledger <span aria-hidden="true">↘</span></a>
            </article>

            <GlowBorder className="summary-card summary-card--reward">
              <div className="summary-card__icon summary-card__icon--coin">◆</div>
              <span>Available rewards</span>
              <strong>{visibleBalance}</strong>
              <p>Ledger-derived coins, ready for an atomic redemption.</p>
              <a href="#rewards">View rewards <span aria-hidden="true">↘</span></a>
            </GlowBorder>
          </section>

          <section className="analytics-section" aria-labelledby="analytics-title">
            <div className="section-heading section-heading--compact">
              <div>
                <span className="section-index">01</span>
                <div>
                  <p className="eyebrow">Insights</p>
                  <h2 id="analytics-title">Where the money moves</h2>
                </div>
              </div>
              <p>Interactive category mix and monthly spend movement. Selecting a category updates the ledger below.</p>
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
            <div className="section-heading section-heading--compact">
              <div>
                <span className="section-index">02</span>
                <div>
                  <p className="eyebrow">Ledger</p>
                  <h2>Transactions</h2>
                </div>
              </div>
              <span className="section-meta">{matchingTransactions} matching</span>
            </div>

            <div className="ledger-surface">
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
            </div>
          </section>

          <Rewards />

          <footer className="app-footer">
            <span>ArcPay / Digital Alpha Technologies</span>
            <span>Built for the Full Stack Engineer take-home</span>
          </footer>
        </div>
      </div>

      <div className="mobile-dock">
        <RailNav />
      </div>

      <TransactionModal transaction={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
