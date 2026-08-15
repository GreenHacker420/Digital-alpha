import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Identity,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    text,
)
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

        Index("ix_transactions_user_occurred_id", "user_id", "occurred_at", "id"),
        Index("ix_transactions_user_amount_id", "user_id", "amount", "id"),
        Index(
            "ix_transactions_user_category_occurred",
            "user_id",
            "category",
            "occurred_at",
            "id",
        ),
        Index(
            "ix_transactions_user_status_occurred",
            "user_id",
            "status",
            "occurred_at",
            "id",
        ),
        Index("ix_transactions_user_source_id", "user_id", "source_id"),
        Index(
            "ix_transactions_user_valid_spend",
            "user_id",
            "occurred_at",
            postgresql_where=text(
                "status IN ('SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'PAID') "
                "AND amount > 0 AND is_anomaly = false"
            ),
        ),
    )


    id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    source_id: Mapped[str] = mapped_column(String(80), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    merchant_name: Mapped[str] = mapped_column(String(180), nullable=False)
    category: Mapped[str] = mapped_column(String(80), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    status: Mapped[str] = mapped_column(String(48), nullable=False)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    payment_method: Mapped[str | None] = mapped_column(String(120))
    description: Mapped[str | None] = mapped_column(Text)
    is_anomaly: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

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
        UniqueConstraint(
            "transaction_id",
            "reason",
            name="uq_reward_earning_per_transaction",
        ),
        Index("ix_reward_ledger_user_created_at", "user_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(40), nullable=False)
    transaction_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey("transactions.id", ondelete="SET NULL"),
    )
    reward_id: Mapped[str | None] = mapped_column(
        ForeignKey("rewards.id", ondelete="SET NULL")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped[User] = relationship(back_populates="reward_entries")
