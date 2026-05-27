from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.user import UserOut, ChangePasswordRequest
from middleware.auth import get_current_user
from models.user import User
from services.auth_service import change_password

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("/")
async def get_profile(user: User = Depends(get_current_user)):
    return {"data": UserOut.model_validate(user), "message": "Success"}


@router.put("/")
async def update_profile(
    data: UserOut,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    from utils.errors import AppException
    from sqlalchemy import select

    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        result = await db.execute(select(User).where(User.email == data.email, User.id != user.id))
        if result.scalar_one_or_none():
            raise AppException("USER_EXISTS", "Email đã tồn tại", 409)
        user.email = data.email
    await db.commit()
    return {"data": UserOut.model_validate(user), "message": "Cập nhật thông tin thành công"}


@router.put("/change-password")
async def update_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await change_password(user.id, data.old_password, data.new_password, db)
    return {"data": {}, "message": "Đổi mật khẩu thành công"}
