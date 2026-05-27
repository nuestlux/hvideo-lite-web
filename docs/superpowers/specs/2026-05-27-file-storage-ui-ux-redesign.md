# File Storage UI/UX Redesign

**Date:** 2026-05-27
**Status:** Draft
**Page:** File Storage

## 1. Overview

Redesign the File Storage page to feel cleaner and more modern while adding practical discovery tools:
- Search by file name
- Filter by file type and processing status
- Sort by name, size, or upload date
- Switch between table view and grid view

The goal is to keep the current workflow fast for power users, but improve readability and visual polish.

## 2. Goals

- Make file browsing easier when there are many items
- Reduce visual clutter in the current page
- Keep upload, preview, download, and delete actions obvious
- Support both compact table usage and more visual grid browsing

## 3. Non-Goals

- No folder tree redesign
- No file sharing or collaboration features
- No bulk actions in this iteration
- No backend permission changes

## 4. Proposed UX

### 4.1 Page Structure

1. Top summary card for storage quota
2. Main file section with a toolbar
3. View switcher: `Table` / `Grid`
4. Shared pagination at the bottom

### 4.2 Toolbar

Toolbar sits above the list and includes:
- Search input for `original_name`
- Filter dropdowns:
  - File type: `image`, `video`, `other`
  - Status: `chua_xu_ly`, `dang_xu_ly`, `hoan_thanh`, `that_bai`
- Sort dropdown:
  - `Ngày tải lên`
  - `Kích thước`
  - `Tên file`
- Toggle buttons for `Table` and `Grid`
- Active filter chips with `xóa tất cả`

### 4.3 Table View

Keep table as the default for fast operations.

Enhancements:
- Better spacing and row hover
- Status badges with stronger color contrast
- Optional type badge per file row
- Action buttons grouped consistently

### 4.4 Grid View

Grid view is for visual browsing.

Each card shows:
- File icon or thumbnail placeholder
- File name
- Size
- Status badge
- Upload date
- Quick actions: preview, download, delete

## 5. Data Flow

### 5.1 Search / Filter / Sort

Search, filter, and sort are server-backed so the page stays correct as the dataset grows.

Frontend sends query parameters for:
- `search`
- `file_type`
- `processed`
- `sort_by`
- `sort_order`
- `page`
- `limit`

The page keeps local state for current view mode and selected filters.
Table/Grid is a client-side view toggle only; it does not change the query meaning.

### 5.2 File Type Mapping

File type is derived from MIME type:
- `image/*` -> image
- `video/*` -> video
- everything else -> other

## 6. Backend Changes

Extend `GET /api/files` to support:
- `search` string
- `file_type` string
- `sort_by` string
- `sort_order` string

Sorting options:
- `created_at`
- `size`
- `original_name`

Filtering options:
- `processed`
- `file_type`

Search should match `original_name` using case-insensitive partial match.

## 7. Frontend Changes

### 7.1 State

Add local state for:
- `search`
- `fileType`
- `sortBy`
- `sortOrder`
- `viewMode` (`table` | `grid`)

### 7.2 Behavior

- Search should be debounced lightly to avoid excessive requests
- Changing any filter resets page to 1
- Upload/delete should refresh list and quota
- Preview, download, delete remain unchanged

### 7.3 Empty States

If filters return no rows:
- Show empty state with a clear explanation
- Provide quick actions: `xóa filter`, `tải lên file mới`

## 8. Error Handling

- If list fetch fails, show a compact error message and keep current filters
- If quota fetch fails, keep the page usable and only hide quota details
- If preview fails for images, show a fallback message

## 9. Accessibility / UX Details

- Toolbar controls should be aligned and compact
- Use clear labels, not icon-only controls for key actions
- Maintain readable contrast for status tags
- Grid cards should remain usable on smaller screens

## 10. Testing

- Search by name returns expected results
- Filter by type and status works together
- Sort changes ordering correctly
- Table/Grid toggle preserves current filters
- Upload/delete refreshes list and quota
- Empty state appears when no results match

## 11. Implementation Order

1. Extend backend file list API for search/sort/filter
2. Update `filesApi.list()` params
3. Redesign FileStoragePage toolbar and state
4. Add table/grid toggle
5. Add empty state and polish styles
