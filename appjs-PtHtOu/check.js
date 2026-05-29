
// ============================================================
//  MOCK DATABASE
// ============================================================
const TIER_LIMITS = {
  admin:      { plate_img:999, plate_vid:999, video_fast:999, video_deep:999, label:'Admin',  color:'tag-danger'  },
  enterprise: { plate_img:200, plate_vid:100, video_fast:50,  video_deep:30,  label:'Enterprise', color:'tag-purple'  },
  pro:        { plate_img:50,  plate_vid:30,  video_fast:20,  video_deep:10,  label:'Pro',    color:'tag-primary' },
  basic:      { plate_img:10,  plate_vid:5,   video_fast:5,   video_deep:3,   label:'Basic',  color:'tag-info'    },
  demo:       { plate_img:5,   plate_vid:2,   video_fast:2,   video_deep:1,   label:'Demo',   color:'tag-warning' },
};
const FEATURE_FLAGS = {
  admin: { pages: ['dashboard','plate','video','topup','history','admin-users','admin-config','admin-revenue','profile','audit-log'] },
  user:  { pages: ['dashboard','plate','video','topup','history','profile','audit-log'] },
};
function getFeatureFlags(role) { return FEATURE_FLAGS[role] || FEATURE_FLAGS.user; }
function canAccess(role, page) { return getFeatureFlags(role).pages.includes(page); }
function getTierLimits(tier) { return TIER_LIMITS[tier] || TIER_LIMITS.demo; }
function getTierDaily(tier, module, sub) {
  const t = getTierLimits(tier);
  if (module === 'plate') return sub === 'img' ? t.plate_img : t.plate_vid;
  return sub === 'fast' ? t.video_fast : t.video_deep;
}
function getVolumeDiscount(userId, module) {
  const usage = getUserTodayUsage(userId, module);
  const total = module === 'plate' ? usage.plate_img + usage.plate_vid : usage.video_fast + usage.video_deep;
  if (total >= 50) return 0.7;
  if (total >= 20) return 0.85;
  if (total >= 10) return 0.95;
  return 1;
}
function getEffectiveCost(baseCost, userId, module) {
  return Math.round(baseCost * getVolumeDiscount(userId, module));
}
function getUserTodayUsage(userId, module) {
  const today = new Date().toISOString().slice(0,10);
  if (!DB.dailyUsage[userId]) DB.dailyUsage[userId] = {};
  if (!DB.dailyUsage[userId][today]) DB.dailyUsage[userId][today] = { plate_img:0, plate_vid:0, video_fast:0, video_deep:0 };
  return DB.dailyUsage[userId][today];
}
function recordUsage(userId, module, sub) {
  const usage = getUserTodayUsage(userId, module);
  usage[module === 'plate' ? (sub||'img') : (sub||'deep')]++;
}

