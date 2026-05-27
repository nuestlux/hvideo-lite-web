from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, func
from database import Base


class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    module = Column(String(30), nullable=False)
    status = Column(String(20), nullable=False, default="pending", index=True)
    input_file = Column(String(500), nullable=True)
    input_file_id = Column(Integer, nullable=True)
    reference_file_id = Column(Integer, nullable=True)
    config = Column(Text, nullable=True)
    result = Column(Text, nullable=True)
    confidence = Column(String(10), nullable=True)
    error = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)
    batch_id = Column(String(36), nullable=True, index=True)
    country = Column(String(5), nullable=True)
