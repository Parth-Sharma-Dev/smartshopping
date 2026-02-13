"""
main.py — FastAPI application entry point.

- Mounts routes and sqladmin
- WebSocket endpoint for real-time price/stock broadcasts
- Background tasks: restock loop + price decay
"""

import asyncio
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from sqlalchemy import select, update
from sqladmin import Admin

from .database import engine, async_session, Base
from .models import Item, User, Transaction
from .routes import router
from .websocket_manager import manager
from .admin import UserAdmin, ItemAdmin, TransactionAdmin
from .seed import seed as seed_db

# ── Constants ────────────────────────────────────────────
RESTOCK_CHECK_INTERVAL = 2        # seconds between restock checks
RESTOCK_DELAY = 15                # seconds before sold-out items restock
DECAY_CHECK_INTERVAL = 5          # seconds between decay sweeps
DECAY_INACTIVITY_THRESHOLD = 10   # seconds of no purchases before decay
DECAY_PERCENTAGE = 0.02           # 2% price decay per tick
MIN_PRICE_FACTOR = 0.5            # price floor = base_price * 0.5


# ── Background Tasks ────────────────────────────────────

async def restock_loop():
    """Check for sold-out items and restock after RESTOCK_DELAY seconds."""
    while True:
        try:
            async with async_session() as db:
                now = datetime.now(timezone.utc)
                cutoff = now - timedelta(seconds=RESTOCK_DELAY)

                result = await db.execute(
                    select(Item)
                    .where(Item.is_sold_out == True)
                    .where(Item.sold_out_timestamp != None)
                    .where(Item.sold_out_timestamp <= cutoff)
                )
                items_to_restock = result.scalars().all()

                for item in items_to_restock:
                    item.current_stock = 10
                    item.is_sold_out = False
                    item.sold_out_timestamp = None
                    # Price hike penalty on restock
                    item.current_price = round(
                        item.current_price * item.restock_penalty_multiplier, 2
                    )

                    await manager.broadcast({
                        "type": "ITEM_UPDATE",
                        "item_id": item.id,
                        "name": item.name,
                        "new_price": item.current_price,
                        "new_stock": item.current_stock,
                        "is_sold_out": False,
                    })

                if items_to_restock:
                    await db.commit()

        except Exception as e:
            print(f"[restock_loop] Error: {e}")

        await asyncio.sleep(RESTOCK_CHECK_INTERVAL)


async def price_decay_loop():
    """Lower prices of items that haven't been purchased recently."""
    while True:
        try:
            async with async_session() as db:
                now = datetime.now(timezone.utc)
                threshold = now - timedelta(seconds=DECAY_INACTIVITY_THRESHOLD)

                result = await db.execute(
                    select(Item)
                    .where(Item.is_sold_out == False)
                    .where(
                        (Item.last_purchase_at == None) |
                        (Item.last_purchase_at <= threshold)
                    )
                )
                idle_items = result.scalars().all()

                for item in idle_items:
                    floor_price = item.base_price * MIN_PRICE_FACTOR
                    new_price = round(item.current_price * (1 - DECAY_PERCENTAGE), 2)

                    if new_price < floor_price:
                        new_price = round(floor_price, 2)

                    if new_price != item.current_price:
                        item.current_price = new_price

                        await manager.broadcast({
                            "type": "ITEM_UPDATE",
                            "item_id": item.id,
                            "name": item.name,
                            "new_price": item.current_price,
                            "new_stock": item.current_stock,
                            "is_sold_out": item.is_sold_out,
                        })

                if idle_items:
                    await db.commit()

        except Exception as e:
            print(f"[price_decay_loop] Error: {e}")

        await asyncio.sleep(DECAY_CHECK_INTERVAL)


# ── App Lifespan ─────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_db()
    print("🚀 Smart Shopping server started")

    # Launch background tasks
    restock_task = asyncio.create_task(restock_loop())
    decay_task = asyncio.create_task(price_decay_loop())

    yield

    # Shutdown
    restock_task.cancel()
    decay_task.cancel()
    print("🛑 Smart Shopping server stopped")


# ── FastAPI App ──────────────────────────────────────────

app = FastAPI(
    title="Smart Shopping",
    description="Real-time competitive market simulation game",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(router)

# Mount sqladmin
admin = Admin(app, engine, title="Smart Shopping Admin")
admin.add_view(UserAdmin)
admin.add_view(ItemAdmin)
admin.add_view(TransactionAdmin)


# ── WebSocket Endpoint ───────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; we don't expect client messages
            # but we listen to detect disconnects
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        await manager.disconnect(websocket)


# ── Serve Frontend ───────────────────────────────────────
# Serve static assets and index.html for React SPA
# Assumes dist/ is at backend/dist (parent of app directory)

BASE_DIR = Path(__file__).resolve().parent.parent
DIST_DIR = BASE_DIR / "dist"

if DIST_DIR.exists():
    # Mount assets folder
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    # Serve index.html at root
    @app.get("/")
    async def serve_spa_index():
        return FileResponse(DIST_DIR / "index.html")

    # Catch-all for React routing (must be last)
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        # Don't serve HTML for missing API routes
        if full_path.startswith("api/"):
             raise HTTPException(status_code=404, detail="API route not found")
             
        target_file = DIST_DIR / full_path
        if target_file.is_file():
            return FileResponse(target_file)
            
        return FileResponse(DIST_DIR / "index.html")
else:
    print(f"⚠️ Warning: Frontend dist directory not found at {DIST_DIR}")
