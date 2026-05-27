# Phase 1: Backend Setup & Database Models

**Priority:** P1 — Effort: 6h — Status: Pending

## Overview

Setup Python FastAPI project structure, SQLAlchemy models, database initialization, project config, and base utilities (security, errors, middleware).

## Related Code Files

### Create
- `backend/main.py` — FastAPI app entry
- `backend/config.py` — Settings (DB path, SMTP, JWT secret, etc.)
- `backend/database.py` — SQLAlchemy async engine + session
- `backend/requirements.txt` — Dependencies
- `backend/models/__init__.py`
- `backend/models/user.py` — User model
- `backend/models/otp.py` — OTP verification model
- `backend/models/config.py` — System config model
- `backend/models/audit.py` — Audit log model
- `backend/schemas/__init__.py`
- `backend/schemas/auth.py` — Auth request/response schemas
- `backend/schemas/user.py` — User schemas
- `backend/schemas/config.py` — Config schemas
- `backend/utils/__init__.py`
- `backend/utils/security.py` — bcrypt hash, JWT encode/decode
- `backend/utils/errors.py` — AppException class

## Implementation Steps

### 1. requirements.txt

```
fastapi==0.115.*
uvicorn[standard]==0.34.*
sqlalchemy[asyncio]==2.0.*
aiosqlite==0.20.*
pydantic==2.*
pydantic-settings==2.*
python-jose[cryptography]==3.3.*
passlib[bcrypt]==1.7.*
python-multipart==0.0.*
aiosmtplib==3.*
email-validator==2.*
```

### 2. backend/config.py

Pydantic BaseSettings:
- `DATABASE_URL`: str = "sqlite+aiosqlite:///./hvideolite.db"
- `JWT_SECRET`: str (random 32+ chars)
- `JWT_ALGORITHM`: str = "HS256"
- `JWT_EXPIRE_MINUTES`: int = 480 (8h)
- `BCRYPT_ROUNDS`: int = 12
- `OTP_EXPIRE_MINUTES`: int = 10
- `OTP_MAX_ATTEMPTS`: int = 5
- `OTP_RESEND_LIMIT`: int = 3
- `OTP_RESEND_WINDOW_MINUTES`: int = 60
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_USE_TLS`
- `RATE_LIMIT_LOGIN_ATTEMPTS`: int = 10
- `RATE_LIMIT_LOGIN_WINDOW_MINUTES`: int = 5
- `RATE_LIMIT_LOCK_MINUTES`: int = 30
- `SESSION_INACTIVE_MINUTES`: int = 30

### 3. backend/database.py

Async SQLAlchemy:
```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

engine = create_async_engine(settings.DATABASE_URL)
async_session = async_sessionmaker(engine)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with async_session() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```

### 4. Database Models

**models/user.py** — User table (see spec section 3.1)
- `__tablename__ = "users"`
- All columns from spec
- Use `sqlalchemy.types.DateTime` for timestamps
- `index=True` on `email`, `status`

**models/otp.py** — OTP verification table (see spec section 3.2)
- `__tablename__ = "otp_verifications"`
- FK `user_id` → users.id

**models/config.py** — System config table (see spec section 3.3)
- `__tablename__ = "system_configs"`
- Simple key-value with `updated_by` FK

**models/audit.py** — Audit log table (see spec section 3.4)
- `__tablename__ = "audit_logs"`
- FK `user_id` → users.id

### 5. backend/utils/security.py

```python
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_jwt(data: dict, expires_delta: timedelta) -> str:
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + expires_delta})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def decode_jwt(token: str) -> dict | None:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None
```

### 6. backend/utils/errors.py

```python
class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
```

### 7. backend/main.py

FastAPI app:
- `app = FastAPI(title="Hvideo Lite", docs_url="/docs")`
- Mount static: `app.mount("/", StaticFiles(directory="../frontend/dist", html=True), name="frontend")` — only when dist exists
- CORS middleware (for dev only)
- Exception handler for `AppException`
- Lifespan: `init_db()` on startup
- Include routers: api/auth.py, api/users.py, api/profile.py, api/config.py
- Background task setup (fastapi.BackgroundTasks for email)

### 8. Pydantic Schemas

**schemas/auth.py:**
- `LoginRequest(email, password)`
- `LoginResponse(token, user: UserOut)`
- `VerifyOtpRequest(email, otp)`
- `SetPasswordRequest(setup_token, password)`
- `ForgotPasswordRequest(email)`
- `ResetPasswordRequest(token, new_password)`

**schemas/user.py:**
- `UserOut(id, name, email, role, status, points, created_at)`
- `UserCreate(name, email, role)`
- `UserUpdate(name, email)`
- `UserList(page, limit, search, status, role) → paginated response`
- `ChangePasswordRequest(old_password, new_password)`

**schemas/config.py:**
- `ConfigItem(key, value, description, updated_by, updated_at)`
- `ConfigUpdate(dict of key: value)`

## Success Criteria

- [ ] `uvicorn main:app` starts without errors
- [ ] `GET /docs` shows Swagger UI
- [ ] All 4 tables created in SQLite on first run
- [ ] `hash_password` / `verify_password` works correctly
- [ ] `create_jwt` / `decode_jwt` round-trips correctly
- [ ] Static file mount serves `index.html` (after frontend build)

## Risk Assessment

- SQLite concurrency: single-writer mode, fine for dev/early prod. Migration path to PostgreSQL if needed.
- JWT secret must be set via env var, not hardcoded.
