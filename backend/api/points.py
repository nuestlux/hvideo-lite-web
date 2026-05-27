from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.transaction import PointAdjustRequest, PaginatedTransactions
from middleware.auth import get_current_user, require_admin
from models.user import User
from services.point_service import adjust_points, get_all_transactions, get_user_transactions, get_point_stats
from utils.errors import AppException
from sqlalchemy import select

router = APIRouter(tags=["points"])


@router.post("/api/admin/users/{user_id}/points")
async def admin_adjust_points(
    user_id: int,
    data: PointAdjustRequest,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    txn = await adjust_points(user_id, data.point, data.reason, admin, db)
    from schemas.transaction import TransactionOut
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    return {
        "data": {
            "transaction": TransactionOut.model_validate(txn),
            "new_balance": user.points if user else 0,
        },
        "message": "Điều chỉnh point thành công",
    }


@router.get("/api/admin/transactions")
async def admin_list_transactions(
    user_id: int | None = Query(None),
    service: str = Query(""),
    txn_type: str = Query(""),
    search: str = Query(""),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    items, total = await get_all_transactions(db, user_id, service, txn_type, search, sort_by, sort_order, page, limit)
    from schemas.transaction import TransactionOut

    def enrich(t):
        d = TransactionOut.model_validate(t)
        if t.user:
            d.user_name = t.user.name
            d.user_email = t.user.email
        return d

    return {
        "data": PaginatedTransactions(
            items=[enrich(t) for t in items],
            total=total, page=page, limit=limit,
        ),
        "message": "Success",
    }


@router.get("/api/me/transactions")
async def my_transactions(
    service: str = Query(""),
    page: int = Query(1),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items, total = await get_user_transactions(user.id, db, service, page, limit)
    from schemas.transaction import TransactionOut
    return {
        "data": PaginatedTransactions(
            items=[TransactionOut.model_validate(t) for t in items],
            total=total, page=page, limit=limit,
        ),
        "message": "Success",
    }


@router.get("/api/admin/points/stats")
async def admin_point_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    stats = await get_point_stats(db)
    return {"data": stats, "message": "Success"}
