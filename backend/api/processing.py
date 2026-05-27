import json
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from middleware.auth import get_current_user, require_admin
from models.user import User
from models.processing_job import ProcessingJob
from services.ai_service import create_job, create_batch_jobs, list_jobs, list_jobs_by_batch, list_all_jobs, analyze_video_errors
from services.frame_service import extract_frames
from schemas.job import JobOut, PaginatedJobs
from utils.errors import AppException

router = APIRouter(tags=["processing"])


@router.post("/api/ai/process")
async def start_processing(
    module: str = Query(...),
    file_id: int = Query(...),
    reference_file_id: int = Query(None),
    config: str = Query("{}"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        config_dict = json.loads(config)
    except json.JSONDecodeError:
        config_dict = {}
    config_dict["reference_file_id"] = reference_file_id

    countries = config_dict.get("countries", [])
    if isinstance(countries, list) and len(countries) > 1:
        batch_id, jobs = await create_batch_jobs(user, file_id, config_dict, db)
        return {
            "data": {
                "batch_id": batch_id,
                "jobs": [JobOut.model_validate(j) for j in jobs],
            },
            "message": f"Đã tạo {len(jobs)} công việc xử lý",
        }

    job = await create_job(user, module, file_id, config_dict, db)
    return {"data": JobOut.model_validate(job), "message": "Đã tạo công việc xử lý"}


@router.get("/api/ai/jobs")
async def list_my_jobs(
    module: str = Query(""),
    page: int = Query(1),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items, total = await list_jobs(user.id, db, module, page, limit)
    return {
        "data": PaginatedJobs(
            items=[JobOut.model_validate(j) for j in items],
            total=total, page=page, limit=limit,
        ),
        "message": "Success",
    }


@router.get("/api/ai/jobs/batch")
async def get_batch_jobs(
    batch_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    jobs = await list_jobs_by_batch(user.id, batch_id, db)
    return {
        "data": [JobOut.model_validate(j) for j in jobs],
        "message": "Success",
    }


@router.get("/api/ai/jobs/{job_id}")
async def get_job_status(
    job_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ProcessingJob).where(ProcessingJob.id == job_id, ProcessingJob.user_id == user.id)
    )
    job = result.scalar_one_or_none()
    if not job:
        raise AppException("JOB_NOT_FOUND", "Công việc không tồn tại", 404)
    return {"data": JobOut.model_validate(job), "message": "Success"}


@router.get("/api/admin/ai/jobs")
async def admin_list_jobs(
    module: str = Query(""),
    page: int = Query(1),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    items, total = await list_all_jobs(db, module, page, limit)
    return {
        "data": PaginatedJobs(
            items=[JobOut.model_validate(j) for j in items],
            total=total, page=page, limit=limit,
        ),
        "message": "Success",
    }


@router.post("/api/ai/video/analyze")
async def analyze_video(
    file_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await analyze_video_errors(file_id, user.id, db)
    return {"data": result, "message": "Success"}


@router.post("/api/ai/video/frames")
async def extract_video_frames(
    file_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await extract_frames(file_id, user.id, db)
    return {"data": result, "message": "Success"}
