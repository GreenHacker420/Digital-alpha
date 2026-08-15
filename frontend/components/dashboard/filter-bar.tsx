import type { Filters, TransactionMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h10m4 0h2M14 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0ZM4 17h2m4 0h10M6 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
    </svg>
  );
}

export function FilterBar({
  filters,
  meta,
  onChange,
  onClear,
}: {
  filters: Filters;
  meta?: TransactionMeta;
  onChange: (next: Filters) => void;
  onClear: () => void;
}) {
  const activeCount = Object.values(filters).filter(Boolean).length;
  const update = (key: keyof Filters, value: string) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="filters" aria-label="Transaction filters">
      <label className="field field--search">
        <span>Merchant search</span>
        <div className="search-input-wrap">
          <SearchIcon />
          <input
            value={filters.q}
            onChange={(event) => update("q", event.target.value)}
            placeholder="Search 10,000 transactions"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </label>

      <label className="field field--select">
        <span>Category</span>
        <select
          value={filters.category}
          onChange={(event) => update("category", event.target.value)}
        >
          <option value="">All categories</option>
          {meta?.categories.map((category) => (
            <option value={category} key={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="field field--select">
        <span>Status</span>
        <select
          value={filters.status}
          onChange={(event) => update("status", event.target.value)}
        >
          <option value="">All statuses</option>
          {meta?.statuses.map((status) => (
            <option value={status} key={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <details className="more-filters">
        <summary>
          <SlidersIcon />
          <span>More</span>
          {activeCount > 3 ? <b>{activeCount - 3}</b> : null}
        </summary>
        <div className="more-filters__panel">
          <label className="field">
            <span>From</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => update("dateFrom", event.target.value)}
            />
          </label>
          <label className="field">
            <span>To</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => update("dateTo", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Minimum amount</span>
            <input
              inputMode="decimal"
              type="number"
              value={filters.amountMin}
              onChange={(event) => update("amountMin", event.target.value)}
              placeholder="Any"
            />
          </label>
          <label className="field">
            <span>Maximum amount</span>
            <input
              inputMode="decimal"
              type="number"
              value={filters.amountMax}
              onChange={(event) => update("amountMax", event.target.value)}
              placeholder="Any"
            />
          </label>
        </div>
      </details>

      {activeCount > 0 ? (
        <Button variant="ghost" className="filters__clear" onClick={onClear}>
          Clear {activeCount}
        </Button>
      ) : null}
    </div>
  );
}
