# File Status & Upload Progress Redesign

**Date:** 2026-05-29
**Status:** Approved

## Summary

Xoá trạng thái "Chưa xử lý" (`chua_xu_ly`) khỏi hệ thống quản lý file, thay default thành "Hoàn thành" (`hoan_thanh`), và thêm progress bar khi upload file.

## Data Changes

- **`backend/models/file_record.py:15`**: đổi `default="hoan_thanh"` (thay vì `"chua_xu_ly"`)
- **Migration**: script xoá tất cả `FileRecord` có `processed="chua_xu_ly"` và file vật lý tương ứng trên đĩa (chạy 1 lần)
- **Schema** (`backend/schemas/file.py`): giữ nguyên `processed: str`

## API Changes

- Giữ nguyên API filter `processed` ở backend (vẫn hỗ trợ lọc theo `dang_xu_ly`, `hoan_thanh`, `that_bai`)
- Chỉ xoá option `chua_xu_ly` khỏi frontend
- **`files.ts:upload`**: thêm `onUploadProgress` callback từ Axios để cập nhật %

## Frontend Changes (FileStoragePage.tsx)

- **processedLabels** (dòng 40-45): xoá entry `chua_xu_ly`
- **processedColors** (dòng 47-52): xoá entry `chua_xu_ly`
- **Filter dropdown** (dòng 301-306): xoá option `chua_xu_ly`
- **Upload progress**: state `uploadProgress: number`, truyền `onUploadProgress` vào upload call, hiển thị `Progress` component khi `uploadProgress > 0`. Reset về 0 khi hoàn tất hoặc lỗi.

## Axios Config

Cần expose `onUploadProgress` từ Axios instance. Dùng `client` (`api/client.ts`) với `axios` config hỗ trợ progress callback ở cấp request.

## Edge Cases

- Upload thất bại → reset progress về 0, message error (đã có)
- File vượt quota → backend trả 413, frontend đã xử lý
- Migration chạy 1 lần, idempotent (chỉ xoá record có đúng `chua_xu_ly`)
