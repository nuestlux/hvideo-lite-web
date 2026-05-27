# Hvideo Lite — Phase 1: Core Platform

**Ngày:** 2026-05-26
**Dựa trên:** BRD Hvideo Lite v2.0
**Module:** M11 (Xác thực), M03 (Quản lý tài khoản), M10 (Hồ sơ cán bộ), M07 (Cấu hình hệ thống)

---

## 1. Technical Stack

| Layer | Công nghệ | Ghi chú |
|---|---|---|
| Backend | Python (FastAPI + SQLAlchemy async) | REST API, serve static build |
| Database | SQLite | File-based, dễ migrate lên PostgreSQL |
| Frontend | React + Vite | SPA, Ant Design components |
| Auth | JWT (access token 8h) | Bearer token |
| Email | SMTP TLS (nội bộ hoặc relay) | Gửi OTP + reset password |

## 2. Kiến trúc tổng thể

Monolith: FastAPI server duy nhất (port 8000) vừa serve REST API vừa serve React build tĩnh.

```
Browser (user/admin)
    ↕ HTTPS
Reverse Proxy (Nginx/HAProxy)
    ↕ HTTP localhost:8000
FastAPI (Python)
├── Mount / → frontend/dist/ (React build)
├── REST API /api/*
├── SQLAlchemy async ORM
└── SQLite file (hvideolite.db)
```

- Development: Vite dev server proxy `/api` → FastAPI `:8000`
- Production: `npm run build` → FastAPI serve static
- Không cần CORS (cùng origin)

## 3. Database Schema

### 3.1 users

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | Integer | PK, auto | |
| name | String(100) | NOT NULL | |
| email | String(255) | NOT NULL, UNIQUE | |
| password_hash | String(255) | | bcrypt, có thể NULL (user chưa set pass) |
| role | String(20) | NOT NULL, DEFAULT 'can_bo' | 'admin' / 'can_bo' |
| points | Integer | NOT NULL, DEFAULT 0 | |
| status | String(20) | NOT NULL, DEFAULT 'cho_xac_nhan' | 'cho_xac_nhan' / 'hoat_dong' / 'da_khoa' |
| failed_login_attempts | Integer | DEFAULT 0 | |
| locked_until | DateTime | NULLABLE | |
| unconfirmed_72h_warning | Boolean | DEFAULT FALSE | Đã cảnh báo admin chưa |
| last_login_at | DateTime | NULLABLE | |
| created_at | DateTime | NOT NULL, DEFAULT now | |
| updated_at | DateTime | NOT NULL, DEFAULT now | |

### 3.2 otp_verifications

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | Integer | PK, auto | |
| user_id | Integer | FK → users.id, NOT NULL | |
| otp_hash | String(64) | NOT NULL | SHA-256 hash |
| expires_at | DateTime | NOT NULL | created_at + 10 phút |
| status | String(20) | NOT NULL, DEFAULT 'pending' | 'pending' / 'used' / 'expired' |
| failed_attempts | Integer | DEFAULT 0 | |
| resend_count | Integer | DEFAULT 0 | |
| resend_reset_at | DateTime | NULLABLE | Reset resend_count sau 1h |
| confirmed_at | DateTime | NULLABLE | |
| confirmed_ip | String(45) | NULLABLE | |
| created_at | DateTime | NOT NULL, DEFAULT now | |

### 3.3 system_configs

| Column | Type | Constraints | Notes |
|---|---|---|---|
| key | String(100) | PK | |
| value | Text | NOT NULL | |
| description | String(255) | | |
| updated_by | Integer | FK → users.id | |
| updated_at | DateTime | NOT NULL, DEFAULT now | |

Config keys mặc định:

| Key | Value | Mô tả |
|---|---|---|
| `license_plate_image_cost` | 5 | Point cho biển số từ ảnh |
| `license_plate_video_cost` | 15 | Point cho biển số từ video |
| `video_repair_fast_cost` | 10 | Point cho sửa video nhanh |
| `video_repair_deep_cost` | 20 | Point cho sửa video sâu |
| `queue_mode` | FIFO | FIFO hoặc LIFO |
| `max_concurrent_jobs` | 5 | Giới hạn xử lý đồng thời |
| `storage_limit_mb` | 500 | Giới hạn lưu trữ mỗi user |

### 3.4 audit_logs

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | Integer | PK, auto | |
| user_id | Integer | FK → users.id, NOT NULL | Admin thực hiện |
| action | String(50) | NOT NULL | 'create_user', 'update_user', 'lock_user', 'unlock_user', 'resend_otp', 'update_config', 'reset_otp' |
| target_type | String(50) | NULLABLE | 'user', 'config' |
| target_id | Integer | NULLABLE | |
| details | Text | NULLABLE | JSON string |
| ip_address | String(45) | | |
| created_at | DateTime | NOT NULL, DEFAULT now | |

