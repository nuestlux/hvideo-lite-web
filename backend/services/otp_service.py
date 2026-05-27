import secrets
import hashlib
import logging
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from models.otp import OTPVerification
from config import settings
from utils.errors import AppException
from services.email_service import send_email

logger = logging.getLogger("hvideo.otp")


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


def _generate_otp() -> str:
    return f"{secrets.randbelow(1000000):06d}"


async def create_otp(user_id: int, email: str, user_name: str, db: AsyncSession, purpose: str = "setup_password") -> str:
    now = datetime.utcnow()

    result = await db.execute(
        select(OTPVerification)
        .where(
            OTPVerification.user_id == user_id,
            OTPVerification.status == "pending",
        )
        .order_by(OTPVerification.created_at.desc())
    )
    existing = result.scalar_one_or_none()

    if existing:
        if existing.resend_reset_at and now < existing.resend_reset_at:
            if existing.resend_count >= settings.OTP_RESEND_LIMIT:
                raise AppException(
                    "OTP_RESEND_LIMIT",
                    "Đã gửi OTP quá số lần cho phép (3 lần/giờ). Vui lòng liên hệ admin.",
                    429,
                )
        else:
            existing.resend_count = 0

        existing.status = "expired"
        existing.resend_count += 1
        existing.resend_reset_at = now + timedelta(minutes=settings.OTP_RESEND_WINDOW_MINUTES)

    otp_code = _generate_otp()
    otp_hash = _hash_otp(otp_code)

    new_otp = OTPVerification(
        user_id=user_id,
        otp_hash=otp_hash,
        expires_at=now + timedelta(minutes=settings.OTP_EXPIRE_MINUTES),
        status="pending",
        resend_count=(existing.resend_count if existing else 1),
        resend_reset_at=now + timedelta(minutes=settings.OTP_RESEND_WINDOW_MINUTES),
    )
    db.add(new_otp)
    await db.commit()

    if purpose == "reset_password":
        body = _build_reset_otp_email(user_name, otp_code)
        subject = "[Hvideo Lite] Mã OTP đặt lại mật khẩu"
    else:
        body = _build_otp_email(user_name, otp_code)
        subject = "[Hvideo Lite] Mã OTP xác nhận tài khoản"
    await send_email(email, subject, body)
    return otp_code


async def verify_otp(email: str, otp_code: str, db: AsyncSession, purpose: str = "setup_password") -> str:
    from models.user import User

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException("USER_NOT_FOUND", "Người dùng không tồn tại", 404)
    user_id = user.id

    result = await db.execute(
        select(OTPVerification)
        .where(
            OTPVerification.user_id == user_id,
            OTPVerification.status == "pending",
        )
        .order_by(OTPVerification.created_at.desc())
    )
    otp_record = result.scalar_one_or_none()
    if not otp_record:
        raise AppException("OTP_NOT_FOUND", "Không tìm thấy mã OTP. Vui lòng liên hệ admin.", 400)

    now = datetime.utcnow()
    if now > otp_record.expires_at:
        otp_record.status = "expired"
        await db.commit()
        raise AppException("OTP_EXPIRED", "Mã OTP đã hết hạn. Vui lòng liên hệ admin để gửi lại.", 400)

    if otp_record.failed_attempts >= settings.OTP_MAX_ATTEMPTS:
        otp_record.status = "expired"
        await db.commit()
        raise AppException(
            "OTP_TOO_MANY_ATTEMPTS",
            "Đã nhập sai OTP quá 5 lần. Tài khoản đã bị khóa xác nhận. Vui lòng liên hệ admin.",
            429,
        )

    if _hash_otp(otp_code) != otp_record.otp_hash:
        otp_record.failed_attempts += 1
        await db.commit()
        remaining = settings.OTP_MAX_ATTEMPTS - otp_record.failed_attempts
        raise AppException(
            "OTP_INVALID",
            f"Mã OTP không đúng. Còn {remaining} lần thử.",
            400,
        )

    otp_record.status = "used"
    otp_record.confirmed_at = now
    await db.commit()

    from utils.security import create_jwt
    setup_token = create_jwt(
        {"sub": str(user_id), "purpose": purpose},
        timedelta(minutes=10),
    )
    return setup_token


def _build_reset_otp_email(user_name: str, otp_code: str) -> str:
    return f"""
    <p>Kính gửi <strong>{user_name}</strong>,</p>
    <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản <strong>Hvideo Lite</strong>.</p>
    <p>Mã OTP của bạn là:</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px;text-align:center;padding:12px;background:#f5f5f5;">
        {otp_code}
    </p>
    <p>Mã OTP có hiệu lực trong <strong>10 phút</strong>.</p>
    <p>Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này.</p>
    <hr>
    <p style="color:#888;font-size:12px;">Hvideo Lite — Hệ thống AI phục hồi biển số xe & sửa chữa video</p>
    """


def _build_otp_email(user_name: str, otp_code: str) -> str:
    return f"""
    <p>Kính gửi <strong>{user_name}</strong>,</p>
    <p>Tài khoản <strong>Hvideo Lite</strong> của bạn đã được tạo.</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px;text-align:center;padding:12px;background:#f5f5f5;">
        {otp_code}
    </p>
    <p>Mã OTP có hiệu lực trong <strong>10 phút</strong>.</p>
    <p>Nếu không phải bạn, vui lòng liên hệ admin.</p>
    <hr>
    <p style="color:#888;font-size:12px;">Hvideo Lite — Hệ thống AI phục hồi biển số xe & sửa chữa video</p>
    """
