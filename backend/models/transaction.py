from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import relationship
from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    package_id = Column(Integer, ForeignKey("point_packages.id"), nullable=True, index=True)
    type = Column(String(30), nullable=False)
    service = Column(String(50), nullable=True)
    point = Column(Integer, nullable=False)
    balance_before = Column(Integer, nullable=False, default=0)
    balance_after = Column(Integer, nullable=False, default=0)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False, index=True)

    user = relationship("User", lazy="selectin")
    package = relationship("PointPackage", lazy="selectin", foreign_keys="Transaction.package_id")
