# Technical decisions

## Server-side pagination instead of rendering 10,000 DOM rows

The table uses server-side pagination, filtering, search, and sorting. The dataset is only ~10k rows, so client-side processing is possible, but server-side querying better matches a production data-heavy financial app and keeps DOM/browser work predictable on lower-end devices.

Pagination uses a stable secondary sort by the internal transaction ID so pages remain deterministic when many rows share the same date or amount.

## Internal transaction key + source ID

The source dataset reuses 40 transaction IDs for conflicting records. Treating the source ID as a database primary key would either fail the seed or silently discard data. PostgreSQL therefore owns an identity primary key, while the supplied transaction identifier is retained as an indexed, non-unique `source_id`.

## State management: local filter state + TanStack Query

The dashboard does not need a global state library. Filter/sort/page state stays close to the workspace, while TanStack Query owns server state, caching, request lifecycle, previous-page data, and reward mutations. This avoids a second source of truth.

## Styling: internal design system

Colour, spacing, radius, typography, elevation, and motion tokens are defined as CSS custom properties. Table, button, card, badge, input, skeleton, empty/error states and modal behaviour are hand-built. Recharts is used only for data visualisation.

## Database: typed relational columns + immutable reward ledger

Transactions are stored in typed relational columns rather than a JSON blob. Reward balance is derived from an append-only ledger of earning credits and redemption debits, making the balance auditable and avoiding stale duplicated state.

## Redemption consistency

The backend validates the reward and locks the user row inside a database transaction before calculating balance and inserting a debit. The frontend optimistically updates the visible balance, rolls back on failure, and revalidates from the server.

## Data-quality policy

All 10,000 source rows are retained. Normalization is limited to representation issues (timestamps, amount strings, status casing, empty categories). Negative values are interpreted as credits/refunds. A single extreme ₹999,999,999 value is flagged instead of deleted and excluded only from analytics/reward eligibility so the consumer charts remain meaningful.

## Analytics

Aggregations happen in PostgreSQL rather than shipping the entire dataset to the browser. Successful positive non-anomalous payments feed spend analytics; chart category selection drives the same server-side filter state used by the table.
