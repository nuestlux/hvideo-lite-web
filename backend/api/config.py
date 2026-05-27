from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.config import ConfigItem, ConfigUpdate
from middleware.auth import require_admin
from models.user import User
from models.config import SystemConfig
from models.audit import AuditLog
from utils.errors import AppException
from services.config_service import get_all_configs, update_configs, reset_default_configs
from services.email_service import send_email

router = APIRouter(prefix="/api/admin/config", tags=["admin-config"])


@router.get("/")
async def list_configs(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    configs = await get_all_configs(db)
    return {"data": configs, "message": "Success"}


@router.put("/")
async def update_config(
    data: ConfigUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    updated = await update_configs(data.values, admin, db)
    return {"data": updated, "message": "Cập nhật cấu hình thành công"}


@router.post("/test-email")
async def test_email(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from config import settings
    if not settings.SMTP_HOST:
        raise AppException("SMTP_NOT_CONFIGURED", "SMTP chưa được cấu hình. Vui lòng cập nhật file .env", 400)
    await send_email(admin.email, "Hvideo Lite — Test Email", "Xin chào, email này là test từ Hvideo Lite.")
    return {"data": {}, "message": f"Email test đã gửi đến {admin.email}"}


@router.post("/reset-defaults")
async def reset_defaults(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    updated = await reset_default_configs(admin, db)
    return {"data": updated, "message": "Đã khôi phục cấu hình mặc định"}
