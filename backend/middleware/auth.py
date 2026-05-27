from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.user import User
from utils.security import decode_jwt
from utils.errors import AppException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not token:
        raise AppException("UNAUTHORIZED", "Vui lòng đăng nhập", 401)
    payload = decode_jwt(token)
    if payload is None:
        raise AppException("TOKEN_INVALID", "Token không hợp lệ", 401)
    user_id = payload.get("sub")
    if not user_id:
        raise AppException("TOKEN_INVALID", "Token không hợp lệ", 401)
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException("UNAUTHORIZED", "Người dùng không tồn tại", 401)
    if user.status == "da_khoa":
        raise AppException("ACCOUNT_LOCKED", "Tài khoản đã bị khóa", 403)
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise AppException("FORBIDDEN", "Không có quyền truy cập", 403)
    return user
