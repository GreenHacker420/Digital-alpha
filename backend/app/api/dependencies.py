import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from fastapi import HTTPException, Query, status

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
    amount_min: Decimal | None = None,
    amount_max: Decimal | None = None,
) -> TransactionFilterSet:
    if amount_min is not None and amount_max is not None and amount_min > amount_max:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="amount_min must be less than or equal to amount_max",
        )
    if date_from is not None and date_to is not None and date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="date_from must be earlier than or equal to date_to",
        )

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
