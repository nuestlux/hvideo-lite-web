# Phase 2: HTML — Auth Page, Profile Page, Sidebar

## Overview

Add:
- `page-auth` block: login form, register form, forgot password form, email verification notice
- `page-profile` block: profile edit + change password
- Sidebar: add "Hồ sơ" link, "Đăng xuất" button

## Dependencies

- Phase 1 (CSS) must be complete — HTML classes reference CSS styles
- Phase 4 (JS integration) will reference element IDs defined here

## HTML Structure

### 1. page-auth

Insert **before** first `<div class="page" id="page-dashboard">` or as the first page div.

```html
<div class="page" id="page-auth">
  <div class="auth-page">
    <div class="auth-card">
      <!-- Logo -->
      <div class="auth-logo">
        <div class="logo-icon">🔧</div>
        <div class="logo-text">VisionFix</div>
        <div class="logo-sub">AI Platform for Video & License Plate</div>
      </div>

      <!-- === LOGIN FORM === -->
      <div id="auth-login">
        <div class="auth-title">Đăng nhập</div>
        <div class="auth-subtitle">Đăng nhập để tiếp tục sử dụng dịch vụ</div>
        <div id="auth-login-error" class="auth-error"></div>

        <div class="auth-field">
          <label>Email</label>
          <input type="email" class="auth-input" id="login-email" placeholder="your@email.com" autocomplete="email">
        </div>
        <div class="auth-field">
          <label>Mật khẩu</label>
          <div class="auth-input-wrap">
            <input type="password" class="auth-input" id="login-password" placeholder="••••••••" autocomplete="current-password">
            <button class="toggle-pwd" onclick="togglePwd('login-password',this)">👁️</button>
          </div>
        </div>
        <div class="auth-options">
          <label><input type="checkbox" id="login-remember"> Ghi nhớ đăng nhập</label>
          <a onclick="showAuthForm('forgot')">Quên mật khẩu?</a>
        </div>
        <button class="auth-btn primary" id="login-btn" onclick="handleLogin()">ĐĂNG NHẬP</button>

        <div class="auth-divider">hoặc</div>
        <div class="oauth-row">
          <button class="oauth-btn" onclick="handleOAuth('google')"><span class="oauth-icon">🔴</span> Google</button>
          <button class="oauth-btn" onclick="handleOAuth('facebook')"><span class="oauth-icon">🔵</span> Facebook</button>
        </div>

        <div class="auth-links">
          Chưa có tài khoản? <a onclick="showAuthForm('register')">Đăng ký</a>
        </div>
      </div>

      <!-- === REGISTER FORM === -->
      <div id="auth-register" style="display:none">
        <div class="auth-title">Tạo tài khoản</div>
        <div class="auth-subtitle">🎉 Đăng ký thành công được tặng ngay 50 Point!</div>
        <div id="auth-register-error" class="auth-error"></div>

        <div class="auth-field">
          <label>Họ tên</label>
          <input type="text" class="auth-input" id="reg-name" placeholder="Nguyễn Văn A">
        </div>
        <div class="auth-field">
          <label>Email</label>
          <input type="email" class="auth-input" id="reg-email" placeholder="your@email.com">
        </div>
        <div class="auth-field">
          <label>Mật khẩu</label>
          <div class="auth-input-wrap">
            <input type="password" class="auth-input" id="reg-password" placeholder="Tối thiểu 6 ký tự">
            <button class="toggle-pwd" onclick="togglePwd('reg-password',this)">👁️</button>
          </div>
        </div>
        <div class="auth-field">
          <label>Xác nhận mật khẩu</label>
          <div class="auth-input-wrap">
            <input type="password" class="auth-input" id="reg-confirm" placeholder="Nhập lại mật khẩu">
            <button class="toggle-pwd" onclick="togglePwd('reg-confirm',this)">👁️</button>
          </div>
        </div>
        <div class="auth-options">
          <label><input type="checkbox" id="reg-tos"> Tôi đồng ý với <a onclick="toast('info','📄 Điều khoản dịch vụ (mockup)')">Điều khoản dịch vụ</a></label>
        </div>
        <button class="auth-btn primary" id="register-btn" onclick="handleRegister()">TẠO TÀI KHOẢN</button>

        <div class="auth-divider">hoặc</div>
        <div class="oauth-row">
          <button class="oauth-btn" onclick="handleOAuth('google')"><span class="oauth-icon">🔴</span> Google</button>
          <button class="oauth-btn" onclick="handleOAuth('facebook')"><span class="oauth-icon">🔵</span> Facebook</button>
        </div>

        <div class="auth-links">
          Đã có tài khoản? <a onclick="showAuthForm('login')">Đăng nhập</a>
        </div>
      </div>

      <!-- === FORGOT PASSWORD === -->
      <div id="auth-forgot" style="display:none">
        <div id="auth-forgot-step1">
          <div class="auth-title">Quên mật khẩu</div>
          <div class="auth-subtitle">Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu</div>
          <div class="auth-field">
            <label>Email</label>
            <input type="email" class="auth-input" id="forgot-email" placeholder="your@email.com">
          </div>
          <button class="auth-btn primary" onclick="handleForgotPassword()">GỬI YÊU CẦU</button>
        </div>
        <div id="auth-forgot-step2" style="display:none">
          <div class="auth-success-msg">📧 Email đặt lại mật khẩu đã được gửi đến <span id="forgot-email-sent"></span>. Vui lòng kiểm tra hộp thư.</div>
          <button class="auth-btn primary" onclick="showAuthForm('login')">QUAY LẠI ĐĂNG NHẬP</button>
        </div>
        <div class="auth-links" style="margin-top:16px">
          <a onclick="showAuthForm('login')">← Quay lại đăng nhập</a>
        </div>
      </div>

      <!-- === EMAIL VERIFICATION === -->
      <div id="auth-verify" style="display:none">
        <div class="auth-title">Xác thực email</div>
        <div class="auth-verify-banner">📧 Vui lòng xác thực email. Chúng tôi đã gửi mã xác thực đến <strong id="verify-email-display"></strong>.</div>
        <div class="auth-field">
          <label>Mã xác thực</label>
          <input type="text" class="auth-input" id="verify-code" placeholder="Nhập mã xác thực" maxlength="6" style="text-align:center;font-size:20px;letter-spacing:8px;font-family:monospace">
        </div>
        <button class="auth-btn primary" onclick="handleVerifyEmail()">XÁC THỰC</button>
        <div style="text-align:center;margin-top:12px">
          <a onclick="resendVerifyCode()">Gửi lại mã xác thực</a>
        </div>
        <div class="auth-links">
          <a onclick="skipVerifyAndGo()">Bỏ qua, vào Dashboard</a>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 2. page-profile

Insert between `page-db-viewer` and closing `<!-- end pages -->`. Or next to other page divs.

```html
<div class="page" id="page-profile">
  <div class="page-header">
    <div><div class="page-title">👤 Hồ sơ tài khoản</div><div class="page-subtitle">Quản lý thông tin cá nhân và bảo mật</div></div>
  </div>
  <div class="card">
    <!-- Email Verification Banner (hidden by default) -->
    <div id="profile-verify-banner" style="display:none">
      <div class="auth-verify-banner">⚠️ Email chưa được xác thực. <a onclick="showAuthForm('verify')" style="color:var(--primary);cursor:pointer;font-weight:500">Xác thực ngay</a></div>
    </div>

    <div class="profile-layout">
      <div>
        <div class="profile-avatar" id="profile-avatar" style="background:linear-gradient(135deg,#1668dc,#854eca)">NT</div>
      </div>
      <div class="profile-fields">
        <div class="profile-section">
          <div class="profile-section-title">Thông tin cá nhân</div>
          <div class="profile-field">
            <label>Họ tên</label>
            <input type="text" class="auth-input" id="profile-name">
          </div>
          <div class="profile-field">
            <label>Email</label>
            <input type="email" class="auth-input" id="profile-email" readonly style="opacity:.6">
          </div>
          <div class="profile-field">
            <label>Vai trò</label>
            <input type="text" class="auth-input" id="profile-role" readonly style="opacity:.6">
          </div>
          <div class="profile-field">
            <label>Ngày tham gia</label>
            <input type="text" class="auth-input" id="profile-created" readonly style="opacity:.6">
          </div>
          <button class="btn btn-primary" onclick="handleUpdateProfile()">💾 Lưu thay đổi</button>
        </div>

        <div class="profile-section">
          <div class="profile-section-title">🔑 Đổi mật khẩu</div>
          <div class="profile-field">
            <label>Mật khẩu cũ</label>
            <div class="auth-input-wrap">
              <input type="password" class="auth-input" id="chg-old-pwd" placeholder="••••••••">
              <button class="toggle-pwd" onclick="togglePwd('chg-old-pwd',this)">👁️</button>
            </div>
          </div>
          <div class="profile-field">
            <label>Mật khẩu mới</label>
            <div class="auth-input-wrap">
              <input type="password" class="auth-input" id="chg-new-pwd" placeholder="Tối thiểu 6 ký tự">
              <button class="toggle-pwd" onclick="togglePwd('chg-new-pwd',this)">👁️</button>
            </div>
          </div>
          <div class="profile-field">
            <label>Xác nhận mật khẩu mới</label>
            <div class="auth-input-wrap">
              <input type="password" class="auth-input" id="chg-confirm-pwd" placeholder="Nhập lại mật khẩu mới">
              <button class="toggle-pwd" onclick="togglePwd('chg-confirm-pwd',this)">👁️</button>
            </div>
          </div>
          <button class="btn btn-default" onclick="handleChangePassword()">🔑 Đổi mật khẩu</button>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 3. Sidebar Update

