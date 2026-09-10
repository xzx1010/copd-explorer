"""Application configuration loaded from environment variables."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Centralised, validated settings sourced from environment / .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="forbid",
    )

    # -- application ----------------------------------------------------------
    app_env: str = Field(
        default="development",
        pattern=r"^(development|test|production)$",
    )
    api_host: str = Field(default="127.0.0.1")
    api_port: int = Field(default=8000, ge=1, le=65535)

    # -- CORS -----------------------------------------------------------------
    cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:4174",
        description="Comma-separated list of allowed origins",
    )

    # -- AI provider ----------------------------------------------------------
    ai_provider: str = Field(
        default="mock",
        pattern=r"^(mock|deepseek)$",
    )
    ai_timeout_seconds: int = Field(default=30, ge=1, le=120)

    # -- DeepSeek Key (read from env only, never written to examples) ---------
    deepseek_api_key: str = Field(
        default="",
        description="Set via DEEPSEEK_API_KEY in the runtime environment only",
    )

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings singleton.

    Use this everywhere instead of constructing Settings() directly so that
    .env is only read once and tests can override via environment variables.
    """
    return Settings()
