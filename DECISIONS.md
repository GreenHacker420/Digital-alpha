# Technical decisions

## Server-side pagination instead of rendering 10,000 DOM rows

The table uses server-side pagination, filtering, search, and sorting. The dataset is only ~10k rows, so client-side processing would be feasible, but server-side querying better demonstrates the production shape of a data-heavy financial app and keeps browser work predictable on lower-end devices.

Pagination uses a stable secondary sort by transaction ID so pages are deterministic when many transactions share the same date or amount.

## State management: URL-shaped local filter state + TanStack Query

The dashboard does not need a global state library. Filter/sort/page state stays close to the table workspace, while TanStack Query owns async server state, caching, request lifecycle, and reward mutations. This avoids a second source of truth.

## Styling: CSS custom properties + CSS modules/global component classes

The assignment explicitly asks for a small internal design system. Colour, spacing, radius, typography, elevation, and motion tokens are defined as CSS custom properties. Table, button, card, badge, input and modal states are hand-built rather than delegated to a component library.

## Database schema: relational columns + immutable reward ledger

Transactions are normalized into typed columns rather than stored as JSON. Reward balance is derived from an append-only ledger (earning credits and redemption debits), which makes redemption auditable and prevents a stale mutable balance field from becoming the source of truth.

## Redemption consistency

The backend validates the reward and locks the user's ledger scope inside a database transaction before recording a debit. The frontend may optimistically update the visible balance, but it always rolls back on a failed request and then revalidates from the server.

## Analytics

Aggregations are calculated in PostgreSQL instead of shipping the full dataset to the browser. The category chart can drive the table's category filter; table filters are also sent to analytics queries so the dashboard behaves as one workspace.
