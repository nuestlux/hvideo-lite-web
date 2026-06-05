import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.config import SystemConfig
from models.audit import AuditLog
from models.user import User
from utils.errors import AppException

logger = logging.getLogger("hvideo.config")

# ─── Nhóm 1: Chi phí sử dụng AI – Biển số xe ────────────────────────────────
# key: lp_<country>_cost, description mô tả model & quốc gia
# ─── Nhóm 2: Chi phí sử dụng AI – Sửa video ─────────────────────────────────
# ─── Nhóm 3: Giới hạn phần cứng / hệ thống ──────────────────────────────────

DEFAULT_CONFIGS: dict[str, tuple[str, str, str]] = {
    # (default_value, description, group)
    # Biển số – theo mô hình AI từng quốc gia
    "lp_vn_cost":            ("5",    "Chi phí point – Biển số Việt Nam (model AI-VN)", "lp_cost"),
    "lp_us_cost":            ("8",    "Chi phí point – Biển số Hoa Kỳ (model AI-US)", "lp_cost"),
    "lp_jp_cost":            ("10",   "Chi phí point – Biển số Nhật Bản (model AI-JP)", "lp_cost"),
    "lp_kr_cost":            ("10",   "Chi phí point – Biển số Hàn Quốc (model AI-KR)", "lp_cost"),
    "lp_eu_cost":            ("8",    "Chi phí point – Biển số châu Âu (model AI-EU)", "lp_cost"),
    "lp_cn_cost":            ("8",    "Chi phí point – Biển số Trung Quốc (model AI-CN)", "lp_cost"),

    # Sửa video – theo chế độ xử lý
    "video_repair_basic_cost":     ("10",   "Chi phí point – Sửa video nhanh (không dùng AI, ~2 phút)", "video_cost"),
    "video_repair_advanced_cost":  ("25",   "Chi phí point – Sửa video nâng cao AI (~8 phút)", "video_cost"),
    "video_repair_reference_cost": ("15",   "Chi phí point – Sửa video theo file tham chiếu", "video_cost"),

    # Giới hạn hệ thống / phần cứng
    "queue_mode":            ("FIFO", "Chế độ hàng đợi xử lý: FIFO (vào trước ra trước) hoặc LIFO", "system"),
    "max_concurrent_jobs":   ("5",    "Số lượng tác vụ chạy đồng thời tối đa trên máy chủ", "system"),
    "max_queue_size":        ("50",   "Dung lượng tối đa hàng đợi chờ xử lý", "system"),
    "job_timeout_minutes":   ("30",   "Thời gian chờ tối đa cho mỗi tác vụ (phút)", "system"),
    "storage_limit_mb":      ("500",  "Dung lượng lưu trữ file tối đa mặc định mỗi người dùng (MB)", "system"),
    "max_upload_size_mb":    ("200",  "Kích thước file tải lên tối đa mỗi lần (MB)", "system"),
    "max_video_duration_sec":("600",  "Thời lượng video tối đa được xử lý (giây)", "system"),
}

ALLOWED_KEYS = set(DEFAULT_CONFIGS.keys())

# Nhóm hiển thị
CONFIG_GROUPS = {
    "lp_cost":    "Chi phí AI – Nhận dạng biển số",
    "video_cost": "Chi phí AI – Khôi phục video",
    "system":     "Giới hạn phần cứng & hệ thống",
}


async def seed_default_configs(db: AsyncSession):
    result = await db.execute(select(SystemConfig).limit(1))
    if result.scalar_one_or_none():
        return
    for key, (value, desc, group) in DEFAULT_CONFIGS.items():
        db.add(SystemConfig(key=key, value=value, description=desc))
    await db.commit()
    logger.info("Default configs seeded")


async def get_all_configs(db: AsyncSession) -> list[dict]:
    result = await db.execute(select(SystemConfig).order_by(SystemConfig.key))
    configs = result.scalars().all()
    config_map = {k: DEFAULT_CONFIGS[k] for k in DEFAULT_CONFIGS}

    items = []
    for c in configs:
        group = config_map[c.key][2] if c.key in config_map else "system"
        items.append({
            "key": c.key,
            "value": c.value,
            "description": c.description,
            "group": group,
            "group_label": CONFIG_GROUPS.get(group, group),
            "updated_by": c.updated_by,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None,
        })
    return items


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
            config = SystemConfig(key=key, value=value, description=DEFAULT_CONFIGS.get(key, ("", "", "system"))[1])
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

    for key, (default_value, desc, group) in DEFAULT_CONFIGS.items():
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
