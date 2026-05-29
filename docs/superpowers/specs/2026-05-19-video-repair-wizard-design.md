# Video Repair Wizard — Design Spec

**Ngày:** 2026-05-19
**Dự án:** VisionFix SaaS Mockup
**Module:** Video Repair Wizard (Epic 3, Feature 3.1–3.4)
**File đích:** `video-plate-saas-mockup-v2.html`

## 1. Tổng quan

Cải thiện màn hình Module 1 — Khôi phục video hỏng từ single-page đơn giản thành wizard 4 bước, tương tự plate recovery wizard. Mục tiêu: UX nhất quán, hiển thị rõ quy trình xử lý, feedback trực quan.

## 2. Layout

Grid 2 cột giống plate wizard:

```
┌──────────────────────────────────┬──────────────────────────────┐
│   WIZARD PANEL (trái)           │   PREVIEW PANEL (phải)        │
│                                  │                              │
│   [1] ▬ [2] ▬ [3] ▬ [4]        │   🎬 File Preview            │
│   (stepper 4 bước)              │   (icon/placeholder)         │
│                                  │                              │
│   ┌──────────────────────┐      │   📄 File Meta               │
│   │   Step Content        │      │   • Tên, Size, Format       │
│   │   (thay đổi theo step)│      │   • Duration, Resolution    │
│   └──────────────────────┘      │   • Detected Errors          │
│                                  │                              │
│   Step navigation buttons        │   📋 Lịch sử (bên dưới)     │
└──────────────────────────────────┴──────────────────────────────┘
```

- Wizard panel trái: stepper + step content + navigation buttons
- Preview panel phải: luôn hiển thị thông tin video đã chọn + history list
- Stepper CSS tái sử dụng từ `.plate-stepper` / `.plate-step`

## 3. Step 1 — Upload

### Drop zone
- Video icon + "Kéo thả video bị hỏng vào đây"
- Hỗ trợ kéo thả + click để chọn file
- Accept: MP4, MOV, AVI, MKV, FLV, WEBM — max 500MB
- CSS: `.upload-zone` hiện có, thêm class `.video-dropzone`

### Reference video (optional)
- Nút nhỏ dưới drop zone: "📎 Upload video mẫu (reference)"
- File picker riêng (accept same formats)
- Tăng tỷ lệ thành công khi có reference video cùng thiết bị

### Sau upload
- File queue item: icon, name, size, format tag (.video), progress bar (simulated)
- Preview panel phải cập nhật: tên, size, format, duration (simulated)
- Tự động phân tích sơ bộ → hiển thị lỗi detected trong preview panel
- Nếu reference uploaded → hiển thị tag "📎 Reference: ref_video.mp4"

### Validation
- Format không hợp lệ → toast error
- Kích thước > 500MB → toast error
- Nút Next disabled đến khi có file

## 4. Step 2 — Analyze & Configure

### Error Analysis
Card hiển thị lỗi detected (simulated data):
| Lỗi | Severity | Mô tả |
|-----|----------|-------|
| 🚫 Mất moov atom | Critical | Header metadata bị mất, video không mở được |
| ⚠️ Corrupt header | High | Cấu trúc file MP4 bị hỏng |
| ⚠️ Codec error | Medium | H.264 stream bị lỗi, frame bị skip |
| ℹ️ AV out of sync | Low | Audio/video lệch ~1.2s |

Mỗi lỗi dạng card với icon + severity badge + mô tả.

### Repair Mode Selection
Card-style selection (giống plate config):
- **⚡ Nhanh (10 PT):** Sửa header + metadata. ~2 phút. Cho lỗi nhẹ (moov atom, header).
- **🔬 Sửa sâu (20 PT):** Re-encode + đồng bộ AV. ~8 phút. Cho lỗi nặng (codec, sync).
- Gạch chân mode được đề xuất dựa trên lỗi (simulated).

### Advanced Settings (collapsible)
- Output codec: H.264 / H.265 / VP9 / Auto
- Keep original audio: toggle (mặc định ON)
- Repair level: slider 1–5 (mặc định 3)

### Cost Summary
- "Số dư: X PT → Sau xử lý: Y PT"
- Nếu không đủ Point → disabled + "Nạp thêm →" link to topup

## 5. Step 3 — Process Animation

Animation 5 bước xử lý tuần tự:

```
Bước 1: 🔍 Phân tích file           → ✅ "Phân tích cấu trúc file... OK"
Bước 2: 🔧 Sửa header               → ✅ "Khôi phục moov atom... OK"
Bước 3: 🛠️ Fix codec               → ✅ "Sửa lỗi codec H.264... OK"
Bước 4: 🔄 Đồng bộ AV              → ✅ "Căn chỉnh AV sync... OK"
Bước 5: ✅ Xác minh                 → "Verified: Video có thể phát"
```

