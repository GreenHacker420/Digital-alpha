# ArcPay — Digital Alpha Technologies Take-Home

A frontend-focused financial dashboard for exploring credit-card transactions, understanding spend, and redeeming reward coins.

> Work in progress. This repository is being built as the Digital Alpha Technologies Full Stack Engineer take-home assignment.

## Architecture

- `frontend/` — Next.js + React + TypeScript
- `backend/` — FastAPI + SQLAlchemy + PostgreSQL
- PostgreSQL 18 for local development via Docker Compose

## Local prerequisites

- Node.js 22+
- Python 3.12+
- Docker

## Quick start

```bash
cp .env.example .env
docker compose up -d db

cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'
cd ..

# Put the supplied transactions.json at ./transactions.json, then:
make seed

# terminal 1
make api

# terminal 2
make web-install
make web
```

Frontend: http://localhost:3000  
Backend: http://localhost:8000  
API docs: http://localhost:8000/docs

## Submission status

### Done
- Repository/project foundation
- PostgreSQL 18 local environment
- Documented assumptions and engineering decisions

### In progress
- Transaction API and seed pipeline
- Custom responsive transaction table
- Spend analytics
- Rewards catalogue and redemption
- Deployment

### Known issues
- The supplied `transactions.json` is not committed yet, so the seed path cannot be validated against the real dataset until that file is added.

See [ASSUMPTIONS.md](./ASSUMPTIONS.md), [DECISIONS.md](./DECISIONS.md), and [AI-USAGE.md](./AI-USAGE.md).
