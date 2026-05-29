# Auth System Design — VisionFix SaaS Mockup

**Ngày:** 2026-05-19
**Dự án:** VisionFix SaaS Mockup (video-plate-saas-mockup-v2.html)
**Module:** Auth & User Account Management (Epic 1)

## 1. Tổng quan

Thêm authentication system hoàn chỉnh vào mockup HTML hiện tại. Hiện tại app dùng hardcoded `currentUserId: 'U001'` — không có login, register, logout, password, hay session nào.

**Mục tiêu:** Chuyển từ hardcoded user sang auth flow SaaS chuẩn với:
- Login / Register / Forgot Password
- OAuth simulation (Google, Facebook)
- Email verification simulation
- Profile management + change password
- Navigation guard (chưa login → chỉ thấy auth page)

## 2. User Flow

```
App load → currentUserId = null → page-auth hiện full màn hình (ẩn sidebar, topbar, breadcrumb)
  │
  ├─ Login → set currentUserId → renderAll() → vào Dashboard
  │
  ├─ Register → tạo user mới + welcome points → auto login → Dashboard
  │   (nếu status = 'unverified' → show email verification notice)
  │
  ├─ Forgot Password → email input → confirmation screen "check email"
  │
  └─ OAuth (Google/FB) → click → simulate success → Dashboard
```

**Logout:** Nút ở cuối sidebar → set currentUserId = null → quay về page-auth.

## 3. Auth Pages (page-auth)

Layout: Full màn hình, background gradient tối, card giữa (max-width 420px), logo VisionFix ở trên.

### 3.1 Login Page
- Fields: Email, Password (có eye toggle show/hide)
- Checkbox: "Ghi nhớ đăng nhập" (lưu email vào localStorage)
- Nút: "ĐĂNG NHẬP" (primary, full-width)
- Divider "hoặc" + OAuth buttons (Google 🔴G, Facebook 🔵F)
- Links: "Quên mật khẩu?" + "Chưa có tài khoản? Đăng ký"
- Validation: email format, password không rỗng
- Error toast: "Email hoặc mật khẩu không đúng"

### 3.2 Register Page
- Fields: Họ tên, Email, Mật khẩu, Xác nhận mật khẩu
- Checkbox: "Tôi đồng ý với Điều khoản dịch vụ"
- Notice: "🎉 Đăng ký thành công được tặng ngay 50 Point!"
- Nút: "TẠO TÀI KHOẢN" (primary, full-width)
- Link: "Đã có tài khoản? Đăng nhập"
- Validation: all fields required, email format, password ≥ 6 chars, confirm match, ToS checked
- Error toast: "Email đã được sử dụng" nếu email trùng

### 3.3 Forgot Password Page
- Step 1: Email input + "Gửi yêu cầu"
- Step 2: Confirmation screen — "📧 Email đặt lại mật khẩu đã được gửi đến [email]"
- Nút: "Quay lại đăng nhập"
- Simulation chỉ dừng ở confirmation (không có reset form thật trong mockup)

### 3.4 Email Verification Notice
- Hiển thị toast/banner sau register nếu status = 'unverified'
- Nội dung: "📧 Vui lòng xác thực email. Kiểm tra hộp thư [email]."
- Nút: "Gửi lại mã xác thực" (simulate gửi lại) + "Bỏ qua, vào Dashboard"
- Sau verify → status chuyển 'active'

## 4. Data Model Changes

### Users (DB.users)
- Thêm field `password: string` (plain text — mockup only)
- Thêm field `last_login: string | null`
- `status` đã có: 'active' | 'locked' | 'unverified'

### Auth State
- `DB.currentUserId` khởi tạo = `null` (thay vì `'U001'`)
- `DB.verificationCodes`: object lưu code tạm `{ email: { code, expires } }` — để simulate

### Existing data migration
- 5 users hiện tại: gán password mặc định `'password123'`
- User 'unverified' (Trần Minh) giữ nguyên status để test email verification

## 5. Auth Functions

