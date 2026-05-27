import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.config import SystemConfig
from models.audit import AuditLog
from models.user import User
from utils.errors import AppException

logger = logging.getLogger("hvideo.config")

DEFAULT_CONFIGS: dict[str, tuple[str, str]] = {
    "license_plate_image_cost": ("5", "Point cho biển số từ ảnh"),
    "license_plate_video_cost": ("15", "Point cho biển số từ video"),
    "video_repair_fast_cost": ("10", "Point cho sửa video nhanh (~2 phút)"),
    "video_repair_deep_cost": ("20", "Point cho sửa video sâu (~8 phút)"),
    "queue_mode": ("FIFO", "Chế độ hàng đợi: FIFO hoặc LIFO"),
    "max_concurrent_jobs": ("5", "Giới hạn xử lý đồng thời"),
    "storage_limit_mb": ("500", "Giới hạn lưu trữ mỗi user (MB)"),
}

ALLOWED_KEYS = set(DEFAULT_CONFIGS.keys())


async def seed_default_configs(db: AsyncSession):
    result = await db.execute(select(SystemConfig).limit(1))
    if result.scalar_one_or_none():
        return
    for key, (value, desc) in DEFAULT_CONFIGS.items():
        db.add(SystemConfig(key=key, value=value, description=desc))
    await db.commit()
    logger.info("Default configs seeded")


async def get_all_configs(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(SystemConfig).order_by(SystemConfig.key))
    configs = result.scalars().all()
    return [
        {
            "key": c.key,
            "value": c.value,
            "description": c.description,
            "updated_by": c.updated_by,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        }
        for c in configs
    ]


async def update_configs(values: dict[str, str], admin: User, db: AsyncSession) -> list[dict]:
    unknown_keys = set(values.keys()) - ALLOWED_KEYS
    if unknown_keys:
        raise AppException("INVALID_CONFIG", f"Không hỗ trợ cấu hình: {', '.join(unknown_keys)}", 400)

    from datetime import datetime
    now = datetime.utcnow()

    for key, value in values.items():
        result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
        config = result.scalar_one_or_none()
        if not config:
            config = SystemConfig(key=key, value=value, description=DEFAULT_CONFIGS.get(key, ("", ""))[1])
            db.add(config)
        old_value = config.value
        config.value = value
        config.updated_by = admin.id
        config.updated_at = now

        audit = AuditLog(
            user_id=admin.id,
            action="update_config",
            target_type="config",
            target_id=None,
            details=f'Config "{key}": "{old_value}" → "{value}"',
        )
        db.add(audit)

    await db.commit()
    return await get_all_configs(db)


async def reset_default_configs(admin: User, db: AsyncSession) -> list[dict]:
    from datetime import datetime

    now = datetime.utcnow()
    for key, (default_value, desc) in DEFAULT_CONFIGS.items():
        result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
        config = result.scalar_one_or_none()
        if not config:
            config = SystemConfig(key=key, value=default_value, description=desc)
            db.add(config)
        else:
            config.value = default_value
            config.description = desc
        config.updated_by = admin.id
        config.updated_at = now

    audit = AuditLog(
        user_id=admin.id,
        action="reset_config",
        target_type="config",
        target_id=None,
        details="Khôi phục toàn bộ cấu hình về mặc định",
    )
    db.add(audit)
    await db.commit()
    return await get_all_configs(db)
