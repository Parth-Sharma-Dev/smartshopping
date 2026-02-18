"""
routes.py — API endpoints for Smart Shopping.

The /buy endpoint is the most critical: it uses SELECT FOR UPDATE
to prevent race conditions on stock and balance.
"""

import uuid
from datetime import datetime, timezone
from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .models import User, Item, Transaction
from .schemas import (
    RegisterRequest,
    BuyRequest,
    BuyResponse,
    UserResponse,
    ItemResponse,
    LeaderboardEntry,
)
from .websocket_manager import manager
from .game_state import game_state

router = APIRouter(prefix="/api", tags=["game"])


# ── Register ─────────────────────────────────────────────

@router.post("/register", response_model=UserResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if username taken
    existing = await db.execute(
        select(User).where(User.username == req.username)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Username already taken")

    user = User(username=req.username, roll_number=req.roll_number)
    db.add(user)
    await db.commit()
    await db.refresh(user)

    return UserResponse(
        id=user.id,
        username=user.username,
        roll_number=user.roll_number,
        balance=user.balance,
        is_finished=user.is_finished,
        inventory={},
        game_active=game_state.is_active,
    )


# ── Get User Info ────────────────────────────────────────

@router.get("/me/{user_id}", response_model=UserResponse)
async def get_me(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Build inventory from transactions
    result = await db.execute(
        select(Transaction.item_id, func.count(Transaction.id))
        .where(Transaction.user_id == user_id)
        .group_by(Transaction.item_id)
    )
    inventory = {row[0]: row[1] for row in result.all()}

    return UserResponse(
        id=user.id,
        username=user.username,
        roll_number=user.roll_number,
        balance=user.balance,
        is_finished=user.is_finished,
        inventory=inventory,
        game_active=game_state.is_active,
    )


# ── List Items ───────────────────────────────────────────

@router.get("/items", response_model=list[ItemResponse])
async def list_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).order_by(Item.id))
    items = result.scalars().all()
    return [ItemResponse.model_validate(i) for i in items]


# ── Leaderboard ──────────────────────────────────────────

@router.get("/leaderboard", response_model=list[LeaderboardEntry])
async def leaderboard(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).order_by(User.is_finished.desc(), User.balance.desc())
    )
    users = result.scalars().all()
    return [
        LeaderboardEntry(
            username=u.username,
            roll_number=u.roll_number,
            balance=u.balance,
            is_finished=u.is_finished,
        )
        for u in users
    ]


# ── BUY — Critical Endpoint with SELECT FOR UPDATE ──────

@router.post("/buy", response_model=BuyResponse)
async def buy_item(req: BuyRequest, db: AsyncSession = Depends(get_db)):
    """
    Atomic purchase with row-level locking to prevent race conditions.
    """
    if not game_state.is_active:
        raise HTTPException(status_code=400, detail="Game is not active. Wait for the admin to start.")

    async with db.begin():
        # ── Lock the item row ────────────────────────
        item_result = await db.execute(
            select(Item)
            .where(Item.id == req.item_id)
            .with_for_update()
        )
        item = item_result.scalar_one_or_none()

        if not item:
            raise HTTPException(status_code=404, detail="Item not found")

        if item.is_sold_out:
            raise HTTPException(status_code=400, detail=f"{item.name} is SOLD OUT. Wait for restock.")

        if item.current_stock <= 0:
            raise HTTPException(status_code=400, detail=f"{item.name} is out of stock.")

        # ── Lock the user row ────────────────────────
        user_result = await db.execute(
            select(User)
            .where(User.id == req.user_id)
            .with_for_update()
        )
        user = user_result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.is_finished:
            raise HTTPException(status_code=400, detail="You have already finished the game!")

        if user.balance < item.current_price:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient balance. Need ₹{item.current_price:.2f}, have ₹{user.balance:.2f}",
            )

        # ── Check inventory cap (max 2 of any item) ──
        inv_result = await db.execute(
            select(func.count(Transaction.id))
            .where(Transaction.user_id == req.user_id)
            .where(Transaction.item_id == req.item_id)
        )
        item_count = inv_result.scalar() or 0

        if item_count >= 2:
            raise HTTPException(
                status_code=400,
                detail=f"You already own {item_count} of {item.name}. Max is 2.",
            )

        # ── Execute purchase ─────────────────────────
        purchase_price = item.current_price

        # Deduct balance
        user.balance -= purchase_price

        # Decrement stock
        item.current_stock -= 1

        # ── FIRE SALE LOGIC START ──
        # If stock is 3 or less, CRASH price to base_price.
        # Otherwise, hike price by 2%.
        FIRE_SALE_THRESHOLD = 3

        if item.current_stock <= FIRE_SALE_THRESHOLD and item.current_stock > 0:
             item.current_price = item.base_price
        else:
             item.current_price = round(item.current_price * 1.02, 2)
        # ── FIRE SALE LOGIC END ──

        # Record last purchase time
        item.last_purchase_at = datetime.now(timezone.utc)

        # Check if sold out
        if item.current_stock == 0:
            item.is_sold_out = True
            item.sold_out_timestamp = datetime.now(timezone.utc)

        # Create transaction record
        txn = Transaction(
            user_id=req.user_id,
            item_id=req.item_id,
            price_at_purchase=purchase_price,
        )
        db.add(txn)

        # ── Check if user completed the full set ─────
        # Count distinct items the user now owns (including this purchase)
        distinct_result = await db.execute(
            select(func.count(func.distinct(Transaction.item_id)))
            .where(Transaction.user_id == req.user_id)
        )
        # We need to also count the current item if it's new
        owned_count = distinct_result.scalar() or 0
        if item_count == 0:
            # This is a new item for the user (the txn hasn't flushed yet for the count)
            owned_count += 1

        # Get total number of items in the game
        total_items_result = await db.execute(select(func.count(Item.id)))
        total_items = total_items_result.scalar() or 0

        is_now_finished = owned_count >= total_items
        if is_now_finished:
            user.is_finished = True

    # ── Broadcast updated item state ─────────────────
    await manager.broadcast({
        "type": "ITEM_UPDATE",
        "item_id": item.id,
        "name": item.name,
        "new_price": item.current_price,
        "new_stock": item.current_stock,
        "is_sold_out": item.is_sold_out,
    })

    # Broadcast user update (for leaderboard)
    if is_now_finished:
        await manager.broadcast({
            "type": "PLAYER_FINISHED",
            "username": user.username,
            "balance": user.balance,
        })

    # Broadcast leaderboard update
    lb_result = await db.execute(
        select(User).order_by(User.is_finished.desc(), User.balance.desc())
    )
    lb_users = lb_result.scalars().all()
    await manager.broadcast({
        "type": "LEADERBOARD_UPDATE",
        "leaderboard": [
            {
                "username": u.username,
                "roll_number": u.roll_number,
                "balance": u.balance,
                "is_finished": u.is_finished,
            }
            for u in lb_users
        ],
    })

    return BuyResponse(
        success=True,
        message=f"Purchased {item.name} for ₹{purchase_price:.2f}",
        new_balance=user.balance,
        item=ItemResponse(
            id=item.id,
            name=item.name,
            category=item.category,
            base_price=item.base_price,
            current_price=item.current_price,
            current_stock=item.current_stock,
            is_sold_out=item.is_sold_out,
        ),
        is_finished=is_now_finished,
    )
    