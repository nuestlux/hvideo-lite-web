import os
from pathlib import Path
from fastapi import APIRouter, Depends, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from schemas.file import FileOut
from middleware.auth import get_current_user
from models.user import User
from models.file_record import FileRecord
from services.file_service import upload_file, list_files, delete_file, get_user_quota
from utils.errors import AppException

router = APIRouter(tags=["files"])


@router.get("/api/files/quota")
async def get_quota(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    quota = await get_user_quota(user.id, db)
    return {"data": quota, "message": "Success"}


@router.get("/api/files")
async def list_user_files(
    folder: str = Query(""),
    processed: str = Query(""),
    search: str = Query(""),
    file_type: str = Query(""),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1),
    limit: int = Query(20),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    items, total = await list_files(
        user.id,
        db,
        folder,
        processed,
        search,
        file_type,
        sort_by,
        sort_order,
        page,
        limit,
    )
    return {
        "data": {
            "items": [FileOut.model_validate(f) for f in items],
            "total": total,
            "page": page,
            "limit": limit,
        },
        "message": "Success",
    }


@router.post("/api/files/upload")
async def upload_user_file(
    file: UploadFile = File(...),
    folder: str = Query("/"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    content = await file.read()
    record = await upload_file(user.id, content, file.filename or "unknown", file.content_type or "", folder, db)
    return {"data": FileOut.model_validate(record), "message": "Tải lên thành công"}


@router.get("/api/files/{file_id}/download")
async def download_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(FileRecord).where(FileRecord.id == file_id, FileRecord.user_id == user.id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise AppException("FILE_NOT_FOUND", "File không tồn tại", 404)

    fpath = Path(__file__).resolve().parent.parent / "uploads" / str(user.id) / record.name
    if not fpath.exists():
        raise AppException("FILE_NOT_FOUND", "File không tồn tại trên ổ đĩa", 404)

    return FileResponse(str(fpath), filename=record.original_name, media_type=record.mime_type or "application/octet-stream")


@router.delete("/api/files/{file_id}")
async def delete_user_file(
    file_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ok = await delete_file(file_id, user.id, db)
    if not ok:
        raise AppException("FILE_NOT_FOUND", "File không tồn tại", 404)
    return {"data": {}, "message": "Xóa file thành công"}