let DB;
function initDB() {
  DB = {
    dailyUsage: {},
    // ---- USERS ----
    users: [
      { id: 'U001', name: 'Nguyễn Tuấn', email: 'tuan.nguyen@company.vn', password:'password123', role: 'admin', points: 2450, avatar: 'NT', status: 'active', created: '2026-01-01', total_txn: 112, color: '#1668dc,#854eca', last_login:null, tier:'admin', oauth_links:{ google:{id:'google-u001',email:'tuan.nguyen@gmail.com',linked_at:'2026-05-18 10:30'}, facebook:null, apple:null, microsoft:null } },
      { id: 'U002', name: 'Lê Hương', email: 'huong.le@logistics.vn', password:'password123', role: 'user', points: 8200, avatar: 'LH', status: 'active', created: '2026-02-15', total_txn: 39, color: '#49aa19,#0891b2', last_login:null, tier:'enterprise', oauth_links:{ google:null, facebook:{id:'fb-u002',email:'huong.le@facebook.com',linked_at:'2026-03-01 09:00'}, apple:{id:'apple-u002',email:'huong@icloud.com',linked_at:'2026-04-10 14:30'}, microsoft:null } },
      { id: 'U003', name: 'Phạm Trung', email: 'trung.pham@email.com', password:'password123', role: 'user', points: 0, avatar: 'PT', status: 'locked', created: '2026-05-10', total_txn: 15, color: '#d89614,#dc4446', last_login:null, tier:'basic', oauth_links:{ google:null, facebook:null, apple:null, microsoft:null } },
      { id: 'U004', name: 'Võ Dũng', email: 'dung.vo@security.gov.vn', password:'password123', role: 'user', points: 5100, avatar: 'VD', status: 'active', created: '2026-03-20', total_txn: 33, color: '#854eca,#dc4446', last_login:null, tier:'pro', oauth_links:{ google:{id:'google-u004',email:'dung.vo@gmail.com',linked_at:'2026-03-21 08:00'}, facebook:null, apple:null, microsoft:null } },
      { id: 'U005', name: 'Trần Minh', email: 'minh.tran@newuser.com', password:'password123', role: 'user', points: 50, avatar: 'TM', status: 'unverified', created: '2026-05-19', total_txn: 10, color: '#13a8a8,#16a34a', last_login:null, tier:'demo', oauth_links:{ google:null, facebook:null, apple:null, microsoft:null } },
      { id: 'U006', name: 'Người Dùng Demo', email: 'demo@visionfix.vn', password:'demo123', role: 'user', points: 100, avatar: 'DD', status: 'active', created: '2026-05-19', total_txn: 0, color: '#16a34a,#0891b2', last_login:null, tier:'demo', oauth_links:{ google:null, facebook:null, apple:null, microsoft:null } },
    ],
    currentUserId: null,
    verificationCodes: {},
    audit_log: [
      { id:'AUD-001', user_id:'U001', action:'LOGIN', detail:'Đăng nhập bằng email: tuan.nguyen@company.vn', status:'success', method:'email', provider:null, ip:'192.168.1.42', user_agent:'Chrome 125', time:'2026-05-19 09:30:00' },
      { id:'AUD-002', user_id:'U001', action:'OAUTH_LOGIN', detail:'Đăng nhập OAuth Google: tuan.nguyen@gmail.com', status:'success', method:'oauth', provider:'google', ip:'192.168.1.42', user_agent:'Chrome 125', time:'2026-05-19 11:45:23' },
      { id:'AUD-003', user_id:'U002', action:'OAUTH_LOGIN', detail:'Đăng nhập OAuth Facebook: huong.le@facebook.com', status:'success', method:'oauth', provider:'facebook', ip:'10.0.0.15', user_agent:'Firefox 127', time:'2026-05-19 10:00:00' },
      { id:'AUD-004', user_id:'U001', action:'OAUTH_LOGIN', detail:'Đăng nhập OAuth Apple thất bại: hết hạn token', status:'failed', method:'oauth', provider:'apple', ip:'10.0.0.1', user_agent:'Safari 18', time:'2026-05-18 22:15:10' },
      { id:'AUD-005', user_id:'U001', action:'TOPUP', detail:'Nạp Point: Gói Pro 2.000 PT qua VNPay', status:'success', method:'email', provider:null, ip:'10.0.0.1', user_agent:'Chrome 125', time:'2026-05-18 14:00:00' },
      { id:'AUD-006', user_id:'U004', action:'PLATE_PROCESS_DONE', detail:'Xử lý biển số batch 200 ảnh: 198/200 phát hiện thành công', status:'success', method:'oauth', provider:'google', ip:'192.168.1.100', user_agent:'Edge 126', time:'2026-05-17 16:30:45' },
      { id:'AUD-007', user_id:'U002', action:'LOGIN', detail:'Đăng nhập bằng email: huong.le@logistics.vn', status:'success', method:'email', provider:null, ip:'10.0.0.15', user_agent:'Firefox 127', time:'2026-05-17 10:00:00' },
      { id:'AUD-008', user_id:'U001', action:'USER_EDIT', detail:'Admin chỉnh sửa thông tin user U004 (Võ Dũng)', status:'success', method:'secret', provider:null, ip:'192.168.1.42', user_agent:'Chrome 125', time:'2026-05-16 08:00:00' },
      { id:'AUD-009', user_id:'U002', action:'VIDEO_REPAIR_SUCCESS', detail:'Repair video warehouse_01.mp4 - chất lượng 96%', status:'success', method:'email', provider:null, ip:'10.0.0.15', user_agent:'Firefox 127', time:'2026-05-15 09:15:00' },
      { id:'AUD-010', user_id:'U001', action:'LOGIN', detail:'Đăng nhập thất bại: sai mật khẩu (IP lạ)', status:'failed', method:'email', provider:null, ip:'172.16.0.50', user_agent:'Opera 112', time:'2026-05-15 07:30:00' },
      { id:'AUD-011', user_id:'U004', action:'LOGIN', detail:'Đăng nhập bằng email: dung.vo@security.gov.vn', status:'success', method:'email', provider:null, ip:'192.168.1.100', user_agent:'Edge 126', time:'2026-05-14 11:00:00' },
      { id:'AUD-012', user_id:'U002', action:'OAUTH_LINK', detail:'Liên kết tài khoản Apple: huong@icloud.com', status:'success', method:'oauth', provider:'apple', ip:'10.0.0.15', user_agent:'Safari 18', time:'2026-05-13 16:45:00' },
      { id:'AUD-013', user_id:'U001', action:'PAYMENT_SUCCESS', detail:'Thanh toán gói Starter 100PT thành công qua MoMo', status:'success', method:'email', provider:null, ip:'192.168.1.42', user_agent:'Chrome 125', time:'2026-05-12 14:20:00' },
      { id:'AUD-014', user_id:'U001', action:'OAUTH_LOGIN', detail:'Đăng nhập OAuth Google: tuan.nguyen@gmail.com', status:'success', method:'oauth', provider:'google', ip:'10.0.0.1', user_agent:'Chrome 125', time:'2026-05-11 09:00:00' },
      { id:'AUD-015', user_id:'U005', action:'REGISTER', detail:'Đăng ký tài khoản: minh.tran@newuser.com', status:'success', method:'email', provider:null, ip:'172.16.0.50', user_agent:'Opera 112', time:'2026-05-10 08:30:00' },
      { id:'AUD-016', user_id:'U005', action:'LOGIN', detail:'Đăng nhập thất bại: chưa xác thực email', status:'failed', method:'email', provider:null, ip:'172.16.0.50', user_agent:'Opera 112', time:'2026-05-10 08:31:00' },
      { id:'AUD-017', user_id:'U001', action:'ADJUST_POINTS', detail:'Admin điều chỉnh Point user U003 (Phạm Trung): +0 (đã khóa)', status:'success', method:'email', provider:null, ip:'192.168.1.42', user_agent:'Chrome 125', time:'2026-05-09 17:00:00' },
      { id:'AUD-018', user_id:'U002', action:'PLATE_PROCESS_START', detail:'Bắt đầu xử lý batch 80 ảnh biển số xe tải', status:'success', method:'email', provider:null, ip:'10.0.0.15', user_agent:'Firefox 127', time:'2026-05-08 10:30:00' },
      { id:'AUD-019', user_id:'U001', action:'OAUTH_LINK', detail:'Liên kết tài khoản Microsoft: tuan@outlook.com', status:'success', method:'oauth', provider:'microsoft', ip:'192.168.1.42', user_agent:'Edge 126', time:'2026-05-07 15:00:00' },
      { id:'AUD-020', user_id:'U004', action:'VIDEO_REPAIR_SUCCESS', detail:'Repair video evidence_01.mp4 - khôi phục 4 khung hình hỏng', status:'success', method:'email', provider:null, ip:'192.168.1.100', user_agent:'Chrome 125', time:'2026-05-06 09:45:00' },
      { id:'AUD-021', user_id:'U001', action:'USER_LOCK', detail:'Admin khóa tài khoản U003 (Phạm Trung) - vi phạm TOS', status:'success', method:'secret', provider:null, ip:'192.168.1.42', user_agent:'Chrome 125', time:'2026-05-05 20:00:00' },
      { id:'AUD-022', user_id:'U001', action:'VIDEO_REPAIR_FAILED', detail:'Repair video corruption_01.mp4 thất bại: file không đọc được', status:'failed', method:'email', provider:null, ip:'10.0.0.1', user_agent:'Safari 18', time:'2026-05-04 22:10:00' },
      { id:'AUD-023', user_id:'U002', action:'LOGIN', detail:'Đăng nhập thất bại: sai mật khẩu (lần 3)', status:'failed', method:'email', provider:null, ip:'10.0.0.15', user_agent:'Firefox 127', time:'2026-05-03 18:30:00' },
      { id:'AUD-024', user_id:'U001', action:'TXN_REFUND', detail:'Hoàn Point tự động - OCR không đạt ngưỡng (93%)', status:'success', method:'email', provider:null, ip:'192.168.1.42', user_agent:'Chrome 125', time:'2026-05-02 12:00:00' },
      { id:'AUD-025', user_id:'U001', action:'OAUTH_LOGIN', detail:'Đăng nhập OAuth Google: tuan.nguyen@gmail.com', status:'success', method:'oauth', provider:'google', ip:'192.168.1.42', user_agent:'Chrome 125', time:'2026-05-01 08:00:00' },
      { id:'AUD-026', user_id:'U004', action:'PLATE_PROCESS_DONE', detail:'Xử lý biển số batch 100 ảnh: phát hiện 95 biển số hợp lệ', status:'success', method:'email', provider:null, ip:'192.168.1.100', user_agent:'Chrome 125', time:'2026-04-28 14:00:00' },
      { id:'AUD-027', user_id:'U001', action:'TXN_TOPUP', detail:'Nạp 550PT từ gói Basic qua ZaloPay', status:'success', method:'email', provider:null, ip:'192.168.1.42', user_agent:'Chrome 125', time:'2026-04-25 09:00:00' },
      { id:'AUD-028', user_id:'U002', action:'PAYMENT_SUCCESS', detail:'Thanh toán gói Enterprise 10.000PT qua Stripe', status:'success', method:'email', provider:null, ip:'10.0.0.15', user_agent:'Firefox 127', time:'2026-04-20 15:30:00' },
      { id:'AUD-029', user_id:'U001', action:'VERIFY_EMAIL', detail:'Xác thực email thành công: tuan.nguyen@company.vn', status:'success', method:'email', provider:null, ip:'192.168.1.42', user_agent:'Chrome 125', time:'2026-04-15 10:00:00' },
      { id:'AUD-030', user_id:'U002', action:'CHANGE_PASSWORD', detail:'Đổi mật khẩu tài khoản Lê Hương', status:'success', method:'email', provider:null, ip:'10.0.0.15', user_agent:'Firefox 127', time:'2026-04-10 08:00:00' },
    ],

    // ---- PACKAGES ----
    packages: [
      { id: 'PKG01', name: 'Starter', points: 100, bonus_pct: 0, total_points: 100, price_vnd: 99000, price_usd: 3.99, active: true },
      { id: 'PKG02', name: 'Basic', points: 500, bonus_pct: 10, total_points: 550, price_vnd: 449000, price_usd: 17.99, active: true },
      { id: 'PKG03', name: 'Pro', points: 2000, bonus_pct: 20, total_points: 2400, price_vnd: 1599000, price_usd: 64.99, active: true },
      { id: 'PKG04', name: 'Enterprise', points: 10000, bonus_pct: 30, total_points: 13000, price_vnd: 6999000, price_usd: 279.99, active: true },
    ],

    // ---- TRANSACTIONS ----
    transactions: [
      // === U001 — Nguyễn Tuấn (Admin, current balance: 2450) ===
      { id: 'TXN-001', user_id: 'U001', type: 'topup', desc: 'Gói Basic — 500 PT via MoMo', points: +550, balance_after: 550, gateway: 'momo', package_id: 'PKG02', amount_vnd: 449000, status: 'completed', time: '2026-04-01 09:15' },
      { id: 'TXN-002', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 545, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-01 14:30' },
      { id: 'TXN-003', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 540, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-02 10:00' },
      { id: 'TXN-004', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (video) → 43A-012.34', points: -15, balance_after: 525, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-03 08:45' },
      { id: 'TXN-005', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (nhanh) — dashcam_01.mp4', points: -10, balance_after: 515, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-04 16:20' },
      { id: 'TXN-006', user_id: 'U001', type: 'refund', desc: 'Hoàn Point — Xử lý video thất bại', points: +10, balance_after: 525, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-04 16:22' },
      { id: 'TXN-007', user_id: 'U001', type: 'topup', desc: 'Gói Pro — 2.000 PT via VNPay', points: +2400, balance_after: 2925, gateway: 'vnpay', package_id: 'PKG03', amount_vnd: 1599000, status: 'completed', time: '2026-04-10 11:00' },
      { id: 'TXN-008', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 2920, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-12 09:30' },
      { id: 'TXN-009', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 36C-456.78', points: -5, balance_after: 2915, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-15 13:00' },
      { id: 'TXN-010', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 92D-321.00', points: -5, balance_after: 2910, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-18 10:15' },
      { id: 'TXN-011', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — security_0518.mp4', points: -20, balance_after: 2890, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-20 15:45' },
      { id: 'TXN-012', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 2885, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-22 08:00' },
      { id: 'TXN-013', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (video) → 51G-123.45', points: -15, balance_after: 2870, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-25 11:30' },
      { id: 'TXN-014', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (nhanh) — traffic_01.mp4', points: -10, balance_after: 2860, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-28 14:00' },
      { id: 'TXN-015', user_id: 'U001', type: 'refund', desc: 'Hoàn Point — Không phát hiện biển số hợp lệ', points: +5, balance_after: 2865, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-02 09:20' },
      { id: 'TXN-016', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 2860, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-05 16:10' },
      { id: 'TXN-017', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — evidence_01.mp4', points: -20, balance_after: 2840, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-08 10:30' },
      { id: 'TXN-018', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 92D-321.00', points: -5, balance_after: 2835, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-10 13:45' },
      { id: 'TXN-019', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (video) → 36C-456.78', points: -15, balance_after: 2820, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-12 09:00' },
      { id: 'TXN-020', user_id: 'U001', type: 'topup', desc: 'Gói Basic — 500 PT via ZaloPay', points: +550, balance_after: 3370, gateway: 'zalopay', package_id: 'PKG02', amount_vnd: 449000, status: 'completed', time: '2026-05-15 15:00' },
      { id: 'TXN-021', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 3365, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-16 08:30' },
      { id: 'TXN-022', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — accident_01.mp4', points: -20, balance_after: 3345, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-16 14:20' },
      { id: 'TXN-023', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 3340, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-17 10:00' },
      { id: 'TXN-024', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 3335, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-17 15:30' },
      { id: 'TXN-025', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 36C-456.78', points: -5, balance_after: 3330, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-18 09:15' },
      // Last topup to reach 2450: basic would have been 3330, need to end at 2450, so balance calc: subtract 880 total from recent uses
      // Actually let me recalculate: current user has 2450. Let me just set some deduction txns.
      { id: 'TXN-026', user_id: 'U001', type: 'topup', desc: 'Gói Starter — 100 PT via PayPal', points: +100, balance_after: 3430, gateway: 'paypal', package_id: 'PKG01', amount_vnd: 99000, status: 'completed', time: '2026-05-18 14:00' },
      { id: 'TXN-027', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (nhanh) — clip_01.mp4', points: -10, balance_after: 3420, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-18 16:00' },
      { id: 'TXN-028', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 92D-321.00', points: -5, balance_after: 3415, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-18 17:30' },
      { id: 'TXN-029', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (video) → 51G-123.45', points: -15, balance_after: 3400, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 08:00' },
      { id: 'TXN-030', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 3395, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 09:30' },
      { id: 'TXN-031', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — footage_01.mp4', points: -20, balance_after: 3375, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 10:15' },
      { id: 'TXN-032', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 3370, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 11:00' },
      { id: 'TXN-033', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 3365, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 11:30' },
      { id: 'TXN-034', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (nhanh) — stream_01.mp4', points: -10, balance_after: 3355, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 12:00' },
      { id: 'TXN-035', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 36C-456.78', points: -5, balance_after: 3350, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 12:30' },
      { id: 'TXN-036', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (video) → 92D-321.00', points: -15, balance_after: 3335, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 13:00' },
      { id: 'TXN-037', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 3330, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 13:30' },
      { id: 'TXN-038', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — archive_01.mp4', points: -20, balance_after: 3310, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 14:00' },
      { id: 'TXN-039', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 3305, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 14:30' },
      { id: 'TXN-040', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 3300, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 15:00' },
      { id: 'TXN-041', user_id: 'U001', type: 'refund', desc: 'Hoàn Point — OCR không đạt ngưỡng', points: +5, balance_after: 3305, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 15:01' },
      // Target balance 2450: 3305 - 855 = 2450, need 855 PT of deductions
      { id: 'TXN-042', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — batch_01.mp4', points: -20, balance_after: 3285, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 15:15' },
      { id: 'TXN-043', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 3280, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 15:30' },
      { id: 'TXN-044', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (video) → 36C-456.78', points: -15, balance_after: 3265, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 15:45' },
      { id: 'TXN-045', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 92D-321.00', points: -5, balance_after: 3260, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 16:00' },
      { id: 'TXN-046', user_id: 'U001', type: 'topup', desc: 'Gói Starter — 100 PT via VNPay', points: +100, balance_after: 3360, gateway: 'vnpay', package_id: 'PKG01', amount_vnd: 99000, status: 'completed', time: '2026-05-19 16:05' },
      { id: 'TXN-047', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (nhanh) — clip_02.mp4', points: -10, balance_after: 3350, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 16:15' },
      { id: 'TXN-048', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 3345, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 16:30' },
      { id: 'TXN-049', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 3340, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 16:45' },
      { id: 'TXN-050', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — final_01.mp4', points: -20, balance_after: 3320, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 17:00' },
      // Balance still 3320 at this point... need to zero out more
      { id: 'TXN-051', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 3315, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 17:15' },
      { id: 'TXN-052', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 3310, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 17:30' },
      { id: 'TXN-053', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (video) → 51G-123.45', points: -15, balance_after: 3295, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 17:45' },
      { id: 'TXN-054', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 36C-456.78', points: -5, balance_after: 3290, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 18:00' },
      { id: 'TXN-055', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 92D-321.00', points: -5, balance_after: 3285, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 18:15' },
      { id: 'TXN-056', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (nhanh) — test_01.mp4', points: -10, balance_after: 3275, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 18:30' },
      { id: 'TXN-057', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — debug_01.mp4', points: -20, balance_after: 3255, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 18:45' },
      { id: 'TXN-058', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 3250, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 19:00' },
      { id: 'TXN-059', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 3245, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 19:15' },
      { id: 'TXN-060', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (video) → 29B-888.99', points: -15, balance_after: 3230, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 19:30' },
      // Still 3230... UGH let me just do big deductions
      { id: 'TXN-061', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — large_batch_01.mp4', points: -100, balance_after: 3130, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 19:45' },
      { id: 'TXN-062', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — large_batch_02.mp4', points: -100, balance_after: 3030, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 20:00' },
      { id: 'TXN-063', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (batch 7 ảnh)', points: -35, balance_after: 2995, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 20:15' },
      { id: 'TXN-064', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (batch 5 ảnh)', points: -25, balance_after: 2970, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 20:30' },
      { id: 'TXN-065', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (nhanh) — batch_03.mp4', points: -10, balance_after: 2960, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 20:45' },
      { id: 'TXN-066', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 2955, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 21:00' },
      { id: 'TXN-067', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 2950, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 21:15' },
      { id: 'TXN-068', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 36C-456.78', points: -5, balance_after: 2945, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 21:30' },
      { id: 'TXN-069', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 92D-321.00', points: -5, balance_after: 2940, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 21:45' },
      { id: 'TXN-070', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — batch_04.mp4', points: -20, balance_after: 2920, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 22:00' },
      { id: 'TXN-071', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 2915, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 22:15' },
      { id: 'TXN-072', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 2910, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 22:30' },
      { id: 'TXN-073', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (video) → 51G-123.45', points: -15, balance_after: 2895, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 22:45' },
      { id: 'TXN-074', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (nhanh) — clip_03.mp4', points: -10, balance_after: 2885, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 23:00' },
      { id: 'TXN-075', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 2880, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 23:15' },
      { id: 'TXN-076', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 36C-456.78', points: -5, balance_after: 2875, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 23:30' },
      { id: 'TXN-077', user_id: 'U001', type: 'topup', desc: 'Gói Starter — 100 PT via MoMo', points: +100, balance_after: 2975, gateway: 'momo', package_id: 'PKG01', amount_vnd: 99000, status: 'completed', time: '2026-05-19 23:45' },
      { id: 'TXN-078', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — final_batch.mp4', points: -20, balance_after: 2955, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 23:50' },
      { id: 'TXN-079', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (batch 5 ảnh)', points: -25, balance_after: 2930, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 23:55' },
      { id: 'TXN-080', user_id: 'U001', type: 'topup', desc: 'Gói Starter — 100 PT via Stripe', points: +100, balance_after: 3030, gateway: 'stripe', package_id: 'PKG01', amount_vnd: 99000, status: 'completed', time: '2026-05-20 00:00' },
      { id: 'TXN-081', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 92D-321.00', points: -5, balance_after: 3025, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 00:15' },
      { id: 'TXN-082', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 3020, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 00:30' },
      { id: 'TXN-083', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 3015, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 00:45' },
      { id: 'TXN-084', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 3010, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 01:00' },
      { id: 'TXN-085', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 3005, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 01:15' },
      { id: 'TXN-086', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 36C-456.78', points: -5, balance_after: 3000, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 01:30' },
      { id: 'TXN-087', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (nhanh) — clip_04.mp4', points: -10, balance_after: 2990, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 01:45' },
      { id: 'TXN-088', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — archive_batch.mp4', points: -20, balance_after: 2970, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 02:00' },
      { id: 'TXN-089', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (video) → 92D-321.00', points: -15, balance_after: 2955, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 02:15' },
      { id: 'TXN-090', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 2950, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 02:30' },
      // Still 2950... need to subtract 500 more. Let me simplify.
      { id: 'TXN-091', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — bulk_processing', points: -250, balance_after: 2700, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 03:00' },
      { id: 'TXN-092', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (batch 10 ảnh)', points: -50, balance_after: 2650, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 03:30' },
      { id: 'TXN-093', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (batch 8 ảnh)', points: -40, balance_after: 2610, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 04:00' },
      { id: 'TXN-094', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (nhanh) — batch_05.mp4', points: -10, balance_after: 2600, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 04:30' },
      { id: 'TXN-095', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — final_deep.mp4', points: -20, balance_after: 2580, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 05:00' },
      { id: 'TXN-096', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 2575, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 05:15' },
      { id: 'TXN-097', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 2570, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 05:30' },
      { id: 'TXN-098', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 2565, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 05:45' },
      { id: 'TXN-099', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 36C-456.78', points: -5, balance_after: 2560, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 06:00' },
      { id: 'TXN-100', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 92D-321.00', points: -5, balance_after: 2555, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 06:15' },
      { id: 'TXN-101', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (video) → 51G-123.45', points: -15, balance_after: 2540, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 06:30' },
      { id: 'TXN-102', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (nhanh) — clip_05.mp4', points: -10, balance_after: 2530, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 06:45' },
      { id: 'TXN-103', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (sâu) — deep_batch.mp4', points: -20, balance_after: 2510, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 07:00' },
      { id: 'TXN-104', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 2505, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 07:15' },
      { id: 'TXN-105', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 2500, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 07:30' },
      { id: 'TXN-106', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 2495, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 07:45' },
      { id: 'TXN-107', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 36C-456.78', points: -5, balance_after: 2490, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 08:00' },
      { id: 'TXN-108', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 92D-321.00', points: -5, balance_after: 2485, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 08:15' },
      { id: 'TXN-109', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 2480, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 08:30' },
      { id: 'TXN-110', user_id: 'U001', type: 'use', desc: 'Module 1 — Video repair (nhanh) — morning_clip.mp4', points: -10, balance_after: 2470, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 08:45' },
      { id: 'TXN-111', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 2465, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 09:00' },
      { id: 'TXN-112', user_id: 'U001', type: 'use', desc: 'Module 2 — Biển số (video) → 43A-012.34', points: -15, balance_after: 2450, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-20 09:15' },
      // === End U001 — balance: 2450 ✓ ===

      // === U002 — Lê Hương (current balance: 8200) ===
      { id: 'TXN-113', user_id: 'U002', type: 'topup', desc: 'Gói Pro — 2.000 PT via VNPay', points: +2400, balance_after: 2400, gateway: 'vnpay', package_id: 'PKG03', amount_vnd: 1599000, status: 'completed', time: '2026-03-01 08:00' },
      { id: 'TXN-114', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 20 ảnh)', points: -100, balance_after: 2300, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-03-05 10:30' },
      { id: 'TXN-115', user_id: 'U002', type: 'topup', desc: 'Gói Enterprise — 10.000 PT via Stripe', points: +13000, balance_after: 15300, gateway: 'stripe', package_id: 'PKG04', amount_vnd: 6999000, status: 'completed', time: '2026-03-10 14:00' },
      { id: 'TXN-116', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 50 ảnh)', points: -250, balance_after: 15050, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-03-15 09:00' },
      { id: 'TXN-117', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (sâu) — logistics_01.mp4', points: -20, balance_after: 15030, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-03-20 11:00' },
      { id: 'TXN-118', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (nhanh) — batch_10 videos', points: -100, balance_after: 14930, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-01 08:30' },
      { id: 'TXN-119', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 100 ảnh)', points: -500, balance_after: 14430, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-10 10:00' },
      { id: 'TXN-120', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (sâu) — warehouse_01.mp4', points: -20, balance_after: 14410, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-15 14:00' },
      { id: 'TXN-121', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 80 ảnh)', points: -400, balance_after: 14010, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-20 09:30' },
      { id: 'TXN-122', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 120 ảnh)', points: -600, balance_after: 13410, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-25 11:00' },
      { id: 'TXN-123', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (sâu) — fleet_01.mp4', points: -20, balance_after: 13390, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-01 08:00' },
      { id: 'TXN-124', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (sâu) — fleet_02.mp4', points: -20, balance_after: 13370, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-01 08:30' },
      { id: 'TXN-125', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 60 ảnh)', points: -300, balance_after: 13070, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-05 10:00' },
      { id: 'TXN-126', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 40 ảnh)', points: -200, balance_after: 12870, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-08 14:30' },
      { id: 'TXN-127', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (nhanh) — batch_20 videos', points: -200, balance_after: 12670, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-10 09:00' },
      { id: 'TXN-128', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 90 ảnh)', points: -450, balance_after: 12220, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-12 11:30' },
      { id: 'TXN-129', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 30 ảnh)', points: -150, balance_after: 12070, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-14 10:00' },
      { id: 'TXN-130', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (sâu) — delivery_01.mp4', points: -20, balance_after: 12050, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-15 14:00' },
      { id: 'TXN-131', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (sâu) — delivery_02.mp4', points: -20, balance_after: 12030, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-15 14:30' },
      { id: 'TXN-132', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (sâu) — delivery_03.mp4', points: -20, balance_after: 12010, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-15 15:00' },
      { id: 'TXN-133', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 70 ảnh)', points: -350, balance_after: 11660, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-16 09:00' },
      { id: 'TXN-134', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 50 ảnh)', points: -250, balance_after: 11410, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-16 14:00' },
      { id: 'TXN-135', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (nhanh) — batch_15 videos', points: -150, balance_after: 11260, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-17 10:00' },
      { id: 'TXN-136', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 100 ảnh)', points: -500, balance_after: 10760, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-17 15:00' },
      { id: 'TXN-137', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 60 ảnh)', points: -300, balance_after: 10460, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-18 08:30' },
      { id: 'TXN-138', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 80 ảnh)', points: -400, balance_after: 10060, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-18 10:00' },
      { id: 'TXN-139', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (sâu) — shipment_01.mp4', points: -20, balance_after: 10040, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-18 14:00' },
      { id: 'TXN-140', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (nhanh) — batch_30 videos', points: -300, balance_after: 9740, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-18 16:00' },
      { id: 'TXN-141', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 50 ảnh)', points: -250, balance_after: 9490, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 08:00' },
      { id: 'TXN-142', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 40 ảnh)', points: -200, balance_after: 9290, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 10:30' },
      { id: 'TXN-143', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (sâu) — tracking_01.mp4', points: -20, balance_after: 9270, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 13:00' },
      { id: 'TXN-144', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (nhanh) — batch_10 videos', points: -100, balance_after: 9170, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 15:00' },
      { id: 'TXN-145', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 30 ảnh)', points: -150, balance_after: 9020, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 16:00' },
      { id: 'TXN-146', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 20 ảnh)', points: -100, balance_after: 8920, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 17:00' },
      { id: 'TXN-147', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 60 ảnh)', points: -300, balance_after: 8620, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 18:00' },
      { id: 'TXN-148', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 40 ảnh)', points: -200, balance_after: 8420, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 19:00' },
      { id: 'TXN-149', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (sâu) — dispatch_01.mp4', points: -20, balance_after: 8400, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 20:00' },
      { id: 'TXN-150', user_id: 'U002', type: 'use', desc: 'Module 1 — Video repair (nhanh) — batch_5 videos', points: -50, balance_after: 8350, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 21:00' },
      { id: 'TXN-151', user_id: 'U002', type: 'use', desc: 'Module 2 — Biển số (batch 30 ảnh)', points: -150, balance_after: 8200, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 22:00' },

      // === U003 — Phạm Trung (locked, balance: 0) ===
      { id: 'TXN-152', user_id: 'U003', type: 'topup', desc: 'Gói Starter — 100 PT via MoMo', points: +100, balance_after: 100, gateway: 'momo', package_id: 'PKG01', amount_vnd: 99000, status: 'completed', time: '2026-05-10 10:00' },
      { id: 'TXN-153', user_id: 'U003', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 95, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-10 14:30' },
      { id: 'TXN-154', user_id: 'U003', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 90, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-11 09:00' },
      { id: 'TXN-155', user_id: 'U003', type: 'use', desc: 'Module 1 — Video repair (nhanh) — test.mp4', points: -10, balance_after: 80, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-11 15:00' },
      { id: 'TXN-156', user_id: 'U003', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 75, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-12 10:00' },
      { id: 'TXN-157', user_id: 'U003', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 70, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-12 14:30' },
      { id: 'TXN-158', user_id: 'U003', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 36C-456.78', points: -5, balance_after: 65, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-13 09:00' },
      { id: 'TXN-159', user_id: 'U003', type: 'use', desc: 'Module 2 — Biển số (video) → 92D-321.00', points: -15, balance_after: 50, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-13 15:00' },
      { id: 'TXN-160', user_id: 'U003', type: 'use', desc: 'Module 1 — Video repair (sâu) — final.mp4', points: -20, balance_after: 30, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-14 10:00' },
      { id: 'TXN-161', user_id: 'U003', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 25, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-14 14:30' },
      { id: 'TXN-162', user_id: 'U003', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 20, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-15 09:00' },
      { id: 'TXN-163', user_id: 'U003', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 15, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-15 14:00' },
      { id: 'TXN-164', user_id: 'U003', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 10, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-16 09:30' },
      { id: 'TXN-165', user_id: 'U003', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 36C-456.78', points: -5, balance_after: 5, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-16 14:00' },
      { id: 'TXN-166', user_id: 'U003', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 92D-321.00', points: -5, balance_after: 0, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-16 16:00' },

      // === U004 — Võ Dũng (current balance: 5100) ===
      { id: 'TXN-167', user_id: 'U004', type: 'topup', desc: 'Gói Enterprise — 10.000 PT via VNPay', points: +13000, balance_after: 13000, gateway: 'vnpay', package_id: 'PKG04', amount_vnd: 6999000, status: 'completed', time: '2026-03-20 08:00' },
      { id: 'TXN-168', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 200 ảnh)', points: -1000, balance_after: 12000, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-03-25 10:00' },
      { id: 'TXN-169', user_id: 'U004', type: 'use', desc: 'Module 1 — Video repair (sâu) — evidence_01.mp4', points: -20, balance_after: 11980, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-01 14:30' },
      { id: 'TXN-170', user_id: 'U004', type: 'use', desc: 'Module 1 — Video repair (sâu) — evidence_02.mp4', points: -20, balance_after: 11960, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-01 15:00' },
      { id: 'TXN-171', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 100 ảnh)', points: -500, balance_after: 11460, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-05 09:00' },
      { id: 'TXN-172', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 150 ảnh)', points: -750, balance_after: 10710, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-10 11:00' },
      { id: 'TXN-173', user_id: 'U004', type: 'use', desc: 'Module 1 — Video repair (sâu) — security_01.mp4', points: -20, balance_after: 10690, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-15 14:00' },
      { id: 'TXN-174', user_id: 'U004', type: 'use', desc: 'Module 1 — Video repair (sâu) — security_02.mp4', points: -20, balance_after: 10670, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-15 15:00' },
      { id: 'TXN-175', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 80 ảnh)', points: -400, balance_after: 10270, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-20 10:00' },
      { id: 'TXN-176', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 120 ảnh)', points: -600, balance_after: 9670, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-04-25 14:00' },
      { id: 'TXN-177', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 60 ảnh)', points: -300, balance_after: 9370, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-01 09:00' },
      { id: 'TXN-178', user_id: 'U004', type: 'use', desc: 'Module 1 — Video repair (sâu) — investigation_01.mp4', points: -20, balance_after: 9350, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-02 14:00' },
      { id: 'TXN-179', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 100 ảnh)', points: -500, balance_after: 8850, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-05 10:00' },
      { id: 'TXN-180', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 200 ảnh)', points: -1000, balance_after: 7850, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-08 11:00' },
      { id: 'TXN-181', user_id: 'U004', type: 'use', desc: 'Module 1 — Video repair (sâu) — surveillance_01.mp4', points: -20, balance_after: 7830, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-10 14:00' },
      { id: 'TXN-182', user_id: 'U004', type: 'use', desc: 'Module 1 — Video repair (nhanh) — batch_30 videos', points: -300, balance_after: 7530, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-12 10:00' },
      { id: 'TXN-183', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 80 ảnh)', points: -400, balance_after: 7130, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-14 09:00' },
      { id: 'TXN-184', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 100 ảnh)', points: -500, balance_after: 6630, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-15 14:00' },
      { id: 'TXN-185', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 50 ảnh)', points: -250, balance_after: 6380, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-16 10:00' },
      { id: 'TXN-186', user_id: 'U004', type: 'use', desc: 'Module 1 — Video repair (sâu) — case_01.mp4', points: -20, balance_after: 6360, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-16 15:00' },
      { id: 'TXN-187', user_id: 'U004', type: 'use', desc: 'Module 1 — Video repair (sâu) — case_02.mp4', points: -20, balance_after: 6340, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-16 16:00' },
      { id: 'TXN-188', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 60 ảnh)', points: -300, balance_after: 6040, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-17 09:00' },
      { id: 'TXN-189', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 40 ảnh)', points: -200, balance_after: 5840, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-17 14:00' },
      { id: 'TXN-190', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 30 ảnh)', points: -150, balance_after: 5690, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-18 10:00' },
      { id: 'TXN-191', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 20 ảnh)', points: -100, balance_after: 5590, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-18 15:00' },
      { id: 'TXN-192', user_id: 'U004', type: 'use', desc: 'Module 1 — Video repair (sâu) — forensic_01.mp4', points: -20, balance_after: 5570, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 09:00' },
      { id: 'TXN-193', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 50 ảnh)', points: -250, balance_after: 5320, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 11:00' },
      { id: 'TXN-194', user_id: 'U004', type: 'use', desc: 'Module 1 — Video repair (nhanh) — batch_10 videos', points: -100, balance_after: 5220, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 14:00' },
      { id: 'TXN-195', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (batch 20 ảnh)', points: -100, balance_after: 5120, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 16:00' },
      { id: 'TXN-196', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 5115, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 17:00' },
      { id: 'TXN-197', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 5110, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 17:30' },
      { id: 'TXN-198', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 5105, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 18:00' },
      { id: 'TXN-199', user_id: 'U004', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 5100, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 18:30' },
      // === End U004 — balance: 5100 ✓ ===

      // === U005 — Trần Minh (unverified, balance: 50) ===
      { id: 'TXN-200', user_id: 'U005', type: 'topup', desc: 'Gói Starter — 100 PT via PayPal', points: +100, balance_after: 100, gateway: 'paypal', package_id: 'PKG01', amount_vnd: 99000, status: 'completed', time: '2026-05-19 12:00' },
      { id: 'TXN-201', user_id: 'U005', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 95, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 13:00' },
      { id: 'TXN-202', user_id: 'U005', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 90, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 14:00' },
      { id: 'TXN-203', user_id: 'U005', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 43A-012.34', points: -5, balance_after: 85, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 14:30' },
      { id: 'TXN-204', user_id: 'U005', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 29B-888.99', points: -5, balance_after: 80, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 15:00' },
      { id: 'TXN-205', user_id: 'U005', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 36C-456.78', points: -5, balance_after: 75, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 15:30' },
      { id: 'TXN-206', user_id: 'U005', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 92D-321.00', points: -5, balance_after: 70, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 16:00' },
      { id: 'TXN-207', user_id: 'U005', type: 'use', desc: 'Module 1 — Video repair (nhanh) — test.mp4', points: -10, balance_after: 60, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 16:30' },
      { id: 'TXN-208', user_id: 'U005', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 51G-123.45', points: -5, balance_after: 55, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 17:00' },
      { id: 'TXN-209', user_id: 'U005', type: 'use', desc: 'Module 2 — Biển số (ảnh) → 30A-567.89', points: -5, balance_after: 50, gateway: null, package_id: null, amount_vnd: 0, status: 'completed', time: '2026-05-19 17:30' },
    ],

    // ---- POINT CONFIG ----
    config: {
      plate_image_cost: 5,
      plate_video_cost: 15,
      video_fast_cost: 10,
      video_deep_cost: 20,
      welcome_points: 50,
      max_upload_image_mb: 20,
      max_upload_video_mb: 500,
      max_batch_images: 20,
      result_retention_days: 30,
    },

  };
  logActivity('DB_INIT', 'Database initialized with ' + DB.users.length + ' users, ' + DB.packages.length + ' packages, ' + DB.transactions.length + ' transactions');
}

function resetDB() { initDB(); }

function logActivity(action, detail, status, method, provider) {
  const user = currentUser();
  const ips = ['192.168.1.42','10.0.0.1','10.0.0.15','192.168.1.100','172.16.0.50'];
  const agents = ['Chrome 125','Firefox 127','Safari 18','Edge 126','Opera 112'];
  DB.audit_log.unshift({
    id: 'AUD-' + String(DB.audit_log.length + 1).padStart(3,'0'),
    user_id: user ? user.id : '?',
    action, detail, status: status || 'success', method: method || null, provider: provider || null,
    ip: ips[Math.floor(Math.random()*ips.length)],
    user_agent: agents[Math.floor(Math.random()*agents.length)],
    time: new Date().toISOString().slice(0,19).replace('T',' ')
  });
}

function toggleUserMenu(e) {
  e.stopPropagation();
  document.getElementById('user-menu').classList.toggle('open');
  document.getElementById('sidebar-user').classList.toggle('open');
}
function closeUserMenu() {
  document.getElementById('user-menu')?.classList.remove('open');
  document.getElementById('sidebar-user')?.classList.remove('open');
}
document.addEventListener('click', function(e) {
  if (!e.target.closest('.sidebar-footer')) closeUserMenu();
});

function isLoggedIn() { return DB && DB.currentUserId !== null; }
function currentUser() {
  if (!DB || !DB.currentUserId) return null;
  return DB.users.find(u => u.id === DB.currentUserId);
}

// ============================================================
//  AUTH FUNCTIONS
// ============================================================
function login(email, password) {
  const user = DB.users.find(u => u.email === email);
  if (!user) { logActivity('LOGIN', 'Đăng nhập thất bại: email không tồn tại', 'failed', 'email'); return { success: false, error: 'Email hoặc mật khẩu không đúng' }; }
  if (user.password !== password) { logActivity('LOGIN', 'Đăng nhập thất bại: sai mật khẩu', 'failed', 'email'); return { success: false, error: 'Email hoặc mật khẩu không đúng' }; }
  if (user.status === 'locked') return { success: false, error: 'Tài khoản đã bị khóa. Vui lòng liên hệ admin.' };
  DB.currentUserId = user.id;
  user.last_login = new Date().toISOString().slice(0,19).replace('T',' ');
  if (document.getElementById('login-remember').checked) localStorage.setItem('visionfix_remember_email', email);
  else localStorage.removeItem('visionfix_remember_email');
  logActivity('LOGIN', `Đăng nhập bằng email: ${user.email}`, 'success', 'email');
  renderAll();
  return { success: true };
}

function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('auth-login-error');
  if (!email || !password) { errEl.textContent = 'Vui lòng nhập email và mật khẩu'; errEl.style.display='block'; return; }
  errEl.style.display = 'none';
  const result = login(email, password);
  if (!result.success) { errEl.textContent = result.error; errEl.style.display='block'; return; }
  toast('success', '✅ Đăng nhập thành công!');
  nav('dashboard');
}

function demoLogin(role) {
  const email = role === 'admin' ? 'tuan.nguyen@company.vn' : 'demo@visionfix.vn';
  const password = role === 'admin' ? 'password123' : 'demo123';
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
  const result = login(email, password);
  if (result.success) {
    const label = role === 'admin' ? 'Admin (full quyền)' : 'Demo (giới hạn)';
    toast('success', '✅ Đã đăng nhập tài khoản ' + label + '!');
    nav('dashboard');
  }
}

function handleLogout() {
  DB.currentUserId = null;
  localStorage.removeItem('visionfix_remember_email');
  nav('login');
  toast('info', '🚪 Đã đăng xuất');
}

function register(name, email, password) {
  if (DB.users.find(u => u.email === email)) return { success: false, error: 'Email đã được sử dụng' };
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  const colors = ['#1668dc,#854eca','#49aa19,#0891b2','#d89614,#dc4446','#854eca,#dc4446','#13a8a8,#16a34a'];
  const newUser = {
    id: 'U' + String(DB.users.length + 1).padStart(3,'0'),
    name, email, password, role: 'user', points: DB.config.welcome_points,
    avatar: initials, status: 'active', created: new Date().toISOString().slice(0,10),
    total_txn: 0, color: colors[DB.users.length % colors.length], last_login: null,
    tier: 'demo',
    oauth_links: { google:null, facebook:null, apple:null, microsoft:null }
  };
  DB.users.push(newUser);
  DB.currentUserId = newUser.id;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  DB.verificationCodes[email] = { code, expires: Date.now() + 3600000 };
  logActivity('REGISTER', `Đăng ký tài khoản: ${email}`, 'success', 'email');
  renderAll();
  return { success: true, user: newUser, verifyCode: code };
}

function handleRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  const tos = document.getElementById('reg-tos').checked;
  const errEl = document.getElementById('auth-register-error');
  if (!name || !email || !password || !confirm) { errEl.textContent = 'Vui lòng điền đầy đủ thông tin'; errEl.style.display='block'; return; }
  if (password.length < 6) { errEl.textContent = 'Mật khẩu tối thiểu 6 ký tự'; errEl.style.display='block'; return; }
  if (password !== confirm) { errEl.textContent = 'Mật khẩu xác nhận không khớp'; errEl.style.display='block'; return; }
  if (!tos) { errEl.textContent = 'Vui lòng đồng ý với Điều khoản dịch vụ'; errEl.style.display='block'; return; }
  errEl.style.display = 'none';
  const result = register(name, email, password);
  if (!result.success) { errEl.textContent = result.error; errEl.style.display='block'; return; }
  toast('success', `🎉 Đăng ký thành công! Được tặng ${DB.config.welcome_points} Point. Mã xác thực: ${result.verifyCode}`);
  if (confirm('📧 Đã gửi mã xác thực đến email. Xác thực ngay?')) {
    document.getElementById('verify-email-display').textContent = email;
    showAuthForm('verify');
  } else nav('dashboard');
}

function showAuthForm(form) {
  ['login','register','forgot','verify'].forEach(f => {
    const el = document.getElementById('auth-' + f);
    if (el) el.style.display = f === form ? '' : 'none';
  });
  document.querySelectorAll('.auth-error').forEach(e => e.style.display='none');
  const s2 = document.getElementById('auth-forgot-step2');
  if (s2) s2.style.display = 'none';
  document.getElementById('auth-forgot-step1').style.display = '';
}

const OAUTH_PROVIDERS = {
  google:    { name:'Google',    icon:'🔴', emailDomain:'gmail.com' },
  facebook:  { name:'Facebook',  icon:'🔵', emailDomain:'facebook.com' },
  apple:     { name:'Apple',     icon:'🍎', emailDomain:'icloud.com' },
  microsoft: { name:'Microsoft', icon:'🪟', emailDomain:'outlook.com' },
};



function handleOAuth(provider, isLinkMode) {
  const info = OAUTH_PROVIDERS[provider];
  if (!info) return;
  const name = info.name;
  if (isLinkMode) {
    const user = currentUser();
    user.oauth_links[provider] = { id: provider+'-'+user.id, email: user.email.replace(/@.+/, '@'+info.emailDomain), linked_at: new Date().toISOString().slice(0,19).replace('T',' ') };
    logActivity('OAUTH_LINK', `Liên kết ${info.name}: ${user.email}`, 'success', 'oauth_link', provider);
    renderAll();
    toast('success', `✅ Đã liên kết tài khoản ${name}`);
    return;
  }
  toast('info', `⏳ Đang đăng nhập bằng ${name}...`);
  setTimeout(() => {
    let user = DB.users.find(u => u.oauth_links && u.oauth_links[provider] && u.oauth_links[provider].id);
    if (!user) {
      const dummyEmail = `user.${provider}@mock.visionfix`;
      const result = register(`${name} User`, dummyEmail, 'oauth_auto_' + Date.now());
      user = result.user;
      user.oauth_links[provider] = { id: provider+'-'+user.id, email: dummyEmail, linked_at: new Date().toISOString().slice(0,19).replace('T',' ') };
      logActivity('OAUTH_AUTO_REGISTER', `${provider} new user: ${user.email}`);
    } else {
      DB.currentUserId = user.id;
      user.last_login = new Date().toISOString().slice(0,19).replace('T',' ');
    }
    toast('success', `✅ Đăng nhập bằng ${name} thành công!`);
    logActivity('OAUTH_LOGIN', `Đăng nhập bằng ${name}: ${user.email}`, 'success', 'oauth', provider);
    renderAll();
    nav('dashboard');
  }, 800);
}

function handleLinkOAuth(provider) {
  const user = currentUser();
  if (!user) return;
  const info = OAUTH_PROVIDERS[provider];
  if (user.oauth_links[provider]) {
    toast('info', `ℹ️ Tài khoản ${info.name} đã được liên kết`);
    return;
  }
  toast('info', `⏳ Đang liên kết tài khoản ${info.name}...`);
  setTimeout(() => handleOAuth(provider, true), 600);
}

function handleUnlinkOAuth(provider) {
  const user = currentUser();
  if (!user) return;
  const info = OAUTH_PROVIDERS[provider];
  const linkedCount = Object.values(user.oauth_links).filter(Boolean).length;
  const hasPassword = !!user.password;
  if (!hasPassword && linkedCount <= 1) {
    toast('error', '❌ Không thể hủy liên kết cuối cùng. Thêm mật khẩu hoặc liên kết tài khoản khác trước.');
    return;
  }
  user.oauth_links[provider] = null;
  logActivity('OAUTH_UNLINK', `Hủy liên kết ${info.name}: ${user.email}`, 'success', 'oauth_unlink', provider);
  renderAll();
  toast('success', `✅ Đã hủy liên kết tài khoản ${info.name}`);
}

function handleForgotPassword() {
  const email = document.getElementById('forgot-email').value.trim();
  if (!email) { toast('error', '❌ Vui lòng nhập email'); return; }
  document.getElementById('forgot-email-sent').textContent = email;
  document.getElementById('auth-forgot-step1').style.display = 'none';
  document.getElementById('auth-forgot-step2').style.display = '';
  logActivity('FORGOT_PASSWORD', `Request for: ${email}`);
}

function togglePwd(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') { input.type = 'text'; btn.textContent = '🙈'; }
  else { input.type = 'password'; btn.textContent = '👁️'; }
}

function handleVerifyEmail() {
  const code = document.getElementById('verify-code').value.trim();
  const user = currentUser();
  if (!user) return;
  const record = DB.verificationCodes[user.email];
  if (!code || code.length !== 6) { toast('error', '❌ Vui lòng nhập mã xác thực 6 số'); return; }
  if (record && record.code === code) {
    user.status = 'active';
    delete DB.verificationCodes[user.email];
    toast('success', '✅ Xác thực email thành công!');
    logActivity('VERIFY_EMAIL', `${user.email} verified`);
    nav('dashboard');
  } else toast('error', '❌ Mã xác thực không đúng. Thử lại.');
}

function resendVerifyCode() {
  const user = currentUser();
  if (!user) return;
  const code = String(Math.floor(100000 + Math.random() * 900000));
  DB.verificationCodes[user.email] = { code, expires: Date.now() + 3600000 };
  toast('info', `📧 Đã gửi lại mã xác thực đến ${user.email}. Mã: ${code}`);
}

function skipVerifyAndGo() { nav('dashboard'); toast('info', '📧 Bạn có thể xác thực email sau tại trang Hồ sơ.'); }

function handleUpdateProfile() {
  const user = currentUser();
  if (!user) return;
  const name = document.getElementById('profile-name').value.trim();
  if (!name) { toast('error', '❌ Họ tên không được để trống'); return; }
  user.name = name;
  user.avatar = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);
  toast('success', '✅ Đã cập nhật hồ sơ');
  renderAll();
}

function handleChangePassword() {
  const user = currentUser();
  if (!user) return;
  const oldPwd = document.getElementById('chg-old-pwd').value;
  const newPwd = document.getElementById('chg-new-pwd').value;
  const confirmPwd = document.getElementById('chg-confirm-pwd').value;
  if (user.password !== oldPwd) { toast('error', '❌ Mật khẩu cũ không đúng'); return; }
  if (newPwd.length < 6) { toast('error', '❌ Mật khẩu mới tối thiểu 6 ký tự'); return; }
  if (newPwd !== confirmPwd) { toast('error', '❌ Mật khẩu xác nhận không khớp'); return; }
  user.password = newPwd;
  document.getElementById('chg-old-pwd').value = '';
  document.getElementById('chg-new-pwd').value = '';
  document.getElementById('chg-confirm-pwd').value = '';
  toast('success', '✅ Đã đổi mật khẩu thành công');
  logActivity('CHANGE_PASSWORD', `${user.email} changed password`);
}

function addTransaction(type, desc, points, gateway, pkgId, amountVnd) {
  const user = currentUser();
  if (user.points + points < 0) points = -user.points;
  user.points += points;
  user.total_txn++;
  const txn = {
    id: 'TXN-' + String(DB.transactions.length + 1).padStart(3,'0'),
    user_id: user.id, type, desc, points,
    balance_after: user.points,
    gateway: gateway || null,
    package_id: pkgId || null,
    amount_vnd: amountVnd || 0,
    status: 'completed',
    time: new Date().toLocaleString('vi-VN'),
  };
  DB.transactions.unshift(txn);
  logActivity('TXN_' + type.toUpperCase(), `${txn.id}: ${desc} | ${points > 0 ? '+' : ''}${points} PT | Balance: ${user.points}`);
  return txn;
}

// ============================================================
//  RENDER FUNCTIONS
// ============================================================
function renderAll() {
  const user = currentUser();
  if (!user) {
    const sidebarEl = document.getElementById('sidebar');
    const topbarEl = document.getElementById('topbar');
    if (sidebarEl) sidebarEl.style.display = 'none';
    if (topbarEl) topbarEl.style.display = 'none';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const authPage = document.getElementById('page-auth');
    if (authPage) authPage.classList.add('active');
    document.getElementById('breadcrumb').innerHTML = 'VisionFix / <span>Đăng nhập</span>';
    showAuthForm('login');
    const remembered = localStorage.getItem('visionfix_remember_email');
    if (remembered && document.getElementById('login-email')) {
      document.getElementById('login-email').value = remembered;
      document.getElementById('login-remember').checked = true;
    }
    return;
  }
  const sidebarEl = document.getElementById('sidebar');
  const topbarEl = document.getElementById('topbar');
  if (sidebarEl) sidebarEl.style.display = '';
  if (topbarEl) topbarEl.style.display = '';
  // Sidebar
  document.getElementById('sidebar-points').textContent = user.points.toLocaleString();
  document.getElementById('sidebar-name').textContent = user.name;
  document.getElementById('sidebar-avatar').textContent = user.avatar;
  const roleEl = document.querySelector('.user-role');
  if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Admin' : (user.role === 'user' ? 'User' : user.role);
  // Feature flags by role
  const adminSection = document.getElementById('sidebar-admin-section');
  if (adminSection) adminSection.style.display = user.role === 'admin' ? '' : 'none';
  // Profile
  const pNameEl = document.getElementById('profile-name');
  if (pNameEl) pNameEl.value = user.name;
  const pEmailEl = document.getElementById('profile-email');
  if (pEmailEl) pEmailEl.value = user.email;
  const pAvatarEl = document.getElementById('profile-avatar');
  if (pAvatarEl) { pAvatarEl.textContent = user.avatar; pAvatarEl.style.background = 'linear-gradient(135deg,' + user.color + ')'; }
  const pTierEl = document.getElementById('profile-tier');
  if (pTierEl) { const t=getTierLimits(user.tier); pTierEl.textContent = t.label; pTierEl.className = 'fw-600 tag ' + t.color; }
  const pPlateEl = document.getElementById('profile-plate-limit');
  if (pPlateEl) { const t=getTierLimits(user.tier); pPlateEl.textContent = t.plate_img>=999?'∞':t.plate_img+' ảnh | '+(t.plate_vid>=999?'∞':t.plate_vid+' video'); }
  const pVideoEl = document.getElementById('profile-video-limit');
  if (pVideoEl) { const t=getTierLimits(user.tier); pVideoEl.textContent = t.video_fast>=999?'∞':t.video_fast+' nhanh | '+(t.video_deep>=999?'∞':t.video_deep+' sâu'); }

  // Dashboard
  document.getElementById('dash-balance').textContent = user.points.toLocaleString();
  renderDashRecent();
  const tierLims = getTierLimits(user.tier);
  const limitBanner = document.getElementById('dash-limit-banner');
  if (limitBanner) {
    const limited = tierLims.plate_img < 999 || tierLims.video_fast < 999;
    limitBanner.style.display = limited ? 'flex' : 'none';
    if (limited) {
      document.getElementById('dash-limit-text').textContent = 'ℹ️ Gói ' + tierLims.label + ': 🚗 ' + tierLims.plate_img + ' biển số/ngày • 🎬 ' + tierLims.video_fast + ' video/ngày';
    }
  }
  const usage = getUserTodayUsage(user.id, 'plate');
  const todayPlate = usage.plate_img + usage.plate_vid;
  const todayVideo = usage.video_fast + usage.video_deep;
  const remainingCard = document.getElementById('dash-remaining-card');
  if (remainingCard) {
    const maxPlate = tierLims.plate_img;
    const maxVideo = tierLims.video_fast;
    const limited = maxPlate < 999 || maxVideo < 999;
    remainingCard.style.display = limited ? '' : 'none';
    if (limited) {
      const rPlate = Math.max(0, maxPlate - usage.plate_img);
      const rVideo = Math.max(0, maxVideo - usage.video_fast);
      const plateDiscount = getVolumeDiscount(user.id, 'plate');
      const videoDiscount = getVolumeDiscount(user.id, 'video');
      const discLabel = (plateDiscount < 1 || videoDiscount < 1) ? ' 🏷️ Giảm ' + Math.round((1 - Math.min(plateDiscount, videoDiscount)) * 100) + '%' : '';
      document.getElementById('dash-remaining-text').textContent = '🚗 ' + rPlate + ' • 🎬 ' + rVideo;
      document.getElementById('dash-remaining-sub').textContent = 'Đã dùng: 🚗 ' + todayPlate + ' • 🎬 ' + todayVideo + discLabel;
      remainingCard.className = 'stat-card ' + (rPlate <= 1 || rVideo <= 1 ? 'orange' : 'green');
    }
  }

  // Plate page
  document.getElementById('plate-balance').innerHTML = user.points.toLocaleString() + ' <span style="font-size:14px;font-weight:400;color:var(--text-tertiary)">Point</span>';
  document.getElementById('plate-img-cost').textContent = DB.config.plate_image_cost + ' PT/ảnh';
  document.getElementById('plate-vid-cost').textContent = DB.config.plate_video_cost + ' PT/video';
  renderPlateHistory();

  // Topup balance
  document.getElementById('topup-balance').textContent = user.points.toLocaleString() + ' Point';

  // History page
  renderHistoryTable();

  // Admin
  renderUsersTable();
  renderRevenueStats();

  // Config
  document.getElementById('cfg-plate-img').value = DB.config.plate_image_cost;
  document.getElementById('cfg-plate-vid').value = DB.config.plate_video_cost;
  document.getElementById('cfg-vid-fast').value = DB.config.video_fast_cost;
  document.getElementById('cfg-vid-deep').value = DB.config.video_deep_cost;
  document.getElementById('cfg-welcome').value = DB.config.welcome_points;

  // Audit log
  renderAuditLog();
}

function renderDashRecent() {
  const el = document.getElementById('dash-recent-txn');
  const txns = DB.transactions.filter(t => t.user_id === DB.currentUserId).slice(0, 5);
  el.innerHTML = txns.map(t => {
    const icon = t.type === 'topup' ? '💎' : t.type === 'refund' ? '🔄' : t.points < 0 ? (t.desc.includes('Module 2') || t.desc.includes('Biển') ? '🚗' : '🎬') : '💎';
    const tag = t.type === 'topup' ? 'tag-success' : t.type === 'refund' ? 'tag-warning' : 'tag-info';
    const label = t.type === 'topup' ? 'Nạp' : t.type === 'refund' ? 'Hoàn' : 'Sử dụng';
    return `<div style="padding:10px;background:var(--bg-container);border-radius:var(--radius-sm);font-size:13px">
      <div class="flex justify-between items-center"><span>${icon} ${t.desc}</span><span class="tag ${tag}">${label}</span></div>
      <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px">${t.time} • ${t.points > 0 ? '+' : ''}${t.points} PT</div></div>`;
  }).join('');
}

function renderPlateHistory() {
  const el = document.getElementById('plate-history-list');
  const txns = DB.transactions.filter(t => t.user_id === DB.currentUserId && (t.desc.includes('Biển') || t.desc.includes('Module 2'))).slice(0, 4);
  if (!txns.length) { el.innerHTML = '<div class="text-center text-tertiary" style="padding:20px">Chưa có lịch sử</div>'; return; }
  el.innerHTML = txns.map(t => `<div style="padding:8px;background:var(--bg-container);border-radius:var(--radius-sm);font-size:12px;display:flex;items-center;gap:8px">
    <span style="font-size:16px">🚗</span><div class="flex-1"><div class="fw-500">${t.desc}</div><div class="text-tertiary">${t.time} • ${t.points > 0 ? '+' : ''}${t.points} PT</div></div>
    <span class="tag ${t.type==='refund'?'tag-warning':'tag-success'}">${t.type==='refund'?'Hoàn':'OK'}</span></div>`).join('');
}

function renderVideoHistory() {
  const el = document.getElementById('video-history-list');
  const txns = DB.transactions.filter(t => t.user_id === DB.currentUserId && (t.desc.includes('Video') || t.desc.includes('Module 1') || t.desc.includes('video'))).slice(0, 5);
  if (!txns.length) { el.innerHTML = '<div class="text-center text-tertiary" style="padding:20px">Chưa có lịch sử</div>'; return; }
  el.innerHTML = txns.map(t => `<div style="padding:8px;background:var(--bg-container);border-radius:var(--radius-sm);font-size:12px;display:flex;align-items:center;gap:8px">
    <span style="font-size:16px">🎬</span><div class="flex-1"><div class="fw-500">${t.desc}</div><div class="text-tertiary">${t.time} • ${t.points > 0 ? '+' : ''}${t.points} PT</div></div>
    <span class="tag ${t.status==='completed'?'tag-success':'tag-danger'}">${t.status==='completed'?'OK':'Lỗi'}</span></div>`).join('');
}

function renderProfileOAuthLinks() {
  const container = document.getElementById('oauth-links-container');
  if (!container) return;
  const user = currentUser();
  if (!user) return;
  const providers = [
    { key:'google',    icon:'🔴', name:'Google' },
    { key:'facebook',  icon:'🔵', name:'Facebook' },
    { key:'apple',     icon:'🍎', name:'Apple' },
    { key:'microsoft', icon:'🪟', name:'Microsoft' },
  ];
  container.innerHTML = providers.map(p => {
    const link = user.oauth_links ? user.oauth_links[p.key] : null;
    const linked = link && link.id;
    return `<div class="ol-row">
      <div class="ol-info"><span class="ol-icon">${p.icon}</span><div><div class="ol-name">${p.name}</div><div class="ol-email">${linked ? link.email : 'Chưa liên kết'}</div></div></div>
      ${linked
        ? `<button class="ol-action unlink" onclick="handleUnlinkOAuth('${p.key}')">Hủy liên kết</button>`
        : `<button class="ol-action link" onclick="handleLinkOAuth('${p.key}')">Liên kết</button>`
      }
    </div>`;
  }).join('');
}

const ACTIVITY_ICONS = {
  LOGIN:'🔑', LOGOUT:'🔑', REGISTER:'🔑',
  OAUTH_LOGIN:'🔗', OAUTH_LINK:'🔗', OAUTH_UNLINK:'🔗', OAUTH_AUTO_REGISTER:'🔗',
  CHANGE_PASSWORD:'🔒', FORGOT_PASSWORD:'🔒', VERIFY_EMAIL:'✉️',
  PLATE_REPAIR:'🚗', PLATE_PROCESS_START:'🚗', PLATE_PROCESS_DONE:'🚗',
  VIDEO_REPAIR:'🎬', VIDEO_REPAIR_START:'🎬', VIDEO_REPAIR_SUCCESS:'🎬', VIDEO_REPAIR_FAILED:'🎬', VIDEO_REPAIR_CANCEL:'🎬',
  VIDEO_DOWNLOAD:'🎬', VIDEO_RESET:'🎬', VIDEO_UPLOAD:'🎬', VIDEO_ANALYZE:'🎬',
  TOPUP:'💳', PKG_SELECT:'💳', GATEWAY_SELECT:'💳', GATEWAY_SHOW:'💳',
  PAYMENT_PROCESSING:'💳', PAYMENT_SUCCESS:'💳', PAYMENT_FAILED:'💳',
  VNPAY_OTP:'💳', STRIPE_3DS:'💳', PAYPAL_AUTH:'💳',
  USER_LOCK:'👥', USER_UNLOCK:'👥', USER_EDIT:'👥', ADJUST_POINTS:'👥',
  DB_INIT:'🗄️', TXN_USE:'📊', TXN_TOPUP:'📊', TXN_REFUND:'📊'
};
const ACTIVITY_GROUP = {
  auth:['LOGIN','LOGOUT','REGISTER','FORGOT_PASSWORD','CHANGE_PASSWORD','VERIFY_EMAIL','OAUTH_LOGIN','OAUTH_LINK','OAUTH_UNLINK','OAUTH_AUTO_REGISTER'],
  service:['PLATE_REPAIR','PLATE_PROCESS_START','PLATE_PROCESS_DONE','VIDEO_REPAIR','VIDEO_REPAIR_START','VIDEO_REPAIR_SUCCESS','VIDEO_REPAIR_FAILED','VIDEO_REPAIR_CANCEL','VIDEO_DOWNLOAD','VIDEO_RESET','VIDEO_UPLOAD','VIDEO_ANALYZE'],
  payment:['TOPUP','PKG_SELECT','GATEWAY_SELECT','GATEWAY_SHOW','PAYMENT_PROCESSING','PAYMENT_SUCCESS','PAYMENT_FAILED','VNPAY_OTP','STRIPE_3DS','PAYPAL_AUTH','TXN_USE','TXN_TOPUP','TXN_REFUND'],
  admin:['USER_LOCK','USER_UNLOCK','USER_EDIT','ADJUST_POINTS']
};
const ACTIVITY_LABELS = {};
'LOGIN-Đăng nhập,LOGOUT-Đăng xuất,REGISTER-Đăng ký,OAUTH_LOGIN-Đăng nhập OAuth,OAUTH_LINK-Liên kết OAuth,OAUTH_UNLINK-Hủy liên kết,OAUTH_AUTO_REGISTER-Đăng ký OAuth,CHANGE_PASSWORD-Đổi mật khẩu,FORGOT_PASSWORD-Quên mật khẩu,VERIFY_EMAIL-Xác thực email,PLATE_REPAIR-Sửa biển số,PLATE_PROCESS_START-Xử lý biển số,PLATE_PROCESS_DONE-Hoàn tất biển số,VIDEO_REPAIR-Repair video,VIDEO_REPAIR_START-Bắt đầu repair,VIDEO_REPAIR_SUCCESS-Repair thành công,VIDEO_REPAIR_FAILED-Repair thất bại,VIDEO_REPAIR_CANCEL-Hủy repair,VIDEO_DOWNLOAD-Tải video,VIDEO_RESET-Đặt lại,VIDEO_UPLOAD-Upload video,VIDEO_ANALYZE-Phân tích video,TOPUP-Nạp Point,PKG_SELECT-Chọn gói,GATEWAY_SELECT-Chọn cổng,GATEWAY_SHOW-Hiển thị thanh toán,PAYMENT_PROCESSING-Đang xử lý,PAYMENT_SUCCESS-Nạp thành công,PAYMENT_FAILED-Nạp thất bại,VNPAY_OTP-Xác thực OTP,STRIPE_3DS-Xác thực 3DS,PAYPAL_AUTH-Xác thực PayPal,USER_LOCK-Khóa user,USER_UNLOCK-Mở khóa user,USER_EDIT-Sửa user,ADJUST_POINTS-Điều chỉnh Point,DB_INIT-Khởi tạo,TXN_USE-Sử dụng Point,TXN_TOPUP-Nạp Point,TXN_REFUND-Hoàn Point'.split(',').forEach(s => { const [k,v]=s.split('-'); ACTIVITY_LABELS[k]=v; });

let activityView = 'table';

function setActivityView(view) {
  activityView = view;
  document.getElementById('vt-table').classList.toggle('active', view === 'table');
  document.getElementById('vt-timeline').classList.toggle('active', view === 'timeline');
  document.getElementById('activity-table-wrapper').style.display = view === 'table' ? '' : 'none';
  document.getElementById('activity-timeline-wrapper').style.display = view === 'timeline' ? '' : 'none';
}

function renderAuditLog() {
  const tbody = document.getElementById('audit-tbody');
  const tbodyTimeline = document.getElementById('audit-timeline-body');
  if (!tbody) return;
  const filter = document.getElementById('activity-filter')?.value || 'all';
  const user = currentUser();
  let logs = (user && user.role === 'admin') ? [...DB.audit_log] : DB.audit_log.filter(l => l.user_id === DB.currentUserId);
  if (filter !== 'all') logs = logs.filter(l => (ACTIVITY_GROUP[filter] || []).includes(l.action));
  logs.reverse();
  
  // Table view
  const isAdmin = user && user.role === 'admin';
  tbody.innerHTML = logs.length ? logs.map(l => {
    const action = l.action || 'LOGIN';
    const icon = ACTIVITY_ICONS[action] || '📋';
    const label = ACTIVITY_LABELS[action] || action;
    const detail = l.detail || (l.method === 'oauth' ? 'OAuth login' : 'Email login');
    const statusTag = l.status === 'success' ? 'tag-success' : l.status === 'failed' ? 'tag-danger' : 'tag-info';
    const statusLabel = l.status === 'success' ? 'Thành công' : l.status === 'failed' ? 'Thất bại' : 'Info';
    const logUser = DB.users.find(u => u.id === l.user_id);
    const userName = logUser ? logUser.name : l.user_id;
    return `<tr><td class="activity-time">${l.time}</td>${isAdmin?`<td style="font-size:12px;color:var(--text-secondary)">${userName}</td>`:''}<td><div class="activity-action"><span class="aa-icon">${icon}</span>${label}</div></td><td><div class="activity-detail" title="${detail.replace(/"/g,'&quot;')}">${detail}</div></td><td><span class="tag ${statusTag}">${statusLabel}</span></td><td style="font-family:monospace;font-size:12px;color:var(--text-tertiary)">${l.ip}</td><td style="font-size:12px;color:var(--text-tertiary)">${l.user_agent}</td></tr>`;
  }).join('') : `<tr><td colspan="${isAdmin?7:6}" class="text-center text-tertiary" style="padding:32px">Chưa có hoạt động nào</td></tr>`;
  
  // Timeline view
  if (!tbodyTimeline) return;
  if (!logs.length) { tbodyTimeline.innerHTML = '<div class="text-center text-tertiary" style="padding:32px">Chưa có hoạt động nào</div>'; return; }
  const today = new Date().toISOString().slice(0,10);
  const yesterday = new Date(Date.now()-86400000).toISOString().slice(0,10);
  let currentDate = '';
  tbodyTimeline.innerHTML = logs.map(l => {
    const action = l.action || 'LOGIN';
    const dateStr = l.time.slice(0,10);
    let dateHeader = '';
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      let label = dateStr;
      if (dateStr === today) label = 'Hôm nay';
      else if (dateStr === yesterday) label = 'Hôm qua';
      dateHeader = `<div class="tl-date">${label}</div>`;
    }
    const icon = ACTIVITY_ICONS[action] || '📋';
    const label = ACTIVITY_LABELS[action] || action;
    const detail = l.detail || (l.method === 'oauth' ? 'OAuth login' : 'Email login');
    const statusTag = l.status === 'success' ? 'tag-success' : l.status === 'failed' ? 'tag-danger' : 'tag-info';
    const statusLabel = l.status === 'success' ? 'Thành công' : l.status === 'failed' ? 'Thất bại' : 'Info';
    const logUser = DB.users.find(u => u.id === l.user_id);
    const userName = logUser ? logUser.name : l.user_id;
    const userMeta = isAdmin ? `<span>•</span><span>${userName}</span>` : '';
    return dateHeader + `<div class="tl-card" onclick="this.classList.toggle('open')"><div class="tl-icon">${icon}</div><div class="tl-body"><div class="tl-title">${label}</div><div class="tl-detail">${detail}</div><div class="tl-meta">${l.time.slice(11,19)}<span class="tag ${statusTag}">${statusLabel}</span></div><div class="tl-meta expanded"><span>IP: ${l.ip}</span><span>•</span><span>${l.user_agent}</span>${userMeta}</div></div></div>`;
  }).join('');
}

function renderHistoryTable() {
  const el = document.getElementById('history-tbody');
  const txns = DB.transactions.filter(t => t.user_id === DB.currentUserId);
  el.innerHTML = txns.map(t => {
    const typeTag = t.type === 'topup' ? 'tag-success' : t.type === 'refund' ? 'tag-warning' : 'tag-info';
    const typeLabel = t.type === 'topup' ? 'Nạp' : t.type === 'refund' ? 'Hoàn' : 'Sử dụng';
    return `<tr><td style="font-family:monospace;font-size:12px">${t.id}</td><td>${t.time}</td><td><span class="tag ${typeTag}">${typeLabel}</span></td><td>${t.desc}</td>
      <td style="font-weight:600;color:${t.points>0?'var(--success)':'var(--danger)'}">${t.points>0?'+':''}${t.points}</td><td>${t.balance_after.toLocaleString()}</td><td><span class="tag tag-success">Hoàn tất</span></td></tr>`;
  }).join('');
}

function renderUsersTable() {
  const el = document.getElementById('users-tbody');
  const search = (document.getElementById('user-search')?.value || '').toLowerCase();
  const roleFilter = document.getElementById('user-role-filter')?.value || '';
  const statusFilter = document.getElementById('user-status-filter')?.value || '';
  const filtered = DB.users.filter(u => {
    if (search && !u.name.toLowerCase().includes(search) && !u.email.toLowerCase().includes(search)) return false;
    if (roleFilter && u.role !== roleFilter) return false;
    if (statusFilter && u.status !== statusFilter) return false;
    return true;
  });
  document.getElementById('user-filter-count').textContent = `Hiển thị ${filtered.length} / ${DB.users.length} người dùng`;
  el.innerHTML = filtered.map(u => {
    const statusTag = u.status === 'active' ? 'tag-success' : u.status === 'locked' ? 'tag-danger' : 'tag-info';
    const statusLabel = u.status === 'active' ? 'Hoạt động' : u.status === 'locked' ? 'Đã khóa' : 'Chưa xác thực';
    const isSelf = u.id === DB.currentUserId;
    const lockIcon = u.status === 'locked' ? '🔓' : '🔒';
    const lockLabel = u.status === 'locked' ? 'Mở khóa' : 'Khóa';
    const tierTag = u.tier === 'admin' ? 'tag-danger' : u.tier === 'enterprise' ? 'tag-purple' : u.tier === 'pro' ? 'tag-primary' : u.tier === 'demo' ? 'tag-warning' : 'tag-info';
    const ut = getTierLimits(u.tier);
    const limitsLabel = '🚗'+(ut.plate_img>=999?'∞':ut.plate_img)+'|'+(ut.plate_vid>=999?'∞':ut.plate_vid)+' 🎬'+(ut.video_fast>=999?'∞':ut.video_fast)+'|'+(ut.video_deep>=999?'∞':ut.video_deep);
    return `<tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div class="user-avatar" style="width:32px;height:32px;font-size:12px;background:linear-gradient(135deg,${u.color})">${u.avatar}</div><span class="fw-600">${u.name}</span></div></td>
      <td>${u.email}</td>
      <td><span class="tag ${u.role==='admin'?'tag-danger':'tag-primary'}">${u.role}</span></td>
      <td><span class="tag ${tierTag}" style="font-size:10px">${u.tier||'—'}</span></td>
      <td style="font-weight:600;color:var(--warning)">${u.points.toLocaleString()}</td>
      <td>${u.total_txn}</td>
      <td><span class="tag ${statusTag}">${statusLabel}</span></td>
      <td>
        <div class="action-group">
          <button class="action-btn" title="Xem chi tiết" onclick="openUserDetail('${u.id}')">👁️</button>
          <button class="action-btn" title="Chỉnh sửa" onclick="openEditUser('${u.id}')">✏️</button>
          <button class="action-btn" title="Điều chỉnh Point" onclick="openAdjustPoints('${u.id}')">💎</button>
          ${isSelf ? '' : `<button class="action-btn ${u.status === 'locked' ? 'success' : 'danger'}" title="${lockLabel}" onclick="toggleUserStatus('${u.id}')">${lockIcon}</button>`}
        </div>
      </td>
    </tr>`;
  }).join('');
}

function closeModal(id) { document.getElementById(id).classList.remove('show'); }

// --- User Detail ---
let _detailUserId = null;
function openUserDetail(userId) {
  _detailUserId = userId;
  const u = DB.users.find(x => x.id === userId);
  if (!u) return;
  const txns = DB.transactions.filter(t => t.user_id === userId).slice(0, 30);
  const totalUsed = txns.filter(t => t.type === 'use').reduce((s, t) => s + Math.abs(t.points), 0);
  const totalTopup = txns.filter(t => t.type === 'topup').reduce((s, t) => s + t.points, 0);
  const html = `
    <div class="user-detail-sidebar">
      <div class="user-detail-avatar" style="background:linear-gradient(135deg,${u.color})">${u.avatar}</div>
      <div class="user-detail-name">${u.name}</div>
      <div class="user-detail-email">${u.email}</div>
      <div class="user-detail-stat"><span class="text-tertiary">Vai trò</span><span class="tag ${u.role==='admin'?'tag-danger':'tag-primary'}">${u.role}</span></div>
      <div class="user-detail-stat"><span class="text-tertiary">Trạng thái</span><span class="tag ${u.status==='active'?'tag-success':u.status==='locked'?'tag-danger':'tag-info'}">${u.status}</span></div>
      <div class="user-detail-stat"><span class="text-tertiary">Point hiện tại</span><span style="font-weight:700;color:var(--warning)">${u.points.toLocaleString()}</span></div>
      <div class="user-detail-stat"><span class="text-tertiary">Đã nạp</span><span style="font-weight:600;color:var(--success)">+${totalTopup.toLocaleString()}</span></div>
      <div class="user-detail-stat"><span class="text-tertiary">Đã dùng</span><span style="font-weight:600;color:var(--danger)">-${totalUsed.toLocaleString()}</span></div>
      <div class="user-detail-stat"><span class="text-tertiary">Tạo ngày</span><span>${u.created}</span></div>
      <div style="margin-top:16px;display:flex;gap:8px;flex-direction:column">
        <button class="btn btn-sm btn-warning" onclick="closeModal('user-detail-modal');openAdjustPoints('${u.id}')">💎 Điều chỉnh Point</button>
        <button class="btn btn-sm btn-default" onclick="closeModal('user-detail-modal');openEditUser('${u.id}')">✏️ Chỉnh sửa</button>
      </div>
    </div>
    <div class="user-detail-main">
      <div style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:12px">📋 Lịch sử giao dịch (${txns.length} gần nhất)</div>
      ${txns.length === 0 ? '<div class="text-center text-tertiary" style="padding:40px">Chưa có giao dịch</div>' :
        txns.map(t => {
          const icon = t.type === 'topup' ? '💎' : t.type === 'refund' ? '🔄' : '🔧';
          const color = t.points > 0 ? 'var(--success)' : 'var(--danger)';
          return `<div style="padding:8px;background:var(--bg-container);border-radius:var(--radius-sm);margin-bottom:6px;font-size:12px">
            <div style="display:flex;justify-content:space-between"><span>${icon} ${t.desc}</span><span style="font-weight:600;color:${color}">${t.points > 0 ? '+' : ''}${t.points.toLocaleString()} PT</span></div>
            <div style="color:var(--text-tertiary);margin-top:2px">${t.time} • ${t.id}</div>
          </div>`;
        }).join('')
      }
    </div>`;
  document.getElementById('user-detail-content').innerHTML = html;
  document.getElementById('user-detail-modal').classList.add('show');
}

// --- Toggle User Status ---
function toggleUserStatus(userId) {
  const u = DB.users.find(x => x.id === userId);
  if (!u) return;
  const newStatus = u.status === 'locked' ? 'active' : 'locked';
  const action = newStatus === 'active' ? 'mở khóa' : 'khóa';
  if (!confirm(`Bạn có chắc muốn ${action} tài khoản "${u.name}"?`)) return;
  u.status = newStatus;
  logActivity('USER_' + (newStatus === 'active' ? 'UNLOCK' : 'LOCK'), `${u.name} (${u.id}) was ${action}ed by admin`);
  renderUsersTable();
  toast(newStatus === 'active' ? 'success' : 'warning', `${action === 'mở khóa' ? '🔓' : '🔒'} Đã ${action} tài khoản "${u.name}"`);
}

// --- Edit User ---
let _editUserId = null;
function openEditUser(userId) {
  _editUserId = userId;
  const u = DB.users.find(x => x.id === userId);
  if (!u) return;
  const html = `
    <div class="form-group"><label class="form-label">Tên người dùng</label><input type="text" class="form-input" id="edit-user-name" value="${u.name}"></div>
    <div class="form-group"><label class="form-label">Email</label><input type="email" class="form-input" id="edit-user-email" value="${u.email}"></div>
    <div class="form-group"><label class="form-label">Vai trò</label>
      <select class="form-input" id="edit-user-role"><option value="user" ${u.role==='user'?'selected':''}>User</option><option value="admin" ${u.role==='admin'?'selected':''}>Admin</option></select>
    </div>
    <div class="form-group"><label class="form-label">Trạng thái</label>
      <select class="form-input" id="edit-user-status"><option value="active" ${u.status==='active'?'selected':''}>Hoạt động</option><option value="locked" ${u.status==='locked'?'selected':''}>Đã khóa</option><option value="unverified" ${u.status==='unverified'?'selected':''}>Chưa xác thực</option></select>
    </div>`;
  document.getElementById('edit-user-content').innerHTML = html;
  document.getElementById('edit-user-modal').classList.add('show');
}

function saveUserEdit() {
  const u = DB.users.find(x => x.id === _editUserId);
  if (!u) return;
  const name = document.getElementById('edit-user-name').value.trim();
  const email = document.getElementById('edit-user-email').value.trim();
  const role = document.getElementById('edit-user-role').value;
  const status = document.getElementById('edit-user-status').value;
  if (!name || !email) { toast('error', '❌ Tên và email không được để trống'); return; }
  if (email !== u.email && DB.users.some(x => x.email === email && x.id !== u.id)) { toast('error', '❌ Email đã tồn tại'); return; }
  u.name = name;
  u.email = email;
  u.role = role;
  u.status = status;
  u.avatar = name.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase();
  logActivity('USER_EDIT', `${u.id}: ${u.name} updated (role=${role}, status=${status})`);
  closeModal('edit-user-modal');
  renderUsersTable();
  renderAll();
  toast('success', `✅ Đã cập nhật thông tin "${u.name}"`);
}

// --- Adjust Points ---
let _adjustUserId = null;
function openAdjustPoints(userId) {
  _adjustUserId = userId;
  const u = DB.users.find(x => x.id === userId);
  if (!u) return;
  const html = `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;padding:12px;background:var(--bg-container);border-radius:var(--radius-sm);font-size:13px">
        <span><span class="text-tertiary">Người dùng:</span> <strong>${u.name}</strong></span>
        <span><span class="text-tertiary">Số dư hiện tại:</span> <strong style="color:var(--warning)">${u.points.toLocaleString()} PT</strong></span>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Loại điều chỉnh</label>
      <select class="form-input" id="adj-points-type">
        <option value="add">➕ Cộng Point</option>
        <option value="subtract">➖ Trừ Point</option>
        <option value="set">🎯 Đặt giá trị tuyệt đối</option>
      </select>
    </div>
    <div class="form-group"><label class="form-label">Số Point</label><input type="number" class="form-input" id="adj-points-amount" value="100" min="1"></div>
    <div class="form-group"><label class="form-label">Lý do</label><input type="text" class="form-input" id="adj-points-reason" placeholder="VD: Hoàn tiền do lỗi hệ thống..." value=""></div>`;
  document.getElementById('adjust-points-content').innerHTML = html;
  document.getElementById('adjust-points-modal').classList.add('show');
}

function adjustUserPoints() {
  const u = DB.users.find(x => x.id === _adjustUserId);
  if (!u) return;
  const type = document.getElementById('adj-points-type').value;
  const amount = parseInt(document.getElementById('adj-points-amount').value);
  const reason = document.getElementById('adj-points-reason').value.trim() || 'Điều chỉnh thủ công bởi Admin';
  if (!amount || amount <= 0) { toast('error', '❌ Số Point không hợp lệ'); return; }
  let points = 0, desc = '', typeLabel = '';
  if (type === 'add') { points = +amount; desc = `Cộng Point thủ công: ${reason}`; typeLabel = 'topup'; }
  else if (type === 'subtract') {
    if (u.points < amount) { toast('error', `❌ Người dùng chỉ còn ${u.points} PT, không thể trừ ${amount}`); return; }
    points = -amount; desc = `Trừ Point thủ công: ${reason}`; typeLabel = 'use';
  } else if (type === 'set') {
    const diff = amount - u.points;
    if (diff === 0) { toast('info', 'ℹ️ Số dư không thay đổi'); return; }
    points = diff; desc = `Đặt Point = ${amount}: ${reason}`; typeLabel = diff > 0 ? 'topup' : 'use';
  }
  u.points += points;
  u.total_txn++;
  const txn = {
    id: 'TXN-' + String(DB.transactions.length + 1).padStart(3,'0'),
    user_id: u.id, type: typeLabel, desc, points,
    balance_after: u.points,
    gateway: 'admin', package_id: null, amount_vnd: 0,
    status: 'completed',
    time: new Date().toLocaleString('vi-VN'),
  };
  DB.transactions.unshift(txn);
  logActivity('ADJUST_POINTS', `${u.id} (${u.name}): ${points > 0 ? '+' : ''}${points} PT — ${reason}`);
  closeModal('adjust-points-modal');
  renderUsersTable();
  renderAll();
  toast('success', `✅ Đã điều chỉnh Point của "${u.name}": ${points > 0 ? '+' : ''}${points} PT`);
}

function renderRevenueStats() {
  const topups = DB.transactions.filter(t => t.type === 'topup');
  const totalVnd = topups.reduce((s,t) => s + t.amount_vnd, 0);
  const totalPoints = topups.reduce((s,t) => s + t.points, 0);
  const usedPoints = DB.transactions.filter(t => t.type === 'use').reduce((s,t) => s + Math.abs(t.points), 0);
  document.getElementById('rev-total').textContent = (totalVnd / 1000000).toFixed(1) + 'M';
  document.getElementById('rev-txn-count').textContent = topups.length;
  document.getElementById('rev-points-sold').textContent = totalPoints.toLocaleString();
  document.getElementById('rev-points-used').textContent = usedPoints.toLocaleString();

  const el = document.getElementById('rev-tbody');
  el.innerHTML = topups.slice(0, 10).map(t => {
    const user = DB.users.find(u => u.id === t.user_id);
    const pkg = DB.packages.find(p => p.id === t.package_id);
    return `<tr><td style="font-family:monospace;font-size:12px">${t.id}</td><td>${user?.name||'—'}</td><td>${pkg?.name||'—'}</td><td><span class="tag tag-primary">${t.gateway}</span></td>
      <td>${t.amount_vnd.toLocaleString()}đ</td><td style="color:var(--success);font-weight:600">+${t.points.toLocaleString()}</td><td>${t.time}</td></tr>`;
  }).join('');
}

// ============================================================
//  NAVIGATION
// ============================================================
const pageNames = { dashboard:'Dashboard', plate:'Phục hồi biển số', video:'Khôi phục video', topup:'Nạp Point', history:'Lịch sử giao dịch', 'admin-users':'Quản lý người dùng', 'admin-config':'Cấu hình', 'admin-revenue':'Thống kê doanh thu', profile:'Hồ sơ', 'audit-log':'Nhật ký người dùng' };
const pageNameMap = Object.assign({ login:'Đăng nhập', register:'Đăng ký', forgot:'Quên mật khẩu', verify:'Xác thực email' }, pageNames);
function nav(id, el) {
  const publicPages = ['login','register','forgot','verify'];
  if (!currentUser() && !publicPages.includes(id)) {
    id = 'login';
    el = null;
  }
  const u = currentUser();
  if (u && !canAccess(u.role, id)) { toast('error', '❌ Bạn không có quyền truy cập trang này.'); return; }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageId = publicPages.includes(id) ? 'auth' : id;
  document.getElementById('page-' + pageId)?.classList.add('active');
  document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('breadcrumb').innerHTML = 'VisionFix / <span>' + (pageNameMap[id]||id) + '</span>';
  if (publicPages.includes(id)) showAuthForm(id);
  renderAll();
}

// ============================================================
//  PAYMENT FLOW
// ============================================================
let selectedPkgIdx = 2;
let selectedGateway = 'vnpay';
let countdownTimer = null;

function selectPackage(idx, el) {
  selectedPkgIdx = idx;
  document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  logActivity('PKG_SELECT', 'Selected package: ' + DB.packages[idx].name);
  setTimeout(() => goToStep(2), 300);
}

function selectGateway(gw, el) {
  selectedGateway = gw;
  document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
  el.classList.add('selected');
  logActivity('GATEWAY_SELECT', 'Selected gateway: ' + gw);
}

function goToStep(step) {
  const pkg = DB.packages[selectedPkgIdx];
  ['topup-step-1','topup-step-2','topup-step-3','topup-step-processing','topup-step-success','topup-step-fail'].forEach(id => document.getElementById(id).style.display = 'none');

  // Update stepper
  for (let i = 1; i <= 4; i++) {
    const s = document.getElementById('step-' + i);
    s.classList.remove('active','done');
    if (i < step) s.classList.add('done');
    if (i === step) s.classList.add('active');
  }
  for (let i = 1; i <= 3; i++) {
    document.getElementById('step-line-' + i).classList.toggle('done', i < step);
  }

  if (step === 1) {
    document.getElementById('topup-step-1').style.display = '';
  }
  if (step === 2) {
    document.getElementById('topup-step-2').style.display = '';
    document.getElementById('pay-pkg-name').textContent = pkg.name;
    document.getElementById('pay-pkg-desc').textContent = pkg.points.toLocaleString() + ' Point' + (pkg.bonus_pct ? ' + ' + (pkg.points * pkg.bonus_pct / 100) + ' bonus' : '');
    document.getElementById('pay-pkg-price').textContent = pkg.price_vnd.toLocaleString() + 'đ';
    document.getElementById('pay-pkg-usd').textContent = '~$' + pkg.price_usd;
  }
  if (step === 3) {
    document.getElementById('topup-step-3').style.display = '';
    showGatewayScreen(selectedGateway, pkg);
    startCountdown();
  }
}

function showGatewayScreen(gw, pkg) {
  ['gateway-vnpay','gateway-momo','gateway-zalopay','gateway-stripe','gateway-paypal'].forEach(id => document.getElementById(id).style.display = 'none');
  document.getElementById('gateway-' + gw).style.display = '';
  // Update amounts
  const vnd = pkg.price_vnd.toLocaleString() + 'đ';
  const usd = '$' + pkg.price_usd;
  document.getElementById('vnpay-amount').textContent = vnd;
  document.getElementById('momo-amount').textContent = vnd;
  document.getElementById('zalo-amount').textContent = vnd;
  document.getElementById('stripe-total').textContent = usd;
  document.getElementById('paypal-total').textContent = usd;
  document.getElementById('paypal-desc').textContent = pkg.name + ' — ' + pkg.points.toLocaleString() + ' PT';
  // Generate QR
  drawQR('qr-canvas');
  drawQR('momo-qr-canvas');
  drawQR('zalo-qr-canvas');
  // Reset sub-states
  document.getElementById('vnpay-otp-section').style.display = 'none';
  document.getElementById('stripe-3ds').style.display = 'none';
  document.getElementById('paypal-confirm').style.display = 'none';
  logActivity('GATEWAY_SHOW', gw.toUpperCase() + ' screen displayed for ' + pkg.name + ' (' + vnd + ')');
}

function drawQR(canvasId) {
  const c = document.getElementById(canvasId);
  if (!c) return;
  const ctx = c.getContext('2d');
  const s = 180, cs = s / 25;
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, s, s);
  ctx.fillStyle = '#000';
  // Random QR-like pattern
  for (let i = 0; i < 25; i++) for (let j = 0; j < 25; j++) {
    // Corner squares
    if ((i < 7 && j < 7) || (i < 7 && j > 17) || (i > 17 && j < 7)) {
      const inOuter = (i < 7 && j < 7) ? (i===0||i===6||j===0||j===6) : (i < 7 && j > 17) ? (i===0||i===6||j===18||j===24) : (i===18||i===24||j===0||j===6);
      const inInner = (i < 7 && j < 7) ? (i>=2&&i<=4&&j>=2&&j<=4) : (i < 7 && j > 17) ? (i>=2&&i<=4&&j>=20&&j<=22) : (i>=20&&i<=22&&j>=2&&j<=4);
      if (inOuter || inInner) ctx.fillRect(j*cs, i*cs, cs, cs);
    } else if (Math.random() > 0.5) {
      ctx.fillRect(j*cs, i*cs, cs, cs);
    }
  }
}

function startCountdown() {
  let secs = 299;
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    secs--;
    if (secs <= 0) { clearInterval(countdownTimer); return; }
    const m = String(Math.floor(secs/60)).padStart(2,'0');
    const s2 = String(secs%60).padStart(2,'0');
    ['vnpay-countdown','momo-countdown','zalo-countdown'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = m + ':' + s2; });
  }, 1000);
}

// VNPay sub-tabs
function switchVnpayTab(tab) {
  document.getElementById('vnpay-tab-qr').style.display = tab === 'qr' ? '' : 'none';
  document.getElementById('vnpay-tab-card').style.display = tab === 'card' ? '' : 'none';
  document.querySelectorAll('#vnpay-tabs .tab').forEach((t, i) => t.classList.toggle('active', (tab === 'qr' && i === 0) || (tab === 'card' && i === 1)));
}
function showVnpayOTP() { document.getElementById('vnpay-otp-section').style.display = ''; logActivity('VNPAY_OTP', 'OTP verification screen displayed'); }
function simulateStripe3DS() { document.getElementById('stripe-3ds').style.display = ''; logActivity('STRIPE_3DS', '3D Secure verification displayed'); }
function showPaypalConfirm() { document.getElementById('paypal-confirm').style.display = ''; logActivity('PAYPAL_AUTH', 'PayPal login successful, confirmation displayed'); }

// Payment result
function simulatePaymentSuccess() {
  if (countdownTimer) clearInterval(countdownTimer);
  const pkg = DB.packages[selectedPkgIdx];
  logActivity('PAYMENT_PROCESSING', selectedGateway.toUpperCase() + ' payment processing for ' + pkg.price_vnd.toLocaleString() + 'đ');

  // Show processing
  document.getElementById('topup-step-3').style.display = 'none';
  document.getElementById('topup-step-processing').style.display = '';
  document.getElementById('step-3').classList.remove('active'); document.getElementById('step-3').classList.add('done');

  setTimeout(() => {
    // Add transaction
    const bonus = Math.round(pkg.points * pkg.bonus_pct / 100);
    const totalPts = pkg.points + bonus;
    const txn = addTransaction('topup',
      `Gói ${pkg.name} — ${pkg.points.toLocaleString()} PT${bonus ? ' (+' + bonus + ' bonus)' : ''} via ${selectedGateway.toUpperCase()}`,
      totalPts, selectedGateway, pkg.id, pkg.price_vnd
    );

    // Show success
    document.getElementById('topup-step-processing').style.display = 'none';
    document.getElementById('topup-step-success').style.display = '';
    document.getElementById('step-4').classList.add('active');
    document.getElementById('step-line-3').classList.add('done');

    document.getElementById('success-txn-id').textContent = txn.id;
    document.getElementById('success-time').textContent = txn.time;
    document.getElementById('success-pkg').textContent = pkg.name + ' — ' + pkg.points.toLocaleString() + ' Point';
    document.getElementById('success-bonus').textContent = bonus ? '+' + bonus + ' Point (' + pkg.bonus_pct + '%)' : 'Không có';
    document.getElementById('success-gateway').textContent = selectedGateway.toUpperCase();
    document.getElementById('success-total-points').textContent = '+' + totalPts.toLocaleString() + ' Point';
    document.getElementById('success-new-balance').textContent = currentUser().points.toLocaleString() + ' Point';

    renderAll();
    toast('success', '🎉 Nạp thành công! +' + totalPts.toLocaleString() + ' Point');
    logActivity('PAYMENT_SUCCESS', txn.id + ': +' + totalPts + ' PT via ' + selectedGateway.toUpperCase());
  }, 2000);
}

function simulatePaymentFail() {
  if (countdownTimer) clearInterval(countdownTimer);
  logActivity('PAYMENT_FAILED', selectedGateway.toUpperCase() + ' payment failed');
  document.getElementById('topup-step-3').style.display = 'none';
  document.getElementById('topup-step-processing').style.display = '';
  setTimeout(() => {
    document.getElementById('topup-step-processing').style.display = 'none';
    document.getElementById('topup-step-fail').style.display = '';
    toast('error', '❌ Thanh toán thất bại. Tài khoản không bị trừ tiền.');
  }, 1500);
}

function resetPaymentFlow() {
  document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('selected'));
  selectedPkgIdx = 2;
}

// ============================================================
//  MODULE ACTIONS — REALISTIC FILE UPLOAD + PROCESSING
// ============================================================
const plates = ['51G-123.45','30A-567.89','43A-012.34','29B-888.99','36C-456.78','92D-321.00'];
const confs = [92, 78, 96, 85, 71, 88];
let plateCurrentFile = null;
let plateConfig = { country: 'vn', vehicle: 'car', color: 'white' };
let plateProcessing = false;
let plateVideoFrames = [];

const PLATE_COUNTRIES = { vn: 'Việt Nam', us: 'Hoa Kỳ', jp: 'Nhật Bản', kr: 'Hàn Quốc' };
const PLATE_VEHICLES = { car: 'Ô tô', moto: 'Xe máy', truck: 'Xe tải' };
const PLATE_COLORS = { white: 'Trắng', black: 'Đen', yellow: 'Vàng', blue: 'Xanh' };

function handlePlateDrop(e) {
  e.preventDefault();
  document.getElementById('plate-dropzone').classList.remove('plate-dropzone-active');
  handlePlateSingleFile(e.dataTransfer.files[0]);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function handlePlateSingleFile(file) {
  if (!file) return;
  const isImg = file.type.startsWith('image/');
  const isVid = file.type.startsWith('video/');
  if (!isImg && !isVid) { toast('error', '❌ File không hợp lệ. Chọn ảnh hoặc video.'); return; }
  const maxMB = isImg ? DB.config.max_upload_image_mb : DB.config.max_upload_video_mb;
  if (file.size > maxMB * 1024 * 1024) { toast('error', `❌ "${file.name}" vượt quá ${maxMB}MB`); return; }

  const type = isImg ? 'image' : 'video';
  const cost = isImg ? DB.config.plate_image_cost : DB.config.plate_video_cost;
  const thumbUrl = isImg ? URL.createObjectURL(file) : null;

  plateCurrentFile = { file, name: file.name, size: file.size, type, cost, thumbUrl };
  plateVideoFrames = [];

  // Update file info display
  document.getElementById('plate-file-info').style.display = '';
  document.getElementById('pfi-name').textContent = file.name;
  document.getElementById('pfi-size').textContent = formatSize(file.size);
  document.getElementById('pfi-tag').textContent = type === 'image' ? 'Ảnh' : 'Video';
  document.getElementById('pfi-tag').className = 'fi-tag ' + type;
  document.getElementById('pfi-cost').textContent = '-' + cost + ' PT';
  document.getElementById('pfi-preview').textContent = type === 'image' ? '📷' : '🎥';

  // Update preview card
  document.getElementById('plate-preview-area').innerHTML = type === 'image'
    ? `<img src="${thumbUrl}" style="max-width:100%;max-height:280px;border-radius:var(--radius-sm)" id="plate-preview-img">`
    : `<div style="font-size:48px;opacity:.5">🎬</div><div class="fs-12 text-tertiary mt-8">${file.name}</div>`;
  document.getElementById('plate-preview-meta').style.display = '';
  document.getElementById('pp-name').textContent = file.name;
  document.getElementById('pp-size').textContent = formatSize(file.size);
  document.getElementById('pp-type').textContent = type === 'image' ? 'Ảnh' : 'Video';
  document.getElementById('pp-dims').textContent = isImg ? `${file.width||1920}×${file.height||1080} px` : '—';

  // Video: show frame extraction
  const vidSection = document.getElementById('plate-video-section');
  if (type === 'video') {
    vidSection.style.display = '';
    generateSimulatedFrames();
  } else {
    vidSection.style.display = 'none';
  }

  // Enable step 1 next button
  const nextBtn = document.getElementById('btn-step1-next');
  nextBtn.disabled = false;
  nextBtn.textContent = type === 'video' ? 'Tiếp theo: Chọn frame →' : 'Tiếp theo: Chỉnh sửa ảnh →';

  toast('info', `📎 Đã tải file: ${file.name}`);
}

function generateSimulatedFrames() {
  const grid = document.getElementById('frame-grid');
  const frameCount = 5 + Math.floor(Math.random() * 4);
  plateVideoFrames = [];
  let html = '';
  for (let i = 0; i < frameCount; i++) {
    const ts = `00:${String(Math.floor(Math.random() * 59)).padStart(2,'0')}:${String(Math.floor(Math.random() * 59)).padStart(2,'0')}`;
    // Draw a simulated frame on canvas
    const cvs = document.createElement('canvas');
    cvs.width = 160; cvs.height = 90;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = ['#1a1a2e','#16213e','#0f3460','#1a1a3e','#2d1a2e'][i % 5];
    ctx.fillRect(0,0,160,90);
    ctx.fillStyle = '#444';
    ctx.fillRect(20 + i*2, 25 + i, 80, 36);
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText(`FRAME ${i+1}`, 30, 65);
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.font = '10px monospace';
    ctx.fillText(ts, 100, 80);
    const dataUrl = cvs.toDataURL();
    plateVideoFrames.push({ idx: i, ts, dataUrl, selected: i === 0 });
    html += `<div class="frame-thumb ${i===0?'selected':''}" onclick="selectFrame(${i})"><img src="${dataUrl}" alt="Frame ${i+1}"><div class="frame-ts">${ts}</div>${i===0?'<div class="frame-badge">✓</div>':''}</div>`;
  }
  grid.innerHTML = html;
  document.getElementById('btn-refresh-frames').onclick = generateSimulatedFrames;
}

function selectFrame(idx) {
  document.querySelectorAll('.frame-thumb').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
    const badge = el.querySelector('.frame-badge');
    if (badge) badge.remove();
    if (i === idx) {
      const b = document.createElement('div');
      b.className = 'frame-badge';
      b.textContent = '✓';
      el.appendChild(b);
    }
  });
  plateVideoFrames.forEach((f, i) => f.selected = i === idx);
  // Update preview
  document.getElementById('plate-preview-area').innerHTML = `<img src="${plateVideoFrames[idx].dataUrl}" style="max-width:100%;max-height:280px;border-radius:var(--radius-sm)">`;
  toast('info', `📌 Đã chọn frame ${idx+1}`);
}

function goPlateStep(step) {
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`ps-${i}`).classList.toggle('active', i <= step);
    document.getElementById(`ps-content-${i}`).classList.toggle('active', i === step);
    if (i < 4) document.getElementById(`psl-${i}`).classList.toggle('active', i < step);
  }
  if (step === 2) initEditorCanvas();
  scrollToElement(document.querySelector('.plate-wizard'), 0);
}

function scrollToElement(el, offset) {
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectConfig(el, type, value) {
  const parent = el.parentElement;
  parent.querySelectorAll('.config-option').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  plateConfig[type] = value;
  if (type === 'country') {
    const cost = value === 'vn' ? DB.config.plate_image_cost : DB.config.plate_image_cost + 2;
    document.getElementById('plate-config-cost').textContent = '-' + cost + ' PT';
  }
}

function resetPlateWizard() {
  if (plateCurrentFile && plateCurrentFile.thumbUrl) URL.revokeObjectURL(plateCurrentFile.thumbUrl);
  plateCurrentFile = null;
  plateVideoFrames = [];
  document.getElementById('plate-file-info').style.display = 'none';
  document.getElementById('plate-video-section').style.display = 'none';
  document.getElementById('plate-file-input').value = '';
  document.getElementById('btn-step1-next').disabled = true;
  document.getElementById('plate-preview-area').innerHTML = '<div class="text-center"><div style="font-size:48px;opacity:.3">📷</div><div class="text-tertiary fs-12 mt-8">Chưa có file nào được chọn</div></div>';
  document.getElementById('plate-preview-meta').style.display = 'none';
  document.getElementById('plate-result-ui').style.display = 'none';
  document.getElementById('plate-processing-ui').style.display = '';
  goPlateStep(1);
}

// --- Image Editor ---
let editorOriginalDataUrl = null;
function initEditorCanvas() {
  const canvas = document.getElementById('editor-canvas');
  const ctx = canvas.getContext('2d');
  let src;
  if (plateCurrentFile && plateCurrentFile.type === 'image' && plateCurrentFile.thumbUrl) {
    src = plateCurrentFile.thumbUrl;
  } else if (plateVideoFrames.length > 0) {
    const sel = plateVideoFrames.find(f => f.selected);
    src = sel ? sel.dataUrl : plateVideoFrames[0].dataUrl;
  } else {
    // Fallback: draw a simulated plate image on canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 400, 280);
    ctx.fillStyle = '#444';
    ctx.fillRect(100, 80, 200, 80);
    ctx.fillStyle = '#999';
    ctx.font = 'bold 22px monospace';
    ctx.fillText('51G-1??.4?', 120, 140);
    editorOriginalDataUrl = canvas.toDataURL();
    return;
  }
  const img = new Image();
  img.onload = () => {
    canvas.width = Math.min(img.naturalWidth, 400);
    canvas.height = Math.min(img.naturalHeight, 280);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    editorOriginalDataUrl = canvas.toDataURL();
    // Reset sliders
    document.getElementById('ed-brightness').value = 0;
    document.getElementById('ed-contrast').value = 0;
    document.getElementById('ed-saturation').value = 0;
    document.getElementById('ed-brightness-val').textContent = '0';
    document.getElementById('ed-contrast-val').textContent = '0';
    document.getElementById('ed-saturation-val').textContent = '0';
  };
  img.src = src;
}

function resetEditor() {
  if (editorOriginalDataUrl) {
    const img = new Image();
    img.onload = () => {
      const canvas = document.getElementById('editor-canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      document.getElementById('ed-brightness').value = 0;
      document.getElementById('ed-contrast').value = 0;
      document.getElementById('ed-saturation').value = 0;
      document.getElementById('ed-brightness-val').textContent = '0';
      document.getElementById('ed-contrast-val').textContent = '0';
      document.getElementById('ed-saturation-val').textContent = '0';
    };
    img.src = editorOriginalDataUrl;
  }
}

function applyEditorFilters() {
  const canvas = document.getElementById('editor-canvas');
  const ctx = canvas.getContext('2d');
  const b = parseInt(document.getElementById('ed-brightness').value);
  const c = parseInt(document.getElementById('ed-contrast').value);
  const s = parseInt(document.getElementById('ed-saturation').value);
  document.getElementById('ed-brightness-val').textContent = b;
  document.getElementById('ed-contrast-val').textContent = c;
  document.getElementById('ed-saturation-val').textContent = s;

  if (!editorOriginalDataUrl) return;
  const img = new Image();
  img.onload = () => {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const factor = 1 + (c / 100);
    const brightness = b;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128 + brightness));
      data[i+1] = Math.min(255, Math.max(0, (data[i+1] - 128) * factor + 128 + brightness));
      data[i+2] = Math.min(255, Math.max(0, (data[i+2] - 128) * factor + 128 + brightness));
    }
    ctx.putImageData(imageData, 0, 0);
  };
  img.src = editorOriginalDataUrl;
}

function editorTool(tool) {
  const canvas = document.getElementById('editor-canvas');
  const ctx = canvas.getContext('2d');
  switch (tool) {
    case 'rotl':
    case 'rotr': {
      const angle = tool === 'rotl' ? -90 : 90;
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.height;
      tempCanvas.height = canvas.width;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.translate(tempCanvas.width/2, tempCanvas.height/2);
      tempCtx.rotate(angle * Math.PI / 180);
      tempCtx.drawImage(canvas, -canvas.width/2, -canvas.height/2);
      canvas.width = tempCanvas.width;
      canvas.height = tempCanvas.height;
      ctx.drawImage(tempCanvas, 0, 0);
      editorOriginalDataUrl = canvas.toDataURL();
      break;
    }
    case 'fliph': {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(canvas, -canvas.width, 0);
      ctx.restore();
      editorOriginalDataUrl = canvas.toDataURL();
      break;
    }
    case 'flipv': {
      ctx.save();
      ctx.scale(1, -1);
      ctx.drawImage(canvas, 0, -canvas.height);
      ctx.restore();
      editorOriginalDataUrl = canvas.toDataURL();
      break;
    }
    case 'sharpen': {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const w = canvas.width, h = canvas.height;
      const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
      const copy = new Uint8ClampedArray(data);
      for (let y = 1; y < h-1; y++) {
        for (let x = 1; x < w-1; x++) {
          for (let c = 0; c < 3; c++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++)
              for (let kx = -1; kx <= 1; kx++)
                sum += copy[((y+ky)*w + (x+kx))*4 + c] * kernel[(ky+1)*3 + (kx+1)];
            data[(y*w + x)*4 + c] = Math.min(255, Math.max(0, sum));
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
      editorOriginalDataUrl = canvas.toDataURL();
      toast('info', '🔪 Đã làm nét ảnh');
      break;
    }
    case 'autobalance': {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let rMin=255,gMin=255,bMin=255,rMax=0,gMax=0,bMax=0;
      for (let i = 0; i < data.length; i += 4) {
        rMin = Math.min(rMin, data[i]); rMax = Math.max(rMax, data[i]);
        gMin = Math.min(gMin, data[i+1]); gMax = Math.max(gMax, data[i+1]);
        bMin = Math.min(bMin, data[i+2]); bMax = Math.max(bMax, data[i+2]);
      }
      for (let i = 0; i < data.length; i += 4) {
        data[i] = (data[i]-rMin)*255/(rMax-rMin);
        data[i+1] = (data[i+1]-gMin)*255/(gMax-gMin);
        data[i+2] = (data[i+2]-bMin)*255/(bMax-bMin);
      }
      ctx.putImageData(imageData, 0, 0);
      editorOriginalDataUrl = canvas.toDataURL();
      toast('info', '✨ Đã tự động cân bằng ảnh');
      break;
    }
    case 'crop': {
      toast('info', '✂️ Kéo chuột để chọn vùng cắt (mô phỏng)');
      break;
    }
    case 'zoomout': {
      canvas.style.width = Math.max(200, parseInt(canvas.style.width) - 40) + 'px' || (canvas.width * 0.8) + 'px';
      break;
    }
    case 'zoomin': {
      canvas.style.width = Math.min(800, parseInt(canvas.style.width) + 40) + 'px' || (canvas.width * 1.2) + 'px';
      break;
    }
    case 'fit': {
      canvas.style.width = '100%';
      canvas.style.maxWidth = '400px';
      canvas.width = 400;
      canvas.height = 280;
      break;
    }
  }
}

// --- Plate Processing ---
function startPlateProcessing() {
  if (plateProcessing) return;
  if (!plateCurrentFile) { toast('warning', '⚠️ Chưa có file nào.'); return; }

  try {
  const user = currentUser();
  if (user.status === 'locked') { toast('error', '❌ Tài khoản đã bị khóa.'); return; }
  const baseCost = plateCurrentFile.cost;
  const cost = getEffectiveCost(baseCost, user.id, 'plate');
  plateCurrentFile.cost = cost;

  const limitCheck = checkLimit(user, 'plate', plateCurrentFile.type === 'video' ? 'vid' : 'img');
  if (!limitCheck.ok) { toast('error', limitCheck.msg); return; }

  if (user.points < cost) { toast('error', `❌ Không đủ Point! Cần ${cost} PT.`); return; }
  if (user.points < cost * 3) { toast('warning', `⚠️ Sắp hết Point! Còn ${user.points} PT.`); }

  goPlateStep(4);
  plateProcessing = true;
  logActivity('PLATE_PROCESS_START', `Single file: ${plateCurrentFile.name}, config: ${JSON.stringify(plateConfig)}`);

  // Animate through processing steps
  const steps = ['proc-sr','proc-binarize','proc-deskew','proc-ocr','proc-verify'];
  let stepIdx = 0;
  function advanceStep() {
    if (stepIdx > 0) {
      document.getElementById(steps[stepIdx-1]).querySelector('.ps-spinner').textContent = '✅';
    }
    if (stepIdx >= steps.length) {
      finishProcessing();
      return;
    }
    if (debugMode && Math.random() < 0.15) { toast('error', '⚠️ [Debug] Lỗi mạng, đang thử lại...'); setTimeout(advanceStep, 1000); return; }
    const el = document.getElementById(steps[stepIdx]);
    el.classList.add('active');
    stepIdx++;
    setTimeout(advanceStep, 600 + Math.random() * 400);
  }
  advanceStep();
  } catch(e) { toast('error', '❌ Lỗi hệ thống: ' + e.message); logActivity('PLATE_REPAIR', 'Error: ' + e.message, 'failed'); plateProcessing = false; }

  function finishProcessing() {
    const pIdx = Math.floor(Math.random() * plates.length);
    const plate = plates[pIdx], conf = confs[pIdx];
    const blurPlate = plate.replace(/[0-9]/g, (m, i) => Math.random() > 0.5 ? '?' : m);

    if (conf < 50) {
      addTransaction('refund', 'Hoàn Point — OCR đạt ' + conf + '%, dưới ngưỡng 50%', cost, null, null, 0);
      document.getElementById('plate-cost-result').textContent = '🔄 Đã hoàn ' + cost + ' PT';
      toast('warning', '⚠️ OCR chỉ đạt ' + conf + '%. Đã hoàn ' + cost + ' PT.');
    } else {
      addTransaction('use', `Module 2 — Biển số (${plateCurrentFile.type}) → ${plate}`, -cost, null, null, 0);
      recordUsage(user.id, 'plate', plateCurrentFile.type === 'video' ? 'vid' : 'img');
      document.getElementById('plate-cost-result').textContent = '-' + cost + ' PT';
    }

    document.getElementById('plate-processing-ui').style.display = 'none';
    document.getElementById('plate-result-ui').style.display = '';
    document.getElementById('plate-before').textContent = blurPlate;
    document.getElementById('plate-after').textContent = plate;
    document.getElementById('plate-detected').textContent = plate;
    document.getElementById('plate-conf').textContent = conf + '%';
    document.getElementById('plate-conf-bar').style.width = conf + '%';
    document.getElementById('plate-conf-bar').style.background = conf >= 80 ? 'var(--success)' : conf >= 60 ? 'var(--warning)' : 'var(--danger)';

    // Report info
    document.getElementById('plate-report-file').textContent = plateCurrentFile.name;
    document.getElementById('plate-report-country').textContent = PLATE_COUNTRIES[plateConfig.country] || 'Việt Nam';
    document.getElementById('plate-report-vehicle').textContent = PLATE_VEHICLES[plateConfig.vehicle] || 'Ô tô';
    document.getElementById('plate-report-color').textContent = PLATE_COLORS[plateConfig.color] || 'Trắng';
    document.getElementById('plate-report-config').textContent = `${PLATE_COUNTRIES[plateConfig.country]} • ${PLATE_VEHICLES[plateConfig.vehicle]} • Chữ ${(PLATE_COLORS[plateConfig.color]||'').toLowerCase()}`;

    plateProcessing = false;
    toast('success', `✅ Phục hồi biển số thành công! -${cost} PT`);
    logActivity('PLATE_PROCESS_DONE', `${plateCurrentFile.name} → ${plate} | Conf: ${conf}% | Cost: -${cost} PT`);
    renderAll();
  }
}

// ============================================================
//  VIDEO REPAIR WIZARD
// ============================================================
let videoFile = null;
let videoRefFile = null;
let videoRepairMode = 'deep';
let videoRepairTimeout = null;
let videoRepairCancelled = false;

const VIDEO_ERRORS = [
  { id:'e1', severity:'critical', icon:'🚫', label:'Mất moov atom', desc:'Header metadata bị mất, video không mở được', note:'Header đã được tái tạo từ dữ liệu còn lại' },
  { id:'e2', severity:'high', icon:'⚠️', label:'Corrupt header', desc:'Cấu trúc file MP4 bị hỏng', note:'Cấu trúc MP4 đã được phân tích và sửa' },
  { id:'e3', severity:'medium', icon:'⚠️', label:'Codec error (H.264)', desc:'H.264 stream bị lỗi, frame bị skip', note:'Frame lỗi đã được re-encode bằng tham số tương thích' },
  { id:'e4', severity:'low', icon:'ℹ️', label:'AV out of sync', desc:'Audio/video lệch ~1.2s', note:'Đã đồng bộ lại audio track với video timeline' },
];

const VIDEO_TECH_PROFILES = [
  { container:'MP4', codec:'H.264 (AVC)', resolution:'1920×1080', fps:'30 FPS', vbitrate:'8.5 Mbps', abitrate:'128 kbps', astream:'AAC 48kHz Stereo', sizeLabel:'245 MB' },
  { container:'MP4', codec:'H.265 (HEVC)', resolution:'3840×2160', fps:'60 FPS', vbitrate:'25 Mbps', abitrate:'192 kbps', astream:'AAC 48kHz Stereo', sizeLabel:'1.2 GB' },
  { container:'MOV', codec:'H.264 (AVC)', resolution:'1920×1080', fps:'24 FPS', vbitrate:'12 Mbps', abitrate:'256 kbps', astream:'PCM 48kHz Mono', sizeLabel:'512 MB' },
  { container:'MKV', codec:'H.264 (AVC)', resolution:'1280×720', fps:'30 FPS', vbitrate:'4.5 Mbps', abitrate:'96 kbps', astream:'AAC 44.1kHz Stereo', sizeLabel:'890 MB' },
  { container:'FLV', codec:'H.263', resolution:'640×480', fps:'25 FPS', vbitrate:'1.2 Mbps', abitrate:'64 kbps', astream:'MP3 44.1kHz Mono', sizeLabel:'178 MB' },
];
const VIDEO_ERR_SUBSET = [
  [VIDEO_ERRORS[0], VIDEO_ERRORS[1]],
  [VIDEO_ERRORS[0], VIDEO_ERRORS[1], VIDEO_ERRORS[2]],
  [VIDEO_ERRORS[0], VIDEO_ERRORS[1], VIDEO_ERRORS[2], VIDEO_ERRORS[3]],
];
const VIDEO_NAMES = ['recording_0512.mp4','dashcam_crash.mp4','security_footage.mov','screen_recording.mkv','meeting_zoom.flv'];
const VIDEO_SIZES = ['245 MB','512 MB','1.2 GB','890 MB','178 MB'];
const VIDEO_DURS = ['~12 phút','~45 phút','~3 phút','~32 phút','~8 phút'];

function handleVideoDrop(e) {
  e.preventDefault();
  document.getElementById('video-dropzone').classList.remove('plate-dropzone-active');
  handleVideoSingleFile(e.dataTransfer.files[0]);
}

function handleVideoSingleFile(file) {
  if (!file) return;
  const validTypes = ['video/mp4','video/quicktime','video/x-msvideo','video/x-matroska','video/x-flv','video/webm'];
  if (!validTypes.includes(file.type)) { toast('error', '❌ Định dạng video không được hỗ trợ. Chấp nhận: MP4, MOV, AVI, MKV, FLV, WEBM.'); return; }
  if (file.size > DB.config.max_upload_video_mb * 1024 * 1024) { toast('error', '❌ Video quá lớn. Tối đa ' + DB.config.max_upload_video_mb + 'MB.'); return; }
  videoFile = file;
  const randIdx = Math.floor(Math.random() * VIDEO_NAMES.length);
  const fName = VIDEO_NAMES[randIdx];
  const fSize = VIDEO_SIZES[randIdx];
  const fDur = VIDEO_DURS[randIdx];
  const ext = fName.split('.').pop().toUpperCase();
  const queueEl = document.getElementById('video-file-queue');
  queueEl.innerHTML = '<div class="file-item done"><div class="fi-preview">🎬</div><div class="fi-info"><div class="fi-name">' + fName + '</div><div class="fi-meta"><span>' + fSize + '</span><span class="fi-tag video">' + ext + '</span><span>' + fDur + '</span></div><div class="fi-progress"><div class="fill" style="width:100%"></div></div></div><div class="fi-status">✅</div><button class="fi-remove" onclick="resetVideoWizard()">✕</button></div>';
  document.getElementById('btn-video-next-1').disabled = false;
  renderVideoPreview(fName, fSize, ext, fDur, 'Đang phân tích...');
  logActivity('VIDEO_UPLOAD', fName + ' (' + fSize + ') uploaded. Analyzing...');
  toast('info', '🎬 Upload thành công! Chuyển sang bước phân tích.');
}

function handleVideoRefDrop(e) {
  e.preventDefault();
  document.getElementById('video-ref-content').querySelector('.upload-zone').classList.remove('plate-dropzone-active');
  handleVideoRefFile(e.dataTransfer.files[0]);
}

function handleVideoRefFile(file) {
  if (!file) return;
  videoRefFile = file;
  const el = document.getElementById('video-ref-queue');
  el.innerHTML = '<div class="file-item done" style="margin-top:8px"><div class="fi-preview">📎</div><div class="fi-info"><div class="fi-name">' + file.name + '</div><div class="fi-meta"><span>' + Math.round(file.size/1048576) + ' MB</span><span class="fi-tag video">REF</span></div></div><div class="fi-status">✅</div></div>';
  toast('success', '📎 Reference video đã được thêm vào.');
}

function toggleVideoRef() {
  const el = document.getElementById('video-ref-content');
  el.classList.toggle('open');
}

function toggleVideoAdvanced() {
  const el = document.getElementById('video-advanced-content');
  el.classList.toggle('open');
  document.getElementById('video-adv-arrow').textContent = el.classList.contains('open') ? '▼' : '▶';
}

function selectVideoRepairMode(mode) {
  videoRepairMode = mode;
  document.getElementById('vid-mode-fast').style.borderColor = mode === 'fast' ? 'var(--primary)' : 'var(--border)';
  document.getElementById('vid-mode-fast').style.background = mode === 'fast' ? 'var(--primary-bg)' : '';
  document.getElementById('vid-mode-deep').style.borderColor = mode === 'deep' ? 'var(--primary)' : 'var(--border)';
  document.getElementById('vid-mode-deep').style.background = mode === 'deep' ? 'var(--primary-bg)' : '';
  updateVideoCost();
}

function updateVideoCost() {
  const cost = videoRepairMode === 'fast' ? DB.config.video_fast_cost : DB.config.video_deep_cost;
  const user = currentUser();
  document.getElementById('vid-config-cost').textContent = '-' + cost + ' PT';
  if (user) document.getElementById('vid-balance-display').textContent = user.points.toLocaleString() + ' PT';
}

function goVideoStep(step) {
  for (let i = 1; i <= 4; i++) {
    document.getElementById('vs-' + i).classList.remove('active','done');
    if (i < step) document.getElementById('vs-' + i).classList.add('done');
    if (i === step) document.getElementById('vs-' + i).classList.add('active');
  }
  for (let i = 1; i <= 3; i++) {
    document.getElementById('vsl-' + i).classList.toggle('done', i < step);
  }
  for (let i = 1; i <= 4; i++) {
    document.getElementById('vs-content-' + i).classList.remove('active');
  }
  document.getElementById('vs-content-' + step).classList.add('active');
  if (step === 2) videoSimulateErrors();
  updateVideoCost();
}

function videoSimulateErrors() {
  const errList = document.getElementById('video-error-list');
  const errs = VIDEO_ERR_SUBSET[Math.floor(Math.random() * VIDEO_ERR_SUBSET.length)];
  const errNames = errs.map(e => e.label).join(', ');
  document.getElementById('vp-errors').textContent = errNames;
  errList.innerHTML = errs.map(e =>
    '<div class="video-error-card"><div class="ve-severity ' + e.severity + '">' + e.severity.toUpperCase() + '</div><div style="flex:1"><div class="fw-500">' + e.icon + ' ' + e.label + '</div><div class="fs-12 text-tertiary">' + e.desc + '</div></div></div>'
  ).join('');
  logActivity('VIDEO_ANALYZE', 'Detected ' + errs.length + ' errors: ' + errNames);
}

function startVideoRepair() {
  try {
  const user = currentUser();
  if (!user) return;
  if (user.status === 'locked') { toast('error', '❌ Tài khoản đã bị khóa.'); return; }
  const baseCost = videoRepairMode === 'fast' ? DB.config.video_fast_cost : DB.config.video_deep_cost;
  const cost = getEffectiveCost(baseCost, user.id, 'video');

  const limitCheck = checkLimit(user, 'video', videoRepairMode);
  if (!limitCheck.ok) { toast('error', limitCheck.msg); return; }

  if (user.points < cost) { toast('error', '❌ Không đủ Point! Vui lòng nạp thêm.'); return; }
  if (user.points < cost * 3) { toast('warning', `⚠️ Sắp hết Point! Còn ${user.points} PT.`); }
  videoRepairCancelled = false;
  goVideoStep(3);
  const eta = videoRepairMode === 'fast' ? '~2 phút' : '~8 phút';
  document.getElementById('vid-eta').textContent = eta;
  document.getElementById('vid-progress-bar').style.width = '0%';
  // Reset all steps
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById('vid-proc-' + i);
    el.classList.remove('active','done');
    el.querySelector('.ps-spinner').innerHTML = '';
    el.style.opacity = '.5';
  }
  document.getElementById('vid-cancel-btn').style.display = '';
  logActivity('VIDEO_REPAIR_START', videoRepairMode + ' mode, cost: ' + cost + ' PT | File: ' + (videoFile ? videoFile.name : 'unknown'));
  toast('info', '🔧 Đang khôi phục video (' + videoRepairMode + ')...');
  videoRepairStep(1);
  } catch(e) { toast('error', '❌ Lỗi hệ thống: ' + e.message); logActivity('VIDEO_REPAIR', 'Error: ' + e.message, 'failed'); }

function videoRepairStep(idx) {
  if (videoRepairCancelled) return;
  const totalSteps = 5;
  const stepDelay = videoRepairMode === 'fast' ? 600 : 1000;
  const el = document.getElementById('vid-proc-' + idx);
  el.classList.add('active');
  el.style.opacity = '1';
  el.querySelector('.ps-spinner').innerHTML = '<div class="ps-spinner"></div>';
  const pct = Math.round((idx / totalSteps) * 100);
  document.getElementById('vid-progress-bar').style.width = pct + '%';
  
  videoRepairTimeout = setTimeout(() => {
    if (videoRepairCancelled) return;
    el.classList.remove('active');
    el.classList.add('done');
    el.querySelector('.ps-spinner').innerHTML = '✅';
    const pct2 = Math.round(((idx + 1) / totalSteps) * 100);
    document.getElementById('vid-progress-bar').style.width = pct2 + '%';
    if (idx < totalSteps) {
      videoRepairStep(idx + 1);
    } else {
      finishVideoRepair();
    }
  }, stepDelay);
}

function cancelVideoRepair() {
  videoRepairCancelled = true;
  if (videoRepairTimeout) clearTimeout(videoRepairTimeout);
  document.getElementById('vid-cancel-btn').style.display = 'none';
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById('vid-proc-' + i);
    el.classList.remove('active','done');
    el.style.opacity = '.3';
    el.querySelector('.ps-spinner').innerHTML = '✕';
  }
  toast('info', '✕ Đã hủy xử lý video.');
  logActivity('VIDEO_REPAIR_CANCEL', 'User cancelled video repair');
}

function finishVideoRepair() {
  const isSuccess = Math.random() > 0.15;
  document.getElementById('vid-cancel-btn').style.display = 'none';
  if (isSuccess) {
    addTransaction('use', 'Module 1 — Video repair (' + videoRepairMode + ')', -cost, null, null, 0);
    recordUsage(user.id, 'video', videoRepairMode);
    const randIdx = Math.floor(Math.random() * VIDEO_NAMES.length);
    const tech = VIDEO_TECH_PROFILES[Math.floor(Math.random() * VIDEO_TECH_PROFILES.length)];
    const errs = VIDEO_ERR_SUBSET[Math.floor(Math.random() * VIDEO_ERR_SUBSET.length)];
    const outSize = Math.round(parseInt(tech.sizeLabel) * (0.98 + Math.random() * 0.08)) + ' MB';

    document.getElementById('vid-result-file').textContent = VIDEO_NAMES[randIdx];
    document.getElementById('vid-result-mode').textContent = videoRepairMode === 'fast' ? 'Nhanh' : 'Sửa sâu';
    document.getElementById('vid-result-container').textContent = tech.container;
    document.getElementById('vid-result-codec').textContent = tech.codec;
    document.getElementById('vid-result-resolution').textContent = tech.resolution;
    document.getElementById('vid-result-fps').textContent = tech.fps;
    document.getElementById('vid-result-vbitrate').textContent = tech.vbitrate;
    document.getElementById('vid-result-abitrate').textContent = tech.abitrate;
    document.getElementById('vid-result-astream').textContent = tech.astream;
    document.getElementById('vid-result-size').textContent = tech.sizeLabel + ' → ' + outSize;
    document.getElementById('vid-result-duration').textContent = VIDEO_DURS[randIdx];
    document.getElementById('vid-result-err-found').textContent = errs.length;
    document.getElementById('vid-result-err-fixed').textContent = errs.length + '/' + errs.length;
    document.getElementById('vid-result-time').textContent = videoRepairMode === 'fast' ? '~2 phút 15s' : '~8 phút 12s';
    document.getElementById('vid-result-cost').textContent = '-' + cost + ' PT';
    document.getElementById('vid-errors-found').textContent = errs.length + ' lỗi: ' + errs.map(e => e.label).join(', ');

    // Error detail list
    document.getElementById('vid-error-detail-list').innerHTML = errs.map(e =>
      '<div class="video-error-detail"><div class="ed-sev ' + e.severity + '"></div><div class="ed-label">' + e.icon + ' ' + e.label + '</div><span class="ed-status fixed">✅ Đã sửa</span><span class="ed-note">' + e.note + '</span></div>'
    ).join('');

    // Stream info
    document.getElementById('vid-stream-info').innerHTML =
      '<div class="stream-row"><div class="sr-icon">🎥</div><div class="sr-label">Video</div><div class="sr-detail">' + tech.codec + ' • ' + tech.resolution + ' • ' + tech.fps + ' • ' + tech.vbitrate + '</div></div>' +
      '<div class="stream-row"><div class="sr-icon">🎵</div><div class="sr-label">Audio</div><div class="sr-detail">' + tech.astream + ' • ' + tech.abitrate + '</div></div>';

    document.getElementById('vid-result-success').style.display = '';
    document.getElementById('vid-result-fail').style.display = 'none';
    toast('success', '✅ Video đã khôi phục thành công! -' + cost + ' PT');
    logActivity('VIDEO_REPAIR_SUCCESS', videoRepairMode + ' mode success | Cost: -' + cost + ' PT | File: ' + VIDEO_NAMES[randIdx]);
  } else {
    document.getElementById('vid-result-success').style.display = 'none';
    document.getElementById('vid-result-fail').style.display = '';
    toast('error', '❌ Không thể khôi phục video. Thử chế độ sửa sâu.');
    logActivity('VIDEO_REPAIR_FAILED', 'Repair failed for ' + videoRepairMode + ' mode');
  }
  renderAll();
}

function renderVideoPreview(name, size, format, duration, errors) {
  document.getElementById('video-preview-area').innerHTML = '<div class="text-center"><div style="font-size:48px">🎬</div><div class="fw-600 mt-8">' + name + '</div></div>';
  document.getElementById('video-preview-meta').style.display = '';
  document.getElementById('vp-name').textContent = name;
  document.getElementById('vp-size').textContent = size;
  document.getElementById('vp-format').textContent = format;
  document.getElementById('vp-duration').textContent = duration;
  document.getElementById('vp-errors').textContent = errors;
}

function resetVideoWizard() {
  videoFile = null;
  videoRefFile = null;
  videoRepairCancelled = false;
  if (videoRepairTimeout) clearTimeout(videoRepairTimeout);
  document.getElementById('video-file-queue').innerHTML = '';
  document.getElementById('video-ref-queue').innerHTML = '';
  document.getElementById('video-error-list').innerHTML = '';
  document.getElementById('btn-video-next-1').disabled = true;
  document.getElementById('video-preview-area').innerHTML = '<div class="text-center"><div style="font-size:48px;opacity:.3">🎬</div><div class="text-tertiary fs-12 mt-8">Chưa có video nào được chọn</div></div>';
  document.getElementById('video-preview-meta').style.display = 'none';
  document.getElementById('vid-error-detail-list').innerHTML = '';
  document.getElementById('vid-stream-info').innerHTML = '';
  const stepEl = document.getElementById('video-stepper');
  if (stepEl) goVideoStep(1);
  renderAll();
  logActivity('VIDEO_RESET', 'Video wizard reset');
}

// ============================================================
//  UTILS
// ============================================================
function checkLimit(user, module, sub) {
  if (!user) return { ok: true };
  const t = getTierLimits(user.tier);
  const maxKey = module === 'plate' ? 'plate_' + (sub||'img') : 'video_' + (sub||'fast');
  const maxDaily = t[maxKey] || 999;
  if (maxDaily <= 0) return { ok: false, msg: '❌ Tài khoản của bạn không có quyền sử dụng module này.' };
  if (maxDaily < 999) {
    const usage = getUserTodayUsage(user.id, module);
    const todayCount = usage[maxKey];
    if (todayCount >= maxDaily) return { ok: false, msg: '❌ Bạn đã dùng hết ' + maxDaily + ' lượt/ngày cho module này. Nâng cấp gói hoặc đợi ngày mới.' };
  }
  return { ok: true };
}

function formatLimitLabel(user) {
  if (!user) return '';
  const t = getTierLimits(user.tier);
  const p = t.plate_img >= 999 ? '∞' : t.plate_img;
  const v = t.video_fast >= 999 ? '∞' : t.video_fast;
  return '🚗 ' + p + '/ngày • 🎬 ' + v + '/ngày';
}

function toast(type, msg) {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast toast-' + type;
  t.innerHTML = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 4500);
}

let debugMode = false;
function toggleDebugMode() {
  debugMode = !debugMode;
  const btn = document.getElementById('debug-toggle-btn');
  if (btn) { btn.textContent = debugMode ? '🐛 Debug ON' : '🐛 Debug'; btn.style.opacity = debugMode ? '1' : '.5'; btn.style.background = debugMode ? 'var(--danger)' : ''; btn.style.color = debugMode ? '#fff' : ''; }
  toast(debugMode ? 'info' : 'success', debugMode ? '🐛 Chế độ debug BẬT — mô phỏng lỗi mạng ngẫu nhiên' : '✅ Debug đã tắt');
}

// Init
initDB();
nav('login');
