"""
seed.py — Populate the items table with initial marketplace goods.
Run via:  python -m app.seed
"""

import asyncio
from .database import engine, async_session, Base
from .models import Item


SEED_ITEMS = [
    {"name": "Basmati Rice (1kg)",       "base_price": 180.00},
    {"name": "Olive Oil (500ml)",        "base_price": 650.00},
    {"name": "Dark Chocolate Bar",       "base_price": 250.00},
    {"name": "Green Tea (100 bags)",     "base_price": 420.00},
    {"name": "Almonds (250g)",           "base_price": 380.00},
    {"name": "Saffron (1g)",             "base_price": 750.00},
    {"name": "Protein Powder (1kg)",     "base_price": 2200.00},
    {"name": "Manuka Honey (250g)",      "base_price": 3500.00},
    {"name": "Truffle Salt (100g)",      "base_price": 1200.00},
    {"name": "Wagyu Beef Strips (200g)", "base_price": 4800.00},
    {"name": "Imported Cheese Wheel",    "base_price": 1800.00},
    {"name": "Avocado Pack (6)",         "base_price": 560.00},
    {"name": "Quinoa (500g)",            "base_price": 340.00},
    {"name": "Vanilla Extract (50ml)",   "base_price": 890.00},
    {"name": "Açaí Berry Pack (300g)",   "base_price": 1100.00},
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        from sqlalchemy import select
        result = await session.execute(select(Item).limit(1))
        if result.scalar_one_or_none():
            print("⚠  Items already seeded. Skipping.")
            return

        for data in SEED_ITEMS:
            item = Item(
                name=data["name"],
                base_price=data["base_price"],
                current_price=data["base_price"],
                current_stock=10,
                is_sold_out=False,
                restock_penalty_multiplier=1.2,
            )
            session.add(item)

        await session.commit()
        print(f"✅ Seeded {len(SEED_ITEMS)} items into the database.")


if __name__ == "__main__":
    asyncio.run(seed())
