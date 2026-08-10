import type { Filters, TransactionMeta } from "@/lib/types";
import { Button } from "@/components/ui/button";

const emptyFilters: Filters = {
  q: "",
  category: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  amountMin: "",
  amountMax: "",
};

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
  const update = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });

  return (
    <div className="filters" aria-label="Transaction filters">
      <label className="field field--search">
        <span>Merchant</span>
        <div className="search-input-wrap">
          <span aria-hidden="true">⌕</span>
          <input
            value={filters.q}
            onChange={(event) => update("q", event.target.value)}
            placeholder="Search merchant"
            autoComplete="off"
          />
        </div>
      </label>

      <label className="field">
        <span>Category</span>
        <select value={filters.category} onChange={(event) => update("category", event.target.value)}>
          <option value="">All categories</option>
          {meta?.categories.map((category) => (
            <option value={category} key={category}>{category}</option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>Status</span>
        <select value={filters.status} onChange={(event) => update("status", event.target.value)}>
          <option value="">All statuses</option>
          {meta?.statuses.map((status) => (
            <option value={status} key={status}>{status}</option>
          ))}
        </select>
      </label>

      <details className="more-filters">
        <summary>More filters {activeCount > 3 ? <b>{activeCount - 3}</b> : null}</summary>
        <div className="more-filters__panel">
          <label className="field"><span>From</span><input type="date" value={filters.dateFrom} onChange={(e) => update("dateFrom", e.target.value)} /></label>
          <label className="field"><span>To</span><input type="date" value={filters.dateTo} onChange={(e) => update("dateTo", e.target.value)} /></label>
          <label className="field"><span>Min amount</span><input inputMode="decimal" type="number" min="0" value={filters.amountMin} onChange={(e) => update("amountMin", e.target.value)} placeholder="₹0" /></label>
          <label className="field"><span>Max amount</span><input inputMode="decimal" type="number" min="0" value={filters.amountMax} onChange={(e) => update("amountMax", e.target.value)} placeholder="No limit" /></label>
        </div>
      </details>

      {activeCount > 0 ? <Button variant="ghost" onClick={onClear}>Clear {activeCount}</Button> : null}
    </div>
  );
}

export { emptyFilters };
