from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass(slots=True)
class TransactionFilterSet:
    q: str | None = None
    category: str | None = None
    status: str | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    amount_min: Decimal | None = None
    amount_max: Decimal | None = None

SUCCESS_STATUSES = ("SUCCESS", "SUCCESSFUL", "COMPLETED", "PAID")
