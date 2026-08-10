import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import (
    Page,
    PageSize,
    SortBy,
    SortDirection,
    get_demo_user_id,
    get_transaction_filters,
)
from app.database import get_db
from app.query import TransactionFilterSet
from app.repositories.transactions import get_meta, get_transaction, list_transactions, spend_analytics
from app.schemas import SpendAnalytics, TransactionMeta, TransactionOut, TransactionsPage

router = APIRouter(tags=["transactions"])


@router.get("/transactions", response_model=TransactionsPage)
async def transactions(
    session: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[uuid.UUID, Depends(get_demo_user_id)],
    filters: Annotated[TransactionFilterSet, Depends(get_transaction_filters)],
    page: Page = 1,
    page_size: PageSize = 50,
    sort_by: SortBy = "occurred_at",
    sort_direction: SortDirection = "desc",
) -> TransactionsPage:
    items, total, pages = await list_transactions(
        session,
        user_id,
        filters,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_direction=sort_direction,
    )
    return TransactionsPage(items=items, page=page, page_size=page_size, total=total, pages=pages)


@router.get("/transactions/meta", response_model=TransactionMeta)
async def transaction_meta(
    session: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[uuid.UUID, Depends(get_demo_user_id)],
) -> TransactionMeta:
    return TransactionMeta(**(await get_meta(session, user_id)))


@router.get("/transactions/{transaction_id}", response_model=TransactionOut)
async def transaction_detail(
    transaction_id: str,
    session: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[uuid.UUID, Depends(get_demo_user_id)],
) -> TransactionOut:
    item = await get_transaction(session, user_id, transaction_id)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    return TransactionOut.model_validate(item)


@router.get("/analytics/spend", response_model=SpendAnalytics)
async def analytics(
    session: Annotated[AsyncSession, Depends(get_db)],
    user_id: Annotated[uuid.UUID, Depends(get_demo_user_id)],
    filters: Annotated[TransactionFilterSet, Depends(get_transaction_filters)],
) -> SpendAnalytics:
    return SpendAnalytics(**(await spend_analytics(session, user_id, filters)))
