from datetime import datetime
from pydantic import BaseModel, EmailStr


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str
    points: int
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    role: str = "can_bo"


class UserUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None


class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str


class PaginatedUsers(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    limit: int
