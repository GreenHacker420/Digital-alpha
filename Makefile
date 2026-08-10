.PHONY: db seed api test web-install web

db:
	docker compose up -d db

seed:
	cd backend && python -m scripts.seed ../transactions.json

api:
	cd backend && uvicorn app.main:app --reload --port 8000

test:
	cd backend && pytest -q

web-install:
	cd frontend && npm install

web:
	cd frontend && npm run dev
