from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime


class PointPackageBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str  # 'STANDARD' or 'ENTERPRISE'
    price: Optional[float] = Field(None, ge=0)
    points: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    features: Optional[List[str]] = None
    storage_limit_mb: Optional[int] = Field(500, ge=0)
    is_active: bool = True
    sort_order: int = Field(0, ge=0)

    @field_validator('name')
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Tên gói không được để trống')
        return v.strip()

    @field_validator('type')
    @classmethod
    def type_valid(cls, v: str) -> str:
        if v not in ('STANDARD', 'ENTERPRISE'):
            raise ValueError('Loại gói phải là STANDARD hoặc ENTERPRISE')
        return v


class PointPackageCreate(PointPackageBase):
    pass


class PointPackageUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    points: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    features: Optional[List[str]] = None
    storage_limit_mb: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = Field(None, ge=0)

    @field_validator('name')
    @classmethod
    def name_not_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and (not v or not v.strip()):
            raise ValueError('Tên gói không được để trống')
        return v.strip() if v else v

    @field_validator('type')
    @classmethod
    def type_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ('STANDARD', 'ENTERPRISE'):
            raise ValueError('Loại gói phải là STANDARD hoặc ENTERPRISE')
        return v


class PointPackage(PointPackageBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
