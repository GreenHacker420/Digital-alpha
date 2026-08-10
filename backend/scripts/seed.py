import json
import os
import re
import sys
import uuid
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_FLOOR
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Base, Reward, RewardLedgerEntry, Transaction, User

DEMO_USER_ID = uuid.UUID(settings.demo_user_id)
SUCCESS_STATUSES = {"success", "successful", "completed", "paid"}

REWARDS = [
    Reward(id="cashback-50", title="₹50 cashback", description="Cashback on your next successful card payment.", coin_cost=150, kind="cashback", value_label="₹50"),
    Reward(id="coffee-100", title="Coffee voucher", description="A digital voucher for your next coffee run.", coin_cost=220, kind="voucher", value_label="₹100"),
    Reward(id="movies-200", title="Movie voucher", description="Put your rewards toward your next movie night.", coin_cost=360, kind="voucher", value_label="₹200"),
    Reward(id="cashback-150", title="₹150 cashback", description="A bigger statement credit for regular redeemers.", coin_cost=420, kind="cashback", value_label="₹150"),
    Reward(id="shopping-300", title="Shopping voucher", description="Redeemable against a selected shopping partner.", coin_cost=650, kind="voucher", value_label="₹300"),
]


def first_value(row: dict, *keys: str):
    lowered = {str(key).lower(): value for key, value in row.items()}
    for key in keys:
        if key in row and row[key] not in (None, ""):
            return row[key]
        value = lowered.get(key.lower())
        if value not in (None, ""):
            return value
    return None


def parse_amount(value) -> Decimal:
    if isinstance(value, (int, float, Decimal)):
        return Decimal(str(value)).quantize(Decimal("0.01"))
    cleaned = re.sub(r"[^0-9.\-]", "", str(value or "0"))
    try:
        return Decimal(cleaned or "0").quantize(Decimal("0.01"))
    except InvalidOperation as exc:
        raise ValueError(f"Could not parse amount: {value!r}") from exc


def parse_datetime(value) -> datetime:
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, (int, float)):
        parsed = datetime.fromtimestamp(value, tz=timezone.utc)
    else:
        raw = str(value or "").strip()
        if not raw:
            return datetime.now(timezone.utc)
        raw = raw.replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(raw)
        except ValueError:
            parsed = datetime.strptime(raw[:10], "%Y-%m-%d")
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def normalize_transaction(row: dict, index: int) -> Transaction:
    source_id = first_value(row, "id", "transaction_id", "txn_id", "reference_id")
    transaction_id = str(source_id or uuid.uuid5(uuid.NAMESPACE_URL, f"arcpay:{index}:{row}"))
    merchant = first_value(row, "merchant_name", "merchant", "merchantName", "payee", "name")
    category = first_value(row, "category", "spend_category", "merchant_category")
    amount = parse_amount(first_value(row, "amount", "transaction_amount", "value"))
    status = str(first_value(row, "payment_status", "status", "transaction_status") or "unknown")
    occurred_at = parse_datetime(first_value(row, "date", "occurred_at", "transaction_date", "created_at", "timestamp"))

    return Transaction(
        id=transaction_id[:80],
        user_id=DEMO_USER_ID,
        merchant_name=str(merchant or "Unknown merchant")[:180],
        category=str(category or "Other")[:80],
        amount=amount,
        currency=str(first_value(row, "currency") or "INR").upper()[:3],
        status=status[:48],
        occurred_at=occurred_at,
        payment_method=(str(first_value(row, "payment_method", "method", "card"))[:120] if first_value(row, "payment_method", "method", "card") else None),
        reference_id=(str(first_value(row, "reference_id", "reference", "rrn"))[:120] if first_value(row, "reference_id", "reference", "rrn") else None),
        description=(str(first_value(row, "description", "note")) if first_value(row, "description", "note") else None),
    )


def earned_coins(transaction: Transaction) -> int:
    if transaction.status.lower() not in SUCCESS_STATUSES or transaction.amount <= 0:
        return 0
    raw = int((transaction.amount / Decimal("100")).to_integral_value(rounding=ROUND_FLOOR))
    return min(raw, settings.coin_cap_per_transaction)


def load_rows(path: Path) -> list[dict]:
    data = json.loads(path.read_text())
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("transactions", "data", "items", "records"):
            if isinstance(data.get(key), list):
                return data[key]
    raise ValueError("transactions.json must be a JSON array or contain a transactions/data/items/records array")


def main() -> None:
    path = Path(sys.argv[1] if len(sys.argv) > 1 else "../transactions.json").resolve()
    if not path.exists():
        raise SystemExit(f"Dataset not found: {path}")

    sync_url = os.getenv(
        "DATABASE_URL_SYNC",
        "postgresql+psycopg://arcpay:arcpay@localhost:5432/arcpay",
    )
    engine = create_engine(sync_url, pool_pre_ping=True)
    rows = load_rows(path)

    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        Base.metadata.drop_all(connection)
        Base.metadata.create_all(connection)
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_transactions_merchant_trgm ON transactions USING gin (lower(merchant_name) gin_trgm_ops)"))

    with Session(engine) as session:
        session.add(User(id=DEMO_USER_ID, display_name="Demo user"))
        session.add_all(REWARDS)
        session.flush()

        transactions = [normalize_transaction(row, index) for index, row in enumerate(rows)]
        session.add_all(transactions)
        session.flush()

        credits = []
        for transaction in transactions:
            coins = earned_coins(transaction)
            if coins:
                credits.append(
                    RewardLedgerEntry(
                        user_id=DEMO_USER_ID,
                        delta=coins,
                        reason="payment_earning",
                        transaction_id=transaction.id,
                    )
                )
        session.add_all(credits)
        session.commit()

    print(f"Seeded {len(transactions)} transactions, {len(credits)} earning entries, and {len(REWARDS)} rewards from {path}")


if __name__ == "__main__":
    main()
