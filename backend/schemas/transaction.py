from datetime import datetime
from pydantic import BaseModel


class TransactionOut(BaseModel):
    id: int
    user_id: int
    user_name: str | None = None
    user_email: str | None = None
    type: str
    service: str | None = None
    point: int
    balance_before: int
    balance_after: int
    reason: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class PointAdjustRequest(BaseModel):
    point: int
    reason: str


class PaginatedTransactions(BaseModel):
    items: list[TransactionOut]
    total: int
    page: int
    limit: int


class PointStats(BaseModel):
    total_issued: int = 0
    total_consumed: int = 0
    total_circulating: int = 0
    by_service: dict[str, int] = {}
