import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import Query

from app.config import settings
from app.query import TransactionFilterSet


def get_demo_user_id() -> uuid.UUID:
    return uuid.UUID(settings.demo_user_id)


def get_transaction_filters(
    q: Annotated[str | None, Query(max_length=120)] = None,
    category: Annotated[str | None, Query(max_length=80)] = None,
    status: Annotated[str | None, Query(max_length=48)] = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    amount_min: Annotated[Decimal | None, Query(ge=0)] = None,
    amount_max: Annotated[Decimal | None, Query(ge=0)] = None,
) -> TransactionFilterSet:
    return TransactionFilterSet(
        q=q,
        category=category,
        status=status,
        date_from=date_from,
        date_to=date_to,
        amount_min=amount_min,
        amount_max=amount_max,
    )


Page = Annotated[int, Query(ge=1)]
PageSize = Annotated[int, Query(ge=10, le=100)]
SortBy = Annotated[Literal["occurred_at", "amount"], Query()]
SortDirection = Annotated[Literal["asc", "desc"], Query()]
