# Phase 2: Auth API — Login, OTP, Password

**Priority:** P1 — Effort: 8h — Status: Pending

## Overview

Implement all auth-related endpoints. This is the most security-critical phase. OTP flow, JWT auth, rate limiting, brute-force protection.

## Related Code Files

### Create
- `backend/middleware/__init__.py`
- `backend/middleware/auth.py` — JWT decode + dependency injection
- `backend/middleware/rate_limit.py` — IP-based brute-force protection
- `backend/services/__init__.py`
- `backend/services/auth_service.py` — Login, password management
- `backend/services/otp_service.py` — OTP generation, verification, resend
- `backend/services/email_service.py` — Async email sending (SMTP)
- `backend/api/__init__.py`
- `backend/api/auth.py` — Auth router

### Modify
- `backend/main.py` — Add routers, middleware, exception handlers

## Implementation Steps

### 1. middleware/auth.py

Dependencies:
```python
async def get_current_user(token: str = Depends(oauth2_scheme), db=Depends(get_db)) -> User
    # decode JWT → get user_id → query DB
    # check user status != "da_khoa"
    # check user status == "hoat_dong" (or allow cho_xac_nhan for OTP routes)
    # return user

async def require_admin(user: User = Depends(get_current_user)) -> User
    if user.role != "admin":
        raise AppException("FORBIDDEN", "Không có quyền truy cập", 403)
```

Token extraction: `OAuth2PasswordBearer(tokenUrl="/api/auth/login")`

### 2. middleware/rate_limit.py

Simple in-memory rate limiter:
```python
class RateLimiter:
    def __init__(self):
        self.attempts: dict[str, list[datetime]] = {}
    
    def check(self, key: str, max_attempts: int, window_minutes: int) -> bool
        # Clean old entries, count recent, return True if allowed
    
    def is_locked(self, key: str, lock_minutes: int) -> bool
        # Check if key is currently locked
```

Apply to login endpoint via FastAPI `Depends()`.

### 3. services/email_service.py

```python
import aiosmtplib

async def send_email(to: str, subject: str, body: str):
    # Use settings.SMTP_* config
    # Send HTML-formatted email
    # Log success/failure
```

### 4. services/otp_service.py

```python
import secrets, hashlib

def generate_otp() -> tuple[str, str]:
    """Returns (otp_code, otp_hash)"""
    code = f"{secrets.randbelow(1000000):06d}"
    hash = hashlib.sha256(code.encode()).hexdigest()
    return code, hash

async def create_otp(user_id: int, db) -> str:
    """Create OTP record, return plain OTP code for email"""
    # Validate resend limit (3/hour)
    # Invalidate previous pending OTPs
    # Create new otp_verifications record
    # Return plain OTP code

async def verify_otp(email: str, otp_code: str, db) -> str | None:
    """Verify OTP, return setup_token on success"""
    # Find user by email
    # Find pending OTP for user
    # Hash otp_code, compare with stored hash
    # Check expiry
    # Check failed_attempts < 5
    # On success: mark OTP used, create setup JWT token (10 min), return token
    # On failure: increment failed_attempts, if >=5 mark expired
```

### 5. services/auth_service.py

```python
async def authenticate(email: str, password: str, db) -> User:
    """Verify credentials + account active"""
    # Get user by email
    # Check user exists
    # Check status != "da_khoa" and != "cho_xac_nhan" (not activated can't login)
    # Verify password with bcrypt
    # Create JWT (8h)
    # Update last_login_at
    # Return user + token

async def change_password(user_id: int, old_pw: str, new_pw: str, db):
    """Verify old password, hash new one, update"""
```

### 6. api/auth.py — Endpoints

All under router `router = APIRouter(prefix="/api/auth", tags=["auth"])`

#### POST /login
- Body: `{email, password}`
- Rate limit check (key=IP)
- Call `auth_service.authenticate()`
- Return `{token, user}`

#### POST /verify-otp
- Body: `{email, otp}`
- Call `otp_service.verify_otp()`
- Return `{setup_token}`

#### POST /set-password
- Body: `{setup_token, password}`
- Decode setup_token, validate
- Hash password with bcrypt, update user
- Set user status = "hoat_dong"
- Return JWT login token + user

#### POST /forgot-password
- Body: `{email}`
- Check user exists (don't reveal if not found — generic "If email exists, reset link sent")
- Generate reset JWT (30 min), send email
- Return success message

#### POST /reset-password
- Body: `{token, new_password}`
- Decode reset token, validate
- Hash + update password
- Return success

#### POST /logout
- Invalidate token (optional: token blacklist)
- For Phase 1: JWT stateless, just return success (frontend removes token)

### 7. Exception handler in main.py

```python
@app.exception_handler(AppException)
async def app_exception_handler(request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": {"code": exc.code, "message": exc.message}}
    )
```

### 8. Root endpoint

`GET /api/health` — return `{"status": "ok", "version": "1.0.0"}`

## Success Criteria

- [ ] POST /api/auth/register-user flow works (will need admin create user first from Phase 3)
- [ ] POST /api/auth/login returns JWT for active users
- [ ] POST /api/auth/login returns 403 for "cho_xac_nhan" users
- [ ] POST /api/auth/verify-otp validates OTP correctly
- [ ] POST /api/auth/verify-otp fails after 5 attempts
- [ ] POST /api/auth/verify-otp fails on expired OTP
- [ ] POST /api/auth/set-password activates user and returns token
- [ ] POST /api/auth/forgot-password sends email
- [ ] POST /api/auth/reset-password updates password
- [ ] Rate limiter blocks IP after 10 failed attempts
- [ ] Email sent via SMTP (fail gracefully if SMTP unavailable)

## Risk Assessment

- In-memory rate limiter resets on server restart — acceptable for Phase 1
- SMTP failure: log error, don't crash. Return message "Gửi email thất bại, vui lòng thử lại sau."
- OTP hash comparison: use `hmac.compare_digest()` for timing-safe comparison
