import asyncio
import os
from sqlalchemy import text
from app.database import engine

async def test_db():
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
        print("✅ DB Connection Successful")

if __name__ == "__main__":
    asyncio.run(test_db())
