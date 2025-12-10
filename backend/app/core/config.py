from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # App
    APP_NAME: str = "CareerGENAI"
    ENV: str | None = None

    # Database
    DATABASE_URL: str = Field(..., description="PostgreSQL connection string")

    # LLM
    LLM_PROVIDER: str = "gemini"
    GOOGLE_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    class Config:
        # We read from ENV only; docker-compose sets env vars.
        extra = "allow"


settings = Settings()
