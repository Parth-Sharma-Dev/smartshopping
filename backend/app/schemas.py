"""
schemas.py — Pydantic models for request/response validation.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Requests ─────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=50)
    roll_number: Optional[str] = Field(None, max_length=50)


class BuyRequest(BaseModel):
    user_id: uuid.UUID
    item_id: int


class AdminItemUpdate(BaseModel):
    """Partial update for an item via admin panel."""
    current_price: Optional[float] = None
    current_stock: Optional[int] = None
    base_price: Optional[float] = None
    is_sold_out: Optional[bool] = None


# ── Responses ────────────────────────────────────────────

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    roll_number: Optional[str] = None
    balance: float
    is_finished: bool
    inventory: dict[int, int] = {}  # item_id → count
    game_active: bool = False       # whether a game round is currently active

    class Config:
        from_attributes = True


class ItemResponse(BaseModel):
    id: int
    category: str = "General"
    name: str
    base_price: float
    current_price: float
    current_stock: int
    is_sold_out: bool
    image: Optional[str] = None

    class Config:
        from_attributes = True


class TransactionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    item_id: int
    price_at_purchase: float
    timestamp: datetime

    class Config:
        from_attributes = True


class BuyResponse(BaseModel):
    success: bool
    message: str
    new_balance: Optional[float] = None
    item: Optional[ItemResponse] = None
    is_finished: bool = False


class LeaderboardEntry(BaseModel):
    username: str
    roll_number: Optional[str] = None
    balance: float
    is_finished: bool

    class Config:
        from_attributes = True


class WinnerEntry(BaseModel):
    rank: int               # 1, 2, or 3
    username: str
    roll_number: Optional[str] = None
    balance: float


class GameStateResponse(BaseModel):
    is_active: bool
    round_number: int
    winners: list[WinnerEntry] = []
    connected_players: int = 0

