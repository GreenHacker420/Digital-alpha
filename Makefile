.PHONY: db seed api test lint backend-check web-install web web-check check

PYTHON := $(if $(wildcard backend/.venv/bin/python),.venv/bin/python,python)
UVICORN := $(if $(wildcard backend/.venv/bin/uvicorn),.venv/bin/uvicorn,uvicorn)
PYTEST := $(if $(wildcard backend/.venv/bin/pytest),.venv/bin/pytest,pytest)
RUFF := $(if $(wildcard backend/.venv/bin/ruff),.venv/bin/ruff,ruff)

db:
	docker compose up -d db

seed:
	cd backend && $(PYTHON) -m scripts.seed ../transactions.json

api:
	cd backend && $(UVICORN) app.main:app --reload --port 8000

test:
	cd backend && $(PYTEST) -q

lint:
	cd backend && $(RUFF) check .

backend-check: lint test

web-install:
	cd frontend && npm install

web:
	cd frontend && npm run dev

web-check:
	cd frontend && npm run check

check: backend-check web-check
