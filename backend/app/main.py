"""
main.py — FastAPI application entry point.

- Mounts routes and sqladmin
- WebSocket endpoint for real-time price/stock broadcasts
- Background tasks: restock loop + price decay (only when game active)
- Admin endpoints for game session lifecycle
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
from sqlalchemy.ext.asyncio import AsyncSession
from sqladmin import Admin

from .database import engine, async_session, Base
from .models import Item, User, Transaction
from .routes import router
from .websocket_manager import manager
from .admin import UserAdmin, ItemAdmin, TransactionAdmin
from .seed import seed as seed_db, SEED_ITEMS
from .game_state import game_state
from .schemas import (
    AdminItemUpdate, ItemResponse, GameStateResponse, WinnerEntry,
)

# ── Constants ────────────────────────────────────────────
RESTOCK_CHECK_INTERVAL = 2        # seconds between restock checks
RESTOCK_DELAY = 15                # seconds before sold-out items restock
DECAY_CHECK_INTERVAL = 5          # seconds between decay sweeps
DECAY_INACTIVITY_THRESHOLD = 10   # seconds of no purchases before decay
DECAY_PERCENTAGE = 0.02           # 2% price decay per tick
MIN_PRICE_FACTOR = 0.5            # price floor = base_price * 0.5
DEFAULT_BALANCE = 100_000.00      # starting balance for users
DEFAULT_STOCK = 15                # starting stock for items


# ── Background Tasks ────────────────────────────────────

async def restock_loop():
    """Check for sold-out items and restock after RESTOCK_DELAY seconds."""
    while True:
        try:
            if game_state.is_active:
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
                        item.current_stock = DEFAULT_STOCK
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
            if game_state.is_active:
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
    version="2.0.0",
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


# ── Admin: Game State ────────────────────────────────────

@app.get("/api/admin/state", response_model=GameStateResponse)
async def get_game_state():
    """Return the current game session state."""
    data = game_state.to_dict()
    data["connected_players"] = manager.connection_count
    data["winners"] = [WinnerEntry(**w) for w in data["winners"]]
    return GameStateResponse(**data)


@app.post("/api/admin/start-game")
async def start_game():
    """Start a new game round. Broadcasts GAME_STARTED to all clients."""
    if game_state.is_active:
        raise HTTPException(status_code=400, detail="Game is already running.")

    game_state.start()
    await manager.broadcast({"type": "GAME_STARTED"})
    return {
        "status": "ok",
        "round": game_state.round_number,
        "message": f"Round {game_state.round_number} started! Sent to {manager.connection_count} clients.",
    }


@app.post("/api/admin/stop-game")
async def stop_game():
    """Stop the current game. Calculate winners and broadcast GAME_OVER."""
    if not game_state.is_active:
        raise HTTPException(status_code=400, detail="No game is currently running.")

    # Calculate top 3 winners (finished first, then highest balance)
    async with async_session() as db:
        result = await db.execute(
            select(User)
            .where(User.is_eliminated == False)
            .order_by(User.is_finished.desc(), User.balance.desc())
        )
        all_users = result.scalars().all()

    winners = []
    for rank, user in enumerate(all_users[:3], start=1):
        winners.append({
            "rank": rank,
            "username": user.username,
            "roll_number": user.roll_number,
            "balance": round(user.balance, 2),
        })

    # Build full leaderboard for rank lookup
    leaderboard = [
        {"rank": rank, "username": user.username, "user_id": str(user.id)}
        for rank, user in enumerate(all_users, start=1)
    ]

    game_state.stop(winners)

    await manager.broadcast({
        "type": "GAME_OVER",
        "winners": winners,
        "leaderboard": leaderboard,
    })

    return {
        "status": "ok",
        "message": "Game ended.",
        "winners": winners,
    }


@app.post("/api/admin/reset-game")
async def reset_game(top_n: int = 0):
    """Reset all users and items for a fresh round.
    If top_n > 0, only the top N players (by balance) advance;
    the rest are marked as eliminated.
    """
    if game_state.is_active:
        raise HTTPException(status_code=400, detail="Stop the game before resetting.")

    eliminated_ids = []

    async with async_session() as db:
        if top_n > 0:
            # Fetch only ACTIVE (non-eliminated) users ordered by balance
            result = await db.execute(
                select(User)
                .where(User.is_eliminated == False)
                .order_by(User.balance.desc())
            )
            all_users = result.scalars().all()

            kept_ids = {u.id for u in all_users[:top_n]}
            eliminated_ids = [str(u.id) for u in all_users[top_n:]]

            # Mark eliminated users
            if eliminated_ids:
                await db.execute(
                    update(User)
                    .where(User.id.notin_(kept_ids))
                    .values(is_eliminated=True)
                )

            # Reset only kept users
            await db.execute(
                update(User)
                .where(User.id.in_(kept_ids))
                .values(
                    balance=DEFAULT_BALANCE,
                    is_finished=False,
                    is_eliminated=False,
                )
            )
        else:
            # No elimination — reset everyone
            await db.execute(
                update(User).values(
                    balance=DEFAULT_BALANCE,
                    is_finished=False,
                    is_eliminated=False,
                )
            )

        # Delete all transactions
        await db.execute(
            Transaction.__table__.delete()
        )

        # Build a lookup from seed data: name → seed values
        seed_lookup = {item["name"]: item for item in SEED_ITEMS}

        # Reset items to seed values
        result = await db.execute(select(Item))
        items = result.scalars().all()
        for item in items:
            seed = seed_lookup.get(item.name)
            if seed:
                item.base_price = seed["base_price"]
                item.current_price = seed["base_price"] * 2  # 2x base as per seed logic
            else:
                item.current_price = item.base_price * 2
            item.current_stock = DEFAULT_STOCK
            item.is_sold_out = False
            item.sold_out_timestamp = None
            item.last_purchase_at = None

        await db.commit()

    game_state.reset()

    # Broadcast reset — include eliminated IDs so those clients can auto-logout
    await manager.broadcast({
        "type": "GAME_RESET",
        "eliminated_user_ids": eliminated_ids,
    })

    msg = "All balances, inventories, and items reset."
    if top_n > 0:
        msg = f"Top {top_n} players kept. {len(eliminated_ids)} player(s) eliminated."

    return {
        "status": "ok",
        "message": msg,
        "eliminated_count": len(eliminated_ids),
    }


# ── Admin: Update Item ──────────────────────────────────

@app.patch("/api/admin/update-item/{item_id}", response_model=ItemResponse)
async def admin_update_item(item_id: int, body: AdminItemUpdate):
    """Admin endpoint to update item price/stock."""
    async with async_session() as db:
        item = await db.get(Item, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        if body.current_price is not None:
            item.current_price = body.current_price
        if body.current_stock is not None:
            item.current_stock = body.current_stock
        if body.base_price is not None:
            item.base_price = body.base_price
        if body.is_sold_out is not None:
            item.is_sold_out = body.is_sold_out

        await db.commit()
        await db.refresh(item)

        # Broadcast the change
        await manager.broadcast({
            "type": "ITEM_UPDATE",
            "item_id": item.id,
            "name": item.name,
            "new_price": item.current_price,
            "new_stock": item.current_stock,
            "is_sold_out": item.is_sold_out,
        })

        return ItemResponse.model_validate(item)


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
