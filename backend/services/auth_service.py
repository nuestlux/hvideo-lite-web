import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.user import User
from models.audit import AuditLog
from utils.security import verify_password, hash_password, create_jwt, decode_jwt
from utils.errors import AppException
from config import settings

logger = logging.getLogger("hvideo.auth")


async def authenticate(email: str, password: str, db: AsyncSession) -> tuple[User, str]:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng", 401)

    if user.status == "cho_xac_nhan":
        raise AppException(
            "ACCOUNT_NOT_ACTIVATED",
            "Tài khoản chưa được xác nhận. Vui lòng kiểm tra email để xác nhận OTP.",
            403,
        )

    if user.status == "da_khoa":
        raise AppException("ACCOUNT_LOCKED", "Tài khoản đã bị khóa. Vui lòng liên hệ admin.", 403)

    if not user.password_hash or not verify_password(password, user.password_hash):
        raise AppException("INVALID_CREDENTIALS", "Email hoặc mật khẩu không đúng", 401)

    token = create_jwt({"sub": str(user.id)})
    user.last_login_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)
    return user, token


async def set_password(setup_token: str, password: str, db: AsyncSession) -> tuple[User, str]:
    payload = decode_jwt(setup_token)
    if not payload or payload.get("purpose") != "setup_password":
        raise AppException("TOKEN_INVALID", "Token không hợp lệ hoặc đã hết hạn", 400)

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException("USER_NOT_FOUND", "Người dùng không tồn tại", 404)

    if user.status != "cho_xac_nhan":
        raise AppException("ALREADY_ACTIVATED", "Tài khoản đã được kích hoạt", 400)

    if len(password) < 8:
        raise AppException("WEAK_PASSWORD", "Mật khẩu phải có ít nhất 8 ký tự", 400)

    user.password_hash = hash_password(password)
    user.status = "hoat_dong"
    user.last_login_at = datetime.utcnow()
    await db.commit()
    await db.refresh(user)

    token = create_jwt({"sub": str(user.id)})
    return user, token


async def change_password(user_id: int, old_password: str, new_password: str, db: AsyncSession):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException("USER_NOT_FOUND", "Người dùng không tồn tại", 404)

    if not user.password_hash or not verify_password(old_password, user.password_hash):
        raise AppException("WRONG_PASSWORD", "Mật khẩu cũ không đúng", 400)

    if len(new_password) < 8:
        raise AppException("WEAK_PASSWORD", "Mật khẩu mới phải có ít nhất 8 ký tự", 400)

    user.password_hash = hash_password(new_password)
    await db.commit()
