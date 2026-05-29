# User Activity Log — Design Spec

## Goals

1. Remove "Developer" section (Mock Database) from sidebar + page
2. Expand "Hoạt động đăng nhập" → "Nhật ký người dùng" tracking all user operations
3. Provide both table view (with filter) and timeline view

## Data Model — `DB.audit_log`

Each entry:

```js
{
  id: 'AUD-001',
  user_id: 'USER-001',
  action: 'PLATE_REPAIR',     // action type
  detail: 'Biển 51F-123.45 → Xe con | Conf: 92% | Cost: -5 PT',
  status: 'success',          // 'success' | 'failed' | 'info'
  method: null,               // 'email' | 'oauth' | null
  provider: null,             // 'google' | null
  ip: '192.168.1.42',
  user_agent: 'Chrome 125',
  time: '2026-05-19 14:30:00'
}
```

Legacy entries (from old `addAuditLog`) lack `action`/`detail` — treated as `action='LOGIN'` on render.

### Action types

| Group | Actions |
|-------|---------|
| Auth | `LOGIN`, `LOGOUT`, `REGISTER`, `FORGOT_PASSWORD`, `CHANGE_PASSWORD`, `VERIFY_EMAIL` |
| OAuth | `OAUTH_LOGIN`, `OAUTH_LINK`, `OAUTH_UNLINK`, `OAUTH_AUTO_REGISTER` |
| Service | `PLATE_REPAIR`, `VIDEO_REPAIR`, `VIDEO_DOWNLOAD`, `VIDEO_RESET` |
| Payment | `PKG_SELECT`, `PAYMENT_PROCESS`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`, `TOPUP` |
| Admin | `USER_LOCK`, `USER_UNLOCK`, `USER_EDIT`, `ADJUST_POINTS` |
| Misc | `DB_INIT` |

### Action → icon mapping

- `LOGIN`/`LOGOUT`/`REGISTER` → 🔑
- `OAUTH_*` → 🔗
- `CHANGE_PASSWORD`/`FORGOT_PASSWORD` → 🔒
- `VERIFY_EMAIL` → ✉️
- `PLATE_REPAIR` → 🚗
- `VIDEO_*` → 🎬
- `TOPUP`/`PAYMENT_*`/`PKG_*` → 💳
- `USER_*`/`ADJUST_*` → 👥
- `DB_INIT` → 🗄️

## Unified Logging Function

Replace `dbLog()` and `addAuditLog()` with a single `logActivity(action, detail, status, method, provider)`.

```js
function logActivity(action, detail, status = 'success', method = null, provider = null) {
  const user = currentUser();
  const ips = ['192.168.1.42','10.0.0.1','10.0.0.15','192.168.1.100','172.16.0.50'];
  const agents = ['Chrome 125','Firefox 127','Safari 18','Edge 126','Opera 112'];
  DB.audit_log.unshift({
    id: 'AUD-' + String(DB.audit_log.length + 1).padStart(3,'0'),
    user_id: user ? user.id : '?',
    action, detail, status, method, provider,
    ip: ips[Math.floor(Math.random()*ips.length)],
    user_agent: agents[Math.floor(Math.random()*agents.length)],
    time: new Date().toISOString().slice(0,19).replace('T',' ')
  });
}
```

### Migration

- Delete `dbLog()` function + all calls → `logActivity()`
- Delete `addAuditLog()` function + all calls → `logActivity('LOGIN', ..., status, method, provider)`
- Delete `DB.log` array + `renderDBViewer()` + `DB_LOG` viewer in db-viewer

## UI — Sidebar

Replace:

```
Developer ─── Mock Database    ❌ remove entirely
Cá nhân ─── Hoạt động đăng nhập → 📋 Nhật ký người dùng
```

## UI — Page `#page-audit-log`

### Header

- Title: "📋 Nhật ký người dùng"
- Subtitle: "Lịch sử thao tác trên hệ thống"
- Filter dropdown: `Tất cả` | `Đăng nhập` | `Dịch vụ` | `Thanh toán` | `Quản trị`
- Clear history button (existing)
- View toggle buttons: **Dạng bảng** | **Dòng thời gian**

### Table View

Columns:

| Thời gian | Hành động | Chi tiết | Trạng thái | IP | Trình duyệt |

- "Hành động": icon + action label (e.g. 🔑 Đăng nhập, 🚗 Sửa biển số)
- "Chi tiết": truncated detail text
- "Trạng thái": tag badge
- Filter: shows only rows matching selected action group
- Empty state: "Chưa có hoạt động nào"

### Timeline View

- Grouped by date header ("Hôm nay", "Hôm qua", "DD/MM/YYYY")
- Each entry as a card: `[icon] action · detail · time · status badge`
- Compact layout, click card to expand: shows IP + user_agent
- Same filter applies
- Empty state: "Chưa có hoạt động nào"

## UI — Removed

- Developer section in sidebar (x2 lines)
- Entire `<div id="page-db-viewer">` block
- `renderDBViewer()` from `renderAll()`
- `'db-viewer'` from `pageNames` + `pageNameMap`
- `DB.log` init + usage
