import type { SortState, Transaction, TransactionsPage } from "@/lib/types";
import { formatDate, formatMoney, titleCase } from "@/lib/format";
import { Button } from "@/components/ui/button";

function Status({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone = ["success", "successful", "completed", "paid"].includes(normalized)
    ? "success"
    : ["failed", "declined", "reversed"].includes(normalized)
      ? "danger"
      : "neutral";

  return (
    <span className={`status status--${tone}`}>
      <i />
      {titleCase(value)}
    </span>
  );
}

function SortButton({
  field,
  label,
  sort,
  onSort,
}: {
  field: SortState["by"];
  label: string;
  sort: SortState;
  onSort: (next: SortState) => void;
}) {
  const active = sort.by === field;
  const nextDirection = active && sort.direction === "desc" ? "asc" : "desc";

  return (
    <button
      className={`table-sort ${active ? "table-sort--active" : ""}`}
      onClick={() => onSort({ by: field, direction: nextDirection })}
      aria-label={`Sort by ${label} ${nextDirection}`}
    >
      {label}
      <span aria-hidden="true">{active ? (sort.direction === "asc" ? "↑" : "↓") : "↕"}</span>
    </button>
  );
}

function Merchant({ transaction }: { transaction: Transaction }) {
  return (
    <div className="merchant-cell">
      <span className="merchant-mark">{transaction.merchant_name.slice(0, 1).toUpperCase()}</span>
      <div>
        <strong>{transaction.merchant_name}</strong>
        <small>{transaction.source_id}</small>
      </div>
    </div>
  );
}

function MobileTransactionCard({
  transaction,
  onSelect,
}: {
  transaction: Transaction;
  onSelect: (transaction: Transaction) => void;
}) {
  return (
    <button
      type="button"
      className="transaction-mobile-card"
      onClick={() => onSelect(transaction)}
      aria-label={`Open ${transaction.merchant_name} transaction`}
    >
      <div className="transaction-mobile-card__top">
        <Merchant transaction={transaction} />
        <span className={Number(transaction.amount) < 0 ? "mobile-amount mobile-amount--credit" : "mobile-amount"}>
          {formatMoney(transaction.amount, transaction.currency)}
          {transaction.is_anomaly ? (
            <i className="data-warning" title="Excluded from spend analytics as an extreme data outlier">!</i>
          ) : null}
        </span>
      </div>
      <div className="transaction-mobile-card__meta">
        <span className="category-pill">{transaction.category}</span>
        <Status value={transaction.status} />
        <time>{formatDate(transaction.occurred_at)}</time>
      </div>
    </button>
  );
}

export function TransactionsTable({
  data,
  loading,
  fetching,
  error,
  sort,
  onSort,
  onSelect,
  onPage,
}: {
  data?: TransactionsPage;
  loading: boolean;
  fetching: boolean;
  error: boolean;
  sort: SortState;
  onSort: (sort: SortState) => void;
  onSelect: (transaction: Transaction) => void;
  onPage: (page: number) => void;
}) {
  if (error) {
    return (
      <div className="table-state table-state--error">
        <strong>Transactions couldn’t load.</strong>
        <span>Check the API connection and try again.</span>
      </div>
    );
  }

  return (
    <div className="table-shell" aria-busy={fetching}>
      <div className="table-scroll">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Merchant</th>
              <th>Category</th>
              <th><SortButton field="occurred_at" label="Date" sort={sort} onSort={onSort} /></th>
              <th>Status</th>
              <th className="amount-cell"><SortButton field="amount" label="Amount" sort={sort} onSort={onSort} /></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }, (_, index) => (
                  <tr key={index} className="skeleton-row" aria-hidden="true">
                    <td><span /></td>
                    <td><span /></td>
                    <td><span /></td>
                    <td><span /></td>
                    <td><span /></td>
                  </tr>
                ))
              : data?.items.map((transaction) => (
                  <tr
                    key={transaction.id}
                    tabIndex={0}
                    onClick={() => onSelect(transaction)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(transaction);
                      }
                    }}
                    aria-label={`Open ${transaction.merchant_name} transaction`}
                  >
                    <td><Merchant transaction={transaction} /></td>
                    <td><span className="category-pill">{transaction.category}</span></td>
                    <td>{formatDate(transaction.occurred_at)}</td>
                    <td><Status value={transaction.status} /></td>
                    <td className={`amount-cell ${Number(transaction.amount) < 0 ? "amount-cell--credit" : ""}`}>
                      <strong>{formatMoney(transaction.amount, transaction.currency)}</strong>
                      {transaction.is_anomaly ? (
                        <span className="data-warning" title="Excluded from spend analytics as an extreme data outlier">!</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <div className="transactions-mobile-list">
        {loading
          ? Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="transaction-mobile-card transaction-mobile-card--skeleton" aria-hidden="true" />
            ))
          : data?.items.map((transaction) => (
              <MobileTransactionCard key={transaction.id} transaction={transaction} onSelect={onSelect} />
            ))}
      </div>

      {!loading && data?.items.length === 0 ? (
        <div className="table-state">
          <strong>No transactions match.</strong>
          <span>Try clearing one or more filters.</span>
        </div>
      ) : null}

      <footer className="table-footer">
        <span>
          {data ? `${data.total.toLocaleString("en-IN")} transactions` : "Loading transactions…"}
          {fetching && !loading ? " · Updating…" : ""}
        </span>
        <div className="pagination">
          <Button
            variant="secondary"
            aria-label="Previous page"
            disabled={!data || data.page <= 1 || fetching}
            onClick={() => data && onPage(data.page - 1)}
          >
            ←
          </Button>
          <span>{data?.pages ? `${data.page} / ${data.pages}` : "—"}</span>
          <Button
            variant="secondary"
            aria-label="Next page"
            disabled={!data || data.page >= data.pages || fetching}
            onClick={() => data && onPage(data.page + 1)}
          >
            →
          </Button>
        </div>
      </footer>
    </div>
  );
}
