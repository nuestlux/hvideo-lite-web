import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from models.user import User
from models.transaction import Transaction
from models.audit import AuditLog
from utils.errors import AppException

logger = logging.getLogger("hvideo.point")


async def adjust_points(
    user_id: int, point: int, reason: str, admin: User, db: AsyncSession
) -> Transaction:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException("USER_NOT_FOUND", "Người dùng không tồn tại", 404)
    if user.role == "admin":
        raise AppException("CANNOT_ADJUST_ADMIN", "Không thể điều chỉnh point của admin", 400)
    if point == 0:
        raise AppException("INVALID_POINT", "Số point phải khác 0", 400)

    if point < 0 and user.points + point < 0:
        raise AppException("INSUFFICIENT_POINTS", "Số dư không đủ để trừ", 400)

    balance_before = user.points
    user.points += point
    await db.flush()

    txn = Transaction(
        user_id=user_id,
        type="admin_adjustment",
        point=point,
        balance_before=balance_before,
        balance_after=user.points,
        reason=reason,
    )
    db.add(txn)
    await db.flush()

    audit = AuditLog(
        user_id=admin.id,
        action="adjust_points",
        target_type="user",
        target_id=user_id,
        details=f'Adjusted {point:+d} points: {reason} (balance: {balance_before} → {user.points})',
    )
    db.add(audit)
    await db.commit()
    await db.refresh(txn)
    return txn


async def deduct_points(
    user_id: int, cost: int, service: str, db: AsyncSession
) -> Transaction | None:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return None
    if user.points < cost:
        return None

    balance_before = user.points
    user.points -= cost
    await db.flush()

    txn = Transaction(
        user_id=user_id,
        type="deduction",
        service=service,
        point=-cost,
        balance_before=balance_before,
        balance_after=user.points,
        reason=f"Tiêu thụ: {service}",
    )
    db.add(txn)
    await db.commit()
    await db.refresh(txn)
    return txn


async def get_user_transactions(
    user_id: int, db: AsyncSession, service: str = "", page: int = 1, limit: int = 20
) -> tuple[list[Transaction], int]:
    query = select(Transaction).where(Transaction.user_id == user_id)
    count_query = select(func.count(Transaction.id)).where(Transaction.user_id == user_id)

    if service:
        query = query.where(Transaction.service == service)
        count_query = count_query.where(Transaction.service == service)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Transaction.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())
    return items, total


async def get_all_transactions(
    db: AsyncSession,
    user_id: int | None = None,
    service: str = "",
    txn_type: str = "",
    search: str = "",
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Transaction], int]:
    from sqlalchemy.orm import contains_eager

    query = select(Transaction).join(Transaction.user).options(contains_eager(Transaction.user))
    count_query = select(func.count(Transaction.id))

    if search:
        count_query = count_query.join(User, Transaction.user_id == User.id)

    if user_id:
        query = query.where(Transaction.user_id == user_id)
        count_query = count_query.where(Transaction.user_id == user_id)
    if service:
        query = query.where(Transaction.service == service)
        count_query = count_query.where(Transaction.service == service)
    if txn_type:
        query = query.where(Transaction.type == txn_type)
        count_query = count_query.where(Transaction.type == txn_type)
    if search:
        like = f"%{search}%"
        query = query.where(User.name.ilike(like) | User.email.ilike(like))
        count_query = count_query.where(User.name.ilike(like) | User.email.ilike(like))

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    sort_col = getattr(Transaction, sort_by, Transaction.created_at)
    order_fn = sort_col.desc if sort_order == "desc" else sort_col.asc
    query = query.order_by(order_fn()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())
    return items, total


async def get_point_stats(db: AsyncSession) -> dict:
    issued_query = select(func.coalesce(func.sum(Transaction.point), 0)).where(
        Transaction.type == "admin_adjustment", Transaction.point > 0
    )
    consumed_query = select(func.coalesce(func.sum(Transaction.point), 0)).where(
        Transaction.type == "deduction"
    )
    issued_all_query = select(func.coalesce(func.sum(func.abs(Transaction.point)), 0)).where(
        Transaction.type == "admin_adjustment"
    )

    issued = (await db.execute(issued_query)).scalar() or 0
    consumed = abs((await db.execute(consumed_query)).scalar() or 0)
    issued_all = (await db.execute(issued_all_query)).scalar() or 0

    by_service_query = select(
        Transaction.service,
        func.coalesce(func.sum(func.abs(Transaction.point)), 0),
    ).where(
        Transaction.type == "deduction",
        Transaction.service.isnot(None),
    ).group_by(Transaction.service)

    by_service = {}
    for row in await db.execute(by_service_query):
        by_service[row[0]] = row[1]

    return {
        "total_issued": issued,
        "total_consumed": consumed,
        "total_circulating": issued_all - consumed,
        "by_service": by_service,
    }
