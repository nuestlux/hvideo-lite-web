import asyncio
import aiosqlite

async def migrate():
    conn = await aiosqlite.connect("hvideolite.db")
    
    cursor = await conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='processing_jobs'")
    if await cursor.fetchone():
        cursor = await conn.execute("PRAGMA table_info(processing_jobs)")
        cols = {row[1] for row in await cursor.fetchall()}
        if "batch_id" not in cols:
            await conn.execute("ALTER TABLE processing_jobs ADD COLUMN batch_id VARCHAR(36)")
            await conn.execute("CREATE INDEX IF NOT EXISTS ix_processing_jobs_batch_id ON processing_jobs(batch_id)")
            print("Added batch_id column")
        if "country" not in cols:
            await conn.execute("ALTER TABLE processing_jobs ADD COLUMN country VARCHAR(5)")
            print("Added country column")

    cursor = await conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if await cursor.fetchone():
        cursor = await conn.execute("PRAGMA table_info(users)")
        cols_users = {row[1] for row in await cursor.fetchall()}
        if "avatar_url" not in cols_users:
            await conn.execute("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255)")
            print("Added avatar_url column to users")

    await conn.commit()
    await conn.close()
    print("Migration complete")

asyncio.run(migrate())