## 4. API Endpoints

Base URL: `/api`
Auth: JWT Bearer token (trừ login, forgot-password, verify-otp, reset-password)

### 4.1 Auth — `/api/auth`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | /api/auth/login | No | `{email, password}` → `{token, user}` |
| POST | /api/auth/logout | Yes | Xóa token |
| POST | /api/auth/forgot-password | No | `{email}` → gửi email reset |
| POST | /api/auth/reset-password | No | `{token, new_password}` |
| POST | /api/auth/verify-otp | No | `{email, otp}` → `{setup_token}` (dùng để set-password) |
| POST | /api/auth/set-password | No | `{setup_token, password}` → kích hoạt user + login |

**Response format chung:**
```json
{ "data": {}, "message": "string" }
```

**Error format:**
```json
{ "detail": { "code": "ERROR_CODE", "message": "Thông báo tiếng Việt" } }
```

### 4.2 Admin Users — `/api/admin/users`

| Method | Endpoint | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | /api/admin/users | Yes | admin | Danh sách user (query: search, status, role, page, limit) |
| POST | /api/admin/users | Yes | admin | Tạo user → gửi OTP |
| GET | /api/admin/users/{id} | Yes | admin | Chi tiết user |
| PUT | /api/admin/users/{id} | Yes | admin | Sửa thông tin |
| PATCH | /api/admin/users/{id}/lock | Yes | admin | Khóa/mở user |
| POST | /api/admin/users/{id}/resend-otp | Yes | admin | Gửi lại OTP (check 3 lần/giờ) |
| POST | /api/admin/users/{id}/reset-otp | Yes | admin | Reset OTP failed attempts |

### 4.3 Profile — `/api/profile`

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| GET | /api/profile | Yes | Thông tin cá nhân |
| PUT | /api/profile | Yes | Cập nhật tên, email |
| PUT | /api/profile/change-password | Yes | Đổi mật khẩu `{old_password, new_password}` |

### 4.4 Admin Config — `/api/admin/config`

| Method | Endpoint | Auth | Role | Mô tả |
|---|---|---|---|---|
| GET | /api/admin/config | Yes | admin | Tất cả cấu hình |
| PUT | /api/admin/config | Yes | admin | Update config `{key: value, ...}` |

## 5. Frontend Routes & Components

### 5.1 Routes

| Path | Component | Auth | Layout |
|---|---|---|---|
| /login | LoginPage | No | AuthLayout |
| /forgot-password | ForgotPasswordPage | No | AuthLayout |
| /verify-otp | VerifyOtpPage | No | AuthLayout |
| /reset-password | ResetPasswordPage | No | AuthLayout |
| /set-password | SetPasswordPage | No | AuthLayout |
| /admin/users | AdminUsersPage | admin | AdminLayout |
| /admin/users/:id | AdminUserDetailPage | admin | AdminLayout |
| /admin/config | AdminConfigPage | admin | AdminLayout |
| /can-bo/profile | OfficerProfilePage | can_bo | OfficerLayout |

### 5.2 Component tree

```
frontend/src/
├── App.tsx
├── main.tsx
├── routes.tsx                    # React Router + ProtectedRoute
├── api/
│   ├── client.ts                 # Axios instance (interceptor auth, error)
│   ├── auth.ts                   # API functions
│   ├── users.ts
│   └── config.ts
├── contexts/
│   ├── AuthContext.tsx            # User state, token, login/logout
│   └── AppContext.tsx
├── layouts/
│   ├── AuthLayout.tsx            # Clean layout, centered card
│   ├── AdminLayout.tsx           # Ant Design Layout + Sider
│   └── OfficerLayout.tsx         # Ant Design Layout + Sider (simpler)
├── pages/
│   ├── login/LoginPage.tsx
│   ├── forgot-password/ForgotPasswordPage.tsx
│   ├── verify-otp/VerifyOtpPage.tsx
│   ├── reset-password/ResetPasswordPage.tsx
│   ├── set-password/SetPasswordPage.tsx
│   ├── admin/
│   │   ├── users/
│   │   │   ├── AdminUsersPage.tsx        # Table + search + create modal
│   │   │   └── components/
│   │   │       ├── UserTable.tsx
│   │   │       ├── CreateUserModal.tsx
│   │   │       └── AdjustPointModal.tsx
│   │   └── config/
│   │       └── AdminConfigPage.tsx       # Editable key-value table
│   └── profile/
│       └── ProfilePage.tsx
├── components/
│   ├── ProtectedRoute.tsx
│   └── common/
│       ├── PageHeader.tsx
│       └── StatCard.tsx
└── i18n/
    └── vi.ts                      # Tiếng Việt strings
```

## 6. Authentication Flow

