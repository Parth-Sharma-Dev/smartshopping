"""
admin.py — sqladmin integration for live game management.
"""

from sqladmin import ModelView
from .models import User, Item, Transaction


class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.username, User.balance, User.is_finished, User.created_at]
    column_searchable_list = [User.username]
    column_sortable_list = [User.balance, User.created_at]
    name = "Player"
    name_plural = "Players"
    icon = "fa-solid fa-users"


class ItemAdmin(ModelView, model=Item):
    column_list = [
        Item.id, Item.name, Item.base_price, Item.current_price,
        Item.current_stock, Item.is_sold_out, Item.sold_out_timestamp,
    ]
    column_sortable_list = [Item.current_price, Item.current_stock]
    name = "Market Item"
    name_plural = "Market Items"
    icon = "fa-solid fa-store"


class TransactionAdmin(ModelView, model=Transaction):
    column_list = [
        Transaction.id, Transaction.user_id, Transaction.item_id,
        Transaction.price_at_purchase, Transaction.timestamp,
    ]
    column_sortable_list = [Transaction.timestamp, Transaction.price_at_purchase]
    name = "Transaction"
    name_plural = "Transactions"
    icon = "fa-solid fa-receipt"
