# Design: Đổi gói khác Button Relocation

**Date:** 2026-05-20
**Project:** VisionFix v2
**File:** `2026-05-20-doigoi-button-relocation-design.md`

## Problem

The "← Đổi gói khác" button in step 2 of the payment flow (`#topup-step-2`) is rendered as a full-width button (`width:100%`) at the bottom of the "Gói đã chọn" card. This breaks visual consistency with the "← Quay lại" buttons in step 3 gateway screens, which are compact `btn-default` buttons positioned in the `.payment-screen-header`.

## Current State

- **"← Quay lại"** (step 3): small `btn-default` button, `margin-left:auto` in `.payment-screen-header`
- **"← Đổi gói khác"** (step 2): `btn-default` with `width:100%` below card content
- Step 2 has no `payment-screen-header`/`payment-screen-body` wrapper — it uses raw `max-width:560px` container with two `.card` elements

## Design Change

Wrap step 2 content in the same `payment-screen-header` + `payment-screen-body` pattern used by all gateway screens in step 3:

### Structure (step 2)

```html
<!-- New header replacing the raw container -->
<div class="payment-screen-header">
  <div class="psh-icon">💎</div>
  <div>
    <div class="psh-title">Chọn phương thức thanh toán</div>
  </div>
  <div style="margin-left:auto">
    <button class="btn btn-default" onclick="goToStep(1)">← Đổi gói khác</button>
  </div>
</div>

<div class="payment-screen-body">
  <!-- Card: Gói đã chọn (remove existing full-width button) -->
  <!-- Card: Chọn phương thức thanh toán (unchanged) -->
</div>
```

### Removal

Remove the existing `<button class="btn btn-default mt-8" onclick="goToStep(1)" style="width:100%">← Đổi gói khác</button>` at line 1166 of `index.html`.

### Changes

| Location | File | Change |
|----------|------|--------|
| `index.html` line 1158 | Step 2 container | Replace `max-width:560px` wrapper with `payment-screen-header` + `payment-screen-body` |
| `index.html` line 1166 | Old button | Remove full-width "← Đổi gói khác" button |
| New | Header button | Add "← Đổi gói khác" as `btn-default` in header right side |

### Behavior

- Clicking "← Đổi gói khác" calls `goToStep(1)` — same as current behavior

## Consistency

This pattern is identical to every gateway screen in step 3 (VNPay line 1193, MoMo line 1248, ZaloPay line 1275, Stripe line 1299, PayPal line 1337), ensuring uniform UI/UX across the payment flow.
