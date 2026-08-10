# ArcPay — Digital Alpha Technologies Take-Home

A frontend-focused financial dashboard for exploring credit-card transactions, understanding spend, and redeeming reward coins.

## What is implemented

- Custom React/TypeScript transaction table — no table component library
- Server-side pagination, merchant search, combinable filters and date/amount sorting
- Sticky table header with loading, empty, error, hover, focus and keyboard states
- Responsive layout down to 360px with horizontally scrollable dense data where appropriate
- Transaction detail modal with Escape-to-close and a focus trap
- Category spend donut + monthly spend trend, aggregated in PostgreSQL
- Chart-to-table category filtering; table filters also reshape analytics
- Always-visible coin balance and five-item rewards catalogue
- Confirmed redemption flow with optimistic balance update and rollback on failure
- Backend validation for missing and unaffordable rewards
- PostgreSQL relational schema + append-only reward ledger
- One-command seed path for the supplied 10k-row dataset
- Dataset normalization for duplicated source IDs, mixed timestamp formats, string amounts, empty categories, refunds and an extreme outlier

## Stack

**Frontend:** Next.js, React, TypeScript, TanStack Query, Recharts, hand-built CSS/design tokens.  
**Backend:** FastAPI, SQLAlchemy, Pydantic.  
**Database:** PostgreSQL 18 locally (16+ compatible for hosted environments).

## Architecture

```text
frontend/                    Next.js app
  app/                       App Router entry + design tokens/styles
  components/dashboard/      Product-level dashboard components
  components/ui/             Small internal Button/Card/Modal system
  hooks/                     Client interaction helpers
  lib/                       API client, types, formatting

backend/
  app/api/routes/            HTTP layer
  app/repositories/          PostgreSQL queries
  app/services/              Reward business rules / transactions
  app/models.py              Relational schema
  scripts/seed.py            Dataset normalization + seed
  tests/                     Focused endpoint tests
```

## Local setup (<5 minutes)

Prerequisites: Node.js 22+, Python 3.12+, Docker.

```bash
git clone https://github.com/GreenHacker420/Digital-alpha.git
cd Digital-alpha
cp .env.example .env

# Put the assignment's transactions.json in the repository root.
docker compose up -d db

cd backend
python -m venv .venv
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

Run backend tests:

```bash
make test
```

## Dataset observations

The supplied file is not perfectly clean, so ingestion intentionally handles the real edge cases instead of dropping them. It contains 10,000 rows but only 9,960 unique source transaction IDs, 200 missing/null/blank categories, 20 string amounts, 148 negative values, mixed timestamp formats, inconsistent status casing, and one ₹999,999,999 amount outlier. See [DATA-NOTES.md](./DATA-NOTES.md) for the full handling policy.

## Key technical choices

- **Server-side pagination over virtualization:** keeps the browser DOM bounded and demonstrates the stronger API/database architecture requested in the brief. Each page is deterministically ordered by the requested date/amount field plus internal transaction ID.
- **TanStack Query rather than global state:** filters/sort/page are local UI state; API responses and mutations are server state. `keepPreviousData` prevents page-change flashes.
- **Internal DB transaction ID:** source IDs are not unique, so a generated primary key preserves every row while keeping the original ID queryable/displayable.
- **Append-only rewards ledger:** balance is the sum of ledger deltas instead of a mutable counter. Redemptions run transactionally and are easy to audit.
- **PostgreSQL analytics:** category/month aggregations stay near the data rather than shipping all 10k records into JavaScript.
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
- Assumptions, decisions, data notes and AI usage documentation

### Still to do before sending
- Run final install/build/test locally against PostgreSQL 18
- Add the provided `transactions.json` locally and execute `make seed`
- Deploy frontend + backend + hosted PostgreSQL
- Add deployed URLs to this README
- Record a short walkthrough video (recommended even if deployed)
- Final mobile/browser visual pass

### Known issue / intentional constraint
- The assignment dataset is not committed to this public repository. Put the provided `transactions.json` at repository root before running `make seed`.

See [ASSUMPTIONS.md](./ASSUMPTIONS.md), [DECISIONS.md](./DECISIONS.md), [DATA-NOTES.md](./DATA-NOTES.md), and [AI-USAGE.md](./AI-USAGE.md).
