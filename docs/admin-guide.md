# Hvideo Lite — Hướng dẫn Admin

## 1. Đăng nhập
- Mở trình duyệt, truy cập địa chỉ server
- Nhập email + mật khẩu admin

## 2. Quản lý tài khoản (M03)
**Tạo tài khoản mới:**
- Vào menu Tài khoản → Nút "Tạo tài khoản"
- Nhập tên, email, chọn vai trò (Cán bộ / Admin)
- Hệ thống gửi email OTP 6 số đến cán bộ
- Cán bộ xác nhận OTP và đặt mật khẩu

**Các thao tác khác:**
- Sửa: click "Sửa" để cập nhật tên/email
- Point: click "Point" để cấp/thu hồi point (kèm lý do bắt buộc)
- Khóa/Mở khóa: click nút Khóa/Mở khóa
- Gửi lại OTP: dành cho tài khoản "Chờ xác nhận"
- Cảnh báo 72h+: tài khoản chờ xác nhận quá 72 giờ hiển thị tag đỏ

## 3. Quản lý Point (M04)
- Vào menu Tài khoản → chọn "Point" trên cán bộ
- Nhập số dương (+) để cấp, số âm (-) để thu hồi
- Lý do bắt buộc

## 4. Lịch sử giao dịch (M05)
- Menu Giao dịch → xem toàn bộ giao dịch
- Lọc theo dịch vụ
- Nút "Xuất CSV" để tải báo cáo

## 5. File (M06)
- Menu File → xem/tải lên/tải xuống/xóa file
- Xem trước ảnh bằng nút "Xem"
- Theo dõi quota ở thẻ Bộ nhớ

## 6. Cấu hình hệ thống (M07)
- Menu Cấu hình
- Chi phí point cho từng dịch vụ: biển số ảnh/video, sửa video nhanh/sâu
- Chế độ hàng đợi (FIFO/LIFO)
- Giới hạn xử lý đồng thời
- Giới hạn lưu trữ mỗi user (MB)

## 7. Thống kê Point (M08)
- Menu Thống kê Point → tổng cấp, tiêu thụ, còn lưu hành + phân bổ module

## 8. Dashboard (M09)
- Menu Dashboard → biểu đồ cột/đường/tròn
- Sức khỏe hệ thống: CPU, RAM, ổ đĩa, GPU (cập nhật 30s)

## 9. Cấu hình Email (SMTP)
Tạo file `.env` trong thư mục `backend/`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```
Vào menu Cấu hình → nút "Test Email" để kiểm tra.
