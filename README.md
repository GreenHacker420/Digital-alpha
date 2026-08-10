# ArcPay — Digital Alpha Technologies Take-Home

A frontend-focused financial dashboard for exploring credit-card transactions, understanding spend, and redeeming reward coins.

## What is implemented

- Custom React/TypeScript transaction table — no table component library
- Server-side pagination, merchant search, combinable filters and date/amount sorting
- Stable composite database ordering and one-round-trip page count on normal pagination requests
- Sticky table header with loading, empty, error, hover, focus and keyboard states
- Responsive layout down to 360px with horizontally scrollable dense data where appropriate
- Transaction detail modal with Escape-to-close and a focus trap
- Category spend donut + monthly spend trend, aggregated in PostgreSQL
- Chart-to-table category filtering; table filters also reshape analytics
- Server-prefetched initial dashboard data hydrated into TanStack Query
- Abortable filter/search requests and previous-data retention during transitions
- Recharts split out of the table's initial JavaScript path
- Always-visible coin balance and five-item rewards catalogue
- Confirmed redemption flow with optimistic balance update and rollback on failure
- Backend validation for missing and unaffordable rewards with transactional user-row locking
- PostgreSQL relational schema + append-only reward ledger
- One-command seed path for the supplied 10k-row dataset
- Dataset normalization for duplicated source IDs, mixed timestamp formats, string amounts, empty categories, refunds and an extreme outlier

## Stack

**Frontend:** Next.js 16.2.12, React 19.2.8, TypeScript 6.0.3, TanStack Query 5.101.4, Recharts 3.10.1, React Compiler, Turbopack, ESLint 10, hand-built CSS/design tokens.  
**Backend:** Python 3.14, FastAPI 0.140.13, SQLAlchemy 2.0.51, Psycopg 3.3.4, Pydantic Settings 2.14.2.  
**Database:** PostgreSQL 18.4 locally.

TypeScript 7 is intentionally not used yet: it is newer, but the stable Next.js 16.2 compiler integration still requires the TypeScript JavaScript compiler API. See [DECISIONS.md](./DECISIONS.md) and [AI-USAGE.md](./AI-USAGE.md).

## Architecture

```text
frontend/
  app/                       App Router server entry + query dehydration
  components/dashboard/      Product-level interactive dashboard components
  components/ui/             Small internal Button/Card/Modal system
  hooks/                     Client interaction helpers
  lib/                       API client, query keys, defaults, types, formatting

backend/
  app/api/routes/            HTTP layer
  app/repositories/          PostgreSQL queries
  app/services/              Reward business rules / transactions
  app/models.py              Relational schema + indexes
  scripts/seed.py            Dataset normalization + seed
  tests/                     Focused endpoint tests
```

### Request flow

```text
Initial request
Browser -> Next.js Server Component -> FastAPI -> PostgreSQL
        <- dehydrated TanStack Query state <-

Interactive filters/search
Browser -> TanStack Query -> abortable FastAPI request -> indexed PostgreSQL query
```

The initial page prefetches the first transaction page, metadata, spend analytics, balance and catalogue. After hydration, those same query keys continue as ordinary TanStack Query server state; there is no duplicate client state layer.

## Local setup (<5 minutes)

Prerequisites: Node.js 24 LTS, Python 3.14, Docker.

```bash
git clone https://github.com/GreenHacker420/Digital-alpha.git
cd Digital-alpha
cp .env.example .env

# Put the assignment's transactions.json in the repository root.
docker compose up -d db

cd backend
python3.14 -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cd ..

make seed
```

Run the API and web app in separate terminals:

```bash
make api
```

```bash
make web-install
make web
```

Frontend: `http://localhost:3000`  
Backend: `http://localhost:8000`  
OpenAPI: `http://localhost:8000/docs`

Run the full local validation suite:

```bash
make check
```

This runs backend Ruff + tests, followed by frontend ESLint + TypeScript + a production Next.js build.

## Dataset observations

The supplied file is not perfectly clean, so ingestion intentionally handles the real edge cases instead of dropping them. It contains 10,000 rows but only 9,960 unique source transaction IDs, 200 missing/null/blank categories, 20 string amounts, 148 negative values, mixed timestamp formats, inconsistent status casing, and one ₹999,999,999 amount outlier. See [DATA-NOTES.md](./DATA-NOTES.md) for the full handling policy.

## Key technical choices

- **Server-side pagination over virtualization:** keeps the browser DOM bounded and demonstrates the stronger API/database architecture requested in the brief. Each page is deterministically ordered by the requested date/amount field plus internal transaction ID.
- **Server prefetch + TanStack Query hydration:** removes the initial browser-only data wait while preserving one client cache for all subsequent interactions.
- **Abortable requests:** rapid type-ahead/filter changes cancel stale HTTP work instead of allowing old responses to compete with the latest intent.
- **React Compiler + chart code splitting:** avoids unnecessary manual memoization and keeps Recharts off the table's initial interaction path.
- **Internal DB transaction ID:** source IDs are not unique, so a generated primary key preserves every row while keeping the original ID queryable/displayable.
- **Append-only rewards ledger:** balance is the sum of ledger deltas instead of a mutable counter. Redemptions run transactionally and are easy to audit.
- **PostgreSQL analytics and indexes:** category/month aggregations stay near the data; trigram merchant search, stable sort indexes and a valid-spend partial index support the hot query paths.
- **One PostgreSQL driver:** Psycopg 3 serves both the async API and synchronous seed path through SQLAlchemy.
- **Hand-built UI system:** table, tokens, interactions and modal behaviour are implemented in-project; Recharts is used only for chart rendering.

## Submission status

### Done

- Core data model and PostgreSQL seed pipeline
- Full transactions API, metadata and analytics endpoints
- Server-side search/filter/sort/pagination
- Custom transaction table and detail interaction
- Both spend charts + cross-filter behaviour
- Reward balance/catalogue/redemption flow
- Optimistic balance update + rollback
- Dataset edge-case handling
- Focused reward validation tests
- Server hydration, request cancellation and chart code splitting
- Current stable production dependency pass
- Assumptions, decisions, data notes and AI usage documentation
- GitHub Actions validation workflow for frontend and backend

### Still to do before sending

- Run `make check` locally against your machine/toolchain
- Add the provided `transactions.json` locally and execute `make seed`
- Deploy frontend + backend + hosted PostgreSQL
- Add deployed URLs to this README
- Record a short walkthrough video (recommended even if deployed)
- Final mobile/browser visual pass

### Known issue / intentional constraint

The assignment dataset is not committed to this public repository. Put the provided `transactions.json` at repository root before running `make seed`.

See [ASSUMPTIONS.md](./ASSUMPTIONS.md), [DECISIONS.md](./DECISIONS.md), [DATA-NOTES.md](./DATA-NOTES.md), and [AI-USAGE.md](./AI-USAGE.md).
