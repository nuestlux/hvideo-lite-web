# Phase 7: Frontend — Profile & Config

**Priority:** P1 — Effort: 4h — Status: Pending

## Overview

Officer profile page (view/edit, change password) and admin config page (view/edit key-value configs).

## Related Code Files

### Create
- `frontend/src/layouts/OfficerLayout.tsx`
- `frontend/src/pages/profile/ProfilePage.tsx`
- `frontend/src/pages/admin/config/AdminConfigPage.tsx`
- `frontend/src/api/config.ts`

### Modify
- `frontend/src/routes.tsx` — Add profile + config routes
- `frontend/src/App.tsx` — Add layouts

## Implementation Steps

### 1. OfficerLayout.tsx

Similar to AdminLayout but simder Sider:
- Menu: "Hồ sơ" (`/can-bo/profile`)
- Header: officer name + logout
- Simpler design (cán bộ không cần nhiều menu)

### 2. ProfilePage.tsx

Two sections in `Card` components:

**Thông tin cá nhân:**
- Ant Design `Descriptions` or `Form`
- Fields: Name, Email, Role, Status (read-only)
- "Chỉnh sửa" button → switch to edit mode/inline editing
- Save → PUT /api/profile

**Đổi mật khẩu:**
- Separate card/divider
- Form: Mật khẩu cũ, Mật khẩu mới, Xác nhận mật khẩu
- Validation: new password min 8 chars, confirm matches
- Submit → PUT /api/profile/change-password
- Success → message.success("Đổi mật khẩu thành công")

### 3. AdminConfigPage.tsx

Ant Design `Table` with editable inline fields or modal:

**Layout:**
```
PageHeader: "Cấu hình hệ thống"
Card:
┌──────────────────────────────────────────────┐
│ Key                 | Value      | Mô tả     │
├──────────────────────┼────────────┼──────────┤
│ license_plate_img    │ 5          │ Biển ảnh │
│ license_plate_video  │ 15         │ Biển video│
│ ...                  │ ...        │ ...      │
└──────────────────────┴────────────┴──────────┘
[Lưu thay đổi]
```

**Implementation:**
- Fetch configs on mount `GET /api/admin/config`
- Display in table: key (readonly), value (editable Input), description (readonly)
- "Lưu thay đổi" button → collect changes → `PUT /api/admin/config`
- Success: Ant Design `message.success("Cập nhật cấu hình thành công")`

### 4. routes.tsx updates

```typescript
<Route path="/admin" element={<AdminLayout />}>
  <Route index redirect to="/admin/users" />
  <Route path="users" element={<AdminUsersPage />} />
  <Route path="config" element={<AdminConfigPage />} />
</Route>
<Route path="/can-bo" element={<OfficerLayout />}>
  <Route index redirect to="/can-bo/profile" />
  <Route path="profile" element={<ProfilePage />} />
</Route>
```

Add `role` check in `ProtectedRoute`:
```typescript
<ProtectedRoute requiredRole="admin">
  <AdminUsersPage />
</ProtectedRoute>
```

## Success Criteria

- [ ] Officer can view profile with correct info
- [ ] Officer can edit name/email
- [ ] Officer can change password (old password required)
- [ ] Admin can view all configs
- [ ] Admin can edit config values
- [ ] Config save shows success notification
- [ ] Routes work correctly with role-based access
- [ ] Logout works from all layouts
