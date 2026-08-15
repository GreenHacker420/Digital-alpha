"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { fetchAnalytics, fetchBalance, fetchTransactionMeta, fetchTransactions } from "@/lib/api";
import { DEFAULT_SORT, EMPTY_FILTERS } from "@/lib/dashboard-defaults";
import { queryKeys } from "@/lib/query-keys";
import type { Filters, Transaction } from "@/lib/types";
import { formatCompactMoney } from "@/lib/format";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
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

type SectionId = "overview" | "transactions" | "rewards";

function ProductNav({ activeSection }: { activeSection: SectionId }) {
  return (
    <nav className="product-nav" aria-label="Primary navigation">
      <a className={activeSection === "overview" ? "active" : ""} href="#overview">Overview</a>
      <a className={activeSection === "transactions" ? "active" : ""} href="#transactions">Transactions</a>
      <a className={activeSection === "rewards" ? "active" : ""} href="#rewards">Rewards</a>
    </nav>
  );
}

function formatMonth(month?: string) {
  if (!month) return "—";
  return new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
}

export function Dashboard() {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const debouncedSearch = useDebouncedValue(filters.q, 250);
  const queryFilters: Filters = { ...filters, q: debouncedSearch };

  useEffect(() => {
    const sectionIds: SectionId[] = ["overview", "transactions", "rewards"];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));

    let timer: ReturnType<typeof setTimeout> | undefined;

    const syncActiveSection = () => {
      const documentElement = document.documentElement;
      const atPageBottom =
        window.scrollY + window.innerHeight >= documentElement.scrollHeight - 8;

      // The final section cannot always travel far enough up the viewport to
      // cross a conventional scroll-spy threshold. At the document end the
      // user's intent is unambiguously the Rewards section.
      if (atPageBottom) {
        setActiveSection("rewards");
        return;
      }

      // A fluid viewport anchor makes the active state feel natural across
      // desktop and mobile instead of depending on one fixed pixel offset.
      const activationLine = window.innerHeight * 0.4;
      let nextSection: SectionId = "overview";

      for (const section of sections) {
        if (section.getBoundingClientRect().top <= activationLine) {
          nextSection = section.id as SectionId;
        } else {
          break;
        }
      }

      setActiveSection((current) => current === nextSection ? current : nextSection);
    };

    const scheduleSync = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        syncActiveSection();
      }, 40);
    };

    syncActiveSection();
    document.addEventListener("scroll", scheduleSync, { passive: true });
    window.addEventListener("resize", scheduleSync);

    return () => {
      document.removeEventListener("scroll", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      if (timer) clearTimeout(timer);
    };
  }, []);

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
  const months = analytics.data?.monthly ?? [];
  const period = months.length
    ? `${formatMonth(months[0]?.month)} — ${formatMonth(months.at(-1)?.month)}`
    : "Full dataset";

  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="brand" href="#overview" aria-label="ArcPay home">
          <span className="brand-mark">A</span>
          <span className="brand-copy">
            <strong>ArcPay</strong>
            <small>Cards & rewards</small>
          </span>
        </a>

        <ProductNav activeSection={activeSection} />

        <a
          className="header-balance"
          href="#rewards"
          aria-label={balance.isError ? "Reward balance unavailable" : `${balance.data?.balance ?? 0} reward coins`}
        >
          <span className="coin-gem" aria-hidden="true">◆</span>
          <span>
            <small>Coin balance</small>
            <strong>{visibleBalance}</strong>
          </span>
        </a>
      </header>

      <div className="dashboard">
        <section className="overview-section" id="overview" aria-labelledby="overview-title">
          <div className="page-intro">
            <div>
              <p className="eyebrow">Credit-card spending</p>
              <h1 id="overview-title">Your money, in one clear view.</h1>
              <p>Search every payment, understand your spending mix, and redeem the coins your successful payments earned.</p>
            </div>
            <span className="sync-pill"><i /> {matchingTransactions} transactions in view</span>
          </div>

          <div className="overview-grid" aria-label="Spending summary">
            <article className="primary-metric-card">
              <div className="primary-metric-card__top">
                <span>Total eligible spend</span>
                <span>{period}</span>
              </div>
              <strong>{analytics.data ? formatCompactMoney(analytics.data.total_spend) : "—"}</strong>
              <p>Successful positive card payments included in your current filters.</p>
              <div className="metric-foot">
                <span><b>{successfulTransactions}</b> successful</span>
                <span><b>{matchingTransactions}</b> matching</span>
              </div>
            </article>

            <article className="metric-card">
              <span className="metric-icon metric-icon--indigo" aria-hidden="true">↕</span>
              <div>
                <span>Transactions</span>
                <strong>{matchingTransactions}</strong>
                <p>Filtered, searched and sorted on the server.</p>
              </div>
            </article>

            <article className="metric-card">
              <span className="metric-icon metric-icon--blue" aria-hidden="true">✓</span>
              <div>
                <span>Successful payments</span>
                <strong>{successfulTransactions}</strong>
                <p>Payments eligible for spend analytics.</p>
              </div>
            </article>

            <article className="metric-card metric-card--coins">
              <span className="metric-icon metric-icon--gold" aria-hidden="true">◆</span>
              <div>
                <span>Reward coins</span>
                <strong>{visibleBalance}</strong>
                <p>Available to redeem from the rewards catalogue.</p>
              </div>
            </article>
          </div>
        </section>

        <section className="analytics-section" aria-labelledby="analytics-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Spend analytics</p>
              <h2 id="analytics-title">See where it went, and when.</h2>
            </div>
            <p>Both charts use the same live filter context as your transaction table. Select a category to drill into its payments.</p>
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
          <div className="section-heading section-heading--transactions">
            <div>
              <p className="eyebrow">Transactions</p>
              <h2>Every payment, easy to inspect.</h2>
            </div>
            <span className="live-dot"><i /> Live data</span>
          </div>

          <div className="transaction-surface">
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
          <span>ArcPay</span>
          <span>Digital Alpha Technologies · Take-home assignment</span>
        </footer>
      </div>

      <div className="mobile-nav-shell">
        <ProductNav activeSection={activeSection} />
      </div>

      <TransactionModal transaction={selected} onClose={() => setSelected(null)} />
    </main>
  );
}
