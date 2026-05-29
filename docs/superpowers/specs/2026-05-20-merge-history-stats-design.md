# Gộp Giao Dịch & Thống Kê Point

## 1. Overview
Gộp hai tính năng "Giao dịch" (History) và "Thống kê Point" thành một trang duy nhất để người dùng dễ dàng theo dõi số dư và dòng tiền trong cùng một ngữ cảnh, giảm bớt việc phải chuyển trang.

## 2. Navigation Changes
- **Sidebar:** Xóa hoặc gộp mục `admin-revenue` (Thống kê doanh thu) và `history` (Lịch sử giao dịch). Thay thế bằng mục mới: `history` với label **"Lịch sử & Thống kê"** (hoặc "Giao dịch & Thống kê").

## 3. Page Layout (`#page-history`)
Trang "Lịch sử & Thống kê" sẽ chia làm 2 phần (Trên-Dưới):

### 3.1. Phần Trên: Thống Kê (Overview Stats)
Hiển thị tổng quan về Point của người dùng.
- **Card 1 (Chính):** Số dư Point hiện tại (to, nổi bật). Kèm nút "Nạp thêm" (Top up).
- **Card 2:** Thống kê sử dụng Point (vd: Point đã tiêu, Point đã nạp trong 30 ngày qua). Có thể dùng progress bar hoặc mini-chart để trực quan hóa.

### 3.2. Phần Dưới: Danh sách Giao dịch (Transaction List)
- Tái sử dụng bảng (table) hoặc list giao dịch hiện tại của trang history.
- **Bộ lọc (Filters):** 
  - Nút chuyển view (Tất cả, Chỉ nạp, Chỉ sử dụng).
  - Khung tìm kiếm/Search (nếu cần).
- **Nội dung List:** ID giao dịch, Loại giao dịch (Nạp/Sử dụng), Mô tả chi tiết, Số tiền (+/- Point), Thời gian, Trạng thái (Thành công/Thất bại).

## 4. Implementation Notes
- CSS: Tái sử dụng các class `.stat-card`, `.grid-2`, `.card`, `.table-wrapper` đã có trong `index.html`.
- JS: Cập nhật hàm render history để hiển thị cả stats phía trên list. Loại bỏ các code thừa của page admin-revenue cũ (nếu không còn dùng).
- Data: Sử dụng `DB.audit_log` hoặc `DB.transactions` (tùy cấu trúc hiện tại) để tính toán stats.

## 5. Scope
- Chỉ gộp giao diện UI và JS liên quan trong file `index.html` và `app-check.js` (nếu logic history nằm ở đó).
- Đảm bảo responsive (mobile/desktop).
