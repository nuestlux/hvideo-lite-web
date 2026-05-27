# Phase 6: Frontend — Admin Users

**Priority:** P1 — Effort: 5h — Status: Pending

## Overview

Admin user management page with table, search/filter, create modal, lock/unlock, resend OTP.

## Related Code Files

### Create
- `frontend/src/layouts/AdminLayout.tsx`
- `frontend/src/pages/admin/users/AdminUsersPage.tsx`
- `frontend/src/pages/admin/users/components/UserTable.tsx`
- `frontend/src/pages/admin/users/components/CreateUserModal.tsx`
- `frontend/src/api/users.ts`

### Modify
- `frontend/src/routes.tsx` — Add admin routes + ProtectedRoute for admin
- `frontend/src/App.tsx` — Add layouts

## Implementation Steps

### 1. AdminLayout.tsx

Ant Design `Layout` with Sider:
```
┌─────────────────────────────────────────────┐
│ [Logo] Hvideo Lite        [Avatar] Tên admin│ Header
├──────────┬──────────────────────────────────┤
│ Users    │  <Outlet />                      │
│ Config   │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```
- Sider menu: Users (`/admin/users`), Cấu hình (`/admin/config`)
- Header: admin name + logout button
- Ant Design `Breadcrumb` optional

### 2. api/users.ts

```typescript
export const usersApi = {
  list(params: {search?, status?, role?, page?, limit?}) → Promise<PaginatedResult>
  get(id: number) → Promise<User>
  create(data: UserCreate) → Promise<User>
  update(id: number, data: UserUpdate) → Promise<User>
  toggleLock(id: number) → Promise<User>
  resendOtp(id: number) → Promise<{message}>
  resetOtp(id: number) → Promise<{message}>
}
```

### 3. AdminUsersPage.tsx

```typescript
function AdminUsersPage() {
  // State: users[], total, page, limit, search, status filter
  // Fetch on mount and on filter change
  // Render page header + UserTable + CreateUserModal

  return (
    <>
      <PageHeader title="Quản lý tài khoản" extra={<Button>+ Tạo tài khoản</Button>} />
      <Card>
        <UserTable
          dataSource={users}
          loading={loading}
          pagination={{total, page, limit}}
          onSearch={setSearch}
          onStatusFilter={setStatusFilter}
          onLock={handleLock}
          onResendOtp={handleResendOtp}
        />
      </Card>
      <CreateUserModal open={modalOpen} onClose={closeModal} onSubmit={handleCreate} />
    </>
  )
}
```

### 4. UserTable.tsx

Ant Design `Table` with:

**Columns:**
| Tên | Email | Vai trò | Point | Trạng thái | Hành động |
|---|---|---|---|---|---|
| filterable→ | ←search | filter: Admin/Cán bộ | | filter: Hoạt động/Khóa/Chờ XN | |

**Status badges:**
- "hoat_dong": green "Hoạt động"
- "da_khoa": red "Đã khóa"
- "cho_xac_nhan": orange "Chờ xác nhận"

**Action buttons per row:**
- "Sửa" → modal/edit
- "Khóa/Mở" → toggleLock
- "Gửi OTP" → resendOtp (only for "cho_xac_nhan")
- "Point" → disabled (Phase 2)

**Search bar:** Ant Design `Input.Search` with debounce

### 5. CreateUserModal.tsx

Ant Design `Modal` with `Form`:
- Name (required)
- Email (required, email format)
- Role (radio: Admin / Cán bộ)
- Submit → POST /api/admin/users → success notification

## Success Criteria

- [ ] Admin sidebar with Users menu
- [ ] Users table renders with all columns
- [ ] Search by name/email works (debounced)
- [ ] Filter by status works
- [ ] Create user modal validates and submits
- [ ] Lock/unlock row action works
- [ ] Resend OTP action works (only for unconfirmed)
- [ ] Pagination works
- [ ] Role-based route protection: non-admin redirected
