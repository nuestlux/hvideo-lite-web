from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from models.point_package import PointPackage
from models.transaction import Transaction
from models.audit import AuditLog
from schemas.point_package import PointPackageCreate, PointPackageUpdate
from utils.errors import AppException
from models.user import User
from typing import Optional


async def get_all_packages(db: AsyncSession) -> list[PointPackage]:
    result = await db.execute(select(PointPackage))
    return list(result.scalars().all())


async def get_active_packages(db: AsyncSession) -> list[PointPackage]:
    result = await db.execute(select(PointPackage).where(PointPackage.is_active == True))
    return list(result.scalars().all())


async def get_package_by_id(db: AsyncSession, package_id: int) -> PointPackage:
    result = await db.execute(select(PointPackage).where(PointPackage.id == package_id))
    package = result.scalar_one_or_none()
    if not package:
        raise AppException("PACKAGE_NOT_FOUND", "Không tìm thấy gói này", 404)
    return package


async def _ensure_name_unique(db: AsyncSession, name: str, exclude_id: Optional[int] = None) -> None:
    q = select(PointPackage).where(func.lower(PointPackage.name) == name.lower())
    if exclude_id is not None:
        q = q.where(PointPackage.id != exclude_id)
    result = await db.execute(q)
    if result.scalar_one_or_none():
        raise AppException("PACKAGE_NAME_EXISTS", "Tên gói đã tồn tại (không phân biệt hoa thường)", 400)


async def _count_active_packages(db: AsyncSession, exclude_id: Optional[int] = None) -> int:
    q = select(func.count()).select_from(PointPackage).where(PointPackage.is_active == True)
    if exclude_id is not None:
        q = q.where(PointPackage.id != exclude_id)
    result = await db.execute(q)
    return result.scalar_one() or 0


async def _has_transactions(db: AsyncSession, package_id: int) -> bool:
    result = await db.execute(
        select(func.count()).select_from(Transaction).where(Transaction.package_id == package_id)
    )
    return (result.scalar_one() or 0) > 0


async def _create_audit(db: AsyncSession, admin: Optional[User], action: str, target_id: int, details: Optional[str] = None):
    if not admin:
        return
    audit = AuditLog(
        user_id=admin.id,
        action=action,
        target_type="point_package",
        target_id=target_id,
        details=details,
    )
    db.add(audit)


async def create_package(db: AsyncSession, data: PointPackageCreate, admin: Optional[User] = None) -> PointPackage:
    await _ensure_name_unique(db, data.name)
    if data.type == 'STANDARD' and (data.points is None or data.points <= 0):
        raise AppException("PACKAGE_INVALID_STANDARD", "Gói STANDARD phải có số lượng Point > 0", 400)
    new_package = PointPackage(**data.model_dump())
    db.add(new_package)
    await db.flush()  # assign id
    await _create_audit(db, admin, "PACKAGE_CREATED", new_package.id, f"name={new_package.name}")
    await db.commit()
    await db.refresh(new_package)
    return new_package


async def update_package(db: AsyncSession, package_id: int, data: PointPackageUpdate, admin: Optional[User] = None) -> PointPackage:
    package = await get_package_by_id(db, package_id)
    update_data = data.model_dump(exclude_unset=True)

    if 'name' in update_data and update_data['name']:
        await _ensure_name_unique(db, update_data['name'], exclude_id=package_id)

    # Compute resulting type and points for STANDARD validation
    resulting_type = update_data.get('type', package.type)
    resulting_points = update_data.get('points', package.points)
    if resulting_type == 'STANDARD' and (resulting_points is None or resulting_points <= 0):
        raise AppException("PACKAGE_INVALID_STANDARD", "Gói STANDARD phải có số lượng Point > 0", 400)

    # Prevent deactivating the last active package
    if 'is_active' in update_data and update_data['is_active'] is False:
        remaining = await _count_active_packages(db, exclude_id=package_id)
        if remaining < 1:
            raise AppException("PACKAGE_LAST_ACTIVE", "Phải giữ ít nhất 1 gói đang hoạt động", 400)

    for key, value in update_data.items():
        setattr(package, key, value)

    await db.commit()
    await db.refresh(package)
    await _create_audit(db, admin, "PACKAGE_UPDATED", package.id, str(update_data))
    await db.commit()
    return package


async def delete_package(db: AsyncSession, package_id: int, admin: Optional[User] = None) -> None:
    package = await get_package_by_id(db, package_id)

    if await _has_transactions(db, package_id):
        raise AppException("PACKAGE_HAS_TRANSACTIONS", "Gói đã có giao dịch, không thể xóa (hãy tắt gói)", 400)

    remaining_active = await _count_active_packages(db, exclude_id=package_id)
    if package.is_active and remaining_active < 1:
        raise AppException("PACKAGE_LAST_ACTIVE", "Không thể xóa gói hoạt động cuối cùng", 400)

    await _create_audit(db, admin, "PACKAGE_DELETED", package_id, f"name={package.name}")
    await db.commit()

    await db.delete(package)
    await db.commit()
