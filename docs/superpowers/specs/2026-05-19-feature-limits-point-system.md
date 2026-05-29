# Feature Flags & Limits & Point System

## Architecture (3-layer enforcement order)

```
Layer 1: FEATURE_FLAGS (role-based)
  ↓ pass
Layer 2: QUOTA by tier (daily usage counter)
  ↓ pass
Layer 3: POINT BALANCE check
  ↓ pass
  → Execute → recordUsage() → deduct points
```

---

## Layer 1: Feature Flags by Role

**File:** `video-plate-saas-mockup-v2.html`

**Constant:** `FEATURE_FLAGS` (global, below TIER_LIMITS)

| Role | Accessible Pages |
|---|---|
| `admin` | dashboard, plate, video, topup, history, admin-users, admin-config, admin-revenue, profile, audit-log |
| `user` | dashboard, plate, video, topup, history, profile, audit-log |

**Enforcement:**
- `nav()` calls `canAccess(u.role, id)` — blocks forbidden pages with toast
- `renderAll()` hides `#sidebar-admin-section` for non-admin users

---

## Layer 2: Quota by Tier

**Constant:** `TIER_LIMITS` (global)

| Tier | plate_img | plate_vid | video_fast | video_deep | Label |
|---|---|---|---|---|---|
| admin | 999 | 999 | 999 | 999 | Admin |
| enterprise | 200 | 100 | 50 | 30 | Enterprise |
| pro | 50 | 30 | 20 | 10 | Pro |
| basic | 10 | 5 | 5 | 3 | Basic |
| demo | 5 | 2 | 2 | 1 | Demo |

**Storage:** `DB.dailyUsage[userId][YYYY-MM-DD] = { plate_img, plate_vid, video_fast, video_deep }`

**Functions:**
- `getUserTodayUsage(userId, module)` — init + return today's usage object
- `recordUsage(userId, module, sub)` — increment counter
- `checkLimit(user, module, sub)` — compare current usage vs tier limit, return `{ ok, msg }`

**Reset:** Automatic (keyed by date string)

---

## Layer 3: Point Balance

**Cost config (from `DB.config`):**

| Item | Cost |
|---|---|
| plate_image_cost | 5 PT |
| plate_video_cost | 15 PT |
| video_fast_cost | 10 PT |
| video_deep_cost | 20 PT |

**Volume discount (via `getEffectiveCost()`):**

| Daily usage | Discount |
|---|---|
| ≥ 50 uses | 30% |
| ≥ 20 uses | 15% |
| ≥ 10 uses | 5% |

**Enforcement order (in processing functions):**
1. `user.status === 'locked'?` → block
2. `checkLimit()` → block if quota exceeded
3. `user.points < cost?` → block
4. `user.points < cost * 3?` → warning toast (non-blocking)
5. Execute → `recordUsage()` → `addTransaction('use')`

**Safety:**
- `addTransaction()` floors negative balance: `if (user.points + points < 0) points = -user.points`
- Plate OCR < 50% → refund via `addTransaction('refund')`
- Video repair failure → no deduction, no usage recorded

---

## Error Handling

| Scenario | Handling |
|---|---|
| Locked user tries to process | Toast "Tài khoản đã bị khóa" + return |
| File exceeds max_upload | Toast with size limit |
| Unsupported file type | Toast + return |
| Network error (debug mode) | 15% random in plate step → retry toast |
| Unexpected JS error | try-catch → toast + logActivity('failed') |
| Debug mode toggle | Sidebar button → `debugMode` flag |

---

## UI Indicators

| Element | What it shows |
|---|---|
| Dashboard remaining card | `🚗 {remaining} • 🎬 {remaining}` + discount badge |
| Dashboard limit banner | "Gói {tier}: {plate_limit} biển số/ngày • {video_limit} video/ngày" |
| Sidebar | Points, tier-based daily label |
| Profile section | Tier name (colored tag), plate/video limits |
| Admin users table | Limits per sub-module (img|vid / fast|deep) |

---

## Testing Scenarios

### Feature flags
- [ ] Login as admin (tuan.nguyen@company.vn) → see all 10 sidebar items
- [ ] Login as demo (demo@visionfix.vn) → no admin section in sidebar
- [ ] Direct URL nav to admin-users as demo → toast "Không có quyền"

### Quota
- [ ] Demo user: use plate 5 times → 6th attempt blocked
- [ ] Demo user: use video 2 times → 3rd attempt blocked
- [ ] Pro user: use plate 50 times → 51st attempt blocked
- [ ] Admin: unlimited (999)

### Points
- [ ] Process with insufficient points → blocked
- [ ] Process with low points (< 3× cost) → warning, still proceeds
- [ ] Negative balance guard → balance never goes below 0

### Discount
- [ ] After 10 daily uses → cost drops 5%
- [ ] After 20 daily uses → cost drops 15%
- [ ] Dashboard shows `🏷️` tag when discount active

### Error handling
- [ ] Login as locked user (Phạm Trung) → processing blocked
- [ ] Toggle debug mode → 15% error in plate processing
- [ ] Upload oversized file → blocked
