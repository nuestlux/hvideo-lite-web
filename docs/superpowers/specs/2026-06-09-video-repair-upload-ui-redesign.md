# Video Repair — Upload Step UI Redesign (Step 0)

**Date:** 2026-06-09
**Project:** VisionFix SaaS
**Module:** Video Repair Wizard (focused on Step 0 — Upload)
**Status:** Design approved by user (2026-06-09)
**Related:** Original wizard spec at `2026-05-19-video-repair-wizard-design.md`

## 1. Problem Statement

The current upload UI in `VideoRepairPage.tsx` (Step 0) hides the reference file behind a toggle button that only appears after the main video is uploaded. This contradicts user expectations:

- Reference is optional but valuable ("khuyến nghị").
- Users want to see the reference option from the very beginning.
- After uploading the main file, the main dropzone remains large and dominant, while the reference area stays subtle or hidden.

Real-world video repair tools (Wondershare Repairit, Stellar Video Repair, EaseUS, HitPaw, etc.) typically:
- Show both main and reference areas visibly during the initial upload phase.
- After main file selection, shrink the main file into a compact preview/row.
- Promote the reference area visually so it becomes the natural next focus (optional but encouraged).

## 2. Goals

- Make the optional reference dropzone visible from the empty state.
- After main video upload: strongly shrink the main area into a compact preview row.
- Make the reference area noticeably more prominent (larger size, stronger visual weight).
- Follow patterns from established professional video repair software.
- Maintain premium modern styling consistent with the rest of the app.
- Keep reference strictly optional — the "Phân tích & Chẩn đoán lỗi" flow must work without it.

## 3. Approved Design (Approach 1 — Vertical Stack)

User explicitly approved the complete design on 2026-06-09.

### 3.1 Empty State (no files uploaded)

- Large primary dropzone for the corrupted video at the top.
- Reference dropzone immediately below it, always visible, labeled clearly as optional/recommended.
- Both support drag-and-drop + click-to-select.
- Same formats and size limit as before (MP4, MOV, AVI, MKV, max 500MB).

**Text layout representation:**

```
┌──────────────────────────────────────────────────────────────┐
│                    📤 Kéo thả video hỏng vào đây             │
│              Hoặc click để chọn file từ máy tính             │
│                                                              │
│     MP4   MOV   AVI   MKV                                    │
│     Tối đa 500MB • Hỗ trợ hầu hết định dạng video thông dụng │
│                                                              │
│                  (large, dashed border, subtle gradient)     │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  File tham chiếu (khuyến nghị)                               │
│  Video quay cùng thiết bị → AI sẽ khôi phục chính xác hơn    │
│                                                              │
│     ┌──────────────────────────────────────────────────┐     │
│     │   📁 Kéo thả hoặc click để tải file mẫu          │     │
│     └──────────────────────────────────────────────────┘     │
│  (smaller than main but clearly visible and usable)          │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Post-Upload State (after main video is selected)

Vertical stack:

1. **Compact main preview row** (top, strongly shrunk)
   - Height: ~90px
   - Content (left to right):
     - Video icon (🎬 or VideoCameraOutlined)
     - Filename (truncated with ellipsis if needed)
     - Size (e.g. "248.3 MB")
     - Tag: "Video cần khôi phục"
     - "Thay đổi" button (right side)
     - Small ✕ icon in the top-right corner of the row
   - Subtle card style with light border and soft shadow
   - Hover: slight lift + border accent

2. **Reference area** (immediately below, now the dominant visual element)
   - Height: ~180–200px (noticeably larger — approximately 2x the main preview height)
   - Stronger header "File tham chiếu (khuyến nghị)"
   - Helpful subtext
   - Large dashed dropzone (easy target for drag & drop)
   - When a reference file is present: replace dropzone content with success row (check icon + filename + "Gỡ bỏ" button)

3. **Primary action button**
   - "Phân tích & Chẩn đoán lỗi" (large, primary style)
   - Placed below the two areas
   - Enabled as soon as main file exists (reference remains optional)

**Text layout representation (post-upload):**

```
┌──────────────────────────────────────────────────────────────┐
│  🎬  ten_video_rat_dai_co_the_bi_truncate.mp4   248.3 MB     │
│      Video cần khôi phục               [Thay đổi]   ✕       │
│  (compact horizontal row, ~90px tall)                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  File tham chiếu (khuyến nghị)                               │
│  Video quay cùng thiết bị → AI sẽ khôi phục chính xác hơn    │
│                                                              │
│     ┌──────────────────────────────────────────────────┐     │
│     │                                                  │     │
│     │         📁 Kéo thả hoặc click để tải file mẫu    │     │
│     │         (large, prominent drop target)           │     │
│     │                                                  │     │
│     └──────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘

