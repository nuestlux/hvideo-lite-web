import os
import uuid
import logging
import aiofiles
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, asc, desc, or_, and_

from config import settings
from models.file_record import FileRecord
from models.user import User
from models.config import SystemConfig
from utils.errors import AppException

logger = logging.getLogger("hvideo.file")

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"


async def ensure_upload_dir():
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_user_dir(user_id: int) -> Path:
    return UPLOAD_DIR / str(user_id)


async def get_storage_limit(db: AsyncSession) -> int:
    result = await db.execute(select(SystemConfig).where(SystemConfig.key == "storage_limit_mb"))
    config = result.scalar_one_or_none()
    return int(config.value) if config else 500


async def get_user_quota(user_id: int, db: AsyncSession) -> dict:
    result = await db.execute(
        select(func.coalesce(func.sum(FileRecord.size), 0)).where(FileRecord.user_id == user_id)
    )
    used = result.scalar() or 0
    limit_mb = await get_storage_limit(db)
    limit = limit_mb * 1024 * 1024
    return {
        "used": used,
        "limit": limit,
        "percent": round(used / limit * 100, 1) if limit > 0 else 0,
    }


async def upload_file(
    user_id: int,
    file_content: bytes,
    original_name: str,
    mime_type: str,
    folder: str,
    db: AsyncSession,
) -> FileRecord:
    await ensure_upload_dir()

    quota = await get_user_quota(user_id, db)
    if quota["limit"] > 0 and quota["used"] + len(file_content) > quota["limit"]:
        raise AppException("QUOTA_EXCEEDED", "Đã vượt quá hạn mức lưu trữ", 413)

    ext = Path(original_name).suffix
    stored_name = f"{uuid.uuid4().hex}{ext}"
    user_dir = get_user_dir(user_id)
    user_dir.mkdir(parents=True, exist_ok=True)

    file_path = user_dir / stored_name
    async with aiofiles.open(str(file_path), "wb") as f:
        await f.write(file_content)

    record = FileRecord(
        user_id=user_id,
        name=stored_name,
        original_name=original_name,
        size=len(file_content),
        mime_type=mime_type,
        folder=folder,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


async def list_files(
    user_id: int,
    db: AsyncSession,
    folder: str = "",
    processed: str = "",
    search: str = "",
    file_type: str = "",
    sort_by: str = "created_at",
    sort_order: str = "desc",
    page: int = 1,
    limit: int = 20,
) -> tuple[list[FileRecord], int]:
    query = select(FileRecord).where(FileRecord.user_id == user_id)
    count_query = select(func.count(FileRecord.id)).where(FileRecord.user_id == user_id)

    if folder:
        query = query.where(FileRecord.folder == folder)
        count_query = count_query.where(FileRecord.folder == folder)
    if processed:
        query = query.where(FileRecord.processed == processed)
        count_query = count_query.where(FileRecord.processed == processed)
    if search:
        like = f"%{search.strip()}%"
        query = query.where(FileRecord.original_name.ilike(like))
        count_query = count_query.where(FileRecord.original_name.ilike(like))
    if file_type == "image":
        query = query.where(FileRecord.mime_type.like("image/%"))
        count_query = count_query.where(FileRecord.mime_type.like("image/%"))
    elif file_type == "video":
        query = query.where(FileRecord.mime_type.like("video/%"))
        count_query = count_query.where(FileRecord.mime_type.like("video/%"))
    elif file_type == "other":
        other_filter = or_(
            FileRecord.mime_type.is_(None),
            and_(
                ~FileRecord.mime_type.like("image/%"),
                ~FileRecord.mime_type.like("video/%"),
            ),
        )
        query = query.where(other_filter)
        count_query = count_query.where(other_filter)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    sort_column = {
        "created_at": FileRecord.created_at,
        "size": FileRecord.size,
        "original_name": FileRecord.original_name,
    }.get(sort_by, FileRecord.created_at)
    order = asc(sort_column) if sort_order == "asc" else desc(sort_column)
    query = query.order_by(order).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().all())
    return items, total


async def delete_file(file_id: int, user_id: int, db: AsyncSession) -> bool:
    result = await db.execute(
        select(FileRecord).where(FileRecord.id == file_id, FileRecord.user_id == user_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        return False

    file_path = get_user_dir(user_id) / record.name
    if file_path.exists():
        file_path.unlink()

    await db.delete(record)
    await db.commit()
    return True
