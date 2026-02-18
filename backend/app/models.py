"""
models.py — SQLAlchemy ORM models for Users, Items, and Transactions.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    roll_number = Column(String(50), nullable=True)
    balance = Column(Float, default=100_000.00, nullable=False)
    is_finished = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    transactions = relationship("Transaction", back_populates="user", lazy="selectin")

    def __repr__(self):
        return f"<User {self.username} balance={self.balance}>"


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    category = Column(String(50), default="General", nullable=False)
    base_price = Column(Float, nullable=False)
    current_price = Column(Float, nullable=False)
    # PATCH: Increased stock to 15 to handle 150 users better
    current_stock = Column(Integer, default=15, nullable=False)
    is_sold_out = Column(Boolean, default=False, nullable=False)
    sold_out_timestamp = Column(DateTime(timezone=True), nullable=True)
    # PATCH: Reduced penalty to 1.1 (10%) to prevent price death spiral
    restock_penalty_multiplier = Column(Float, default=1.1, nullable=False)
    image = Column(String(500), nullable=True)
    last_purchase_at = Column(DateTime(timezone=True), nullable=True)

    transactions = relationship("Transaction", back_populates="item", lazy="selectin")

    def __repr__(self):
        return f"<Item {self.name} price={self.current_price} stock={self.current_stock}>"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    price_at_purchase = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=_utcnow, nullable=False)

    user = relationship("User", back_populates="transactions")
    item = relationship("Item", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction user={self.user_id} item={self.item_id} price={self.price_at_purchase}>"
