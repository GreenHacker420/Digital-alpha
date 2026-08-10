"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchAnalytics, fetchBalance, fetchTransactionMeta, fetchTransactions } from "@/lib/api";
import type { Filters, SortState, Transaction } from "@/lib/types";
import { formatCompactMoney } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Analytics } from "./analytics";
import { emptyFilters, FilterBar } from "./filter-bar";
import { Rewards } from "./rewards";
import { TransactionModal } from "./transaction-modal";
import { TransactionsTable } from "./transactions-table";

export function Dashboard() {
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ by: "occurred_at", direction: "desc" });
  const [selected, setSelected] = useState<Transaction | null>(null);
  const debouncedSearch = useDebouncedValue(filters.q, 250);
  const queryFilters = useMemo(() => ({ ...filters, q: debouncedSearch }), [debouncedSearch, filters]);

  const transactions = useQuery({
    queryKey: ["transactions", queryFilters, page, sort],
    queryFn: () => fetchTransactions(queryFilters, page, sort),
    placeholderData: keepPreviousData,
  });
  const meta = useQuery({ queryKey: ["transaction-meta"], queryFn: fetchTransactionMeta });
  const analytics = useQuery({ queryKey: ["analytics", queryFilters], queryFn: () => fetchAnalytics(queryFilters) });
  const balance = useQuery({ queryKey: ["balance"], queryFn: fetchBalance });

  const updateFilters = (next: Filters) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="ArcPay home"><span className="brand-mark">A</span><strong>ArcPay</strong></a>
        <nav aria-label="Primary navigation"><a className="active" href="#transactions">Overview</a><a href="#transactions">Transactions</a><a href="#rewards">Rewards</a></nav>
        <div className="header-balance" aria-label={`${balance.data?.balance ?? 0} reward coins`}><span>◆</span><div><small>Coin balance</small><strong>{(balance.data?.balance ?? 0).toLocaleString("en-IN")}</strong></div></div>
      </header>

      <div className="dashboard" id="top">
        <section className="hero-row">
          <div><p className="eyebrow">Your money, in focus</p><h1>Spend smarter.<br/><em>Earn on the way.</em></h1><p>One clear view of card payments, patterns, and the rewards they unlock.</p></div>
          <div className="hero-stats">
            <div><span>Total spend</span><strong>{analytics.data ? formatCompactMoney(analytics.data.total_spend) : "—"}</strong><small>successful payments</small></div>
            <div><span>Transactions</span><strong>{transactions.data?.total.toLocaleString("en-IN") ?? "—"}</strong><small>matching current filters</small></div>
            <div className="hero-stats__accent"><span>Reward balance</span><strong>{(balance.data?.balance ?? 0).toLocaleString("en-IN")}</strong><small>coins available</small></div>
          </div>
        </section>

        <Analytics data={analytics.data} loading={analytics.isPending} activeCategory={filters.category} onCategory={(category) => updateFilters({ ...filters, category: filters.category === category ? "" : category })} />

        <section className="transactions-section" id="transactions">
          <div className="section-heading"><div><p className="eyebrow">Transactions</p><h2>Every payment, easy to inspect.</h2></div><span className="live-dot"><i /> Live data</span></div>
          <FilterBar filters={filters} meta={meta.data} onChange={updateFilters} onClear={() => updateFilters(emptyFilters)} />
          <TransactionsTable
            data={transactions.data}
            loading={transactions.isPending}
            fetching={transactions.isFetching}
            error={transactions.isError}
            sort={sort}
            onSort={(next) => { setSort(next); setPage(1); }}
            onSelect={setSelected}
            onPage={setPage}
          />
        </section>

        <Rewards />

        <footer className="app-footer"><span>ArcPay</span><span>Digital Alpha Technologies · Take-home assignment</span></footer>
      </div>

      <TransactionModal transaction={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
