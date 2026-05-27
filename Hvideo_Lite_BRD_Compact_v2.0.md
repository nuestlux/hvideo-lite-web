# Hvideo Lite — Tài liệu Yêu cầu Nghiệp vụ (BRD)

**Nền tảng AI phục hồi biển số xe & sửa chữa video — phục vụ 500 cán bộ công an**

| Trường | Giá trị |
|---|---|
| Phiên bản | 2.0 (Bản nháp) |
| Ngày | 26/05/2026 |
| Phân loại | Nội bộ — Mật |
| Triển khai | On-premise (cho phép truy cập từ Internet) |

---

## 1. Giới thiệu

### 1.1 Hvideo Lite là gì?

Hvideo Lite là nền tảng web chạy trên server nội bộ (on-premise). Mô hình AI và toàn bộ hệ thống web được triển khai trên máy chủ do đơn vị tự quản lý; cán bộ có thể truy cập hệ thống từ mạng Internet thông qua kết nối bảo mật (VPN/Reverse Proxy + HTTPS). Hệ thống dùng AI để giúp cán bộ công an:

- **Phục hồi biển số xe** — Từ ảnh/video camera giám sát mờ, AI tự động tăng cường chất lượng và nhận dạng ký tự biển số. Thay vì cán bộ kỹ thuật mất 15–60 phút chỉnh ảnh bằng Photoshop, hệ thống xử lý trong vài giây với độ chính xác >= 90%.
- **Sửa chữa video hỏng** — File video từ dashcam, CCTV bị hỏng (mất metadata, lỗi codec) được AI phân tích và khôi phục. Thay vì gửi đến đơn vị kỹ thuật chờ 2–7 ngày, hệ thống sửa trong 2–8 phút.

### 1.2 Ai sử dụng?

| Vai trò | Mô tả | Số lượng |
|---|---|---|
| **Admin** | Cán bộ phòng CNTT Công an. Quản lý tài khoản, cấp point, cấu hình hệ thống, xem thống kê. | 1–3 |
| **Cán bộ** | Cán bộ CSGT, CSHS, CSĐT, An ninh. Sử dụng dịch vụ xử lý biển số và sửa video. Tài khoản do Admin tạo. | ~500 |

### 1.3 Cơ chế sử dụng: Point nội bộ

Cán bộ dùng **point** để trả cho mỗi lần xử lý. Point do admin cấp phát thủ công — **không có thanh toán bằng tiền** trong giai đoạn này.

| Dịch vụ | Chi phí |
|---|---|
| Biển số từ ảnh | 5 PT |
| Biển số từ video | 15 PT |
| Sửa video Nhanh (~2 phút) | 10 PT |
| Sửa video Sâu (~8 phút) | 20 PT |

> Chi phí có thể cấu hình bởi admin.

---

## 2. Mục tiêu & Tiêu chí thành công

| ID | Mục tiêu | Chỉ tiêu đo | Cách đo |
|---|---|---|---|
| O-01 | Độ chính xác OCR biển số | >= 90% trên ảnh chất lượng tiêu chuẩn | Điểm tin cậy trên 100 ảnh test |
| O-02 | Tỷ lệ sửa video thành công | >= 80% | Tỷ lệ file sửa thành công / tổng file |
| O-03 | Tốc độ xử lý | Ảnh <= 30s, Video sâu <= 10 phút (P95) | Log thời gian |
| O-04 | Triển khai sử dụng | >= 200/500 cán bộ active trong 3 tháng đầu | Dashboard |
| O-05 | Dashboard trực quan | >= 6 loại biểu đồ | Đếm trên giao diện |
| O-06 | An ninh dữ liệu | 100% dữ liệu & AI on-premise; truy cập từ Internet qua kênh mã hóa (VPN/HTTPS) | Audit kiến trúc mạng + penetration test |

---

## 3. Phạm vi

### 3.1 Trong phạm vi (11 module)

