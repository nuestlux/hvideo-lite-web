# M01 — Multi-Model License Plate Recovery Enhancement

**Date:** 2026-05-26
**Status:** Draft
**Module:** M01 — Phục hồi biển số xe

## 1. Overview

Enhance M01 license plate recovery to support:
- Advanced image editing tools (crop, free rotate, hue, sharpness, exposure)
- Multi-country AI model selection (checkbox instead of single-select)
- Parallel processing across multiple country-specific AI models
- Dedicated results screen with back-navigation for re-editing

## 2. User Flow

```
Screen 1: Edit & Configure                         Screen 2: Results
┌──────────────────────────────┐      ┌──────────────────────────────┐
│ Upload image                 │      │ ← Quay lại chỉnh sửa        │
│ Preview with crop overlay    │      │                              │
│ Crop (drag-select)           │      │ 🇻🇳 VN Model — 95.2%         │
│ Brightness / Contrast / Sat  │      │ 51F-123.45                   │
│ Hue / Sharpness / Exposure   │      │ [Chọn] [Tải xuống]          │
│ Free rotate (slider+input)   │      │                              │
│ Flip H / Flip V / Zoom       │      │ 🇯🇵 JP Model — 72.8%         │
│                              │      │ 品川 123 あ 4567            │
│ ☑ VN  ☐ US  ☐ JP  ☐ KR     │      │ [Chọn] [Tải xuống]          │
│ [Xe: Ô tô] [Màu: Trắng]     │      │                              │
│ [▶ Xử lý (3 model)]          │      │ 🇰🇷 KR Model — 45.1%         │
└──────────────────────────────┘      │ (độ tin cậy thấp)           │
                                      │ [Chọn] [Tải xuống]          │
                                      └──────────────────────────────┘
```

1. User uploads image → preview appears with editing tools
2. User adjusts image (crop, rotate, color, etc.)
3. User checks one or more countries
4. User clicks "Xử lý (N model)" → navigates to Results screen
5. Backend creates N jobs (one per selected country), runs them in parallel
6. Results screen polls each job; results render as individual cards
7. User can "← Quay lại chỉnh sửa" to re-edit, or "Chọn" a result to confirm

## 3. Frontend Changes

### 3.1 LicensePlatePage.tsx — Edit Screen

**New state variables:**
- `countries: string[]` — selected countries (was single `country: string`)
- `crop: { x, y, width, height } | null` — crop selection
- `cropMode: boolean` — toggle crop selection overlay
- `freeRotate: number` — free rotation angle (-180 to 180)
- `hue: number` — hue rotation (-180 to 180)
- `sharpness: number` — sharpness (0 to 100)
- `exposure: number` — exposure (-2 to 2)

**Country selector:**
- Replace single `Select` with a `Checkbox.Group` showing all countries
- Show count on the process button: "Xử lý (N model)"

**Image editing panel additions:**
- Crop section: "Kéo crop" button activates crop mode on preview; drag-select overlay; "Hủy crop" button to reset
- Free rotate: slider (-180° to 180°) + number input + existing ±90° shortcut buttons
- New sliders in the color grid: Hue, Sharpness, Exposure (alongside existing Brightness, Contrast, Saturation, Zoom)

**Process button:**
- On click, navigate to `/license-plate/results` with state carrying `{ fileId, countries[], adjustments, vehicleType, plateColor }`
- Navigate using React Router with location state (not serialized URL params)

### 3.2 LicensePlateResultsPage.tsx — Results Screen

New page at route `/license-plate/results`.

**On mount:**
- Receive `fileId, countries[], adjustments` from location state (or `useNavigate()` state)
- Call `/api/ai/process` once per selected country, each with its `country` in config
- Collect returned `batchId` (same for all jobs in this batch)
- Poll `/api/ai/jobs?batch_id=<batchId>` every 2 seconds until all jobs complete

**Layout:**
- Back button: `<Button onClick={() => navigate(-1)}>← Quay lại chỉnh sửa</Button>`
- Loading state: show progress per model (Step indicator for each)
- Results: each completed job renders a card showing:
  - Country flag + model name + confidence badge (green/yellow/red)
  - Plate number (large, monospace, blue)
  - Vehicle type & plate color
  - Action buttons: "Chọn kết quả" (stores to job history), "Tải xuống" (download result image)