CSS pattern giống `.proc-steps` của plate wizard:
- Mỗi step: `.proc-step` với `active` (spinner), `done` (checkmark)
- Progress bar tổng thể dưới stepper
- ETA: "~2 phút" (nhanh) / "~8 phút" (sâu)
- Nút "Hủy" ở dưới — simulated cancel → toast + reset

### Thời gian simulated
- Mỗi bước: 800–1200ms
- Nhanh: 4 bước × 800ms = ~3.2s total
- Sâu: 5 bước × 1200ms = ~6s total

## 6. Step 4 — Result

### Before/After Comparison
2 panel cạnh nhau:
- **Before:** "Trước khi sửa" (đỏ) — icon ❌ + error list
- **After:** "Sau khi sửa" (xanh) — icon ✅ + "Video có thể phát!"

Panel body: simulated thumbnail + play button (mock) + duration.

### Repair Summary
| Field | Value |
|-------|-------|
| File | recording_0512.mp4 |
| Mode | Sửa sâu (20 PT) |
| Errors found | 3 |
| Errors fixed | 3/3 |
| Original size | 245 MB |
| Output size | 248 MB (~99% retained) |
| Duration | ~12 phút |
| Time processed | ~8 phút 12s |

### Actions
- ⬇️ **Tải video đã sửa** — simulated download (toast + ghi log)
- 📧 **Gửi link qua email** — simulated
- 🔄 **Xử lý file khác** — reset wizard về Step 1
- Preview panel phải cập nhật thành repaired info

### Failure state
- Nếu simulated fail → error screen thay vì success
- "❌ Không thể khôi phục video. Thử chế độ sửa sâu hoặc upload reference video."
- Không trừ Point
- Nút: "Thử lại" (quay Step 2) / "Hủy" (reset)

## 7. Error Handling

| Scenario | Behavior |
|----------|----------|
| Upload không đúng format | Toast error, không accept file |
| Upload > 500MB | Toast error, không accept |
| Không đủ Point | Disable nút repair, hiển thị "Nạp thêm" |
| Xử lý thất bại | Error screen, không trừ Point |
| Hủy giữa chừng | Toast confirm, reset về Step 1 |
| Reference upload sai format | Toast error, file bi loại bỏ |

## 8. Data Model Changes

Thêm vào `DB` object trong `initDB()`:
```js
// State cho video repair wizard
videoFile: null,
videoRefFile: null,
videoRepairMode: 'deep',     // 'fast' | 'deep'
videoRepairAdvanced: {
  outputCodec: 'auto',
  keepAudio: true,
  repairLevel: 3
},
videoRepairErrors: [
  { id: 'err1', severity: 'critical', icon: '🚫', label: 'Mất moov atom', desc: '...' },
  { id: 'err2', severity: 'high', icon: '⚠️', label: 'Corrupt header', desc: '...' },
  // ...
],
videoRepairSteps: [
  { id: 'step1', icon: '🔍', label: 'Phân tích file', done: false },
  { id: 'step2', icon: '🔧', label: 'Sửa header', done: false },
  // ...
],
videoRepairResult: null,  // 'success' | 'failed' | null
```

## 9. Functions (JS)

| Function | Description |
|----------|-------------|
| `handleVideoDrop(e)` | Drop handler, gọi handleVideoFile |
| `handleVideoFile(file)` | Validate + set videoFile + update preview |
| `handleVideoRefFile(file)` | Validate + set videoRefFile |
| `goVideoStep(step)` | Chuyển step trong wizard |
| `videoSimulateAnalysis()` | Simulate analyze → hiển thị errors |
| `selectVideoRepairMode(mode)` | Set videoRepairMode |
| `executeVideoRepair()` | Start repair process + trừ Point |
| `videoRepairStep(index)` | Chạy animation từng step |
| `cancelVideoRepair()` | Hủy quá trình repair |
| `renderVideoPreview()` | Cập nhật preview panel phải |
| `renderVideoResult()` | Hiển thị kết quả sau repair |
| `resetVideoWizard()` | Reset to Step 1 |
| `renderVideoHistory()` | Render history list (đã có, cập nhật) |

## 10. CSS Additions

- `.video-stepper` — copy từ `.plate-stepper`
- `.video-error-card` — card cho mỗi lỗi detected
- `.video-advanced-section` — collapsible advanced settings
- `.video-result-comparison` — before/after panel
- `.repair-summary-grid` — grid cho summary table
- Các class còn lại reuse từ plate wizard CSS

## 11. Checklist

- [x] Layout grid-2 giống plate
- [x] Stepper 4 bước
- [x] Step 1: Upload + reference
- [x] Step 2: Error analysis + mode config + advanced
- [x] Step 3: 5-step process animation
- [x] Step 4: Before/After + summary + actions
- [x] Error handling: upload, Point, failure
- [x] Failure state: không trừ Point
- [x] Data model mở rộng
- [x] JS functions list
- [ ] CSS additions
