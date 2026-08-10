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


# The seed normalizes statuses to uppercase. Keeping the query predicate normalized
# avoids wrapping the indexed status column in LOWER() on every analytics request.
SUCCESS_STATUSES = ("SUCCESS", "SUCCESSFUL", "COMPLETED", "PAID")
