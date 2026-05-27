import os
import psutil
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from middleware.auth import get_current_user, require_admin
from models.user import User
from models.transaction import Transaction
from models.processing_job import ProcessingJob

router = APIRouter(tags=["dashboard"])


@router.get("/api/dashboard/admin")
async def admin_dashboard(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_jobs = (await db.execute(select(func.count(ProcessingJob.id)))).scalar() or 0
    successful_jobs = (await db.execute(
        select(func.count(ProcessingJob.id)).where(ProcessingJob.status == "completed")
    )).scalar() or 0

    daily_volume = []
    success_trend = []
    weekly_issued = []
    weekly_consumed = []
    for i in range(6, -1, -1):
        day = today_start - timedelta(days=i)
        next_day = day + timedelta(days=1)

        cnt = (await db.execute(
            select(func.count(ProcessingJob.id)).where(
                ProcessingJob.created_at >= day, ProcessingJob.created_at < next_day
            )
        )).scalar() or 0
        daily_volume.append({"date": day.strftime("%a"), "value": cnt})

        total = cnt
        success = (await db.execute(
            select(func.count(ProcessingJob.id)).where(
                ProcessingJob.created_at >= day, ProcessingJob.created_at < next_day,
                ProcessingJob.status == "completed",
            )
        )).scalar() or 0
        success_trend.append({"date": day.strftime("%a"), "rate": round(success / total * 100, 1) if total > 0 else 0})

        issued = (await db.execute(
            select(func.coalesce(func.sum(Transaction.point), 0)).where(
                Transaction.created_at >= day, Transaction.created_at < next_day,
                Transaction.type == "admin_adjustment", Transaction.point > 0,
            )
        )).scalar() or 0
        consumed = (await db.execute(
            select(func.coalesce(func.sum(func.abs(Transaction.point)), 0)).where(
                Transaction.created_at >= day, Transaction.created_at < next_day,
                Transaction.type == "deduction",
            )
        )).scalar() or 0
        weekly_issued.append({"date": day.strftime("%a"), "value": issued})
        weekly_consumed.append({"date": day.strftime("%a"), "value": consumed})

    by_module = [
        {"name": r[0] or "Khác", "value": r[1]}
        for r in (await db.execute(
            select(Transaction.service, func.coalesce(func.sum(func.abs(Transaction.point)), 0))
            .where(Transaction.type == "deduction", Transaction.service.isnot(None))
            .group_by(Transaction.service)
        ))
    ]

    top_officers = [
        {"id": r.id, "name": r.name, "email": r.email, "points": r.total_points, "txns": r.txn_count}
        for r in (await db.execute(
            select(User.id, User.name, User.email,
                   func.coalesce(func.sum(func.abs(Transaction.point)), 0).label("total_points"),
                   func.count(Transaction.id).label("txn_count"))
            .join(Transaction, User.id == Transaction.user_id)
            .where(Transaction.type == "deduction")
            .group_by(User.id, User.name, User.email)
            .order_by(func.sum(func.abs(Transaction.point)).desc())
            .limit(10)
        ))
    ]

    return {
        "data": {
            "summary": {
                "total_users": total_users, "total_jobs": total_jobs,
                "success_rate": round(successful_jobs / total_jobs * 100, 1) if total_jobs > 0 else 0,
            },
            "daily_volume": daily_volume, "success_trend": success_trend,
            "weekly_issued": weekly_issued, "weekly_consumed": weekly_consumed,
            "by_module": by_module, "top_officers": top_officers,
        },
        "message": "Success",
    }


@router.get("/api/dashboard/officer")
async def officer_dashboard(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_jobs = (await db.execute(
        select(func.count(ProcessingJob.id)).where(ProcessingJob.user_id == user.id)
    )).scalar() or 0
    successful_jobs = (await db.execute(
        select(func.count(ProcessingJob.id)).where(
            ProcessingJob.user_id == user.id, ProcessingJob.status == "completed"
        )
    )).scalar() or 0

    weekly_volume = []
    for i in range(6, -1, -1):
        day = today_start - timedelta(days=i)
        next_day = day + timedelta(days=1)
        cnt = (await db.execute(
            select(func.count(ProcessingJob.id)).where(
                ProcessingJob.user_id == user.id,
                ProcessingJob.created_at >= day, ProcessingJob.created_at < next_day,
            )
        )).scalar() or 0
        weekly_volume.append({"date": day.strftime("%a"), "value": cnt})

    recent_txns = [
        {"time": t.created_at.isoformat() if t.created_at else None,
         "point": t.point, "balance_after": t.balance_after, "reason": t.reason}
        for t in (await db.execute(
            select(Transaction).where(Transaction.user_id == user.id)
            .order_by(Transaction.created_at.desc()).limit(5)
        )).scalars().all()
    ]

    return {
        "data": {
            "points": user.points, "total_jobs": total_jobs,
            "success_rate": round(successful_jobs / total_jobs * 100, 1) if total_jobs > 0 else 0,
            "weekly_volume": weekly_volume, "recent_txns": recent_txns,
        },
        "message": "Success",
    }


@router.get("/api/health/server")
async def server_health():
    cpu_percent = psutil.cpu_percent(interval=0.5)
    mem = psutil.virtual_memory()
    disk = psutil.disk_usage(os.path.abspath(os.sep))

    try:
        import GPUtil
        gpus = [{"id": g.id, "name": g.name, "load": g.load * 100, "memory_used": g.memoryUsed, "memory_total": g.memoryTotal} for g in GPUtil.getGPUs()]
    except Exception:
        gpus = []

    return {
        "data": {
            "cpu": {"percent": cpu_percent, "cores": psutil.cpu_count()},
            "memory": {"used": mem.used, "total": mem.total, "percent": mem.percent},
            "disk": {"used": disk.used, "total": disk.total, "percent": disk.percent},
            "gpu": gpus,
            "timestamp": datetime.utcnow().isoformat(),
        },
        "message": "Success",
    }