**Edge cases:**
- If user navigates directly to `/license-plate/results` without state → redirect back to `/license-plate`
- If all jobs fail → show error state with "Thử lại" button → back to edit

### 3.3 Route update

Add route in `App.tsx`:
```tsx
<Route path="/license-plate/results" element={<LicensePlateResultsPage />} />
```

## 4. Backend Changes

### 4.1 Model — ProcessingJob

Add a `batch_id` column to group multi-model jobs:

```python
batch_id = Column(String(36), nullable=True, index=True)  # UUID for a batch
country = Column(String(5), nullable=True)  # Which country model this job runs
```

### 4.2 AI Service — Multi-model processing

**`create_batch_jobs()`:**

```python
async def create_batch_jobs(
    user: User, file_id: int, config: dict, db: AsyncSession
) -> list[ProcessingJob]:
```

- Accepts `countries` as a list in config (e.g., `["VN", "JP", "KR"]`)
- Generates a single `batch_id` (UUID)
- Creates one `ProcessingJob` per country with same `batch_id`
- Each job's config includes country-specific fields
- Deducts points once for the primary job (or once per job — align with BRD business rules)
- Launches all jobs as async tasks in parallel

**Updated API endpoint:**

Extend the existing `POST /api/ai/process` to accept `countries[]` in config:

```
POST /api/ai/process
Params: module, file_id, config (JSON with countries[], adjustments, vehicle_type, plate_color)
Returns: { batch_id, jobs: [job1, job2, ...] }
```

When `config.countries` is an array with >1 entry, the endpoint creates a batch of jobs (one per country) and returns `batch_id` with all jobs. When it's a single string (backward compat), behavior is unchanged.

**List jobs by batch:**

```
GET /api/ai/jobs?batch_id=<uuid>
Returns: all jobs in the batch
```

### 4.3 AI Model Config File

File: `backend/config/ai_models.yaml`

```yaml
models:
  VN:
    name: "VN Model - VietOCR"
    endpoint: "http://ai-engine:5001/predict"
    target_country: "VN"
    supported_vehicles: ["car", "motorcycle", "truck"]
    supported_colors: ["white", "black", "yellow", "blue"]
    
  US:
    name: "US Model - EasyOCR"
    endpoint: "http://ai-engine:5002/predict"
    target_country: "US"
    supported_vehicles: ["car", "motorcycle", "truck"]
    supported_colors: ["white", "black", "yellow", "blue"]
    
  JP:
    name: "JP Model - PaddleOCR JP"
    endpoint: "http://ai-engine:5003/predict"
    target_country: "JP"
    supported_vehicles: ["car", "motorcycle"]
    supported_colors: ["white", "yellow", "blue"]
    
  KR:
    name: "KR Model - Tesseract KR"
    endpoint: "http://ai-engine:5004/predict"
    target_country: "KR"
    supported_vehicles: ["car"]
    supported_colors: ["white", "yellow", "blue"]
```

Loaded at startup:
```python
AI_MODELS: dict[str, AIModelConfig] = load_ai_models("config/ai_models.yaml")
```

### 4.4 Processing Flow (Multi-Model)

```
User selects VN + JP
        │
        ▼
POST /api/ai/process/batch
        │
        ▼
batch_id = uuid4()
for each country in countries:
    job = create_job(config={..., "country": country})
    job.batch_id = batch_id
    job.country = country
    asyncio.create_task(_run_model(job, country))
        │
        ▼
_return { batch_id, jobs: [...] }
```

Each `_run_model()` sends the image + config to the respective AI model endpoint.

## 5. Point Deduction

**Current rule:** Single model → 5 PT per image.

**New rule:** Multi-model → 5 PT per model per image.
- VN + JP + KR selected → 15 PT deducted total.
- One consolidated Transaction record with description "Xử lý biển số: VN, JP, KR".
- Each job stores individual cost in its result for display only.
- Admin can configure per-model pricing independently in System Config if needed (deferred).

## 6. Crop Implementation

Use a lightweight library for the crop interaction:
- **Option A:** `react-easy-crop` — popular, touch-friendly, provides drag-to-select overlay
- **Option B:** Native canvas implementation with `onMouseDown/onMouseMove/onMouseUp`