| Module | Mô tả ngắn |
|---|---|
| M01 — Phục hồi biển số | Tải ảnh/video, chỉnh sửa, cấu hình biển số (VN/US/JP/KR), pipeline AI 5 bước, kết quả + điểm tin cậy |
| M02 — Sửa video hỏng | Tải video, phân tích lỗi tự động, 2 chế độ sửa (Nhanh/Sâu), cấu hình codec, so sánh trước/sau |
| M03 — Quản lý tài khoản | Admin tạo tài khoản → email OTP 6 số (10 phút) → cán bộ xác nhận → đặt mật khẩu → đăng nhập |
| M04 — Quản lý Point | Admin cấp/điều chỉnh point (kèm lý do bắt buộc), hiển thị số dư |
| M05 — Lịch sử giao dịch | Ghi nhận trừ point, lọc theo loại dịch vụ, xuất báo cáo. Không giao dịch tiền |
| M06 — Lưu trữ file | Thư mục cá nhân, tải lên/xuống, xem trước, theo dõi quota |
| M07 — Cấu hình hệ thống | Chi phí module, giới hạn đồng thời, hàng đợi, giới hạn lưu trữ |
| M08 — Thống kê Point | Tổng cấp phát, tiêu thụ, phân tách theo module. Không doanh thu tiền |
| M09 — Dashboard | Admin: 6+ biểu đồ + sức khỏe hệ thống. Cán bộ: thẻ tóm tắt + biểu đồ cá nhân |
| M10 — Hồ sơ cán bộ | Xem/sửa thông tin, đổi mật khẩu |
| M11 — Xác thực | Đăng nhập email/mật khẩu, xác nhận OTP, quản lý phiên, quên mật khẩu |

### 3.2 Ngoài phạm vi

Tự đăng ký, OAuth, thanh toán tiền, nhật ký hoạt động, mã khuyến mãi, mua gói dịch vụ, thưởng point, ứng dụng mobile, API bên thứ 3, triển khai trên cloud công cộng (AWS/Azure/GCP).

---

## 4. Quy trình nghiệp vụ chính

### 4.1 Tạo tài khoản & Xác nhận OTP

```
Admin tạo tài khoản (tên, email, vai trò)
    → Hệ thống tạo tài khoản "Chờ xác nhận"
    → Gửi email OTP 6 chữ số (hiệu lực 10 phút)
    → Cán bộ nhập OTP trên trang xác nhận
    → Thành công → trạng thái "Hoạt động" → Đặt mật khẩu → Đăng nhập

Ngoại lệ:
• OTP hết hạn → thông báo lỗi, liên hệ admin gửi lại
• Sai OTP 5 lần → khóa xác nhận, admin reset
• Không xác nhận trong 72h → hệ thống cảnh báo admin
• Gửi lại OTP: tối đa 3 lần/giờ, mã cũ tự vô hiệu
```

### 4.2 Phục hồi biển số

```
Cán bộ tải ảnh/video → Chỉnh sửa (tùy chọn) → Cấu hình biển số (quốc gia, loại xe, màu)
    → Kiểm tra point → Trừ point → Pipeline AI 5 bước
    → Kết quả: biển số + điểm tin cậy + ảnh đã xử lý
```

### 4.3 Sửa chữa video

```
Cán bộ tải video hỏng (+ video tham chiếu tùy chọn)
    → Hệ thống phân tích lỗi tự động
    → Chọn chế độ Nhanh (10 PT) hoặc Sâu (20 PT)
    → Trừ point → Xử lý → Kết quả chi tiết + tải video

Ngoại lệ: Sửa thất bại → KHÔNG trừ point → Thông báo lý do → Nút thử lại
```

### 4.4 Cấp phát Point

```
Admin chọn cán bộ → Điều chỉnh point (+ hoặc -) + lý do bắt buộc
    → Số dư cập nhật trong 2 giây → Ghi lịch sử giao dịch
```

---

## 5. Quy tắc nghiệp vụ

