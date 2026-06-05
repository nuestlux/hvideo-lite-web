from pydantic import BaseModel, ConfigDict
from typing import Optional, Any, List
from datetime import datetime


class PointPackageBase(BaseModel):
    name: str
    type: str  # 'STANDARD' or 'ENTERPRISE'
    price: Optional[float] = None
    points: Optional[int] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    storage_limit_mb: Optional[int] = 500
    is_active: bool = True
    sort_order: int = 0


class PointPackageCreate(PointPackageBase):
    pass


class PointPackageUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    price: Optional[float] = None
    points: Optional[int] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    storage_limit_mb: Optional[int] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class PointPackage(PointPackageBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
