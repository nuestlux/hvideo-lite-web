from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, Text, JSON, func
from database import Base


class PointPackage(Base):
    __tablename__ = "point_packages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # 'STANDARD' or 'ENTERPRISE'
    price = Column(Float, nullable=True)
    points = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    features = Column(JSON, nullable=True)  # list of feature strings
    storage_limit_mb = Column(Integer, nullable=True, default=500)  # MB storage per user
    validity_days = Column(Integer, nullable=True, default=0)  # 0 or null = unlimited / vĩnh viễn. Hidden for ENTERPRISE
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
