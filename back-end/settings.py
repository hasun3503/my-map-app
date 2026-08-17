from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    app_timezone: str = "Asia/Seoul"

    kma_service_key: str
    seoul_api_key: str

    kma_api_base_url: str = "https://apis.data.go.kr"
    seoul_api_base_url: str = "http://openapi.seoul.go.kr:8088"
    redis_url: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
