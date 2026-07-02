from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config.settings import settings

_url = settings.async_database_url
_is_sqlite = "sqlite" in _url

engine = create_async_engine(
    _url,
    echo=False,
    # SQLite needs check_same_thread=False; PostgreSQL doesn't support it
    connect_args={"check_same_thread": False} if _is_sqlite else {},
    # PostgreSQL benefits from a connection pool; SQLite uses StaticPool
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
