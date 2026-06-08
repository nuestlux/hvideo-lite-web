"""
Migrate DB: thêm cột features và storage_limit_mb vào bảng point_packages;
thêm các cấu hình mới vào system_configs nếu chưa có.
Chạy: python migrate_db.py
"""
import asyncio
import logging
from sqlalchemy import text

from database import engine, Base
from models import *  # noqa: import all models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hvideo.migrate")


async def run():
    async with engine.begin() as conn:
        # Tạo tất cả bảng nếu chưa tồn tại (bao gồm cột mới)
        await conn.run_sync(Base.metadata.create_all)
        logger.info("Tables created / verified")

        # Thêm cột mới vào point_packages nếu chưa có
        try:
            await conn.execute(text(
                "ALTER TABLE point_packages ADD COLUMN features TEXT"
            ))
            logger.info("Added column: point_packages.features")
        except Exception:
            logger.info("Column features already exists")

        try:
            await conn.execute(text(
                "ALTER TABLE point_packages ADD COLUMN storage_limit_mb INTEGER DEFAULT 500"
            ))
            logger.info("Added column: point_packages.storage_limit_mb")
        except Exception:
            logger.info("Column storage_limit_mb already exists")

        try:
            await conn.execute(text(
                "ALTER TABLE point_packages ADD COLUMN sort_order INTEGER DEFAULT 0"
            ))
            logger.info("Added column: point_packages.sort_order")
        except Exception:
            logger.info("Column sort_order already exists")

        # Thêm cột package_id vào transactions để ghi nhận gói đã mua (cho lịch sử + audit giá)
        try:
            await conn.execute(text(
                "ALTER TABLE transactions ADD COLUMN package_id INTEGER"
            ))
            logger.info("Added column: transactions.package_id")
        except Exception:
            logger.info("Column transactions.package_id already exists")

        # Unique index cho tên gói (case-insensitive hỗ trợ qua service, nhưng index giúp DB)
        try:
            await conn.execute(text(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_point_packages_name_lower ON point_packages (LOWER(name))"
            ))
            logger.info("Created unique index on point_packages.name (lower)")
        except Exception:
            logger.info("Unique index on packages.name already exists or failed")

    # Seed các config mới
    from database import async_session as AsyncSessionLocal
    from services.config_service import DEFAULT_CONFIGS
    from models.config import SystemConfig
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        for key, (value, desc, group) in DEFAULT_CONFIGS.items():
            result = await db.execute(select(SystemConfig).where(SystemConfig.key == key))
            existing = result.scalar_one_or_none()
            if not existing:
                db.add(SystemConfig(key=key, value=value, description=desc))
                logger.info(f"Seeded config: {key} = {value}")
        await db.commit()
        logger.info("Config migration done")


if __name__ == "__main__":
    asyncio.run(run())
