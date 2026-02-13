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


class BuyRequest(BaseModel):
    user_id: uuid.UUID
    item_id: int


# ── Responses ────────────────────────────────────────────

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    balance: float
    is_finished: bool
    inventory: dict[int, int] = {}  # item_id → count

    class Config:
        from_attributes = True


class ItemResponse(BaseModel):
    id: int
    name: str
    base_price: float
    current_price: float
    current_stock: int
    is_sold_out: bool

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
    balance: float
    is_finished: bool

    class Config:
        from_attributes = True