Find existing sidebar items list. Add:
- **After** the existing nav items (before "Mock Database"): `<div class="sidebar-item" onclick="nav('profile',this)">👤 Hồ sơ</div>`
- **After** "Mock Database" or at the end: a logout divider + button

```html
<div class="sidebar-logout">
  <div class="sidebar-item" onclick="handleLogout()" style="color:var(--danger)">
    🚪 Đăng xuất
  </div>
</div>
```

Also wrap the existing nav items in a flex column container so logout stays at bottom.

## Implementation Steps

1. Open `video-plate-saas-mockup-v2.html`
2. Find `<!-- pages -->` comment or first `id="page-dashboard"` div
3. Insert `page-auth` block as first page div (before dashboard)
4. Find the pages section end (`<!-- end pages -->` or last page)
5. Insert `page-profile` block
6. Find sidebar `<div class="sidebar-items">` or equivalent
7. Insert "Hồ sơ" link in sidebar item list
8. Insert sidebar logout at bottom

## Todo

- [ ] Add page-auth HTML (login form)
- [ ] Add page-auth HTML (register form)
- [ ] Add page-auth HTML (forgot password form)
- [ ] Add page-auth HTML (email verification)
- [ ] Add page-profile HTML
- [ ] Add sidebar link for profile
- [ ] Add sidebar logout button

## Success Criteria

- Auth page renders centered with all forms
- Login/register/forgot/verify toggle correctly (show/hide)
- Profile page shows editable fields
- Sidebar has profile link and logout button
