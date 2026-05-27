from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, func
from database import Base


class PointPackage(Base):
    __tablename__ = "point_packages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # 'STANDARD' or 'ENTERPRISE'
    price = Column(Float, nullable=True)
    points = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
