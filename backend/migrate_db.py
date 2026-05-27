import asyncio
import aiosqlite


async def migrate():
    conn = await aiosqlite.connect("hvideolite.db")
    cursor = await conn.execute("PRAGMA table_info(processing_jobs)")
    cols = {row[1] for row in await cursor.fetchall()}
    if "batch_id" not in cols:
        await conn.execute("ALTER TABLE processing_jobs ADD COLUMN batch_id VARCHAR(36)")
        await conn.execute("CREATE INDEX IF NOT EXISTS ix_processing_jobs_batch_id ON processing_jobs(batch_id)")
        print("Added batch_id column")
    if "country" not in cols:
        await conn.execute("ALTER TABLE processing_jobs ADD COLUMN country VARCHAR(5)")
        print("Added country column")
    await conn.commit()
    await conn.close()
    print("Migration complete")


asyncio.run(migrate())
