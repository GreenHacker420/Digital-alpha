.PHONY: db seed api test lint backend-check web-install web web-check check

db:
	docker compose up -d db

seed:
	cd backend && python -m scripts.seed ../transactions.json

api:
	cd backend && uvicorn app.main:app --reload --port 8000

test:
	cd backend && pytest -q

lint:
	cd backend && ruff check .

backend-check: lint test

web-install:
	cd frontend && npm install

web:
	cd frontend && npm run dev

web-check:
	cd frontend && npm run check

check: backend-check web-check