| ID | Quy tắc |
|---|---|
| BRULE-01 | Tài khoản chỉ được admin tạo. Cấm tự đăng ký. |
| BRULE-02 | Point chỉ admin cấp phát/điều chỉnh. Cán bộ không tự nạp. |
| BRULE-03 | Không đủ point → từ chối xử lý. |
| BRULE-04 | Sửa video thất bại → không trừ point. |
| BRULE-05 | Chi phí: biển số 5/15 PT, video 10/20 PT. Admin cấu hình được. |
| BRULE-06 | Điều chỉnh point phải kèm lý do. |
| BRULE-07 | File tối đa: ảnh 20 MB, video 500 MB. |
| BRULE-08 | Ảnh: JPG/PNG/WEBP. Video: MP4/MOV/AVI/MKV/FLV/WEBM. |
| BRULE-09 | Biển số hỗ trợ: Việt Nam, Hoa Kỳ, Nhật Bản, Hàn Quốc. |
| BRULE-10 | Hàng đợi đầy → xếp hàng FIFO/LIFO; vẫn đầy → từ chối. |
| BRULE-11 | Mọi dữ liệu và mô hình AI nằm on-premise. Người dùng được phép truy cập hệ thống từ Internet qua kênh mã hóa (VPN/HTTPS). Hệ thống không gọi API bên ngoài; không đẩy dữ liệu ra cloud bên thứ 3. |
| BRULE-12 | Tạo tài khoản → email OTP 6 số (10 phút). Phải xác nhận mới đăng nhập được. |
| BRULE-13 | OTP dùng 1 lần. Hết hạn/đã dùng → vô hiệu. Admin có thể gửi lại. |

---

## 6. Yêu cầu chức năng

### 6.1 Xác thực & Tài khoản

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-01 | Admin tạo tài khoản → trạng thái "Chờ xác nhận" → gửi email OTP 6 số (10 phút) trong 3 giây. | Phải có |
| FR-02 | Không hiển thị trang đăng ký, nút OAuth trên bất kỳ màn hình nào. | Phải có |
| FR-03 | Email OTP chứa: tên cán bộ, "Hvideo Lite", mã OTP, thời hạn 10 phút, hướng dẫn liên hệ admin. | Phải có |
| FR-04 | Nhập đúng OTP trong 10 phút → trạng thái "Hoạt động" → trang đặt mật khẩu. OTP dùng 1 lần. | Phải có |
| FR-05 | OTP hết hạn/đã dùng → thông báo lỗi rõ ràng + hướng dẫn liên hệ admin. | Phải có |
| FR-06 | Sai OTP 5 lần → khóa xác nhận. Admin reset thủ công. | Phải có |
| FR-07 | Quản lý người dùng: hiển thị trạng thái xác nhận + nút "Gửi lại OTP" (tối đa 3 lần/giờ, mã cũ vô hiệu). | Phải có |
| FR-08 | Tài khoản "Chờ xác nhận" cố đăng nhập → từ chối + thông báo rõ ràng. | Phải có |
| FR-09 | Không xác nhận trong 72h → cảnh báo admin. | Nên có |
| FR-10 | Đăng nhập email/mật khẩu. Quên mật khẩu → email reset qua SMTP server (nội bộ hoặc relay có TLS). | Phải có |
| FR-11 | Hồ sơ: xem/sửa tên, email, đổi mật khẩu (cần mật khẩu cũ). Không phần OAuth. | Phải có |

### 6.2 Phục hồi biển số

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-12 | Tải ảnh (JPG/PNG/WEBP, <= 20 MB) → xem trước + metadata trong 2 giây. | Phải có |
| FR-13 | Tải video → trích xuất frame (khoảng 1s) → hiển thị lưới thumbnail để chọn. | Phải có |
| FR-14 | Chỉnh sửa ảnh: cắt, xoay, lật, zoom, sáng/tương phản/bão hòa (-100 đến +100), reset. | Phải có |
| FR-15 | Cấu hình biển số: quốc gia (VN/US/JP/KR + xem trước), loại xe (ô tô/xe máy/xe tải), màu biển (trắng/đen/vàng/xanh). | Phải có |
| FR-16 | Xác nhận xử lý → kiểm tra point → trừ chi phí → pipeline AI 5 giai đoạn với thanh tiến trình. | Phải có |
| FR-17 | Kết quả: so sánh trước/sau, biển số, metadata, điểm tin cậy (%), point trừ, nút tải ảnh. | Phải có |

