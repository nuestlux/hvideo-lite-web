from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from schemas.point_package import PointPackage, PointPackageCreate, PointPackageUpdate
from services.point_package_service import (
    get_all_packages,
    create_package,
    update_package,
    delete_package,
)
from middleware.auth import get_current_user
from utils.errors import AppException

router = APIRouter(prefix="/api/admin/packages", tags=["admin-packages"])


@router.get("", response_model=dict)
async def list_packages(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    # In a real app, check if current_user.role is 'admin'
    packages = await get_all_packages(db)
    return {"data": packages, "message": "Lấy danh sách gói thành công"}


@router.post("", response_model=dict)
async def create_package(
    req: PointPackageCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    new_package = await create_package(db, req)
    return {"data": new_package, "message": "Tạo gói thành công"}


@router.put("/{package_id}", response_model=dict)
async def update_package(
    package_id: int,
    req: PointPackageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    updated_package = await update_package(db, package_id, req)
    return {"data": updated_package, "message": "Cập nhật gói thành công"}


@router.delete("/{package_id}", response_model=dict)
async def delete_package(
    package_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await delete_package(db, package_id)
    return {"data": {}, "message": "Xóa gói thành công"}