### 6.1 Login

User → nhập email/password → POST `/api/auth/login` → server validate → JWT (8h) → lưu localStorage → redirect theo role.

### 6.2 Tạo tài khoản + OTP

Admin → POST `/api/admin/users` → server:
1. Tạo user `status=cho_xac_nhan`, không password
2. Sinh OTP 6 số, hash SHA-256, lưu `otp_verifications`
3. Gửi email chứa OTP gốc
4. User nhận email → vào `/verify-otp` → nhập OTP
5. POST `/api/auth/verify-otp` → server verify hash + expiry + attempts
6. Thành công → trả `setup_token` → redirect `/set-password`
7. User đặt password → POST `/api/auth/set-password` → kích hoạt user → auto login

### 6.3 OTP rules

- OTP 6 số, hiệu lực 10 phút
- Dùng 1 lần → status = "used"
- Sai 5 lần → status = "expired", khóa xác nhận (admin reset)
- Gửi lại tối đa 3 lần/giờ, gửi lại → mã cũ vô hiệu
- Hết hạn → thông báo "Liên hệ admin"

### 6.4 Quên mật khẩu

User → POST `/api/auth/forgot-password` → server gửi email reset link (token 30 phút) → user click link → trang reset-password → POST `/api/auth/reset-password`.

### 6.5 Session & Security

- JWT hết hạn sau 8h
- Frontend detect 30 phút inactive → force logout (track mousemove/keydown)
- Sai mật khẩu 10 lần trong 5 phút → lock IP 30 phút (rate limit middleware)
- Mật khẩu bcrypt hệ số 12

## 7. Admin Layout Components

### AdminLayout

```
┌──────────────────────────────────────────────────────┐
│ [Logo] Hvideo Lite                    [Avatar] Tên   │ Header
├──────────┬───────────────────────────────────────────┤
│          │                                           │
│ Users    │  <Outlet /> (nội dung trang)              │
│ Config   │                                           │
│          │                                           │
│          │                                           │
└──────────┴───────────────────────────────────────────┘
```

Sider: Ant Design `Menu` với các mục Users, Config.

### OfficerLayout

Tương tự nhưng sider chỉ có Profile và Dashboard (reserved).

### AdminUsersPage

Ant Design `Table` với:
- Columns: Tên, Email, Vai trò, Point, Trạng thái, Hành động
- Filter: search text, status dropdown
- Action buttons: Sửa, Cấp point, Khóa/Mở, Gửi lại OTP (cho status `cho_xac_nhan`)
- Nút "Tạo tài khoản" → `Modal` form

## 8. Error Handling

### Backend

Custom exception handler catch `AppException` (code + message tiếng Việt):

```python
class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
```

### Frontend

- Axios interceptor: response error → Ant Design `message.error()`
- Form validation: Ant Design Form `rules`
- Network error: "Không thể kết nối đến server. Vui lòng thử lại."

### Error codes

| Code | HTTP | Ý nghĩa |
|---|---|---|
| INVALID_CREDENTIALS | 401 | Sai email/mật khẩu |
| ACCOUNT_LOCKED | 403 | Tài khoản bị khóa |
| ACCOUNT_NOT_ACTIVATED | 403 | Chưa xác nhận OTP |
| OTP_EXPIRED | 400 | OTP hết hạn |
| OTP_INVALID | 400 | Sai OTP |
| OTP_TOO_MANY_ATTEMPTS | 429 | Sai OTP 5 lần |
| OTP_RESEND_LIMIT | 429 | Gửi lại OTP quá 3 lần/giờ |
| USER_EXISTS | 409 | Email đã tồn tại |
| FORBIDDEN | 403 | Không phải admin |
| TOKEN_EXPIRED | 401 | Token hết hạn |
| RATE_LIMITED | 429 | Quá nhiều request |

## 9. Phát triển & Triển khai

### Development

```bash
# Backend
cd backend
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm run dev  # proxy /api → localhost:8000
```

### Production

```bash
# Build frontend
cd frontend && npm run build

# Run backend (serve both API + static)
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

Reverse proxy (Nginx) đứng trước, terminate SSL, proxy_pass đến localhost:8000.

## 10. Background Tasks

### 10.1 72h Unconfirmed Warning (FR-09)

Mỗi giờ, background task kiểm tra users có `status='cho_xac_nhan'` và `created_at > 72h`. Nếu chưa gửi cảnh báo (`unconfirmed_72h_warning = False`), gửi email thông báo cho admin và đánh dấu đã cảnh báo.

### 10.2 OTP Cleanup

Mỗi ngày, xóa các `otp_verifications` có `created_at > 90 ngày` (DR-02).

### 10.3 OTP Resend Reset

Mỗi giờ, reset `resend_count = 0` cho các `otp_verifications` có `resend_reset_at < now`.

## 11. Email Service

Async email sending sử dụng `aiosmtplib` (hoặc thread pool) để đảm bảo API response trong 3 giây (FR-01). Cấu hình SMTP lấy từ environment variables:

| Variable | Mô tả |
|---|---|
| SMTP_HOST | SMTP server host |
| SMTP_PORT | Port (thường 587 TLS) |
| SMTP_USER | Username |
| SMTP_PASSWORD | Password |
| SMTP_FROM | Địa chỉ gửi (noreply@...) |
| SMTP_USE_TLS | True/False |

Email OTP template (FR-03):
```
Kính gửi {tên cán bộ},