### 6.3 Sửa chữa video

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-18 | Tải video hỏng (MP4/MOV/AVI/MKV/FLV/WEBM, <= 500 MB) + video tham chiếu (tùy chọn). | Phải có |
| FR-19 | Phân tích lỗi tự động (mất moov atom, hỏng header, lỗi codec) → hiển thị danh sách lỗi. | Phải có |
| FR-20 | Hai chế độ: Nhanh (10 PT, ~2 phút) / Sâu (20 PT, ~8 phút). Tùy chọn: codec (Auto/H.264/H.265/VP9), mức sửa (1–5), giữ audio. | Phải có |
| FR-21 | Thành công → kết quả chi tiết (metadata, lỗi tìm/sửa, thời gian, point) + tải video. | Phải có |
| FR-22 | Thất bại → thông báo lý do, không trừ point, nút thử lại. | Phải có |

### 6.4 Quản lý Point & Giao dịch

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-23 | Admin điều chỉnh point: hiển thị số dư hiện tại, nhập số (+ hoặc -), lý do bắt buộc, cập nhật trong 2 giây. | Phải có |
| FR-24 | Không hiển thị trang nạp point, cổng thanh toán, mua gói. | Phải có |
| FR-25 | Lịch sử giao dịch: cột ngày/giờ, loại dịch vụ, tên file, point, số dư sau. Không giao dịch tiền. | Phải có |
| FR-26 | Lọc theo loại dịch vụ (Tất cả/Biển số/Video) + xuất báo cáo. | Nên có |

### 6.5 Dashboard & Thống kê

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-27 | Dashboard admin — 6 thẻ tóm tắt: tổng cán bộ, active hôm nay, tổng lượt xử lý, tổng point cấp, tổng point tiêu thụ, tỷ lệ thành công. | Phải có |
| FR-28 | Dashboard admin — 6+ biểu đồ: cột (khối lượng/ngày), đường (xu hướng thành công), tròn (phân bổ point/module), diện tích (cấp vs tiêu thụ/tuần), cột ngang (theo quốc gia), bảng xếp hạng top 10 cán bộ. | Phải có |
| FR-29 | Dashboard admin — chỉ báo sức khỏe: trạng thái server, CPU/GPU, ổ đĩa, hàng đợi. Cập nhật 30 giây. | Nên có |
| FR-30 | Dashboard cán bộ — 5 thẻ tóm tắt (số dư, lượt xử lý, sửa video, hạn mức, tỷ lệ thành công) + biểu đồ cột 7 ngày + 5 giao dịch gần nhất. | Phải có |
| FR-31 | Thống kê point (Admin): tổng cấp, tổng tiêu thụ, còn lưu hành, phân tách module. Không dữ liệu tiền. | Phải có |

### 6.6 Lưu trữ & Cấu hình

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| FR-32 | Lưu trữ file: tạo thư mục, tải lên/xuống, xem trước, lọc (ảnh/video/đã xử lý/chưa), theo dõi quota. | Phải có |
| FR-33 | Cấu hình (Admin): chi phí module, giới hạn đồng thời, hàng đợi (FIFO/LIFO), giới hạn lưu trữ. Thay đổi có hiệu lực ngay, không cần restart. | Phải có |
| FR-34 | Quản lý người dùng: bảng tìm kiếm/lọc được, cột (tên, email, vai trò, point, giao dịch, trạng thái), nút thao tác (sửa, point, khóa/mở, gửi lại OTP). | Phải có |

---

## 7. Yêu cầu phi chức năng

