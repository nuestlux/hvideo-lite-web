from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from schemas.user import UserCreate, UserUpdate, UserOut, PaginatedUsers
from schemas.user import ChangePasswordRequest
from middleware.auth import get_current_user, require_admin
from models.user import User
from models.audit import AuditLog
from services.otp_service import create_otp
from services.auth_service import change_password
from utils.errors import AppException

router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])


@router.get("/")
async def list_users(
    search: str = "",
    status: str = "",
    role: str = "",
    page: int = 1,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from sqlalchemy import select, func

    query = select(User)
    count_query = select(func.count(User.id))

    if search:
        query = query.where(User.name.contains(search) | User.email.contains(search))
        count_query = count_query.where(User.name.contains(search) | User.email.contains(search))
    if status:
        query = query.where(User.status == status)
        count_query = count_query.where(User.status == status)
    if role:
        query = query.where(User.role == role)
        count_query = count_query.where(User.role == role)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "data": {
            "items": [UserOut.model_validate(u) for u in users],
            "total": total,
            "page": page,
            "limit": limit,
        },
        "message": "Success",
    }


@router.post("/")
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from sqlalchemy import select

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise AppException("USER_EXISTS", "Email đã tồn tại trong hệ thống", 409)

    user = User(
        name=data.name,
        email=data.email,
        role=data.role,
        status="cho_xac_nhan",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    audit = AuditLog(
        user_id=admin.id,
        action="create_user",
        target_type="user",
        target_id=user.id,
        details=f'Created user: {data.name}, {data.email}, role={data.role}',
    )
    db.add(audit)
    await db.commit()

    await create_otp(user.id, user.email, user.name, db)

    return {"data": UserOut.model_validate(user), "message": "Tạo tài khoản thành công. Email OTP đã được gửi."}


@router.get("/{user_id}")
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException("USER_NOT_FOUND", "Người dùng không tồn tại", 404)
    return {"data": UserOut.model_validate(user), "message": "Success"}


@router.put("/{user_id}")
async def update_user(
    user_id: int,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException("USER_NOT_FOUND", "Người dùng không tồn tại", 404)

    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        existing = await db.execute(select(User).where(User.email == data.email, User.id != user_id))
        if existing.scalar_one_or_none():
            raise AppException("USER_EXISTS", "Email đã tồn tại", 409)
        user.email = data.email

    audit = AuditLog(
        user_id=admin.id,
        action="update_user",
        target_type="user",
        target_id=user_id,
        details=f'Updated user: name={data.name}, email={data.email}',
    )
    db.add(audit)
    await db.commit()
    await db.refresh(user)

    return {"data": UserOut.model_validate(user), "message": "Cập nhật thông tin thành công"}


@router.patch("/{user_id}/lock")
async def toggle_lock(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException("USER_NOT_FOUND", "Người dùng không tồn tại", 404)

    if user.status == "da_khoa":
        user.status = "hoat_dong"
        action = "unlock_user"
        msg = "Mở khóa tài khoản thành công"
    else:
        user.status = "da_khoa"
        action = "lock_user"
        msg = "Khóa tài khoản thành công"

    audit = AuditLog(user_id=admin.id, action=action, target_type="user", target_id=user_id)
    db.add(audit)
    await db.commit()
    await db.refresh(user)
    return {"data": UserOut.model_validate(user), "message": msg}


@router.post("/{user_id}/resend-otp")
async def resend_otp(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException("USER_NOT_FOUND", "Người dùng không tồn tại", 404)
    if user.status != "cho_xac_nhan":
        raise AppException("INVALID_STATUS", "Chỉ có thể gửi lại OTP cho tài khoản chưa xác nhận", 400)

    await create_otp(user.id, user.email, user.name, db)

    audit = AuditLog(user_id=admin.id, action="resend_otp", target_type="user", target_id=user_id)
    db.add(audit)
    await db.commit()

    return {"data": {}, "message": "OTP đã được gửi lại."}


@router.post("/{user_id}/reset-otp")
async def reset_otp(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    from sqlalchemy import select, update
    from models.otp import OTPVerification

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise AppException("USER_NOT_FOUND", "Người dùng không tồn tại", 404)

    await db.execute(
        update(OTPVerification)
        .where(OTPVerification.user_id == user_id, OTPVerification.status == "pending")
        .values(status="expired")
    )
    
    await create_otp(user.id, user.email, user.name, db)

    audit = AuditLog(user_id=admin.id, action="reset_otp", target_type="user", target_id=user_id)
    db.add(audit)
    await db.commit()

    return {"data": {}, "message": "OTP đã được reset và gửi lại."}
