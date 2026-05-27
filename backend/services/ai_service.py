import json
import logging
import random
import asyncio
import uuid
from datetime import datetime
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from models.processing_job import ProcessingJob
from models.user import User
from models.file_record import FileRecord
from services.point_service import deduct_points
from services.image_service import preprocess_image
from services.model_config import AI_MODELS, AIModelConfig
from schemas.job import JobOut
from utils.errors import AppException

logger = logging.getLogger("hvideo.ai")

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"


SERVICES = {
    "license_plate_image": {"cost_key": "license_plate_image_cost", "label": "Biển số (ảnh)"},
    "license_plate_video": {"cost_key": "license_plate_video_cost", "label": "Biển số (video)"},
    "video_repair_fast": {"cost_key": "video_repair_fast_cost", "label": "Sửa video nhanh"},
    "video_repair_deep": {"cost_key": "video_repair_deep_cost", "label": "Sửa video sâu"},
}

AI_STAGES = {
    "license_plate": [
        ("Tăng cường ảnh", 15),
        ("Phát hiện biển số", 30),
        ("Phân đoạn ký tự", 50),
        ("Nhận dạng ký tự", 70),
        ("Xác thực kết quả", 90),
    ],
    "video_repair": [
        ("Phân tích lỗi", 10),
        ("Phục hồi cấu trúc", 30),
        ("Sửa codec", 50),
        ("Đồng bộ hóa", 70),
        ("Xác thực", 90),
    ],
}


async def get_cost(module: str, db: AsyncSession) -> int:
    from models.config import SystemConfig
    svc = SERVICES.get(module)
    if not svc:
        return 0
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == svc["cost_key"]))
    config = result.scalar_one_or_none()
    return int(config.value) if config else 0


async def create_job(
    user: User,
    module: str,
    file_id: int,
    config: dict,
    db: AsyncSession,
    batch_id: str | None = None,
    country: str | None = None,
) -> ProcessingJob:
    svc = SERVICES.get(module)
    if not svc:
        raise AppException("INVALID_MODULE", "Module không hợp lệ", 400)

    file_result = await db.execute(select(FileRecord).where(FileRecord.id == file_id, FileRecord.user_id == user.id))
    file_record = file_result.scalar_one_or_none()
    if not file_record:
        raise AppException("FILE_NOT_FOUND", "File không tồn tại", 404)

    cost = await get_cost(module, db)
    if user.points < cost:
        raise AppException("INSUFFICIENT_POINTS", f"Không đủ point. Cần {cost} PT, hiện có {user.points} PT", 400)

    txn = await deduct_points(user.id, cost, module, db)
    if not txn:
        raise AppException("INSUFFICIENT_POINTS", "Không thể trừ point", 400)

    ref_id = config.get("reference_file_id")
    job = ProcessingJob(
        user_id=user.id,
        module=module,
        status="pending",
        input_file=file_record.original_name,
        input_file_id=file_id,
        reference_file_id=ref_id,
        config=json.dumps(config, ensure_ascii=False),
        batch_id=batch_id,
        country=country,
    )
    db.add(job)
    await db.commit()
    await db.refresh(job)

    file_record.processed = "dang_xu_ly"
    await db.commit()

    asyncio.create_task(_process_job(job.id, module, config, file_record, user.points, db))

    return job


async def create_batch_jobs(
    user: User,
    file_id: int,
    config: dict,
    db: AsyncSession,
) -> tuple[str, list[ProcessingJob]]:
    countries = config.get("countries", [])
    if not countries or len(countries) == 1:
        single_country = countries[0] if countries else config.get("country", "VN")
        config["country"] = single_country
        job = await create_job(user, "license_plate_image", file_id, config, db)
        return "", [job]

    module = "license_plate_image"
    svc = SERVICES.get(module)
    if not svc:
        raise AppException("INVALID_MODULE", "Module không hợp lệ", 400)

    file_result = await db.execute(select(FileRecord).where(FileRecord.id == file_id, FileRecord.user_id == user.id))
    file_record = file_result.scalar_one_or_none()
    if not file_record:
        raise AppException("FILE_NOT_FOUND", "File không tồn tại", 404)

    cost = await get_cost(module, db)
    total_cost = cost * len(countries)
    if user.points < total_cost:
        raise AppException(
            "INSUFFICIENT_POINTS",
            f"Không đủ point. Cần {total_cost} PT cho {len(countries)} model, hiện có {user.points} PT",
            400,
        )

    balance_before = user.points
    user.points -= total_cost
    await db.flush()

    from models.transaction import Transaction
    country_labels = ", ".join(
        AI_MODELS[c].name if c in AI_MODELS else c for c in countries
    )
    txn = Transaction(
        user_id=user.id,
        type="deduction",
        service=module,
        point=-total_cost,
        balance_before=balance_before,
        balance_after=user.points,
        reason=f"Xử lý biển số: {country_labels}",
    )
    db.add(txn)
    await db.flush()

    batch_id_val = str(uuid.uuid4())
    jobs = []

    for country_code in countries:
        country_config = {**config, "country": country_code}
        job = ProcessingJob(
            user_id=user.id,
            module=module,
            status="pending",
            input_file=file_record.original_name,
            input_file_id=file_id,
            config=json.dumps(country_config, ensure_ascii=False),
            batch_id=batch_id_val,
            country=country_code,
        )
        db.add(job)
        jobs.append(job)

    file_record.processed = "dang_xu_ly"
    await db.commit()

    for j in jobs:
        await db.refresh(j)

    for job in jobs:
        asyncio.create_task(_process_job(job.id, module, json.loads(job.config), file_record, user.points, db))

    return batch_id_val, jobs


