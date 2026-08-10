from fastapi.testclient import TestClient

from app.api.routes import rewards as rewards_routes
from app.database import get_db
from app.main import app
from app.services.rewards import InsufficientBalanceError, RewardNotFoundError


async def fake_db():
    yield object()


app.dependency_overrides[get_db] = fake_db
client = TestClient(app)


def test_redeem_rejects_unknown_reward(monkeypatch):
    async def fake_redeem(*_args, **_kwargs):
        raise RewardNotFoundError("missing")

    monkeypatch.setattr(rewards_routes, "redeem_reward", fake_redeem)
    response = client.post("/api/v1/rewards/redeem", json={"reward_id": "missing"})

    assert response.status_code == 404
    assert response.json()["detail"] == "Reward not found"


def test_redeem_rejects_unaffordable_reward(monkeypatch):
    async def fake_redeem(*_args, **_kwargs):
        raise InsufficientBalanceError(balance=90, required=1500)

    monkeypatch.setattr(rewards_routes, "redeem_reward", fake_redeem)
    response = client.post("/api/v1/rewards/redeem", json={"reward_id": "cashback-50"})

    assert response.status_code == 409
    assert response.json()["detail"] == {
        "code": "insufficient_balance",
        "balance": 90,
        "required": 1500,
    }
