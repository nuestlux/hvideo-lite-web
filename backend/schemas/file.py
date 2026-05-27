from datetime import datetime
from pydantic import BaseModel


class FileOut(BaseModel):
    id: int
    user_id: int
    name: str
    original_name: str
    size: int
    mime_type: str | None = None
    folder: str
    processed: str
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class FileQuota(BaseModel):
    used: int = 0
    limit: int = 0
    percent: float = 0
