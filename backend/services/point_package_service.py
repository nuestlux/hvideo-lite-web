from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from models.point_package import PointPackage
from schemas.point_package import PointPackageCreate, PointPackageUpdate
from utils.errors import AppException


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


async def create_package(db: AsyncSession, data: PointPackageCreate) -> PointPackage:
    new_package = PointPackage(**data.model_dump())
    db.add(new_package)
    await db.commit()
    await db.refresh(new_package)
    return new_package


async def update_package(db: AsyncSession, package_id: int, data: PointPackageUpdate) -> PointPackage:
    package = await get_package_by_id(db, package_id)
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(package, key, value)
    await db.commit()
    await db.refresh(package)
    return package


async def delete_package(db: AsyncSession, package_id: int) -> None:
    package = await get_package_by_id(db, package_id)
    await db.delete(package)
    await db.commit()
