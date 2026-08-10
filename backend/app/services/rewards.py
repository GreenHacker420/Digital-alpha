import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Reward, RewardLedgerEntry
from app.repositories.rewards import get_active_reward, get_balance, lock_user


class RewardNotFoundError(Exception):
    pass


@dataclass(slots=True)
class InsufficientBalanceError(Exception):
    balance: int
    required: int


@dataclass(slots=True)
class RedemptionResult:
    entry: RewardLedgerEntry
    reward: Reward
    balance: int


async def redeem_reward(
    session: AsyncSession, user_id: uuid.UUID, reward_id: str
) -> RedemptionResult:
    async with session.begin():
        user = await lock_user(session, user_id)
        if user is None:
            raise RewardNotFoundError("Demo user not found")

        reward = await get_active_reward(session, reward_id)
        if reward is None:
            raise RewardNotFoundError(reward_id)

        balance = await get_balance(session, user_id)
        if balance < reward.coin_cost:
            raise InsufficientBalanceError(balance=balance, required=reward.coin_cost)

        entry = RewardLedgerEntry(
            user_id=user_id,
            delta=-reward.coin_cost,
            reason="redemption",
            reward_id=reward.id,
            created_at=datetime.now(timezone.utc),
        )
        session.add(entry)
        await session.flush()
        new_balance = balance - reward.coin_cost

    return RedemptionResult(entry=entry, reward=reward, balance=new_balance)
