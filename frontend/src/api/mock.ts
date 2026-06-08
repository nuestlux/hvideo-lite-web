const skeletonAuthRoutes = [
  'POST /auth/login',
  'POST /auth/forgot-password',
  'POST /auth/verify-otp',
  'POST /auth/set-password',
  'POST /auth/reset-password',
  'POST /auth/logout',
];

function skeletonMock(key: string, data?: any) {
  if (key === 'POST /auth/login') {
    if (!data) return null;
    const { email, password } = data;
    const users: Record<string, any> = {
      'admin@example.com': { id: 1, name: 'Admin', email: 'admin@example.com', role: 'admin', status: 'hoat_dong', points: 500 },
      'canbo@example.com': { id: 2, name: 'Cán bộ A', email: 'canbo@example.com', role: 'can_bo', status: 'hoat_dong', points: 200 },
    };
    const user = users[email];
    if (!user || password !== '123456') return null;
    return {
      data: {
        token: 'demo-token-' + user.role,
        user,
      },
      message: 'Đăng nhập thành công',
    };
  }
  if (key === 'POST /auth/forgot-password') {
    return { data: {}, message: 'Mã xác nhận đã được gửi đến email của bạn' };
  }
  if (key === 'POST /auth/verify-otp') {
    if (!data) return null;
    return { data: { setup_token: 'skeleton-setup-token-' + Date.now() }, message: 'Xác thực thành công' };
  }
  if (key === 'POST /auth/set-password' || key === 'POST /auth/reset-password') {
    return { data: {}, message: 'Đặt mật khẩu thành công' };
  }
  if (key === 'POST /auth/logout') {
    return { data: {}, message: 'Đã đăng xuất' };
  }
  return null;
}

// Mutable in-memory packages for admin package management demo (so "Tạo gói mua mới" actually persists in UI when using mocks)
let mockAdminPackages: any[] = [
  { id: 1, name: 'Gói Cơ Bản', type: 'STANDARD', price: 100000, points: 100, description: 'Phù hợp cho nhu cầu sử dụng cơ bản', features: ['Nhận dạng biển số xe', 'Khôi phục video cơ bản'], storage_limit_mb: 200, sort_order: 0, is_active: true, created_at: '2026-05-01T00:00:00', updated_at: '2026-05-01T00:00:00' },
  { id: 2, name: 'Gói Chuyên Nghiệp', type: 'STANDARD', price: 500000, points: 600, description: 'Dành cho cán bộ xử lý thường xuyên', features: ['Nhận dạng biển số xe', 'Khôi phục video cơ bản', 'Khôi phục video nâng cao AI', 'Tải file hàng loạt'], storage_limit_mb: 500, sort_order: 1, is_active: true, created_at: '2026-05-01T00:00:00', updated_at: '2026-05-03T00:00:00' },
  { id: 3, name: 'Gói Cao Cấp', type: 'STANDARD', price: 1000000, points: 1300, description: 'Không giới hạn nhu cầu sử dụng', features: ['Nhận dạng biển số xe', 'Khôi phục video cơ bản', 'Khôi phục video nâng cao AI', 'Sửa video theo file tham chiếu', 'Tải file hàng loạt', 'Ưu tiên xử lý trong hàng đợi'], storage_limit_mb: 2048, sort_order: 2, is_active: true, created_at: '2026-05-01T00:00:00', updated_at: '2026-05-06T00:00:00' },
  { id: 4, name: 'Doanh Nghiệp', type: 'ENTERPRISE', description: 'Liên hệ để nhận báo giá riêng', features: ['Nhận dạng biển số xe', 'Khôi phục video nâng cao AI', 'API riêng (Rate limit cao)', 'Hỗ trợ kỹ thuật 24/7', 'Báo cáo phân tích chi tiết'], storage_limit_mb: 10240, sort_order: 3, is_active: true, created_at: '2026-05-01T00:00:00', updated_at: '2026-05-11T00:00:00' },
];

