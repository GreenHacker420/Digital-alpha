import math
import uuid
from decimal import Decimal

from sqlalchemy import Select, asc, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Transaction
from app.query import SUCCESS_STATUSES, TransactionFilterSet


def _apply_filters(
    statement: Select,
    user_id: uuid.UUID,
    filters: TransactionFilterSet,
    *,
    successful_only: bool = False,
) -> Select:
    statement = statement.where(Transaction.user_id == user_id)

    if filters.q:
        statement = statement.where(Transaction.merchant_name.ilike(f"%{filters.q.strip()}%"))
    if filters.category:
        statement = statement.where(Transaction.category == filters.category)
    if filters.status:
        statement = statement.where(Transaction.status == filters.status)
    if filters.date_from:
        statement = statement.where(Transaction.occurred_at >= filters.date_from)
    if filters.date_to:
        statement = statement.where(Transaction.occurred_at <= filters.date_to)
    if filters.amount_min is not None:
        statement = statement.where(Transaction.amount >= filters.amount_min)
    if filters.amount_max is not None:
        statement = statement.where(Transaction.amount <= filters.amount_max)
    if successful_only:
        statement = statement.where(func.lower(Transaction.status).in_(SUCCESS_STATUSES))

    return statement


async def list_transactions(
    session: AsyncSession,
    user_id: uuid.UUID,
    filters: TransactionFilterSet,
    *,
    page: int,
    page_size: int,
    sort_by: str,
    sort_direction: str,
) -> tuple[list[Transaction], int, int]:
    count_stmt = _apply_filters(select(func.count()).select_from(Transaction), user_id, filters)
    total = int((await session.execute(count_stmt)).scalar_one())

    sort_column = Transaction.amount if sort_by == "amount" else Transaction.occurred_at
    direction = asc if sort_direction == "asc" else desc

    data_stmt = _apply_filters(select(Transaction), user_id, filters).order_by(
        direction(sort_column), direction(Transaction.id)
    )
    data_stmt = data_stmt.limit(page_size).offset((page - 1) * page_size)
    items = list((await session.scalars(data_stmt)).all())

    pages = max(1, math.ceil(total / page_size)) if total else 0
    return items, total, pages


async def get_transaction(
    session: AsyncSession, user_id: uuid.UUID, transaction_id: str
) -> Transaction | None:
    stmt = select(Transaction).where(
        Transaction.user_id == user_id,
        Transaction.id == transaction_id,
    )
    return await session.scalar(stmt)


async def get_meta(session: AsyncSession, user_id: uuid.UUID) -> dict:
    categories = list(
        (
            await session.scalars(
                select(Transaction.category)
                .where(Transaction.user_id == user_id)
                .distinct()
                .order_by(Transaction.category)
            )
        ).all()
    )
    statuses = list(
        (
            await session.scalars(
                select(Transaction.status)
                .where(Transaction.user_id == user_id)
                .distinct()
                .order_by(Transaction.status)
            )
        ).all()
    )
    min_amount, max_amount, min_date, max_date = (
        await session.execute(
            select(
                func.min(Transaction.amount),
                func.max(Transaction.amount),
                func.min(Transaction.occurred_at),
                func.max(Transaction.occurred_at),
            ).where(Transaction.user_id == user_id)
        )
    ).one()
    return {
        "categories": categories,
        "statuses": statuses,
        "min_amount": min_amount,
        "max_amount": max_amount,
        "min_date": min_date,
        "max_date": max_date,
    }


async def spend_analytics(
    session: AsyncSession,
    user_id: uuid.UUID,
    filters: TransactionFilterSet,
) -> dict:
    base = _apply_filters(select(Transaction), user_id, filters, successful_only=True).subquery()

    total_spend, successful_transactions = (
        await session.execute(
            select(func.coalesce(func.sum(base.c.amount), 0), func.count()).select_from(base)
        )
    ).one()

    category_rows = (
        await session.execute(
            select(
                base.c.category,
                func.sum(base.c.amount).label("amount"),
                func.count().label("count"),
            )
            .group_by(base.c.category)
            .order_by(desc("amount"))
        )
    ).all()

    month_expr = func.date_trunc("month", base.c.occurred_at)
    monthly_rows = (
        await session.execute(
            select(
                month_expr.label("month"),
                func.sum(base.c.amount).label("amount"),
                func.count().label("count"),
            )
            .group_by(month_expr)
            .order_by(month_expr)
        )
    ).all()

    return {
        "total_spend": Decimal(total_spend),
        "successful_transactions": int(successful_transactions),
        "categories": [
            {"category": row.category, "amount": row.amount, "count": row.count}
            for row in category_rows
        ],
        "monthly": [
            {
                "month": row.month.strftime("%Y-%m"),
                "amount": row.amount,
                "count": row.count,
            }
            for row in monthly_rows
        ],
    }
