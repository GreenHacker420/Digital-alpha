import json
import re
import sys
import uuid
from collections import Counter
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_FLOOR
from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Base, Reward, RewardLedgerEntry, Transaction, User

DEMO_USER_ID = uuid.UUID(settings.demo_user_id)
SUCCESS_STATUSES = {"success", "successful", "completed", "paid"}

REWARD_DEFINITIONS = [
    {"id": "cashback-50", "title": "₹50 cashback", "description": "Cashback on your next successful card payment.", "coin_cost": 1500, "kind": "cashback", "value_label": "₹50"},
    {"id": "coffee-100", "title": "Coffee voucher", "description": "A digital voucher for your next coffee run.", "coin_cost": 3000, "kind": "voucher", "value_label": "₹100"},
    {"id": "movies-200", "title": "Movie voucher", "description": "Put your rewards toward your next movie night.", "coin_cost": 6500, "kind": "voucher", "value_label": "₹200"},
    {"id": "cashback-500", "title": "₹500 cashback", "description": "A statement credit for regular redeemers.", "coin_cost": 10000, "kind": "cashback", "value_label": "₹500"},
    {"id": "shopping-1000", "title": "Shopping voucher", "description": "Redeemable against a selected shopping partner.", "coin_cost": 18000, "kind": "voucher", "value_label": "₹1,000"},
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
    # The supplied data intentionally mixes ISO strings, date-only values,
    # DD/MM/YYYY strings and Unix timestamps in milliseconds.
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, (int, float)):
        seconds = value / 1000 if abs(value) > 10_000_000_000 else value
        parsed = datetime.fromtimestamp(seconds, tz=timezone.utc)
    else:
        raw = str(value or "").strip()
        if not raw:
            raise ValueError("Transaction timestamp is empty")
        if re.fullmatch(r"\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}", raw):
            parsed = datetime.strptime(raw, "%d/%m/%Y %H:%M:%S")
        else:
            parsed = datetime.fromisoformat(raw.replace("Z", "+00:00"))

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def normalize_transaction(row: dict) -> Transaction:
    source_id = str(first_value(row, "id", "transaction_id", "txn_id") or "unknown")[:80]
    amount = parse_amount(first_value(row, "amount", "transaction_amount", "value"))
    merchant = first_value(row, "merchant", "merchant_name", "merchantName", "payee", "name")
    category = first_value(row, "category", "spend_category", "merchant_category")
    status = str(first_value(row, "status", "payment_status", "transaction_status") or "UNKNOWN").upper()
    occurred_at = parse_datetime(first_value(row, "timestamp", "date", "occurred_at", "transaction_date", "created_at"))
    payment_method = first_value(row, "payment_method", "method", "card")
    description = first_value(row, "description", "note")

    return Transaction(
        source_id=source_id,
        user_id=DEMO_USER_ID,
        merchant_name=str(merchant or "Unknown merchant")[:180],
        category=str(category).strip()[:80] if category and str(category).strip() else "Uncategorized",
        amount=amount,
        currency=str(first_value(row, "currency") or "INR").upper()[:3],
        status=status[:48],
        occurred_at=occurred_at,
        payment_method=str(payment_method)[:120] if payment_method else None,
        description=str(description) if description else None,
        is_anomaly=abs(amount) > Decimal(settings.analytics_outlier_limit),
    )


def earned_coins(transaction: Transaction) -> int:
    if (
        transaction.status.lower() not in SUCCESS_STATUSES
        or transaction.amount <= 0
        or transaction.is_anomaly
    ):
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

    rows = load_rows(path)
    source_counts = Counter(str(row.get("id")) for row in rows)
    duplicate_source_ids = sum(1 for count in source_counts.values() if count > 1)

    engine = create_engine(settings.database_url_sync, pool_pre_ping=True)
    with engine.begin() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
        Base.metadata.drop_all(connection)
        Base.metadata.create_all(connection)
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_transactions_merchant_trgm ON transactions USING gin (lower(merchant_name) gin_trgm_ops)"))

    with Session(engine) as session:
        session.add(User(id=DEMO_USER_ID, display_name="Demo user"))
        session.add_all([Reward(**definition) for definition in REWARD_DEFINITIONS])
        session.flush()

        transactions = [normalize_transaction(row) for row in rows]
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

    anomaly_count = sum(transaction.is_anomaly for transaction in transactions)
    print(
        f"Seeded {len(transactions)} source rows, {len(credits)} earning entries and "
        f"{len(REWARD_DEFINITIONS)} rewards. Preserved {duplicate_source_ids} duplicate source IDs; "
        f"flagged {anomaly_count} amount anomalies."
    )


if __name__ == "__main__":
    main()