export function getMockResponse(url: string, method: string, _data?: any) {
  const apiPath = new URL(url, 'http://localhost').pathname;
  const reqKey = `${method} ${apiPath}`;

  const isDemo = localStorage.getItem('token')?.startsWith('demo-token-');

  if (skeletonAuthRoutes.includes(reqKey)) {
    return skeletonMock(reqKey, _data);
  }

  if (!isDemo) return null;

  // === Dynamic package admin CRUD (fixes "Tạo gói mua mới" not persisting in mock/demo mode) ===
  if (reqKey === 'GET /admin/packages') {
    return { data: mockAdminPackages, message: 'Lấy danh sách gói thành công' };
  }
  if (reqKey === 'POST /admin/packages') {
    if (!_data) return { data: {}, message: 'Dữ liệu không hợp lệ' };
    const body = typeof _data === 'string' ? JSON.parse(_data) : _data;
    const name = (body.name || '').trim();
    // Basic duplicate prevention in mock (real enforcement + better errors live in backend)
    const isDup = mockAdminPackages.some((p: any) => p.name.toLowerCase() === name.toLowerCase());
    const newId = Math.max(0, ...mockAdminPackages.map((p: any) => p.id)) + 1;
    const now = new Date().toISOString();
    const newPkg = {
      id: newId,
      name: name || `Gói ${newId}`,
      type: body.type || 'STANDARD',
      price: body.price ?? 0,
      points: body.points ?? 0,
      description: body.description || '',
      features: body.features || [],
      storage_limit_mb: body.storage_limit_mb ?? 500,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
      created_at: now,
      updated_at: now,
    };
    if (!isDup) {
      mockAdminPackages.push(newPkg);
    }
    return { data: newPkg, message: isDup ? 'Tên gói đã tồn tại (mock cho phép để demo UI)' : 'Tạo gói thành công' };
  }
  if (reqKey.startsWith('PUT /admin/packages/')) {
    const idMatch = reqKey.match(/\/(\d+)$/);
    const id = idMatch ? parseInt(idMatch[1], 10) : 0;
    const body = typeof _data === 'string' ? JSON.parse(_data) : (_data || {});
    const idx = mockAdminPackages.findIndex((p: any) => p.id === id);
    if (idx === -1) return { data: {}, message: 'Không tìm thấy gói' };
    const updated = { ...mockAdminPackages[idx], ...body, updated_at: new Date().toISOString() };
    mockAdminPackages[idx] = updated;
    return { data: updated, message: 'Cập nhật gói thành công' };
  }
  if (reqKey.startsWith('DELETE /admin/packages/')) {
    const idMatch = reqKey.match(/\/(\d+)$/);
    const id = idMatch ? parseInt(idMatch[1], 10) : 0;
    const beforeLen = mockAdminPackages.length;
    mockAdminPackages = mockAdminPackages.filter((p: any) => p.id !== id);
    return { data: {}, message: beforeLen !== mockAdminPackages.length ? 'Xóa gói thành công' : 'Không tìm thấy gói' };
  }
  if (reqKey === 'GET /packages') {
    const active = mockAdminPackages.filter((p: any) => p.is_active);
    return { data: active, message: 'Lấy danh sách gói thành công' };
  }

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
        summary: { 
          total_users: { value: 14, trend: [10, 11, 10, 12, 13, 14, 14], isUp: true, percentChange: 12.5 },
          total_jobs: { value: 128, trend: [90, 100, 110, 105, 115, 120, 128], isUp: true, percentChange: 8.2 },
          success_rate: { value: 87.5, trend: [85, 86, 86.5, 87, 85, 86, 87.5], isUp: true, percentChange: 1.5 }
        },
        daily_volume: Array.from({ length: 7 }, (_, i) => ({ 
          date: dayLabel(6 - i), 
          'Biển số': Math.floor(10 + Math.random() * 20),
          'Sửa video': Math.floor(5 + Math.random() * 15),
        })),
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
        points: { value: 200, trend: [150, 160, 180, 170, 190, 195, 200], isUp: true, percentChange: 5.2 },
        total_jobs: { value: 32, trend: [20, 22, 25, 28, 26, 30, 32], isUp: true, percentChange: 14.3 },
        success_rate: { value: 84.4, trend: [80, 81, 82, 83, 83.5, 84, 84.4], isUp: true, percentChange: 2.1 },
        weekly_volume: Array.from({ length: 7 }, (_, i) => ({ 
          date: dayLabel(6 - i), 
          'Biển số': Math.floor(2 + Math.random() * 8),
          'Sửa video': Math.floor(1 + Math.random() * 4),
        })),
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

    'POST /files/upload': () => ({
      data: {
        id: Math.floor(Math.random() * 1000) + 1000,
        user_id: 1,
        name: `mocked_upload_${Date.now()}.jpg`,
        original_name: 'uploaded_file.jpg',
        size: 1024000,
        mime_type: 'image/jpeg',
        folder: '/',
        processed: 'chua_xu_ly',
        created_at: new Date().toISOString()
      },
      message: 'Tải lên thành công'
    }),

    'POST /ai/process': () => ({
      data: {
        batch_id: 'mock_batch_' + Date.now(),
        jobs: [
          { id: 9999, module: 'license_plate' }
        ]
      },
      message: 'Success'
    }),

    'GET /ai/jobs': () => {
      // Parse query params to see if file_id is passed
      const urlObj = new URL(url, 'http://localhost');
      const fileIdParam = urlObj.searchParams.get('file_id');
      
      let items = [
        { id: 1, user_id: 3, module: 'license_plate', status: 'completed', input_file: 'bie_so_101.jpg', input_file_id: 101, config: { country: 'VN', vehicle_type: 'car' }, result: { plate: '30A-12345', vehicle_type: 'car', plate_color: 'white', country: 'VN', original_crop_url: 'https://fakeimg.pl/300x100/cccccc/909090?text=30A-12345&font=bebas', enhanced_url: 'https://fakeimg.pl/300x100/ffffff/000000?text=30A-12345&font=bebas' }, confidence: '95.2', error: null, started_at: day(1), finished_at: day(0), created_at: day(1), batch_id: null, country: 'VN' },
        { id: 2, user_id: 4, module: 'license_plate', status: 'completed', input_file: 'bie_so_102.jpg', input_file_id: 102, config: { country: 'VN', vehicle_type: 'truck' }, result: { plate: '29B-67890', vehicle_type: 'truck', plate_color: 'yellow', country: 'VN', original_crop_url: 'https://fakeimg.pl/300x100/cccccc/909090?text=29B-67890&font=bebas', enhanced_url: 'https://fakeimg.pl/300x100/ffffff/000000?text=29B-67890&font=bebas' }, confidence: '88.7', error: null, started_at: day(2), finished_at: day(1), created_at: day(2), batch_id: null, country: 'VN' },
        { id: 3, user_id: 5, module: 'video_repair', status: 'completed', input_file: 'corrupted_video_1.mp4', input_file_id: 201, config: { mode: 'fast', codec: 'h264' }, result: { mode: 'fast', errors_found: 3, errors: ['Không đồng bộ audio/video', 'Frame bị lỗi'], errors_repaired: ['Không đồng bộ audio/video', 'Frame bị lỗi'], fixed_count: 2 }, confidence: null, error: null, started_at: day(3), finished_at: day(2), created_at: day(3), batch_id: 'batch_001', country: null },
      ];

      // If filtering by file_id, dynamically generate a completed job for it!
      if (fileIdParam) {
        items = [{
          id: 9999, user_id: 1, module: 'license_plate', status: 'completed', input_file: 'uploaded_file.jpg', input_file_id: parseInt(fileIdParam), config: { country: 'VN', vehicle_type: 'car' }, result: { plate: '51F-999.99', vehicle_type: 'car', plate_color: 'white', country: 'VN', original_crop_url: 'https://fakeimg.pl/300x100/cccccc/909090?text=51F-999.99&font=bebas', enhanced_url: 'https://fakeimg.pl/300x100/ffffff/000000?text=51F-999.99&font=bebas' }, confidence: '98.5', error: null, started_at: day(0), finished_at: day(0), created_at: day(0), batch_id: null, country: 'VN'
        }];
      }

      return {
        data: {
          items,
          total: items.length,
          page: 1,
          limit: 20,
        },
        message: 'Success',
      };
    },

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
        { id: 1, name: 'Gói Cơ Bản', type: 'STANDARD', price: 100000, points: 100, description: 'Phù hợp cho nhu cầu sử dụng cơ bản', features: ['Nhận dạng biển số xe', 'Khôi phục video cơ bản'], storage_limit_mb: 200, sort_order: 0, is_active: true, created_at: day(30), updated_at: day(30) },
        { id: 2, name: 'Gói Chuyên Nghiệp', type: 'STANDARD', price: 500000, points: 600, description: 'Dành cho cán bộ xử lý thường xuyên', features: ['Nhận dạng biển số xe', 'Khôi phục video cơ bản', 'Khôi phục video nâng cao AI', 'Tải file hàng loạt'], storage_limit_mb: 500, sort_order: 1, is_active: true, created_at: day(30), updated_at: day(28) },
        { id: 3, name: 'Gói Cao Cấp', type: 'STANDARD', price: 1000000, points: 1300, description: 'Không giới hạn nhu cầu sử dụng', features: ['Nhận dạng biển số xe', 'Khôi phục video cơ bản', 'Khôi phục video nâng cao AI', 'Sửa video theo file tham chiếu', 'Tải file hàng loạt', 'Ưu tiên xử lý trong hàng đợi'], storage_limit_mb: 2048, sort_order: 2, is_active: true, created_at: day(30), updated_at: day(25) },
        { id: 4, name: 'Doanh Nghiệp', type: 'ENTERPRISE', description: 'Liên hệ để nhận báo giá riêng', features: ['Nhận dạng biển số xe', 'Khôi phục video nâng cao AI', 'API riêng (Rate limit cao)', 'Hỗ trợ kỹ thuật 24/7', 'Báo cáo phân tích chi tiết'], storage_limit_mb: 10240, sort_order: 3, is_active: true, created_at: day(30), updated_at: day(20) },
      ],
      message: 'Lấy danh sách gói thành công',
    }),

    'GET /admin/config/': () => ({
      data: [
        // Nhóm biển số xe
        { key: 'lp_vn_cost',   value: '5',  description: 'Chi phí point – Biển số Việt Nam (model AI-VN)', group: 'lp_cost', group_label: 'Chi phí AI – Nhận dạng biển số', updated_by: 1, updated_at: day(10) },
        { key: 'lp_us_cost',   value: '8',  description: 'Chi phí point – Biển số Hoa Kỳ (model AI-US)', group: 'lp_cost', group_label: 'Chi phí AI – Nhận dạng biển số', updated_by: 1, updated_at: day(10) },
        { key: 'lp_jp_cost',   value: '10', description: 'Chi phí point – Biển số Nhật Bản (model AI-JP)', group: 'lp_cost', group_label: 'Chi phí AI – Nhận dạng biển số', updated_by: 1, updated_at: day(10) },
        { key: 'lp_kr_cost',   value: '10', description: 'Chi phí point – Biển số Hàn Quốc (model AI-KR)', group: 'lp_cost', group_label: 'Chi phí AI – Nhận dạng biển số', updated_by: 1, updated_at: day(10) },
        { key: 'lp_eu_cost',   value: '8',  description: 'Chi phí point – Biển số châu Âu (model AI-EU)', group: 'lp_cost', group_label: 'Chi phí AI – Nhận dạng biển số', updated_by: 1, updated_at: day(10) },
        { key: 'lp_cn_cost',   value: '8',  description: 'Chi phí point – Biển số Trung Quốc (model AI-CN)', group: 'lp_cost', group_label: 'Chi phí AI – Nhận dạng biển số', updated_by: 1, updated_at: day(10) },
        // Nhóm sửa video
        { key: 'video_repair_basic_cost',     value: '10', description: 'Chi phí point – Sửa video nhanh (không dùng AI, ~2 phút)', group: 'video_cost', group_label: 'Chi phí AI – Khôi phục video', updated_by: 1, updated_at: day(10) },
        { key: 'video_repair_advanced_cost',  value: '25', description: 'Chi phí point – Sửa video nâng cao AI (~8 phút)', group: 'video_cost', group_label: 'Chi phí AI – Khôi phục video', updated_by: 1, updated_at: day(10) },
        { key: 'video_repair_reference_cost', value: '15', description: 'Chi phí point – Sửa video theo file tham chiếu', group: 'video_cost', group_label: 'Chi phí AI – Khôi phục video', updated_by: 1, updated_at: day(10) },
        // Nhóm hệ thống
        { key: 'queue_mode',            value: 'FIFO', description: 'Chế độ hàng đợi xử lý: FIFO hoặc LIFO', group: 'system', group_label: 'Giới hạn phần cứng & hệ thống', updated_by: 1, updated_at: day(10) },
        { key: 'max_concurrent_jobs',   value: '5',   description: 'Số lượng tác vụ chạy đồng thời tối đa trên máy chủ', group: 'system', group_label: 'Giới hạn phần cứng & hệ thống', updated_by: 1, updated_at: day(10) },
        { key: 'max_queue_size',        value: '50',  description: 'Dung lượng tối đa hàng đợi chờ xử lý', group: 'system', group_label: 'Giới hạn phần cứng & hệ thống', updated_by: null, updated_at: null },
        { key: 'job_timeout_minutes',   value: '30',  description: 'Thời gian chờ tối đa cho mỗi tác vụ (phút)', group: 'system', group_label: 'Giới hạn phần cứng & hệ thống', updated_by: null, updated_at: null },
        { key: 'storage_limit_mb',      value: '500', description: 'Dung lượng lưu trữ file tối đa mặc định mỗi người dùng (MB)', group: 'system', group_label: 'Giới hạn phần cứng & hệ thống', updated_by: null, updated_at: null },
        { key: 'max_upload_size_mb',    value: '200', description: 'Kích thước file tải lên tối đa mỗi lần (MB)', group: 'system', group_label: 'Giới hạn phần cứng & hệ thống', updated_by: null, updated_at: null },
        { key: 'max_video_duration_sec',value: '600', description: 'Thời lượng video tối đa được xử lý (giây)', group: 'system', group_label: 'Giới hạn phần cứng & hệ thống', updated_by: null, updated_at: null },
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
