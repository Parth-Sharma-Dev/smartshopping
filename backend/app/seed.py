"""
seed.py — Populate the items table with initial marketplace goods.
Run via:  python -m app.seed
"""

import asyncio
from .database import engine, async_session, Base
from .models import Item

SEED_ITEMS = [
    # ── FOOD & GROCERY (30 Items) - The "Cheap" Volume ─────────────
    # Essential for filling inventory without breaking the bank
    {"name": "Parle-G Gold (Pack)",          "category": "Food", "base_price": 50.00,  "image": "/items/parleg-gold.webp"},
    {"name": "Maggi Noodles (Pack of 6)",    "category": "Food", "base_price": 84.00,  "image": "/items/maggi-noodles.webp"},
    {"name": "Amul Butter (500g)",           "category": "Food", "base_price": 275.00, "image": "/items/amul-butter.webp"},
    {"name": "Tata Tea Gold (500g)",         "category": "Food", "base_price": 350.00, "image": "/items/tata-tea-gold.webp"},
    {"name": "Basmati Rice (1kg)",           "category": "Food", "base_price": 180.00, "image": "/items/basmati-rice.webp"},
    {"name": "Aashirvaad Atta (5kg)",        "category": "Food", "base_price": 290.00, "image": "/items/aashirvaad-aata.webp"},
    {"name": "Toor Dal (1kg)",               "category": "Food", "base_price": 160.00, "image": "/items/toor-dal.webp"},
    {"name": "Alphonso Mango (1pc)",         "category": "Food", "base_price": 100.00, "image": "/items/alphonso-mango.webp"},
    {"name": "Dairy Milk Silk",              "category": "Food", "base_price": 180.00, "image": "/items/dairy-milk-silk.webp"},
    {"name": "Haldiram Bhujia (400g)",       "category": "Food", "base_price": 110.00, "image": "/items/haldiram-bhujia.webp"},
    {"name": "Kissan Jam (500g)",            "category": "Food", "base_price": 165.00, "image": "/items/kissan-jam.webp"},
    {"name": "Fortune Oil (1L)",             "category": "Food", "base_price": 145.00, "image": "/items/fortune-oil.webp"},
    {"name": "Chyawanprash (500g)",          "category": "Food", "base_price": 395.00, "image": "/items/chyawanprash.webp"},
    {"name": "Paneer (Fresh 500g)",          "category": "Food", "base_price": 240.00, "image": "/items/paneer.webp"},
    {"name": "Gulab Jamun Tin (1kg)",        "category": "Food", "base_price": 320.00, "image": "/items/gulab-jamun-tin.webp"},
    {"name": "Bournvita (500g)",             "category": "Food", "base_price": 260.00, "image": "/items/bournvita.webp"},
    {"name": "Nescafe Classic (100g)",       "category": "Food", "base_price": 310.00, "image": "/items/nescafe-classic.webp"},
    {"name": "Honey (Dabur 500g)",           "category": "Food", "base_price": 220.00, "image": "/items/honey-dabur-500g.jpg"},
    {"name": "Pringles Chips",               "category": "Food", "base_price": 110.00, "image": "/items/pringles-chips.jpg"},
    {"name": "Tropicana Juice (1L)",         "category": "Food", "base_price": 130.00, "image": "/items/tropicana-juice-1l.jpg"},
    {"name": "Organic Brown Sugar",          "category": "Food", "base_price": 190.00, "image": "/items/organic-brown-sugar.jpg"},
    {"name": "Digestive Biscuits",           "category": "Food", "base_price": 95.00,  "image": "/items/digestive-biscuits.jpg"},
    {"name": "Coconut Water (Pack of 4)",    "category": "Food", "base_price": 200.00, "image": "/items/coconut-water-pack-of-4.jpg"},
    {"name": "Soya Chunks (Pack)",           "category": "Food", "base_price": 65.00,  "image": "/items/soya-chunks-pack.jpg"},
    {"name": "Masala Oats (Pack)",           "category": "Food", "base_price": 185.00, "image": "/items/masala-oats-pack.jpg"},
    # Premium Food (Mini-Luxury)
    {"name": "Kashmiri Saffron (1g)",        "category": "Food", "base_price": 850.00, "image": "/items/kashmiri-saffron-1g.jpg"},
    {"name": "Ferrero Rocher (16pc)",        "category": "Food", "base_price": 950.00, "image": "/items/ferrero-rocher-16pc.jpg"},
    {"name": "Davidoff Coffee (100g)",       "category": "Food", "base_price": 650.00, "image": "/items/davidoff-coffee-100g.jpg"},
    {"name": "Imported Blueberries",         "category": "Food", "base_price": 550.00, "image": "/items/imported-blueberries.jpg"},
    {"name": "Premium Cashews (500g)",       "category": "Food", "base_price": 780.00, "image": "/items/premium-cashews-500g.jpg"},

    # ── ELECTRONICS (20 Items) - Mid-Range Gadgets ────────────────
    {"name": "Boat Bassheads Earphones",     "category": "Electronics", "base_price": 499.00,  "image": "/items/boat-bassheads-earphones.jpg"},
    {"name": "USB-C Fast Cable",             "category": "Electronics", "base_price": 350.00,  "image": "/items/usb-c-fast-cable.jpg"},
    {"name": "SanDisk Pendrive (64GB)",      "category": "Electronics", "base_price": 600.00,  "image": "/items/sandisk-pendrive-64gb.jpg"},
    {"name": "Wireless Mouse (Logitech)",    "category": "Electronics", "base_price": 895.00,  "image": "/items/wireless-mouse-logitech.jpg"},
    {"name": "Mi Power Bank (10000mAh)",     "category": "Electronics", "base_price": 1200.00, "image": "/items/mi-power-bank-10000mah.jpg"},
    {"name": "JBL Go 3 Speaker",             "category": "Electronics", "base_price": 2500.00, "image": "/items/jbl-go-3-speaker.jpg"},
    {"name": "Realme Smart Band",            "category": "Electronics", "base_price": 1800.00, "image": "/items/realme-smart-band.jpg"},
    {"name": "Noise Smartwatch",             "category": "Electronics", "base_price": 3500.00, "image": "/items/noise-smartwatch.jpg"},
    {"name": "Sony Wired Headphones",        "category": "Electronics", "base_price": 1400.00, "image": "/items/sony-wired-headphones.jpg"},
    {"name": "TP-Link WiFi Router",          "category": "Electronics", "base_price": 1600.00, "image": "/items/tp-link-wifi-router.jpg"},
    {"name": "Laptop Cooling Pad",           "category": "Electronics", "base_price": 950.00,  "image": "/items/laptop-cooling-pad.jpg"},
    {"name": "Gaming Keyboard (Membrane)",   "category": "Electronics", "base_price": 1800.00, "image": "/items/gaming-keyboard-membrane.jpg"},
    {"name": "Tripod Stand (Mobile)",        "category": "Electronics", "base_price": 700.00,  "image": "/items/tripod-stand-mobile.jpg"},
    {"name": "Ring Light (10 inch)",         "category": "Electronics", "base_price": 1100.00, "image": "/items/ring-light-10-inch.jpg"},
    {"name": "Extension Board (4 Socket)",   "category": "Electronics", "base_price": 450.00,  "image": "/items/extension-board-4-socket.jpg"},
    # Premium Electronics (Under 10k)
    {"name": "Echo Dot (Alexa)",             "category": "Electronics", "base_price": 4500.00, "image": "/items/echo-dot-alexa.jpg"},
    {"name": "Kindle Reader (Refurb)",       "category": "Electronics", "base_price": 7500.00, "image": "/items/kindle-reader-refurb.jpg"},
    {"name": "Samsung Galaxy Buds",          "category": "Electronics", "base_price": 6500.00, "image": "/items/samsung-galaxy-buds.jpg"},
    {"name": "Portable SSD (500GB)",         "category": "Electronics", "base_price": 5800.00, "image": "/items/portable-ssd-500gb.jpg"},
    {"name": "Instax Mini Camera",           "category": "Electronics", "base_price": 6000.00, "image": "/items/instax-mini-camera.jpg"},

    # ── CLOTHING (15 Items) - Fashion Staples ─────────────────────
    {"name": "Cotton Handkerchiefs (3pc)",   "category": "Clothing", "base_price": 150.00,  "image": "/items/cotton-handkerchiefs-3pc.jpg"},
    {"name": "Sports Socks (Pack of 3)",     "category": "Clothing", "base_price": 300.00,  "image": "/items/sports-socks-pack-of-3.jpg"},
    {"name": "Printed T-Shirt",              "category": "Clothing", "base_price": 499.00,  "image": "/items/printed-t-shirt.jpg"},
    {"name": "Polo T-Shirt",                 "category": "Clothing", "base_price": 899.00,  "image": "/items/polo-t-shirt.jpg"},
    {"name": "Cotton Kurta (Daily)",         "category": "Clothing", "base_price": 750.00,  "image": "/items/cotton-kurta-daily.jpg"},
    {"name": "Denim Jeans (Regular)",        "category": "Clothing", "base_price": 1200.00, "image": "/items/denim-jeans-regular.jpg"},
    {"name": "Joggers / Trackpants",         "category": "Clothing", "base_price": 950.00,  "image": "/items/joggers-trackpants.jpg"},
    {"name": "Formal Shirt",                 "category": "Clothing", "base_price": 1100.00, "image": "/items/formal-shirt.jpg"},
    {"name": "Ethnic Dupatta",               "category": "Clothing", "base_price": 450.00,  "image": "/items/ethnic-dupatta.jpg"},
    {"name": "Winter Beanie",                "category": "Clothing", "base_price": 350.00,  "image": "/items/winter-beanie.jpg"},
    # Premium Clothing (Under 10k)
    {"name": "Ray-Ban Aviators",             "category": "Clothing", "base_price": 6500.00, "image": "/items/ray-ban-aviators.jpg"},
    {"name": "Titan Watch (Classic)",        "category": "Clothing", "base_price": 4500.00, "image": "/items/titan-watch-classic.jpg"},
    {"name": "Silk Saree (Mysore)",          "category": "Clothing", "base_price": 8500.00, "image": "/items/silk-saree-mysore.jpg"},
    {"name": "Leather Jacket (Faux)",        "category": "Clothing", "base_price": 3500.00, "image": "/items/leather-jacket-faux.jpg"},
    {"name": "Nike Running Shoes",           "category": "Clothing", "base_price": 5500.00, "image": "/items/nike-running-shoes.jpg"},

    # ── LUXURY & LIFESTYLE (10 Items) - The Big Ticket Items ──────
    {"name": "Parker Vector Pen",            "category": "Luxury", "base_price": 400.00,  "image": "/items/parker-vector-pen.jpg"},
    {"name": "Scented Candle (Glass)",       "category": "Luxury", "base_price": 650.00,  "image": "/items/scented-candle-glass.jpg"},
    {"name": "Bamboo Plant (Lucky)",         "category": "Luxury", "base_price": 350.00,  "image": "/items/bamboo-plant-lucky.jpg"},
    {"name": "Swiss Knife (Victorinox)",     "category": "Luxury", "base_price": 1800.00, "image": "/items/swiss-knife-victorinox.jpg"},
    {"name": "Yoga Mat (Premium)",           "category": "Luxury", "base_price": 1500.00, "image": "/items/yoga-mat-premium.jpg"},
    {"name": "Silver Coin (10g)",            "category": "Luxury", "base_price": 950.00,  "image": "/items/silver-coin-10g.jpg"},
    {"name": "Crystal Vase (Small)",         "category": "Luxury", "base_price": 2200.00, "image": "/items/crystal-vase-small.jpg"},
    # High Luxury (The "Boss" Items - Max 9k)
    {"name": "Swarovski Pendant",            "category": "Luxury", "base_price": 6500.00, "image": "/items/swarovski-pendant.jpg"},
    {"name": "Mont Blanc Ink Bottle",        "category": "Luxury", "base_price": 4500.00, "image": "/items/mont-blanc-ink-bottle.jpg"},
    {"name": "Designer Perfume (100ml)",     "category": "Luxury", "base_price": 8000.00, "image": "/items/designer-perfume-100ml.jpg"},
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        from sqlalchemy import select
        result = await session.execute(select(Item).limit(1))
        # Logic to skip if seeded removed/modified to ensure updates if needed,
        # but for now we'll keep the skip logic or we might want to update existing items?
        # The user's request usually implies we want these images NOW.
        # But wait, seed.py is for initial population. The update script will handle existing DB.
        # So I will keep the skip logic as is, but make sure the Item creation has the image.
        if result.scalar_one_or_none():
            print("⚠  Items already seeded. Skipping initial seed.")
            return

        for data in SEED_ITEMS:
            item = Item(
                name=data["name"],
                category=data["category"],
                base_price=data["base_price"],
                # START GAME LOGIC:
                # Price starts at 2x Base Price
                current_price=data["base_price"] * 2,
                # Stock is 15 to allow some buffer
                current_stock=15,
                # Restock penalty reduced to 1.1x to prevent crash
                restock_penalty_multiplier=1.1,
                image=data.get("image")
            )
            session.add(item)

        await session.commit()
        print(f"✅ Seeded {len(SEED_ITEMS)} items into the database.")


if __name__ == "__main__":
    asyncio.run(seed())
