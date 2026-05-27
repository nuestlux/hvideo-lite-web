export function getMockResponse(url: string, method: string, _data?: any) {
  const isDemo = localStorage.getItem('token')?.startsWith('demo-token-');
  if (!isDemo) return null;

  const today = new Date();
  const day = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString();
  };
  const dayLabel = (n: number) => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return days[d.getDay()];
  };

  const mockMap: Record<string, () => any> = {
    'GET /dashboard/admin': () => ({
      data: {
        summary: { total_users: 14, total_jobs: 128, success_rate: 87.5 },
        daily_volume: Array.from({ length: 7 }, (_, i) => ({ date: dayLabel(6 - i), value: Math.floor(8 + Math.random() * 20) })),
        success_trend: Array.from({ length: 7 }, (_, i) => ({ date: dayLabel(6 - i), rate: 75 + Math.floor(Math.random() * 20) })),
        weekly_issued: Array.from({ length: 7 }, (_, i) => ({ date: dayLabel(6 - i), value: Math.floor(50 + Math.random() * 150) })),
        weekly_consumed: Array.from({ length: 7 }, (_, i) => ({ date: dayLabel(6 - i), value: Math.floor(30 + Math.random() * 100) })),
        by_module: [
          { name: 'Nhận diện biển số', value: 45 },
          { name: 'Sửa video (Nhanh)', value: 28 },
          { name: 'Sửa video (Sâu)', value: 15 },
          { name: 'Tra cứu', value: 12 },
        ],
        top_officers: [
          { id: 3, name: 'Nguyễn Văn Bình', email: 'binh.nv@example.com', points: 187, txns: 42 },
          { id: 4, name: 'Trần Thị Mai', email: 'mai.tt@example.com', points: 156, txns: 38 },
          { id: 5, name: 'Lê Hoàng Nam', email: 'nam.lh@example.com', points: 134, txns: 31 },
          { id: 6, name: 'Phạm Minh Đức', email: 'duc.pm@example.com', points: 112, txns: 27 },
          { id: 7, name: 'Hoàng Thu Hà', email: 'ha.ht@example.com', points: 98, txns: 24 },
          { id: 8, name: 'Đỗ Văn Hùng', email: 'hung.dv@example.com', points: 87, txns: 21 },
          { id: 9, name: 'Ngô Thị Lan', email: 'lan.nt@example.com', points: 76, txns: 19 },
          { id: 10, name: 'Vũ Quốc Anh', email: 'anh.vq@example.com', points: 65, txns: 16 },
          { id: 11, name: 'Bùi Thị Hương', email: 'huong.bt@example.com', points: 54, txns: 14 },
          { id: 12, name: 'Đinh Công Thành', email: 'thanh.dc@example.com', points: 43, txns: 11 },
        ],
      },
      message: 'Success',
    }),

    'GET /dashboard/officer': () => ({
      data: {
        points: 200,
        total_jobs: 32,
        success_rate: 84.4,
        weekly_volume: Array.from({ length: 7 }, (_, i) => ({ date: dayLabel(6 - i), value: Math.floor(2 + Math.random() * 8) })),
        recent_txns: [
          { time: day(0), point: -5, balance_after: 195, reason: 'Tiêu thụ: Nhận diện biển số' },
          { time: day(1), point: -10, balance_after: 200, reason: 'Tiêu thụ: Sửa video (Sâu)' },
          { time: day(2), point: 50, balance_after: 210, reason: 'Cấp point định kỳ' },
          { time: day(3), point: -5, balance_after: 160, reason: 'Tiêu thụ: Nhận diện biển số' },
          { time: day(4), point: -15, balance_after: 165, reason: 'Tiêu thụ: Sửa video (Nhanh)' },
        ],
      },
      message: 'Success',
    }),

    'GET /health/server': () => ({
      data: {
        cpu: { percent: 42, cores: 8 },
        memory: { used: 8589934592, total: 17179869184, percent: 50 },
        disk: { used: 128849018880, total: 515396075520, percent: 25 },
        gpu: [
          { id: 0, name: 'NVIDIA RTX 4060', load: 34.5, memory_used: 4096, memory_total: 12288 },
        ],
        timestamp: new Date().toISOString(),
      },
      message: 'Success',
    }),

    'GET /admin/users/': () => ({
      data: {
        items: [
          { id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin', status: 'hoat_dong', points: 500, created_at: day(30) },
          { id: 2, name: 'Cán bộ A', email: 'canbo@example.com', role: 'can_bo', status: 'hoat_dong', points: 200, created_at: day(28) },
          { id: 3, name: 'Nguyễn Văn Bình', email: 'binh.nv@example.com', role: 'can_bo', status: 'hoat_dong', points: 180, created_at: day(25) },
          { id: 4, name: 'Trần Thị Mai', email: 'mai.tt@example.com', role: 'can_bo', status: 'hoat_dong', points: 250, created_at: day(24) },
          { id: 5, name: 'Lê Hoàng Nam', email: 'nam.lh@example.com', role: 'can_bo', status: 'hoat_dong', points: 120, created_at: day(22) },
          { id: 6, name: 'Phạm Minh Đức', email: 'duc.pm@example.com', role: 'can_bo', status: 'hoat_dong', points: 310, created_at: day(20) },
          { id: 7, name: 'Hoàng Thu Hà', email: 'ha.ht@example.com', role: 'can_bo', status: 'hoat_dong', points: 95, created_at: day(18) },
          { id: 8, name: 'Đỗ Văn Hùng', email: 'hung.dv@example.com', role: 'can_bo', status: 'hoat_dong', points: 160, created_at: day(16) },
          { id: 9, name: 'Ngô Thị Lan', email: 'lan.nt@example.com', role: 'can_bo', status: 'hoat_dong', points: 220, created_at: day(14) },
          { id: 10, name: 'Vũ Quốc Anh', email: 'anh.vq@example.com', role: 'can_bo', status: 'hoat_dong', points: 145, created_at: day(12) },
          { id: 11, name: 'Bùi Thị Hương', email: 'huong.bt@example.com', role: 'can_bo', status: 'hoat_dong', points: 88, created_at: day(10) },
          { id: 12, name: 'Đinh Công Thành', email: 'thanh.dc@example.com', role: 'can_bo', status: 'hoat_dong', points: 175, created_at: day(8) },
        ],
        total: 12,
        page: 1,
        limit: 20,
      },
      message: 'Success',
    }),

    'GET /admin/transactions': () => ({
      data: {
        items: Array.from({ length: 20 }, (_, i) => ({
          id: 1000 + i,
          user_id: i % 12 + 1,
          user_name: ['Admin', 'Cán bộ A', 'Nguyễn Văn Bình', 'Trần Thị Mai', 'Lê Hoàng Nam', 'Phạm Minh Đức', 'Hoàng Thu Hà', 'Đỗ Văn Hùng', 'Ngô Thị Lan', 'Vũ Quốc Anh', 'Bùi Thị Hương', 'Đinh Công Thành'][i % 12],
          user_email: ['admin@example.com', 'canbo@example.com', 'binh.nv@example.com', 'mai.tt@example.com', 'nam.lh@example.com', 'duc.pm@example.com', 'ha.ht@example.com', 'hung.dv@example.com', 'lan.nt@example.com', 'anh.vq@example.com', 'huong.bt@example.com', 'thanh.dc@example.com'][i % 12],
          type: i % 3 === 0 ? 'admin_adjustment' : 'deduction',
          service: i % 3 === 0 ? null : ['license_plate_image', 'license_plate_video', 'video_repair_fast', 'video_repair_deep'][i % 4],
          point: i % 3 === 0 ? 50 + i * 5 : -(5 + (i % 4) * 5),
          balance_before: 100 + i * 10,
          balance_after: 100 + i * 10 + (i % 3 === 0 ? 50 + i * 5 : -(5 + (i % 4) * 5)),
          reason: i % 3 === 0 ? 'Cấp point định kỳ' : `Tiêu thụ: ${['license_plate_image', 'license_plate_video', 'video_repair_fast', 'video_repair_deep'][i % 4]}`,
          created_at: day(i),
        })),
        total: 128,
        page: 1,
        limit: 20,
      },
      message: 'Success',
    }),

    'GET /me/transactions': () => ({
      data: {
        items: Array.from({ length: 5 }, (_, i) => ({
          id: 2000 + i,
          user_id: 2,
          type: i % 2 === 0 ? 'deduction' : 'admin_adjustment',
          service: i % 2 === 0 ? ['license_plate_image', 'video_repair_fast'][i % 2] : null,
          point: i % 2 === 0 ? -5 * (i + 1) : 30 + i * 10,
          balance_before: 200 - i * 5,
          balance_after: 200 - i * 5 + (i % 2 === 0 ? -5 * (i + 1) : 30 + i * 10),
          reason: i % 2 === 0 ? 'Tiêu thụ xử lý' : 'Cấp point',
          created_at: day(i),
        })),
        total: 12,
        page: 1,
        limit: 5,
      },
      message: 'Success',
    }),

    'GET /admin/points/stats': () => ({
      data: {
        total_issued: 5200,
        total_consumed: 3850,
        total_circulating: 1350,
        by_service: {
          license_plate_image: 1250,
          license_plate_video: 980,
          video_repair_fast: 720,
          video_repair_deep: 900,
        },
      },
      message: 'Success',
    }),

    'GET /files': () => ({
      data: {
        items: Array.from({ length: 8 }, (_, i) => ({
          id: 100 + i,
          user_id: i % 12 + 1,
          name: `bie_so_${100 + i}.jpg`,
          original_name: `bie_so_${100 + i}.jpg`,
          size: Math.floor(500000 + Math.random() * 5000000),
          mime_type: i % 3 === 0 ? 'video/mp4' : 'image/jpeg',
          folder: '/',
          processed: ['chua_xu_ly', 'da_xu_ly', 'dang_xu_ly'][i % 3],
          created_at: day(i),
        })),
        total: 36,
        page: 1,
        limit: 20,
      },
      message: 'Success',
    }),

    'GET /files/quota': () => ({
      data: { used: 256789012, limit: 1073741824, percent: 23.9 },
      message: 'Success',
    }),

    'GET /ai/jobs': () => ({
      data: {
        items: [
          { id: 1, user_id: 3, module: 'license_plate', status: 'completed', input_file: 'bie_so_101.jpg', input_file_id: 101, config: { country: 'VN', vehicle_type: 'car' }, result: { plate: '30A-12345', vehicle_type: 'Xe con', country: 'Việt Nam' }, confidence: '95.2%', error: null, started_at: day(1), finished_at: day(0), created_at: day(1), batch_id: null, country: 'VN' },
          { id: 2, user_id: 4, module: 'license_plate', status: 'completed', input_file: 'bie_so_102.jpg', input_file_id: 102, config: { country: 'VN', vehicle_type: 'truck' }, result: { plate: '29B-67890', vehicle_type: 'Xe tải', country: 'Việt Nam' }, confidence: '88.7%', error: null, started_at: day(2), finished_at: day(1), created_at: day(2), batch_id: null, country: 'VN' },
          { id: 3, user_id: 5, module: 'video_repair', status: 'completed', input_file: 'corrupted_video_1.mp4', input_file_id: 201, config: { mode: 'fast', codec: 'h264' }, result: { mode: 'fast', errors_found: 3, errors: ['Không đồng bộ audio/video', 'Frame bị lỗi'], errors_repaired: ['Không đồng bộ audio/video', 'Frame bị lỗi'], fixed_count: 2 }, confidence: null, error: null, started_at: day(3), finished_at: day(2), created_at: day(3), batch_id: 'batch_001', country: null },
          { id: 4, user_id: 6, module: 'license_plate', status: 'completed', input_file: 'bie_so_103.jpg', input_file_id: 103, config: { country: 'VN', vehicle_type: 'motorcycle' }, result: { plate: '51F-54321', vehicle_type: 'Xe máy', country: 'Việt Nam' }, confidence: '92.1%', error: null, started_at: day(4), finished_at: day(3), created_at: day(4), batch_id: null, country: 'VN' },
          { id: 5, user_id: 7, module: 'video_repair', status: 'failed', input_file: 'corrupted_video_2.mp4', input_file_id: 202, config: { mode: 'deep', codec: 'h265' }, result: null, confidence: null, error: 'File không hỗ trợ codec', started_at: day(5), finished_at: null, created_at: day(5), batch_id: 'batch_002', country: null },
          { id: 6, user_id: 8, module: 'license_plate', status: 'processing', input_file: 'bie_so_104.jpg', input_file_id: 104, config: { country: 'VN' }, result: null, confidence: null, error: null, started_at: day(0), finished_at: null, created_at: day(0), batch_id: null, country: 'VN' },
        ],
        total: 6,
        page: 1,
        limit: 20,
      },
      message: 'Success',
    }),

    'GET /packages': () => ({
      data: [
        { id: 1, name: 'Gói Cơ Bản', type: 'STANDARD', price: 100000, points: 100, description: 'Phù hợp cho nhu cầu sử dụng cơ bản', is_active: true, created_at: day(30), updated_at: day(30) },
        { id: 2, name: 'Gói Chuyên Nghiệp', type: 'STANDARD', price: 500000, points: 600, description: 'Dành cho cán bộ xử lý thường xuyên', is_active: true, created_at: day(30), updated_at: day(28) },
        { id: 3, name: 'Gói Cao Cấp', type: 'STANDARD', price: 1000000, points: 1300, description: 'Không giới hạn nhu cầu sử dụng', is_active: true, created_at: day(30), updated_at: day(25) },
        { id: 4, name: 'Doanh Nghiệp', type: 'ENTERPRISE', price: 5000000, points: 7000, description: 'Liên hệ để nhận báo giá riêng', is_active: true, created_at: day(30), updated_at: day(20) },
      ],
      message: 'Lấy danh sách gói thành công',
    }),

    'GET /admin/packages': () => ({
      data: [
        { id: 1, name: 'Gói Cơ Bản', type: 'STANDARD', price: 100000, points: 100, description: 'Phù hợp cho nhu cầu sử dụng cơ bản', is_active: true, created_at: day(30), updated_at: day(30) },
        { id: 2, name: 'Gói Chuyên Nghiệp', type: 'STANDARD', price: 500000, points: 600, description: 'Dành cho cán bộ xử lý thường xuyên', is_active: true, created_at: day(30), updated_at: day(28) },
        { id: 3, name: 'Gói Cao Cấp', type: 'STANDARD', price: 1000000, points: 1300, description: 'Không giới hạn nhu cầu sử dụng', is_active: true, created_at: day(30), updated_at: day(25) },
        { id: 4, name: 'Doanh Nghiệp', type: 'ENTERPRISE', price: 5000000, points: 7000, description: 'Liên hệ để nhận báo giá riêng', is_active: true, created_at: day(30), updated_at: day(20) },
      ],
      message: 'Lấy danh sách gói thành công',
    }),

    'GET /admin/config/': () => ({
      data: [
        { key: 'max_file_size', value: '500', description: 'Kích thước file tối đa (MB)', updated_by: 1, updated_at: day(10) },
        { key: 'allowed_file_types', value: 'jpg,png,mp4,avi,mov', description: 'Định dạng file cho phép', updated_by: 1, updated_at: day(10) },
        { key: 'default_points', value: '100', description: 'Point mặc định cho tài khoản mới', updated_by: 1, updated_at: day(10) },
        { key: 'session_timeout', value: '30', description: 'Thời gian hết phiên (phút)', updated_by: 1, updated_at: day(10) },
        { key: 'maintenance_mode', value: 'false', description: 'Chế độ bảo trì', updated_by: null, updated_at: null },
      ],
      message: 'Success',
    }),

    'GET /profile': () => {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return {
        data: { id: 1, name: user.name || 'Admin', email: user.email || 'admin@example.com', role: user.role || 'admin', status: 'hoat_dong', points: user.points || 500, created_at: day(30) },
        message: 'Success',
      };
    },

    'POST /auth/logout': () => ({
      data: {},
      message: 'Đăng xuất thành công',
    }),
  };

  const key = `${method} ${new URL(url, 'http://localhost').pathname}`;
  const exact = mockMap[key];
  if (exact) return exact();

  const prefixKey = Object.keys(mockMap).find(k => {
    if (k.includes(':id')) {
      const pattern = k.replace(/:id/g, '\\d+');
      return new RegExp(`^${pattern}$`).test(key);
    }
    return false;
  });
  if (prefixKey) return mockMap[prefixKey]();

  return null;
}
