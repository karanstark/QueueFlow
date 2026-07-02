from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "QueueFlow API"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY_HERE_PLEASE_CHANGE_IN_PRODUCTION"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    DATABASE_URL: str = "sqlite+aiosqlite:///./queueflow.db"

    class Config:
        env_file = ".env"

settings = Settings()
