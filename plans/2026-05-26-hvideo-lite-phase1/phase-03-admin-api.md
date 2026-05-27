# Phase 3: Admin Users & Profile API

**Priority:** P1 — Effort: 6h — Status: Pending

## Overview

Admin user management endpoints (CRUD users, lock/unlock, OTP resend) and officer profile endpoints (view, update, change password).

## Related Code Files

### Create
- `backend/services/user_service.py`
- `backend/api/users.py` — Admin user management
- `backend/api/profile.py` — Officer profile

### Modify
- `backend/main.py` — Add routers
- `backend/services/otp_service.py` — Export resend helper
- `backend/schemas/user.py` — Ensure all schemas complete

## Implementation Steps

### 1. services/user_service.py

```python
async def create_user(data: UserCreate, admin: User, db) -> User:
    # Check email uniqueness
    # Create user with status="cho_xac_nhan", no password
    # Call otp_service.create_otp()
    # Call email_service.send_email() with OTP
    # Log to audit_logs
    # Return user (without exposing OTP)

async def get_users(search, status, role, page, limit, db) -> PaginatedResult
    # SQLAlchemy query with optional filters
    # Return total + items

async def get_user(user_id: int, db) -> User
    # Get by ID, raise 404 if not found

async def update_user(user_id: int, data: UserUpdate, admin: User, db)
    # Update name, email
    # Check email uniqueness if changed
    # Log audit

async def toggle_lock(user_id: int, admin: User, db)
    # Toggle between "hoat_dong" and "da_khoa"
    # Log audit

async def resend_otp(user_id: int, admin: User, db)
    # Validate user status = "cho_xac_nhan"
    # Check otp_service.resend_limit
    # Invalidate old OTPs
    # Create new OTP, send email
    # Log audit

async def reset_otp(user_id: int, admin: User, db):
    # Reset otp_verifications failed_attempts for user
    # Log audit
```

### 2. api/users.py — Admin Endpoints

Router: `router = APIRouter(prefix="/api/admin/users", tags=["admin-users"])`
All endpoints use `Depends(require_admin)`.

- `GET /` — List users (query: search, status, role, page, limit)
- `POST /` — Create user `{name, email, role}`
- `GET /{id}` — User detail
- `PUT /{id}` — Update user
- `PATCH /{id}/lock` — Lock/unlock
- `POST /{id}/resend-otp` — Resend OTP
- `POST /{id}/reset-otp` — Reset OTP attempts

### 3. api/profile.py — Officer Endpoints

Router: `router = APIRouter(prefix="/api/profile", tags=["profile"])`
All use `Depends(get_current_user)`.

- `GET /` — Return current user info
- `PUT /` — Update `{name, email}`
- `PUT /change-password` — Body: `{old_password, new_password}`
  - Verify old password, hash + save new one

## Success Criteria

- [ ] Admin can create user → email sent with OTP
- [ ] Admin can list, search, filter users
- [ ] Admin can lock/unlock user
- [ ] Admin can resend OTP (respects 3/hour limit)
- [ ] Officer can view own profile
- [ ] Officer can update name/email
- [ ] Officer can change password (requires old password)
- [ ] All operations logged to audit_logs

## Risk Assessment

- Audit log: never expose audit log via API in Phase 1 (no requirement for it yet)
- Resend OTP limit: check `resend_count` in current window, not total history
