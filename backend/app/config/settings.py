from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "QueueFlow API"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE_PLEASE_CHANGE_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    DATABASE_URL: str = "sqlite+aiosqlite:///./queueflow.db"

    @property
    def async_database_url(self) -> str:
        """Convert postgres:// or postgresql:// to asyncpg driver URL."""
        url = self.DATABASE_URL
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    class Config:
        env_file = ".env"


settings = Settings()
