import asyncio
import logging
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import async_session
from models.file_record import FileRecord
from services.file_service import get_user_dir

logger = logging.getLogger("migrate")


async def remove_unprocessed(db: AsyncSession):
    result = await db.execute(
        select(FileRecord).where(FileRecord.processed == "chua_xu_ly")
    )
    records = list(result.scalars().all())
    for record in records:
        file_path = get_user_dir(record.user_id) / record.name
        if file_path.exists():
            file_path.unlink()
        await db.delete(record)
    await db.commit()
    if records:
        logger.info(f"Removed {len(records)} unprocessed files")


async def main():
    logging.basicConfig(level=logging.INFO)
    logger.info("Removing unprocessed files...")
    async with async_session() as db:
        await remove_unprocessed(db)


if __name__ == "__main__":
    asyncio.run(main())
