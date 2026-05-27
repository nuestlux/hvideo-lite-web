from datetime import datetime
from pydantic import BaseModel


class JobOut(BaseModel):
    id: int
    user_id: int
    module: str
    status: str
    input_file: str | None = None
    input_file_id: int | None = None
    reference_file_id: int | None = None
    config: dict | None = None
    result: dict | None = None
    confidence: str | None = None
    error: str | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class JobCreate(BaseModel):
    module: str
    file_id: int
    config: dict = {}


class PaginatedJobs(BaseModel):
    items: list[JobOut]
    total: int
    page: int
    limit: int
