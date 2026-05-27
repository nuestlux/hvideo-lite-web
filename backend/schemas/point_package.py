from pydantic import BaseModel, ConfigDict
from typing import Optional, Any
from datetime import datetime


class PointPackageBase(BaseModel):
    name: str
    type: str  # 'STANDARD' or 'ENTERPRISE'
    price: Optional[float] = None
    points: Optional[int] = None
    description: Optional[str] = None
    is_active: bool = True


class PointPackageCreate(PointPackageBase):
    pass


class PointPackageUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    price: Optional[float] = None
    points: Optional[int] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class PointPackage(PointPackageBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