[   Phân tích & Chẩn đoán lỗi   ]
```

### 3.3 Reference Area States

- **Empty (no reference):** Large dashed dropzone with icon + "Kéo thả hoặc click để tải file mẫu"
- **Filled:** Compact success row inside the same large container:
  - Green check icon
  - Filename
  - Small "Gỡ bỏ" danger button
- User can add or remove reference at any time while still in the upload step.

### 3.4 Interactions & Behaviors

- Main and reference are independent (except removing main clears the whole upload area for simplicity).
- Removing main (✕): resets to empty state (both main and any reference cleared).
- Reference can be added before or after main file.
- "Phân tích & Chẩn đoán lỗi" only requires main file.
- Drag-over states: clear visual feedback on both dropzones.
- Upload feedback: subtle loading state per zone (reuse existing patterns).
- All existing validation rules remain (format, size, error toasts).

### 3.5 Sizing & Proportions (Approved)

- Main compact row: ~90px high
- Reference container: ~180–200px high (clearly larger, ~2x)
- Gap between main row and reference: 16–20px
- Reference dropzone inside its container should feel spacious and inviting.
- On mobile: vertical stack preserved; reference area remains relatively large for touch targets.

### 3.6 Visual Style & Consistency

- Reuse existing premium styling from current `VideoRepairPage.tsx`:
  - White cards with soft shadows (`0 10px 40px rgba(0,0,0,0.05)`)
  - Rounded corners (16–24px)
  - Blue accent for primary actions and drag highlights
  - Clean typography with strong labels
- Main empty dropzone: keep the current attractive gradient + large icon treatment.
- Reference dropzone: slightly more subtle dashed border than main, but becomes more prominent after main is selected (larger size + stronger header).
- Compact main row: minimal, clean, scannable (icon + text + actions).
- Hover and drag states follow patterns from professional repair tools (subtle lift, border color change, background tint on drag).

### 3.7 Responsive Behavior

- Desktop: clean vertical stack as shown.
- Mobile / narrow screens: everything stacks naturally.
  - Compact main row becomes even more compact (reduced padding, filename truncation).
  - Reference area keeps generous height for easy drag-and-drop.
  - Action button becomes full-width.

### 3.8 What Stays the Same

- File upload API calls (`handleUploadMain`, `handleUploadRef`)
- Validation logic and error messages
- Format support and size limit
- Subsequent steps (analysis, repair method selection, processing, result) — this spec only changes the upload UI surface

## 4. Files & Scope

**Primary file to change:**
- `frontend/src/pages/video-repair/VideoRepairPage.tsx` (Step 0 / upload section)

**No changes required to:**
- Backend / API
- Other pages
- Global styles (reuse existing classes and inline patterns)
- Data model (reference remains optional)

## 5. Open Questions / Notes (Resolved during design)

- Reference is optional and never blocks the analyze flow. (Confirmed)
- Reference should be visible from the first load. (Confirmed)
- Post-upload: main shrinks, reference grows. (Confirmed — Approach 1)
- Exact content of compact main row. (Locked: Icon + name + size + tag + "Thay đổi" + ✕)
- Follow real software patterns. (Confirmed)

## 6. Checklist

- [x] Problem clearly stated
- [x] Goals defined
- [x] Design presented in sections and approved by user
- [x] Empty state defined (both zones visible)
- [x] Post-upload vertical stack defined with exact main preview content
- [x] Reference area states (empty + filled)
- [x] Sizing & proportions specified
- [x] Interactions & removal behavior specified
- [x] Visual style & consistency rules
- [x] Responsive handled
- [x] Scope limited to upload UI only
- [ ] Implementation (after this spec is reviewed)
- [ ] Testing (upload flows, remove main, add/remove reference, mobile)

## 7. Next Steps After Spec Approval

1. User reviews this spec.
2. Any final adjustments.
3. Transition to implementation phase (invoke writing-plans or direct edits).
4. Update the original wizard design doc if needed for consistency.

---

**Approval record:**
- Design proposal presented: 2026-06-09
- User response: "ok" (full approval)
- Spec written: 2026-06-09