from database import async_session


async def _process_job(
    job_id: int,
    module: str,
    config: dict,
    file_record: FileRecord,
    points_after: int,
    db: AsyncSession,
    retries: int = 0,
):
    if retries > 2:
        logger.error(f"Job {job_id} failed after 3 attempts")
        try:
            async with async_session() as session:
                jr = await session.execute(select(ProcessingJob).where(ProcessingJob.id == job_id))
                j = jr.scalar_one_or_none()
                if j:
                    j.status = "failed"
                    j.error = "Pipeline AI lỗi sau 3 lần thử"
                    j.finished_at = datetime.utcnow()
                    await session.commit()
                fr = await session.execute(select(FileRecord).where(FileRecord.id == file_record.id))
                f = fr.scalar_one_or_none()
                if f:
                    f.processed = "that_bai"
                    await session.commit()
        except Exception:
            pass
        return

    try:
        async with async_session() as session:
            job_result = await session.execute(select(ProcessingJob).where(ProcessingJob.id == job_id))
            job = job_result.scalar_one_or_none()
            if not job:
                return

            job.status = "processing"
            job.started_at = datetime.utcnow()
            await session.commit()

            adjustments = config.get("adjustments", {})
            if adjustments:
                input_path = str(UPLOAD_DIR / str(file_record.user_id) / file_record.name)
                output_dir = str(UPLOAD_DIR / str(file_record.user_id) / "processed")
                preprocess_image(input_path, adjustments, output_dir)

            await asyncio.sleep(5)

            if module == "video_repair_fast" or module == "video_repair_deep":
                if random.random() > 0.2:
                    repair_method = config.get("repair_method", "ai")
                    ref_id = config.get("reference_file_id")
                    all_errors = [
                        "Mất moov atom (metadata header)",
                        "Header checksum fail",
                        "Thiếu index chunk (idx1)",
                        "Lỗi codec không hỗ trợ",
                        "Keyframe bị thiếu",
                        "Không đồng bộ audio/video",
                        "Frame bị rơi rớt",
                        "Timestamp bị sai",
                        "Bitrate quá thấp",
                        "Duration metadata không khớp",
                    ]
                    import random as rnd
                    errors_found = rnd.sample(all_errors, rnd.randint(2, 5))
                    errors_fixed = []
                    if repair_method == "ai":
                        errors_fixed = rnd.sample(errors_found, rnd.randint(1, len(errors_found)))
                    elif repair_method == "reference" and ref_id:
                        errors_fixed = errors_found[:]
                    elif repair_method == "both":
                        errors_fixed = errors_found[:]
                    result = {
                        "module": module,
                        "input_file": file_record.original_name,
                        "repair_mode": "Nhanh" if "fast" in module else "Sâu",
                        "repair_method": repair_method,
                        "has_reference": bool(ref_id),
                        "errors_found": errors_found,
                        "errors_fixed": errors_fixed,
                        "fixed_count": len(errors_fixed),
                        "error_count": len(errors_found),
                        "duration_seconds": random.randint(40, 120) if "fast" in module else random.randint(120, 480),
                        "codec": config.get("codec", "H.264"),
                        "points_used": points_after,
                        "audio_preserved": config.get("keep_audio", True),
                    }
                    file_record.processed = "hoan_thanh"
                else:
                    raise Exception("Không thể phục hồi cấu trúc video")
            else:
                confidence = round(random.uniform(85, 99), 1)
                result = {
                    "module": module,
                    "input_file": file_record.original_name,
                    "plate": random.choice(["51F-123.45", "30A-678.90", "59T-111.22", "92C-333.44"]),
                    "confidence": confidence,
                    "country": config.get("country", "VN"),
                    "vehicle_type": config.get("vehicle_type", "car"),
                    "plate_color": config.get("plate_color", "white"),
                    "points_used": points_after,
                    "adjustments": config.get("adjustments", {}),
                }
                job.confidence = str(confidence)
                file_record.processed = "hoan_thanh"

            job.result = json.dumps(result, ensure_ascii=False) if result else None
            job.status = "completed" if result else "failed"
            job.finished_at = datetime.utcnow()
            await session.commit()

    except Exception as e:
        logger.warning(f"Job {job_id} attempt {retries + 1} failed: {e}")
        await asyncio.sleep(2)
        await _process_job(job_id, module, config, file_record, points_after, db, retries + 1)