Recommendation: **`react-easy-crop`** for faster implementation and better UX (zoom, aspect ratio built-in). Only the cropped area is sent to the AI backend; the full image with adjustments is used for preview.

The crop coordinates are passed in `adjustments.crop` in the process config, and the backend applies the crop before sending to the AI model.

## 7. Image Processing Pipeline

```
User edits (client-side CSS filters)  →  Crop coordinates + adjustment params
                                              │
                                              ▼
                                   Backend receives config
                                              │
                                              ▼
                                   Applies adjustments to original image
                                   (PIL/Pillow on server):
                                     - Crop to coordinates
                                     - Rotate by angle
                                     - Apply brightness/contrast/saturation
                                     - Apply hue/sharpness/exposure
                                     - Save processed image
                                              │
                                              ▼
                                   Send processed image to AI model endpoint
```

## 8. Backend Image Processing

Image processing on the server uses **Pillow** (PIL):

```python
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

def preprocess_image(image_path: str, adjustments: dict) -> str:
    img = Image.open(image_path)
    
    # Crop
    if crop := adjustments.get("crop"):
        img = img.crop((crop["x"], crop["y"], crop["x"] + crop["w"], crop["y"] + crop["h"]))
    
    # Rotate
    if angle := adjustments.get("rotate", 0):
        img = img.rotate(angle, expand=True, resample=Image.BICUBIC)
    
    # Brightness / Contrast / Saturation
    if brightness := adjustments.get("brightness", 0):
        img = ImageEnhance.Brightness(img).enhance(1 + brightness / 100)
    if contrast := adjustments.get("contrast", 0):
        img = ImageEnhance.Contrast(img).enhance(1 + contrast / 100)
    if saturation := adjustments.get("saturation", 0):
        img = ImageEnhance.Color(img).enhance(1 + saturation / 100)
    
    # Hue (rotate HSV hue channel)
    if hue := adjustments.get("hue", 0):
        img = img.convert("HSV")
        h, s, v = img.split()
        h = h.point(lambda p: (p + int(hue * 255 / 360)) % 255)
        img = Image.merge("HSV", (h, s, v)).convert("RGB")
    
    # Sharpness
    if sharpness := adjustments.get("sharpness", 50):
        factor = sharpness / 50  # 50 = neutral
        img = ImageEnhance.Sharpness(img).enhance(factor)
    
    # Exposure (multiply brightness)
    if exposure := adjustments.get("exposure", 0):
        factor = 2 ** exposure  # exposure in stops
        img = ImageEnhance.Brightness(img).enhance(factor)
    
    processed_path = image_path.replace(".", "_processed.")
    img.save(processed_path, quality=95)
    return processed_path
```

Add `Pillow` to `requirements.txt`.

## 9. Storage

Processed images (after applying adjustments server-side) are saved to a `processed` subdirectory under the user's upload folder:
```
uploads/{user_id}/processed/{job_id}_processed.jpg
```
These are temporary and cleaned up after 24 hours (via a scheduled cleanup or on-the-fly check).

## 10. Error Handling

| Scenario | Behavior |
|----------|----------|
| User navigates directly to /license-plate/results | Redirect to /license-plate |
| All models fail | Show error state, "Thử lại" button goes back to edit |
| Some models succeed, some fail | Show successful results; failed ones show error message |
| Network error during polling | Retry 3 times, then show "Mất kết nối" |
| Crop applied but backend fails | Preserve crop state on back-navigation |
| Points insufficient for all selected models | Show error "Cần X PT, hiện có Y PT" before creating batch |

## 11. Route Protection

Results page is guarded by `ProtectedRoute` (same as all other pages). Both admin and officer roles can access.

## 12. Implementation Order

1. Add `batch_id` and `country` columns to ProcessingJob model
2. Create AI model config file (`config/ai_models.yaml`) + loader
3. Add image preprocessing service with Pillow
4. Update backend API: batch processing endpoint, list-by-batch endpoint
5. Update frontend LicensePlatePage: multi-country, crop, free rotate, hue, sharpness, exposure
6. Create LicensePlateResultsPage with polling + results display
7. Add `react-easy-crop` dependency
8. Add route and navigation logic
