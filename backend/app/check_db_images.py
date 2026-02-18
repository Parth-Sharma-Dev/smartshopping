import asyncio
from sqlalchemy import select
from app.database import async_session
from app.models import Item

async def check_images():
    async with async_session() as session:
        result = await session.execute(select(Item).limit(5))
        items = result.scalars().all()
        print(f"{'Item Name':<30} | {'Image Path':<50}")
        print("-" * 85)
        for item in items:
            print(f"{item.name:<30} | {item.image:<50}")

if __name__ == "__main__":
    asyncio.run(check_images())
