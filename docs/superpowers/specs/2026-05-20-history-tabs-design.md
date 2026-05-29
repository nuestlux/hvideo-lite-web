# Design: Transaction History Tabs

**Date:** 2026-05-20
**Project:** VisionFix v2
**File:** `2026-05-20-history-tabs-design.md`

## Problem

`#page-history` shows all transactions in a single flat table. No way to distinguish between money-in (topups/refunds) and money-out (usage). As transaction volume grows, finding specific records becomes difficult.

## Design

Add 2 main tabs to filter by transaction direction, plus a sub-filter for the usage tab.

### Structure

```html
<div class="page" id="page-history">
  <div class="page-header">📋 Lịch Sử Giao Dịch</div>

  <!-- Summary bar -->
  <div id="history-summary">...</div>

  <!-- Main tabs -->
  <div class="storage-chips" id="history-tabs">
    <span class="chip active" data-tab="topup" onclick="switchHistoryTab('topup',this)">
      💳 Nạp Point
    </span>
    <span class="chip" data-tab="use" onclick="switchHistoryTab('use',this)">
      🔧 Sử dụng Point
    </span>
  </div>

  <!-- Sub-filter (only visible on 'use' tab) -->
  <div class="storage-chips" id="history-subfilter" style="display:none">
    <span class="chip active" data-filter="all" onclick="filterHistoryModule('all',this)">📋 Tất cả</span>
    <span class="chip" data-filter="plate" onclick="filterHistoryModule('plate',this)">🚗 Biển số</span>
    <span class="chip" data-filter="video" onclick="filterHistoryModule('video',this)">🎬 Video</span>
  </div>

  <div class="table-wrapper"><table>...</table></div>
</div>
```

### Tabs

| Tab | Filter | Columns | Summary |
|-----|--------|---------|---------|
| **💳 Nạp Point** | `type === 'topup' \|\| type === 'refund'` | Mã GD, TG, Loại, Mô tả, Point, Cổng, Số dư, TT | Tổng nạp, tổng tiền VNĐ |
| **🔧 Sử dụng Point** | `type === 'use'` | Mã GD, TG, Module, Mô tả, Point, Số dư, TT | Tổng điểm đã dùng, tổng lượt |

### Sub-filter (tab Sử dụng)

- **📋 Tất cả** — no filter
- **🚗 Biển số** — `desc.includes('Biển') || desc.includes('plate') || desc.includes('51')`
- **🎬 Video** — `desc.includes('Video') || desc.includes('video') || desc.includes('mp4')`

### Summary Bar

Positioned between page-header and tabs, showing totals for the active tab:

**Tab Nạp:**
```
💎 Tổng nạp: +12,000 PT (~7,997,000đ) • 15 giao dịch
```

**Tab Sử dụng:**
```
🔧 Đã dùng: -9,550 PT • 347 lượt (286 biển số • 61 video)
```

### Changes

| Location | Change |
|----------|--------|
| `index.html` ~line 1424 | Replace flat table with tabs + summary + sub-filter HTML |
| `renderHistoryTable()` | Refactor to `switchHistoryTab(tab, el)` and `filterHistoryModule(filter, el)` |
| New function | `renderHistoryTopupTable()` — renders topup columns |
| New function | `renderHistoryUsageTable()` — renders usage columns with module filter |
| CSS | Reuse existing `.storage-chips` `.chip` styles (lines 593-596) |

### JS Logic

```js
function switchHistoryTab(tab, el) {
  // Update active chip
  // Show/hide sub-filter (only for 'use' tab)
  // Update summary bar
  // Render appropriate table
}

function filterHistoryModule(filter, el) {
  // Update active sub-chip
  // Re-render usage table with filter
}
```

### Reuse

Tab/chip styles use the same `.storage-chips` `.chip` `.chip.active` classes already defined for the storage page (lines 593-596). No new CSS needed.
