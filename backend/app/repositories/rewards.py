import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Reward, RewardLedgerEntry, User


async def list_rewards(session: AsyncSession) -> list[Reward]:
    stmt = select(Reward).where(Reward.active.is_(True)).order_by(Reward.coin_cost)
    return list((await session.scalars(stmt)).all())


async def get_balance(session: AsyncSession, user_id: uuid.UUID) -> int:
    stmt = select(func.coalesce(func.sum(RewardLedgerEntry.delta), 0)).where(
        RewardLedgerEntry.user_id == user_id
    )
    return int((await session.execute(stmt)).scalar_one())


async def lock_user(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    return await session.scalar(select(User).where(User.id == user_id).with_for_update())


async def get_active_reward(session: AsyncSession, reward_id: str) -> Reward | None:
    return await session.scalar(
        select(Reward).where(Reward.id == reward_id, Reward.active.is_(True))
    )