| Function | Description |
|---|---|
| `login(email, password)` | Tìm user theo email, match password, set currentUserId, update last_login. Return { success, error? }. |
| `logout()` | Clear currentUserId, clear remember-me. Redirect to page-auth. |
| `register(name, email, password)` | Validate, check email trùng, tạo user mới (id, role='user', status='active', points=welcome_points, created=now, avatar initials). Auto login. Return { success, error? }. |
| `forgotPassword(email)` | Simulate gửi email. Hiển thị confirmation. Không có reset thật. |
| `verifyEmail(code)` | Simulate — chỉ cần click "Xác thực" là thành công. Set status='active'. |
| `changePassword(oldPwd, newPwd)` | Validate old password, update. |
| `updateProfile(name)` | Update user name. |
| `isLoggedIn()` | Return `DB.currentUserId !== null`. |
| `authGuard()` | Gọi trong renderAll(). Nếu !isLoggedIn() → ẩn sidebar/topbar, chỉ show page-auth. |

## 6. UI Components

### 6.1 page-auth
- Full-screen auth page với sub-navigation (login/register/forgot/verify-email)
- Dùng JS để switch giữa các form (không qua nav())
- Shared CSS: auth-card, auth-title, auth-input, auth-btn, auth-divider, auth-link, oauth-btn

### 6.2 page-profile (thêm mới)
- Card chia 2 section: "Thông tin cá nhân" và "Đổi mật khẩu"
- Avatar display (initials, gradient background)
- Form edit: Họ tên, Email (read-only)
- Form change password: Mật khẩu cũ, Mật khẩu mới, Xác nhận
- Email verification status bar nếu status = 'unverified'

### 6.3 Sidebar changes
- Thêm "👤 Hồ sơ" mục (link đến page-profile)
- Thêm nút "🚪 Đăng xuất" ở cuối (cách biệt với 1 divider)
- Logout có confirmation toast (không cần modal)

## 7. Navigation Guard

`renderAll()` kiểm tra đầu tiên:
```js
function renderAll() {
  if (!isLoggedIn()) {
    document.getElementById('sidebar').style.display = 'none';
    document.querySelector('.top-bar').style.display = 'none';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-auth').classList.add('active');
    // Render auth sub-page (login là default)
    renderAuthPage();
    return;
  }
  // ... existing render logic ...
  document.getElementById('sidebar').style.display = '';
  document.querySelector('.top-bar').style.display = '';
}
```

`nav()` cũng check:
```js
function nav(id) {
  if (!isLoggedIn() && id !== 'auth') return;
  // ... existing nav logic ...
}
```

## 8. Mock Details

| Tính năng | Cách mock |
|---|---|
| OAuth login | Click Google/FB → toast "Đăng nhập bằng Google thành công!" → set currentUserId = user có email tương ứng (hoặc tạo user mới nếu không tồn tại) |
| Email verification | Gửi code → lưu vào DB.verificationCodes. Click "Xác thực" → check code trùng (simplified: always match) → set status='active' |
| Forgot password | Chỉ hiển thị confirmation. Không có reset form thật. |
| Remember me | Lưu email vào localStorage.getItem('remember_email'). Khi load page, nếu có → tự điền email. |
| Password | Plain text. Mặc định tất cả user cũ = 'password123'. |

## 9. Files Affected

- `video-plate-saas-mockup-v2.html`:
  - CSS: Thêm auth page styles (auth-card, auth-form, oauth-buttons, auth-links, profile section)
  - HTML: Thêm `page-auth` block (login/register/forgot/verify forms), `page-profile` block
  - HTML: Sửa sidebar — thêm logout, profile link
  - JS: Thêm auth functions (login, logout, register, forgotPassword, verifyEmail, changePassword, updateProfile, isLoggedIn, authGuard)
  - JS: Sửa `initDB()` — currentUserId = null, add password field, verificationCodes
  - JS: Sửa `renderAll()` — add authGuard
  - JS: Sửa `nav()` — add auth check
- `brainstorm-video-repair-plate-recovery-saas.md`: Cập nhật trạng thái user stories US-001 → US-007 thành ✅

## 10. Error Handling

- Login sai email/pass → toast error "Email hoặc mật khẩu không đúng"
- Register email trùng → toast error "Email đã được sử dụng"
- Register password < 6 ký tự → inline validation
- Register confirm password mismatch → inline validation
- Register ToS not checked → disable button
- Login with locked account → toast error "Tài khoản đã bị khóa"
- Change password sai old password → toast error "Mật khẩu cũ không đúng"
- Change password new ≠ confirm → inline validation