async def get_job(user_id: int, job_id: int, db: AsyncSession) -> ProcessingJob | None:
    result = await db.execute(
        select(ProcessingJob).where(ProcessingJob.id == job_id, ProcessingJob.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def list_jobs(
    user_id: int, db: AsyncSession, module: str = "", page: int = 1, limit: int = 20
) -> tuple[list[ProcessingJob], int]:
    query = select(ProcessingJob).where(ProcessingJob.user_id == user_id)
    count_query = select(func.count(ProcessingJob.id)).where(ProcessingJob.user_id == user_id)

    if module:
        query = query.where(ProcessingJob.module == module)
        count_query = count_query.where(ProcessingJob.module == module)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(ProcessingJob.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())
    return items, total


async def list_jobs_by_batch(
    user_id: int, batch_id: str, db: AsyncSession
) -> list[ProcessingJob]:
    result = await db.execute(
        select(ProcessingJob)
        .where(ProcessingJob.batch_id == batch_id, ProcessingJob.user_id == user_id)
        .order_by(ProcessingJob.created_at)
    )
    return list(result.scalars().all())


async def list_all_jobs(
    db: AsyncSession, module: str = "", page: int = 1, limit: int = 20
) -> tuple[list[ProcessingJob], int]:
    query = select(ProcessingJob)
    count_query = select(func.count(ProcessingJob.id))

    if module:
        query = query.where(ProcessingJob.module == module)
        count_query = count_query.where(ProcessingJob.module == module)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    from sqlalchemy import desc
    query = query.order_by(desc(ProcessingJob.created_at)).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())
    return items, total


import random as rnd

ERROR_TEMPLATES = [
    {"type": "moov_atom", "severity": "critical", "description": "Mất moov atom — file không thể seek hoặc play"},
    {"type": "header_checksum", "severity": "high", "description": "Header checksum fail — cấu trúc file bị hỏng"},
    {"type": "idx1_missing", "severity": "high", "description": "Thiếu index chunk (idx1) — AVI không có index"},
    {"type": "codec_error", "severity": "critical", "description": "Codec không hỗ trợ hoặc bị thiếu decoder"},
    {"type": "keyframe_loss", "severity": "high", "description": "Keyframe bị thiếu — video bị giật, mất hình"},
    {"type": "sync_loss", "severity": "medium", "description": "Mất đồng bộ audio/video — âm thanh lệch hình"},
    {"type": "frame_drop", "severity": "medium", "description": "Frame bị rơi rớt — video chập chờn"},
    {"type": "timestamp_corrupt", "severity": "low", "description": "Timestamp bị sai — duration không chính xác"},
    {"type": "bitrate_low", "severity": "low", "description": "Bitrate quá thấp — chất lượng giảm"},
    {"type": "duration_mismatch", "severity": "low", "description": "Duration metadata không khớp với thực tế"},
]


async def analyze_video_errors(file_id: int, user_id: int, db: AsyncSession) -> dict:
    file_result = await db.execute(
        select(FileRecord).where(FileRecord.id == file_id, FileRecord.user_id == user_id)
    )
    file_record = file_result.scalar_one_or_none()
    if not file_record:
        raise AppException("FILE_NOT_FOUND", "File không tồn tại", 404)

    num_errors = rnd.randint(2, 4)
    selected = rnd.sample(ERROR_TEMPLATES, num_errors)
    has_critical = any(e["severity"] == "critical" for e in selected)
    has_reference_match = rnd.random() > 0.3

    return {
        "file_name": file_record.original_name,
        "file_size": file_record.size,
        "mime_type": file_record.mime_type,
        "repairable": True,
        "errors": selected,
        "recommended_mode": "deep" if file_record.size > 100 * 1024 * 1024 else "fast",
        "has_critical_errors": has_critical,
        "recommends_reference": has_critical,
        "can_repair_with_ai": True,
        "can_repair_with_reference": has_reference_match,
    }
