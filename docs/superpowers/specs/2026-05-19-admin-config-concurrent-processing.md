# Admin Config & Concurrent Processing

## 1. Admin Config Tabs

The admin config page (`#page-admin-config`) has 4 tabs:

| Tab | ID | Content |
|-----|-----|---------|
| 📦 Gói mua | `config-tab-packages` | Package CRUD |
| 💰 Chi phí Module | `config-tab-pricing` | Module costs, welcome points, referral |
| 🎫 Khuyến mãi | `config-tab-coupons` | Coupon CRUD |
| 🧠 Xử lý đồng thời | `config-tab-concurrent` | On-premise concurrent processing config |

### Tab switching
- `switchConfigTab(tab, el)` — hides all tabs, shows selected one
- Tab array: `['packages','pricing','coupons','concurrent']`

---

## 2. Pricing Tab (Chi phí Module)

**Auto-update mode** — inputs use `onchange` to update `DB.config` directly.

**Fields:**
| Input ID | Config key | Default |
|----------|-----------|---------|
| `cfg-plate-img` | `plate_image_cost` | 5 |
| `cfg-plate-vid` | `plate_video_cost` | 15 |
| `cfg-vid-fast` | `video_fast_cost` | 10 |
| `cfg-vid-deep` | `video_deep_cost` | 20 |
| `cfg-welcome` | `welcome_points` | 50 |
| `cfg-referrer` | `referral_referrer_points` | 20 |
| `cfg-referee` | `referral_referee_points` | 10 |
| `cfg-plate-toggle` | `module_plate_active` | true |
| `cfg-video-toggle` | `module_video_active` | true |

**Init:** `renderAll()` reads `DB.config.*` and sets input values with null checks.

---

## 3. Coupons Tab (Khuyến mãi)

### CRUD Operations

| Operation | Function | Trigger |
|-----------|----------|---------|
| Create | `openCouponModal()` → `saveCoupon()` | "Tạo mã" button |
| Read | `renderCoupons()` | Tab switch |
| Update | `openCouponModal(code)` → `saveCoupon()` | ✏️ button per card |
| Delete | `deleteCoupon(code)` | 🗑️ button per card |

### Data model
```js
{
  code: string,           // uppercase, unique
  type: 'percent'|'fixed',
  value: number,
  max_uses: number,       // 0 = unlimited
  expires: string|null,   // YYYY-MM-DD
  used_count: number,
  created_at: string      // ISO
}
```

### Edit flow
- `editingCouponCode` global tracks which coupon is being edited
- `openCouponModal(code)` pre-fills modal, sets `cp-code` to readonly
- `saveCoupon()` checks `editingCouponCode`: if set → update existing object; else → push new + duplicate check
- Modal header shows `✏️ Sửa mã: {code}` vs `🎫 Tạo mã khuyến mãi`

---

## 4. Concurrent Processing (Xử lý đồng thời)

**Purpose:** On-premise config to prevent resource exhaustion.

### DEFAULT_CONFIG additions
```js
max_concurrent_users: 5,   // max user processing threads
max_ai_instances: 2,       // parallel AI model instances
task_timeout_seconds: 300,  // per-task timeout (seconds)
queue_max_size: 50,         // max queue length
queue_policy: 'FIFO'        // queue policy: FIFO|LIFO
```

### UI Fields
| Input ID | Config key | Type | Default |
|----------|-----------|------|---------|
| `cfg-max-users` | `max_concurrent_users` | number (min=1) | 5 |
| `cfg-max-ai` | `max_ai_instances` | number (min=1) | 2 |
| `cfg-task-timeout` | `task_timeout_seconds` | number (min=10) | 300 |
| `cfg-queue-size` | `queue_max_size` | number (min=0) | 50 |
| `cfg-queue-policy` | `queue_policy` | select (FIFO/LIFO) | FIFO |

**Behaviour:** Auto-update via `onchange` + audit log via `logActivity('CONFIG_CHANGED', ...)`.
**When queue is full:** new tasks are queued; if queue at capacity, rejected.

### Init
`renderAll()` reads `DB.config.*` for each concurrent field (null-safe).

---

## 5. Bug Fixes

### `updatePkgPreview()` — orphaned element fix
Line 2484 overwrote `#pp-price` innerHTML without preserving the `id="pp-price-usd"` on the contained span. Fixed by adding `id="pp-price-usd"` to the replacement string:
```js
// Before (broken):
document.getElementById('pp-price').innerHTML = vnd + 'đ <span class="usd">$' + usd + '</span>';
// After (fixed):
document.getElementById('pp-price').innerHTML = vnd + 'đ <span class="usd" id="pp-price-usd">$' + usd + '</span>';
```

This caused `Cannot set properties of null (setting 'textContent')` when opening the package modal.
