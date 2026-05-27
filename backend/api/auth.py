from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from middleware.auth import get_current_user
from middleware.rate_limit import rate_limiter
from schemas.auth import (
    LoginRequest,
    VerifyOtpRequest,
    SetPasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from schemas.user import UserOut
from services.auth_service import authenticate, set_password, change_password
from services.otp_service import create_otp, verify_otp
from utils.errors import AppException

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    client_ip = "unknown"
    if rate_limiter.is_locked(client_ip):
        raise AppException("RATE_LIMITED", "Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau 30 phút.", 429)

    if not rate_limiter.check(client_ip):
        rate_limiter.lock(client_ip)
        raise AppException("RATE_LIMITED", "Quá nhiều lần đăng nhập sai. Đã khóa IP 30 phút.", 429)

    user, token = await authenticate(req.email, req.password, db)
    rate_limiter.reset(client_ip)
    return {"data": {"token": token, "user": UserOut.model_validate(user)}, "message": "Đăng nhập thành công"}


@router.post("/verify-otp")
async def verify_otp_endpoint(req: VerifyOtpRequest, db: AsyncSession = Depends(get_db)):
    setup_token = await verify_otp(req.email, req.otp, db, purpose=req.purpose)
    return {"data": {"setup_token": setup_token}, "message": "Xác nhận OTP thành công"}


@router.post("/set-password")
async def set_password_endpoint(req: SetPasswordRequest, db: AsyncSession = Depends(get_db)):
    user, token = await set_password(req.setup_token, req.password, db)
    return {"data": {"token": token, "user": UserOut.model_validate(user)}, "message": "Đặt mật khẩu thành công"}


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from models.user import User
    from services.otp_service import create_otp

    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if user:
        await create_otp(user.id, user.email, user.name, db, purpose="reset_password")
    return {"data": {}, "message": "Nếu email tồn tại, mã OTP đã được gửi đến email của bạn."}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    from utils.security import decode_jwt, hash_password
    from sqlalchemy import select
    from models.user import User

    payload = decode_jwt(req.token)
    if not payload or payload.get("purpose") != "reset_password":
        raise AppException("TOKEN_INVALID", "Token không hợp lệ hoặc đã hết hạn", 400)

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException("USER_NOT_FOUND", "Người dùng không tồn tại", 404)

    if len(req.new_password) < 8:
        raise AppException("WEAK_PASSWORD", "Mật khẩu phải có ít nhất 8 ký tự", 400)

    user.password_hash = hash_password(req.new_password)
    await db.commit()
    return {"data": {}, "message": "Đặt lại mật khẩu thành công"}


@router.post("/logout")
async def logout(user=Depends(get_current_user)):
    return {"data": {}, "message": "Đăng xuất thành công"}
