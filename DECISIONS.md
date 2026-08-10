# Technical decisions

## Stable production stack over preview versions

The project targets the current stable production line rather than the numerically newest prerelease. The frontend uses Next.js 16.2.12 with React 19.2.8. TypeScript is pinned to 6.0.3 because TypeScript 7.0.2 is not yet compatible with the compiler-API path used by the stable Next.js 16.2 line; using a 16.3 preview only to claim a newer version would add unnecessary take-home risk.

Node 24 is the runtime baseline because it is the current LTS line. PostgreSQL is pinned to 18.4 locally. The Python API targets Python 3.14 with current stable FastAPI, SQLAlchemy 2.0 and Psycopg 3 releases.

## Server-side pagination instead of rendering 10,000 DOM rows

The table uses server-side pagination, filtering, search, and sorting. The dataset is only ~10k rows, so client-side processing is possible, but server-side querying better matches a production data-heavy financial app and keeps DOM/browser work predictable on lower-end devices.

Pagination uses a stable secondary sort by the internal transaction ID so pages remain deterministic when many rows share the same date or amount. Composite PostgreSQL indexes mirror the date/amount + ID ordering. The normal page query uses `COUNT(*) OVER()` so page data and total count arrive in one database round trip; only an explicitly out-of-range page falls back to a separate count query.

## Initial server prefetch + client server-state cache

The first transaction page, metadata, analytics, reward balance and reward catalogue are prefetched in the Next.js Server Component and dehydrated into TanStack Query. This avoids waiting for browser hydration before the initial API requests begin.

After hydration, TanStack Query owns server state. Filter/sort/page state remains local to the dashboard. Stale requests receive the query `AbortSignal`, previous page/analytics data remains visible while new filters load, 4xx responses are not retried, and immutable metadata/catalogue queries use long-lived cache entries.

## Client JavaScript boundaries

The dashboard is the interactive client workspace, while the route itself remains a Server Component. Recharts is dynamically loaded so the charting dependency is not on the table's initial interaction path. React Compiler is enabled, so manual memoization is reserved for semantic needs rather than being scattered throughout components.

## Styling: internal design system

Colour, spacing, radius, typography, elevation, and motion tokens are defined as CSS custom properties. Table, button, card, badge, input, skeleton, empty/error states and modal behaviour are hand-built. Recharts is used only for data visualisation.

## Internal transaction key + source ID

The source dataset reuses 40 transaction IDs for conflicting records. Treating the source ID as a database primary key would either fail the seed or silently discard data. PostgreSQL therefore owns an identity primary key, while the supplied transaction identifier is retained as an indexed, non-unique `source_id`.

## PostgreSQL query design

Search uses a lower-cased trigram GIN index so type-ahead merchant substring queries do not require an unindexed full scan as the dataset grows. Date/amount sorting has deterministic composite indexes, category/status filters include the main date ordering, and valid spend has a partial index matching the analytics eligibility predicate.

The runtime API and the synchronous seed both use Psycopg 3 through SQLAlchemy. This removes the need to ship two PostgreSQL drivers while still keeping the HTTP path fully async.

## Database: typed relational columns + immutable reward ledger

Transactions are stored in typed relational columns rather than a JSON blob. Reward balance is derived from an append-only ledger of earning credits and redemption debits, making the balance auditable and avoiding stale duplicated state.

## Redemption consistency

The backend validates the reward and locks the user row inside a database transaction before calculating balance and inserting a debit. The frontend optimistically updates the visible balance, snapshots the pre-mutation value, rolls back on failure, and revalidates from the server.

## Data-quality policy

All 10,000 source rows are retained. Normalization is limited to representation issues (timestamps, amount strings, status casing, empty categories). Negative values are interpreted as credits/refunds. A single extreme ₹999,999,999 value is flagged instead of deleted and excluded only from analytics/reward eligibility so the consumer charts remain meaningful.

## Analytics

Aggregations happen in PostgreSQL rather than shipping the entire dataset to the browser. Successful positive non-anomalous payments feed spend analytics; chart category selection drives the same server-side filter state used by the table.
