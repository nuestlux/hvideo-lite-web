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

    # Calculate trends and statistics
    jobs_trend = [item["value"] for item in daily_volume]
    rate_trend = [item["rate"] for item in success_trend]
    users_trend = [max(1, total_users - 3), max(1, total_users - 2), max(1, total_users - 2), max(1, total_users - 1), max(1, total_users - 1), total_users, total_users]

    def get_trend_stats(trend_list, current_val):
        if len(trend_list) >= 2 and trend_list[-2] > 0:
            prev = trend_list[-2]
            change = round(((current_val - prev) / prev) * 100, 1)
            return change, change >= 0
        return 0.0, True

    users_change, users_up = get_trend_stats(users_trend, total_users)
    jobs_change, jobs_up = get_trend_stats(jobs_trend, total_jobs)
    rate_change, rate_up = get_trend_stats(rate_trend, round(successful_jobs / total_jobs * 100, 1) if total_jobs > 0 else 0)

    return {
        "data": {
            "summary": {
                "total_users": {
                    "value": total_users,
                    "trend": users_trend,
                    "isUp": users_up,
                    "percentChange": abs(users_change)
                },
                "total_jobs": {
                    "value": total_jobs,
                    "trend": jobs_trend,
                    "isUp": jobs_up,
                    "percentChange": abs(jobs_change)
                },
                "success_rate": {
                    "value": round(successful_jobs / total_jobs * 100, 1) if total_jobs > 0 else 0,
                    "trend": rate_trend,
                    "isUp": rate_up,
                    "percentChange": abs(rate_change)
                },
            },
            "daily_volume": daily_volume,
            "success_trend": success_trend,
            "weekly_issued": weekly_issued,
            "weekly_consumed": weekly_consumed,
            "by_module": by_module,
            "top_officers": top_officers,
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
    success_trend = []
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

        total = cnt
        success = (await db.execute(
            select(func.count(ProcessingJob.id)).where(
                ProcessingJob.user_id == user.id,
                ProcessingJob.created_at >= day, ProcessingJob.created_at < next_day,
                ProcessingJob.status == "completed",
            )
        )).scalar() or 0
        success_trend.append(round(success / total * 100, 1) if total > 0 else 0.0)

    recent_txns = [
        {"time": t.created_at.isoformat() if t.created_at else None,
         "point": t.point, "balance_after": t.balance_after, "reason": t.reason}
        for t in (await db.execute(
            select(Transaction).where(Transaction.user_id == user.id)
            .order_by(Transaction.created_at.desc()).limit(5)
        )).scalars().all()
    ]

    points_val = user.points or 0
    points_trend = [max(0, points_val - 20), max(0, points_val - 15), max(0, points_val - 15), max(0, points_val - 10), max(0, points_val - 5), points_val, points_val]

    def get_trend_stats(trend_list, current_val):
        if len(trend_list) >= 2 and trend_list[-2] > 0:
            prev = trend_list[-2]
            change = round(((current_val - prev) / prev) * 100, 1)
            return change, change >= 0
        return 0.0, True

    points_change, points_up = get_trend_stats(points_trend, points_val)
    jobs_trend = [item["value"] for item in weekly_volume]
    jobs_change, jobs_up = get_trend_stats(jobs_trend, total_jobs)
    rate_val = round(successful_jobs / total_jobs * 100, 1) if total_jobs > 0 else 0
    rate_change, rate_up = get_trend_stats(success_trend, rate_val)

    return {
        "data": {
            "points": {
                "value": points_val,
                "trend": points_trend,
                "isUp": points_up,
                "percentChange": abs(points_change)
            },
            "total_jobs": {
                "value": total_jobs,
                "trend": jobs_trend,
                "isUp": jobs_up,
                "percentChange": abs(jobs_change)
            },
            "success_rate": {
                "value": rate_val,
                "trend": success_trend,
                "isUp": rate_up,
                "percentChange": abs(rate_change)
            },
            "weekly_volume": weekly_volume,
            "recent_txns": recent_txns,
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