Tài khoản Hvideo Lite của bạn đã được tạo.

Mã OTP xác nhận: {otp}
Mã có hiệu lực trong 10 phút.

Nếu không phải bạn, vui lòng liên hệ admin.
```

## 12. Files & Project Structure

```
hvideolite/
├── backend/
│   ├── main.py                  # FastAPI app entry
│   ├── config.py                # Settings (DB path, SMTP, JWT secret)
│   ├── database.py              # SQLAlchemy engine + session
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── otp.py
│   │   ├── config.py
│   │   └── audit.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── config.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── profile.py
│   │   └── config.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── otp_service.py
│   │   └── email_service.py
│   ├── middleware/
│   │   ├── auth.py              # JWT decode + role check
│   │   └── rate_limit.py        # Brute-force protection
│   ├── utils/
│   │   ├── security.py          # bcrypt, JWT
│   │   └── errors.py            # AppException
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   ├── api/
│   │   │   ├── client.ts
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   └── config.ts
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── layouts/
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   └── OfficerLayout.tsx
│   │   ├── pages/
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   ├── verify-otp/
│   │   │   ├── reset-password/
│   │   │   ├── set-password/
│   │   │   ├── admin/
│   │   │   │   ├── users/
│   │   │   │   └── config/
│   │   │   └── profile/
│   │   ├── components/
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── common/
│   │   ├── i18n/
│   │   │   └── vi.ts
│   │   └── styles/
│   │       └── global.css
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-05-26-hvideo-lite-phase1-core-platform.md
```

## 13. Quy tắc nghiệp vụ được implement

| BRULE | Mô tả | Implement tại |
|---|---|---|
| BRULE-01 | Chỉ admin tạo tài khoản | AdminUsersPage + POST /api/admin/users |
| BRULE-06 | Điều chỉnh point phải kèm lý do | (Phase 2) |
| BRULE-12 | Tạo TK → email OTP 6 số 10 phút | OTP service + email service |
| BRULE-13 | OTP dùng 1 lần, hết hạn/đã dùng vô hiệu | otp_verifications.status |

## 14. Yêu cầu chức năng được implement

| FR | Mô tả | Trạng thái |
|---|---|---|
| FR-01 | Admin tạo TK → OTP 6 số trong 3 giây | Có |
| FR-02 | Không hiển thị trang đăng ký, OAuth | Có |
| FR-03 | Email OTP chứa: tên, Hvideo Lite, mã OTP, thời hạn, hướng dẫn | Có |
| FR-04 | Nhập đúng OTP → status Hoạt động → set password | Có |
| FR-05 | OTP hết hạn/đã dùng → thông báo lỗi | Có |
| FR-06 | Sai OTP 5 lần → khóa | Có |
| FR-07 | Quản lý user: gửi lại OTP (3 lần/giờ) | Có |
| FR-08 | Chờ xác nhận cố đăng nhập → từ chối | Có |
| FR-09 | Không xác nhận 72h → cảnh báo admin | Có |
| FR-10 | Đăng nhập email/pass, quên mật khẩu | Có |
| FR-11 | Hồ sơ: xem/sửa tên, email, đổi mật khẩu | Có |
| FR-33 | Cấu hình admin: chi phí, giới hạn, hàng đợi | Có |
| FR-34 | Quản lý user: bảng tìm kiếm, lọc, thao tác | Có |

## 15. Yêu cầu phi chức năng được implement

| NFR | Mô tả | Trạng thái |
|---|---|---|
| NFR-05 | RBAC 2 vai trò, 403 nếu không đủ quyền | Có |
| NFR-06 | bcrypt (>=12), HTTPS TLS 1.2+, OTP hash | Có |
| NFR-07 | 100% on-premise, không gọi API ngoài | Có |
| NFR-08 | Audit log mọi thao tác admin | Có |
| NFR-11 | Chrome/Firefox/Safari/Edge, >=1280px | Có (Ant Design responsive) |
| NFR-12 | Giao diện tiếng Việt | Có |
| NFR-16 | Brute-force: khóa IP 10 lần sai/5 phút | Có |
| NFR-18 | Session 30 phút inactive, JWT 8h | Có |
