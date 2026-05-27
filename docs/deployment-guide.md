# Hvideo Lite — Hướng dẫn Triển khai

## Yêu cầu
- Python 3.11+
- Node.js 18+
- GPU NVIDIA (khuyến nghị: T4 16GB x2 cho AI)

## Cài đặt

### 1. Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate    # Windows
source venv/bin/activate  # Linux

pip install -r requirements.txt
# Tạo file .env từ .env.example, cập nhật SMTP + JWT secret
cp .env.example .env
```

### 2. Frontend
```bash
cd frontend
npm install
npm run build
```

### 3. Chạy
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Mở http://localhost:8000

## Triển khai Production

### Nginx Reverse Proxy
Sử dụng `deploy/nginx.conf`:
- Thay `hvideolite.example.com` bằng domain thật
- Cấu hình SSL với Let's Encrypt
- Chạy: `certbot --nginx -d hvideolite.example.com`

### Backup
- Tạo task scheduler chạy `deploy/backup.bat` hàng ngày
- Hoặc dùng cron trên Linux:
```bash
0 2 * * * /path/to/deploy/backup.sh
```

### Bảo mật
- Đổi `JWT_SECRET` trong `.env` thành chuỗi ngẫu nhiên
- Cấu hình SMTP thật (không dùng Gmail cho production — dùng SMTP nội bộ)
- Firewall: chỉ mở port 443 (HTTPS) từ Internet, không mở port 8000
- WAF: khuyến nghị Cloudflare hoặc ModSecurity

## Kiểm tra
```bash
# Health check
curl https://domain/api/health

# Test login
curl -X POST https://domain/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```
