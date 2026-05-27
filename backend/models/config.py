from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from database import Base


class SystemConfig(Base):
    __tablename__ = "system_configs"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
    description = Column(String(255), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
