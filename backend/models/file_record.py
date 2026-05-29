from sqlalchemy import Column, Integer, String, DateTime, BigInteger, ForeignKey, func
from database import Base


class FileRecord(Base):
    __tablename__ = "file_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(500), nullable=False)
    original_name = Column(String(500), nullable=False)
    size = Column(BigInteger, nullable=False, default=0)
    mime_type = Column(String(100), nullable=True)
    folder = Column(String(255), nullable=False, default="/")
    processed = Column(String(20), nullable=False, default="hoan_thanh")
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
