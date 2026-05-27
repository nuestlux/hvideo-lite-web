from datetime import datetime
from pydantic import BaseModel


class ConfigItem(BaseModel):
    key: str
    value: str
    description: str | None = None
    updated_by: int | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class ConfigUpdate(BaseModel):
    values: dict[str, str]
