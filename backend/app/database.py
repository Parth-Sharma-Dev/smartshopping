"""
database.py — Async SQLAlchemy engine, session factory, and declarative Base.
Uses asyncpg driver for PostgreSQL.
"""

import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/smartshopping",
)

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=30,
    max_overflow=20,
    pool_pre_ping=True,
)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db():
    """FastAPI dependency — yields an async session and ensures cleanup."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
