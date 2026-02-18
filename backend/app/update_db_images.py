import asyncio
import os
from sqlalchemy import text, select
from app.database import engine, async_session
from app.models import Item
from app.seed import SEED_ITEMS

async def update_images():
    # 1. Check if column exists
    column_exists = False
    try:
        # Use a separate connection/transaction for the check
        async with engine.connect() as conn:
            await conn.execute(text("SELECT image FROM items LIMIT 1"))
            column_exists = True
    except Exception:
        # If the above fails, it likely means the column checks failed.
        # We catch it and proceed to add the column.
        pass

    if not column_exists:
        print("sh 'image' column missing. Adding it...")
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE items ADD COLUMN image VARCHAR(500)"))
        print("✅ Added 'image' column to items table.")
    else:
        print("✅ 'image' column already exists.")

    async with async_session() as session:
        print("🔄 Updating item images...")
        updated_count = 0
        
        # 2. Iterate through SEED_ITEMS and update corresponding DB entries
        for seed_item in SEED_ITEMS:
            # excessive querying but fine for <100 items
            stmt = select(Item).where(Item.name == seed_item["name"])
            result = await session.execute(stmt)
            db_item = result.scalar_one_or_none()
            
            if db_item:
                if seed_item.get("image"):
                    db_item.image = seed_item["image"]
                    updated_count += 1
        
        await session.commit()
        print(f"✅ Successfully updated images for {updated_count} items.")

if __name__ == "__main__":
    asyncio.run(update_images())
