from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.rewards import router as rewards_router
from app.api.routes.transactions import router as transactions_router
from app.config import settings

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(transactions_router, prefix=settings.api_prefix)
app.include_router(rewards_router, prefix=settings.api_prefix)


@app.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
