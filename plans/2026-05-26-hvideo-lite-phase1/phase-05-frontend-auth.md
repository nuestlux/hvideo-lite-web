# Phase 5: Frontend Setup & Auth Pages

**Priority:** P1 — Effort: 8h — Status: Pending

## Overview

Scaffold React + Vite + Ant Design project, implement auth flows (login, OTP, password setup, forgot/reset password), auth context, API client.

## Related Code Files

### Create
- `frontend/package.json`
- `frontend/tsconfig.json`
- `frontend/vite.config.ts`
- `frontend/index.html`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/routes.tsx`
- `frontend/src/api/client.ts`
- `frontend/src/api/auth.ts`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/layouts/AuthLayout.tsx`
- `frontend/src/components/ProtectedRoute.tsx`
- `frontend/src/pages/login/LoginPage.tsx`
- `frontend/src/pages/verify-otp/VerifyOtpPage.tsx`
- `frontend/src/pages/set-password/SetPasswordPage.tsx`
- `frontend/src/pages/forgot-password/ForgotPasswordPage.tsx`
- `frontend/src/pages/reset-password/ResetPasswordPage.tsx`
- `frontend/src/styles/global.css`
- `frontend/src/i18n/vi.ts`

## Implementation Steps

### 1. Scaffold

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install antd @ant-design/icons react-router-dom axios dayjs
```

### 2. vite.config.ts

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
```

### 3. api/client.ts

Axios instance:
- `baseURL: "/api"`
- Request interceptor: attach Bearer token from localStorage
- Response interceptor: if 401 → clear token, redirect to /login
- Error handling: extract `detail.message` and show Ant Design `message.error()`

### 4. api/auth.ts

```typescript
export const authApi = {
  login(data: {email, password}) → Promise<LoginResponse>
  verifyOtp(data: {email, otp}) → Promise<{setup_token}>
  setPassword(data: {setup_token, password}) → Promise<LoginResponse>
  forgotPassword(data: {email}) → Promise<{message}>
  resetPassword(data: {token, new_password}) → Promise<{message}>
  logout() → Promise<void>
}
```

### 5. contexts/AuthContext.tsx

```typescript
interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
}
```
- Store token + user in localStorage
- Track inactivity: 30 min → auto logout
- On mount: check localStorage for existing session, validate with user info

### 6. AuthLayout.tsx

Clean centered layout:
```
┌─────────────────┐
│  [Logo]          │
│  Hvideo Lite     │
│                  │
│  ┌───────────┐  │
│  │  {Cards}   │  │
│  └───────────┘  │
│                  │
│  Footer text     │
└─────────────────┘
```
- Ant Design `Card` centered with `flex` + `justify-content: center`
- No sidebar, no header navigation

### 7. LoginPage.tsx

Ant Design `Form`:
- Email input (validation: required, email format)
- Password input (validation: required)
- Submit button "Đăng nhập"
- "Quên mật khẩu?" link → /forgot-password
- On success: redirect based on role (`/admin/users` or `/can-bo/profile`)

Error: show `message.error("Email hoặc mật khẩu không đúng")`

### 8. VerifyOtpPage.tsx

- Title: "Xác nhận OTP"
- Subtitle: "Mã OTP đã được gửi đến email của bạn"
- Ant Design `Input.OTP` (6 digits, 6 separate input boxes)
- Email display (readonly, passed via state)
- "Xác nhận" button
- "Liên hệ admin nếu không nhận được mã" text
- On success: redirect to /set-password with setup_token

### 9. SetPasswordPage.tsx

- Title: "Đặt mật khẩu"
- New password input (min 8 chars, validation)
- Confirm password input
- Requirements hint text
- On success: auto-login, redirect based on role

### 10. ForgotPasswordPage.tsx

- Email input
- Submit → "Nếu email tồn tại, link reset đã được gửi"
- Back to login link

### 11. ResetPasswordPage.tsx

- Read token from URL query param
- New password + confirm inputs
- Submit → success → redirect /login

## Success Criteria

- [ ] `npm run dev` starts, proxy works
- [ ] Login page renders with Ant Design theme
- [ ] Login error shows Vietnamese message
- [ ] OTP page shows 6-digit input fields
- [ ] OTP success → redirect to set-password
- [ ] Set password success → auto-login
- [ ] AuthContext persists session across refresh
- [ ] 30min inactivity → auto logout
- [ ] Protected routes redirect to /login if not authenticated
