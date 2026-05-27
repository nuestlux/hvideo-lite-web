from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from schemas.point_package import PointPackage
from services.point_package_service import get_active_packages
from utils.errors import AppException


router = APIRouter(prefix="/api/packages", tags=["packages"])


@router.get("", response_model=dict)
async def list_packages(db: AsyncSession = Depends(get_db)):
    packages = await get_active_packages(db)
    return {"data": packages, "message": "Lấy danh sách gói thành công"}


@router.post("/contact-enterprise")
async def contact_enterprise(req: dict, db: AsyncSession = Depends(get_db)):
    # For now, just log the contact info
    print(f"Enterprise Contact Request: {req}")
    return {"data": {}, "message": "Liên hệ thành công. Chúng tôi sẽ liên hệ lại với bạn sớm nhất."}
