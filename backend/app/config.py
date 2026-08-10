from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "ArcPay API"
    api_prefix: str = "/api/v1"
    database_url: str = "postgresql+asyncpg://arcpay:arcpay@localhost:5432/arcpay"
    database_url_sync: str = "postgresql+psycopg://arcpay:arcpay@localhost:5432/arcpay"
    cors_origins: str = "http://localhost:3000"
    demo_user_id: str = "00000000-0000-0000-0000-000000000001"
    coin_cap_per_transaction: int = 100
    analytics_outlier_limit: int = 10_000_000

    model_config = SettingsConfigDict(env_file="../.env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
