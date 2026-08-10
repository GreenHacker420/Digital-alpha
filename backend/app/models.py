import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user")
    reward_entries: Mapped[list["RewardLedgerEntry"]] = relationship(back_populates="user")


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        Index("ix_transactions_user_occurred_at", "user_id", "occurred_at"),
        Index("ix_transactions_user_amount", "user_id", "amount"),
        Index("ix_transactions_user_category", "user_id", "category"),
        Index("ix_transactions_user_status", "user_id", "status"),
    )

    id: Mapped[str] = mapped_column(String(80), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    merchant_name: Mapped[str] = mapped_column(String(180), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    status: Mapped[str] = mapped_column(String(48), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    payment_method: Mapped[str | None] = mapped_column(String(120))
    reference_id: Mapped[str | None] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates="transactions")


class Reward(Base):
    __tablename__ = "rewards"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(240), nullable=False)
    coin_cost: Mapped[int] = mapped_column(Integer, nullable=False)
    kind: Mapped[str] = mapped_column(String(40), nullable=False)
    value_label: Mapped[str] = mapped_column(String(60), nullable=False)
    active: Mapped[bool] = mapped_column(nullable=False, default=True)


class RewardLedgerEntry(Base):
    __tablename__ = "reward_ledger"
    __table_args__ = (
        UniqueConstraint("transaction_id", "reason", name="uq_reward_earning_per_transaction"),
        Index("ix_reward_ledger_user_created_at", "user_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(40), nullable=False)
    transaction_id: Mapped[str | None] = mapped_column(ForeignKey("transactions.id", ondelete="SET NULL"))
    reward_id: Mapped[str | None] = mapped_column(ForeignKey("rewards.id", ondelete="SET NULL"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship(back_populates="reward_entries")
