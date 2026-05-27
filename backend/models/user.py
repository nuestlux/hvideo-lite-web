from sqlalchemy import Column, Integer, String, DateTime, Boolean, func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(20), nullable=False, default="can_bo")
    points = Column(Integer, nullable=False, default=0)
    status = Column(String(20), nullable=False, default="cho_xac_nhan", index=True)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    unconfirmed_72h_warning = Column(Boolean, default=False)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
