import json
from datetime import datetime
from pydantic import BaseModel, field_validator


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
    batch_id: str | None = None
    country: str | None = None

    @field_validator("config", "result", mode="before")
    def parse_json(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return {}
        return v

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
