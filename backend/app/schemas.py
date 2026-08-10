from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field


class TransactionOut(BaseModel):
    id: str
    merchant_name: str
    category: str
    amount: Decimal
    currency: str
    status: str
    occurred_at: datetime
    payment_method: str | None = None
    reference_id: str | None = None
    description: str | None = None

    model_config = {"from_attributes": True}


class TransactionsPage(BaseModel):
    items: list[TransactionOut]
    page: int
    page_size: int
    total: int
    pages: int


class TransactionMeta(BaseModel):
    categories: list[str]
    statuses: list[str]
    min_amount: Decimal | None
    max_amount: Decimal | None
    min_date: datetime | None
    max_date: datetime | None


class CategorySpend(BaseModel):
    category: str
    amount: Decimal
    count: int


class MonthlySpend(BaseModel):
    month: str
    amount: Decimal
    count: int


class SpendAnalytics(BaseModel):
    total_spend: Decimal
    successful_transactions: int
    categories: list[CategorySpend]
    monthly: list[MonthlySpend]


class CoinBalance(BaseModel):
    balance: int


class RewardOut(BaseModel):
    id: str
    title: str
    description: str
    coin_cost: int
    kind: str
    value_label: str

    model_config = {"from_attributes": True}


class RedeemRequest(BaseModel):
    reward_id: str = Field(min_length=1, max_length=64)


class RedeemResponse(BaseModel):
    redemption_id: str
    reward: RewardOut
    balance: int
    redeemed_at: datetime


SortField = Literal["occurred_at", "amount"]
SortDirection = Literal["asc", "desc"]
