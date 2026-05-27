from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from database import Base


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    otp_hash = Column(String(64), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    failed_attempts = Column(Integer, default=0)
    resend_count = Column(Integer, default=0)
    resend_reset_at = Column(DateTime, nullable=True)
    confirmed_at = Column(DateTime, nullable=True)
    confirmed_ip = Column(String(45), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
