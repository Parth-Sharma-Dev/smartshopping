
import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import engine
from app.models import User, Item, Transaction
from app.game_state import game_state

async def run_verification():
    print("🚀 Starting Cooldown Verification...")
    
    # Use AsyncClient with ASGITransport to keep everything in the same event loop
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        
        # 1. Setup DB Session
        test_session_factory = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
        
        async with test_session_factory() as db:
            # Create a test user
            username = f"tester_{uuid.uuid4().hex[:6]}"
            user = User(username=username, roll_number="123456")
            db.add(user)
            
            # Ensure at least one item exists
            result = await db.execute(select(Item).limit(1))
            item = result.scalar_one_or_none()
            if not item:
                print("❌ No items found in DB. Seed DB first.")
                return

            # Ensure item has stock
            item.current_stock = 100
            item.is_sold_out = False
            db.add(item)
            await db.commit()
            await db.refresh(user)
            
            print(f"👤 Created test user: {username} ({user.id})")
            print(f"📦 Using item: {item.name} ({item.id})")

            # 2. Ensure Game is Active
            game_state.start() # Force start game state in memory
            print("🎮 Game state forced to ACTIVE")

            # 3. First Purchase
            print("\n🛒 Attempting 1st Purchase (Should Succeed)...")
            resp = await client.post("/api/buy", json={"user_id": str(user.id), "item_id": item.id})
            if resp.status_code == 200:
                print("✅ Purchase 1 Successful")
            else:
                print(f"❌ Purchase 1 Failed: {resp.json()}")
                return

            # 4. Immediate Second Purchase (Should Fail)
            print("\n🛒 Attempting 2nd Purchase Immediately (Should Fail via Cooldown)...")
            resp = await client.post("/api/buy", json={"user_id": str(user.id), "item_id": item.id})
            
            if resp.status_code == 400 and "Cooldown active" in resp.json().get("detail", ""):
                print(f"✅ Cooldown Verified! Response: {resp.json()['detail']}")
            else:
                print(f"❌ expected Cooldown error, got: {resp.status_code} {resp.json()}")

            # 5. Backdate the transaction to bypass cooldown
            print("\n⏳ Mocking time passing (Backdating previous transaction)...")
            # Find the transaction we just made
            txn_result = await db.execute(
                select(Transaction)
                .where(Transaction.user_id == user.id)
                .order_by(Transaction.timestamp.desc())
                .limit(1)
            )
            last_txn = txn_result.scalar_one()
            
            # Move it 40 seconds into the past
            past_time = datetime.now(timezone.utc) - timedelta(seconds=40)
            
            # Update timestamp
            await db.execute(
                update(Transaction)
                .where(Transaction.id == last_txn.id)
                .values(timestamp=past_time)
            )
            await db.commit()
            print("✅ Transaction backdated.")

            # 6. Third Purchase (Should First Succeed)
            print("\n🛒 Attempting 3rd Purchase after 'waiting' (Should Succeed)...")
            resp = await client.post("/api/buy", json={"user_id": str(user.id), "item_id": item.id})
            if resp.status_code == 200:
                print("✅ Purchase 3 Successful")
            else:
                print(f"❌ Purchase 3 Failed: {resp.json()}")

if __name__ == "__main__":
    try:
        asyncio.run(run_verification())
    except Exception as e:
        print(f"💥 Error: {e}")