| ID | Loại | Yêu cầu | Ưu tiên |
|---|---|---|---|
| NFR-01 | Hiệu năng | Xử lý ảnh biển số < 30 giây (P95, 20 đồng thời). | Phải có |
| NFR-02 | Hiệu năng | Sửa video sâu < 10 phút (P95, file 500 MB). | Phải có |
| NFR-03 | Hiệu năng | Dashboard load < 5 giây (P95, dữ liệu 500 user). | Nên có |
| NFR-04 | Hiệu năng | Hỗ trợ 500 tài khoản + 20 task AI đồng thời. | Phải có |
| NFR-05 | Bảo mật | RBAC: 2 vai trò (Admin, Cán bộ). Cán bộ không truy cập chức năng admin (API trả 403). | Phải có |
| NFR-06 | Bảo mật | Mật khẩu: bcrypt (hệ số >= 12). Truyền dữ liệu: HTTPS TLS 1.2+. OTP: băm trước khi lưu DB. | Phải có |
| NFR-07 | Bảo mật | Dữ liệu & mô hình AI 100% on-premise. Không gọi API ra dịch vụ bên ngoài. Không đẩy dữ liệu lên cloud bên thứ 3. Cho phép người dùng truy cập hệ thống từ Internet qua VPN hoặc Reverse Proxy + HTTPS. | Phải có |
| NFR-08 | Bảo mật | Log audit: mọi thao tác admin (tạo tài khoản, điều chỉnh point, thay đổi cấu hình) kèm thời gian, người thực hiện. | Phải có |
| NFR-09 | Sẵn sàng | Uptime >= 99.5% (đo hàng tháng, trừ bảo trì <= 4h/tháng). | Phải có |
| NFR-10 | Tin cậy | Pipeline AI lỗi → thử lại tối đa 2 lần trước khi báo thất bại. | Phải có |
| NFR-11 | Trình duyệt | Chrome, Firefox, Safari, Edge (2 phiên bản mới nhất), viewport >= 1280px. | Phải có |
| NFR-12 | Ngôn ngữ | Giao diện tiếng Việt: tất cả nhãn, thông báo, cảnh báo. | Phải có |
| NFR-13 | Khả dụng | Admin mới, sau 15 phút hướng dẫn, hoàn thành tạo tài khoản + cấp point + cấu hình (>= 90% trong test 5 người). | Nên có |
| NFR-14 | Bảo mật | Truy cập từ Internet phải qua Reverse Proxy (Nginx/HAProxy) hoặc VPN. Reverse Proxy thực hiện SSL termination, rate limiting (tối đa 100 req/s/IP), chặn IP đáng ngờ. | Phải có |
| NFR-15 | Bảo mật | Web Application Firewall (WAF): chặn SQL injection, XSS, CSRF. Header bảo mật: HSTS, X-Frame-Options, CSP. | Phải có |
| NFR-16 | Bảo mật | Brute-force protection: khóa IP sau 10 lần đăng nhập sai trong 5 phút (thời gian khóa 30 phút). | Phải có |
| NFR-17 | Bảo mật | Chứng chỉ SSL/TLS từ Public CA (Let's Encrypt hoặc tương đương) cho tên miền truy cập công khai. | Phải có |
| NFR-18 | Bảo mật | Session timeout: 30 phút không hoạt động → tự động đăng xuất. JWT/session token có thời hạn tối đa 8 giờ. | Phải có |

---

## 8. Yêu cầu dữ liệu

| ID | Thực thể | Dữ liệu chính | Lưu trữ |
|---|---|---|---|
| DR-01 | Tài khoản | ID, tên, email, mật khẩu (băm), vai trò, point, trạng thái (Chờ xác nhận/Hoạt động/Đã khóa), ngày tạo, đăng nhập cuối | Vòng đời + 1 năm |
| DR-02 | Xác nhận OTP | ID, ID tài khoản, OTP (băm), tạo/hết hạn (10 phút), trạng thái, số lần sai, IP xác nhận | 90 ngày |
| DR-03 | Giao dịch | ID, ID cán bộ, thời gian, loại (trừ_point/admin_điều_chỉnh), dịch vụ, point, số dư sau, lý do admin | 3 năm |
| DR-04 | Công việc xử lý | ID job, ID cán bộ, module, file đầu vào, cấu hình, thời gian, trạng thái, kết quả, điểm tin cậy | 2 năm |
| DR-05 | File lưu trữ | ID, ID cán bộ, thư mục, tên gốc, kích thước, MIME, ngày tải, trạng thái xử lý | Theo quota |
| DR-06 | Cấu hình | Key-value + log thay đổi (ai, gì, khi nào) | Không giới hạn |
| DR-07 | Tổng thể | Toàn bộ DR-01 đến DR-06 phải nằm trên database/storage on-premise. Không lưu trữ trên cloud bên thứ 3. Truy cập dữ liệu từ Internet chỉ thông qua ứng dụng web (đã xác thực). | Theo từng DR |

---

## 9. Tích hợp hệ thống

| Hệ thống | Giao thức | Dữ liệu | SLA |
|---|---|---|---|
| Engine AI (on-premise) | REST/gRPC nội bộ | Ảnh/video + cấu hình → kết quả AI | Ảnh < 30s, Video < 10 phút |
| SMTP Server | SMTP/TLS | Email OTP xác nhận + email reset mật khẩu. Hỗ trợ SMTP nội bộ hoặc relay ra Internet (cho cán bộ dùng email công cộng). | Gửi trong 60 giây |
| File Storage (NAS) | File system | Upload/download ảnh, video, kết quả | Xác nhận < 5s (file < 50 MB) |
| Reverse Proxy / VPN Gateway | HTTPS/TLS 1.2+ | Tiếp nhận kết nối từ Internet, chuyển tiếp đến Application Server nội bộ | Latency thêm < 100ms |

> Hệ thống không gọi API dịch vụ AI hoặc lưu trữ bên ngoài. Kết nối Internet chỉ phục vụ: (1) người dùng truy cập ứng dụng web, (2) gửi email OTP/reset mật khẩu.

---

## 10. Ràng buộc & Giả định

**Ràng buộc:** Server & AI on-premise (không triển khai trên cloud công cộng); cho phép truy cập từ Internet qua VPN hoặc Reverse Proxy; không thanh toán tiền; không tự đăng ký; không OAuth; cần GPU NVIDIA; chỉ web (không mobile); file tối đa 20 MB ảnh / 500 MB video.

**Giả định:** Mô hình AI đã sẵn sàng; server GPU được cung cấp trước; SMTP server có sẵn (nội bộ hoặc relay); đường truyền Internet đủ băng thông cho 500 user truy cập đồng thời; có IP tĩnh hoặc domain để publish hệ thống; firewall/reverse proxy được cấu hình bảo mật; admin có kỹ năng CNTT cơ bản.

**Phụ thuộc:** Mô hình AI, server GPU, SMTP, chứng chỉ SSL/TLS (public CA cho truy cập Internet), hạ tầng mạng, firewall/reverse proxy, IP tĩnh hoặc tên miền.

---

## 11. Rủi ro

| ID | Rủi ro | Khả năng | Ảnh hưởng | Giảm thiểu |
|---|---|---|---|---|
| R-01 | AI chính xác < 90% cho ảnh xấu | Trung bình | Cao | Hiển thị điểm tin cậy; xử lý lại; cải thiện model |
| R-02 | Chi phí GPU vượt ngân sách | Trung bình | Trung bình | Giới hạn đồng thời; mua theo giai đoạn |
| R-03 | Admin quá tải cấp point thủ công | Trung bình | Trung bình | Thao tác hàng loạt; Phase 2 tự phục vụ |
| R-04 | Upload video 500 MB chậm | Thấp | Trung bình | Chunked upload; thanh tiến trình; thử lại |
| R-05 | Cán bộ khó sử dụng | Trung bình | Thấp | UX đơn giản; tài liệu; đào tạo |
| R-06 | Mất điện/hỏng server | Thấp | Cao | UPS; RAID; sao lưu hàng ngày |
| R-07 | Truy cập trái phép dữ liệu nhạy cảm | Thấp | Rất cao | RBAC; mã hóa; audit log; kiểm tra an ninh |
| R-08 | Email OTP bị spam filter chặn | Thấp | Trung bình | Whitelist domain SMTP; cấu hình SPF/DKIM nếu dùng relay Internet |
| R-09 | Tấn công từ Internet (DDoS, brute-force, SQL injection) | Trung bình | Rất cao | WAF + rate limiting + IP blacklist + penetration test định kỳ |
| R-10 | Chứng chỉ SSL hết hạn gây gián đoạn truy cập | Thấp | Cao | Auto-renew (Let's Encrypt/certbot); cảnh báo trước 30 ngày |
| R-11 | Đường truyền Internet bị gián đoạn | Trung bình | Cao | Dual ISP hoặc failover; cán bộ nội bộ vẫn truy cập qua LAN |

---

## 12. Yêu cầu triển khai

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| TR-01 | Tạo sẵn 1 admin + 5 cán bộ mẫu khi triển khai. | Phải có |
| TR-02 | Tài liệu hướng dẫn admin (tạo tài khoản, cấp point, cấu hình, dashboard). | Phải có |
| TR-03 | Tài liệu hướng dẫn cán bộ (đăng nhập, OTP, xử lý biển số, sửa video). | Phải có |
| TR-04 | Thiết lập cấu hình mặc định (chi phí point, giới hạn, hàng đợi). | Phải có |
| TR-05 | Đào tạo: 1 buổi admin + 1 buổi cán bộ trước triển khai. | Phải có |
| TR-06 | Smoke test production: tạo cán bộ → OTP → point → biển số → video → dashboard. | Phải có |
| TR-07 | Sao lưu tự động hàng ngày (database + file storage). | Phải có |
| TR-08 | Cấu hình Reverse Proxy/VPN gateway + chứng chỉ SSL public + firewall rules trước khi mở truy cập Internet. | Phải có |
| TR-09 | Penetration test trước khi go-live (tối thiểu: OWASP Top 10). | Phải có |

---

## 13. Hạ tầng On-Premise + Truy cập Internet (tham khảo)

| Server | Cấu hình đề xuất |
|---|---|
| Application Server | CPU 8 cores, RAM 32 GB, SSD 500 GB |
| AI Processing Server | CPU 8 cores, RAM 64 GB, GPU NVIDIA T4 (16 GB) x2, SSD 1 TB |
| Database Server | CPU 4 cores, RAM 16 GB, SSD 500 GB (RAID 1) |
| File Storage | NAS/SAN 5 TB (RAID 5) |
| Firewall / Reverse Proxy | Nginx/HAProxy hoặc hardware firewall. SSL termination, rate limiting, WAF. IP tĩnh hoặc tên miền. |
| Network | LAN Gigabit nội bộ + đường truyền Internet (tối thiểu 100 Mbps symmetrical) + VPN gateway (tùy chọn) |
| UPS | Tất cả server, tối thiểu 30 phút |

---

## Tổng hợp yêu cầu

| Loại | Số lượng |
|---|---|
| Yêu cầu chức năng (FR) | 34 |
| Yêu cầu phi chức năng (NFR) | 18 |
| Yêu cầu dữ liệu (DR) | 7 |
| Quy tắc nghiệp vụ (BRULE) | 13 |
| Yêu cầu triển khai (TR) | 9 |
| **Tổng cộng** | **81** |

---

*Tài liệu BRD Hvideo Lite v2.0 — Nền tảng AI phục hồi biển số xe & sửa chữa video. Phục vụ 500 cán bộ công an, triển khai on-premise với truy cập từ Internet. Phương thức xác nhận email: OTP 6 chữ số (10 phút).*
