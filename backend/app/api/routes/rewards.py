import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_demo_user_id
from app.database import get_db
from app.repositories.rewards import get_balance, list_rewards
from app.schemas import CoinBalance, RedeemRequest, RedeemResponse, RewardOut
from app.services.rewards import InsufficientBalanceError, RewardNotFoundError, redeem_reward

router = APIRouter(prefix="/rewards", tags=["rewards"])


@router.get("/balance", response_model=CoinBalance)
async def balance(
    session: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[uuid.UUID, Depends(get_demo_user_id)],
) -> CoinBalance:
    return CoinBalance(balance=await get_balance(session, user_id))


@router.get("/catalog", response_model=list[RewardOut])
async def catalog(session: Annotated[AsyncSession, Depends(get_db)]) -> list[RewardOut]:
    return [RewardOut.model_validate(reward) for reward in await list_rewards(session)]


@router.post("/redeem", response_model=RedeemResponse)
async def redeem(
    payload: RedeemRequest,
    session: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[uuid.UUID, Depends(get_demo_user_id)],
) -> RedeemResponse:
    try:
        result = await redeem_reward(session, user_id, payload.reward_id)
    except RewardNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reward not found") from exc
    except InsufficientBalanceError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "insufficient_balance",
                "balance": exc.balance,
                "required": exc.required,
            },
        ) from exc

    return RedeemResponse(
        redemption_id=str(result.entry.id),
        reward=RewardOut.model_validate(result.reward),
        balance=result.balance,
        redeemed_at=result.entry.created_at,
    )
