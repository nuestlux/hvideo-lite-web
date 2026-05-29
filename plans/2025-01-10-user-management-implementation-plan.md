# User Management Enhancement - Implementation Plan

**Date:** 2025-01-10  
**Design Ref:** `docs/superpowers/specs/2025-01-10-user-management-enhancement-design.md`

---

## Project Overview

Enhance the Hvideo Lite user management system (Quản lý tài khoản) with:
1. Three new user profile fields (phone, address, date of birth)
2. Expandable row detail view showing all user information
3. Password reset modal with auto-generate and copy functionality

---

## Phase 1: Database & Backend Setup

### 1.1 Database Schema Migration

**Files to Create/Modify:**
- `migrations/[timestamp]-add-user-contact-fields.sql` (PostgreSQL) OR equivalent for your DB

**Changes:**
```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN date_of_birth DATE;

-- Create audit table for password resets
CREATE TABLE password_reset_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reset_by UUID NOT NULL REFERENCES users(id),
  reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Validation:**
- Run migration successfully
- Verify new columns exist: `SELECT phone, address, date_of_birth FROM users LIMIT 1;`
- Verify audit table created: `\dt password_reset_logs;`

---

### 1.2 Backend Model Update

**File to Modify:**
- `src/models/user.ts` (or equivalent user model)

**Update User Type/Interface:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;           // NEW
  address?: string;         // NEW
  dateOfBirth?: Date;       // NEW
  role: 'admin' | 'user';
  points: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation:**
- Model compiles without errors
- Type is exported and usable in services

---

### 1.3 Database Query/ORM Updates

**Files to Modify:**
- `src/services/userService.ts` (or repository pattern file)

**Update Methods:**

```typescript
// Update select query to include new fields
async getUser(id: string): Promise<User> {
  return db.query(
    'SELECT id, name, email, phone, address, date_of_birth, role, points, status FROM users WHERE id = $1',
    [id]
  );
}

// Update list query
async getAllUsers(): Promise<User[]> {
  return db.query(
    'SELECT id, name, email, phone, address, date_of_birth, role, points, status FROM users'
  );
}

// New method: Update user contact info
async updateUserContactInfo(userId: string, data: {
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}): Promise<User> {
  const { phone, address, dateOfBirth } = data;
  return db.query(
    'UPDATE users SET phone = COALESCE($2, phone), address = COALESCE($3, address), date_of_birth = COALESCE($4, date_of_birth), updated_at = NOW() WHERE id = $1 RETURNING *',
    [userId, phone, address, dateOfBirth]
  );
}

// New method: Reset password
async resetPassword(userId: string, newHashedPassword: string, resetByAdminId: string): Promise<void> {
  await db.query(
    'UPDATE users SET password = $2, updated_at = NOW() WHERE id = $1',
    [userId, newHashedPassword]
  );
  
  // Log the reset
  await db.query(
    'INSERT INTO password_reset_logs (user_id, reset_by) VALUES ($1, $2)',
    [userId, resetByAdminId]
  );
}
```

**Validation:**
- Service methods compile and export correctly
- Test with sample queries in database client

---

## Phase 2: Backend API Endpoints

### 2.1 GET User Details Endpoint

**File:** `src/routes/users.ts` or `src/controllers/userController.ts`

```typescript
// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await userService.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});
```

**Validation:**
- Endpoint returns user object with all fields (including new ones)
- Status code 200 for success, 404 for not found

---

### 2.2 PUT Update User Contact Info Endpoint

**File:** `src/routes/users.ts`

```typescript
// PUT /api/users/:id/contact-info
router.put('/:id/contact-info', authenticateAdmin, async (req, res) => {
  try {
    const { phone, address, dateOfBirth } = req.body;
    
    // Validation
    if (dateOfBirth && !isValidDate(dateOfBirth)) {
      return res.status(400).json({ error: 'Invalid date format' });
    }
    
    const updated = await userService.updateUserContactInfo(req.params.id, {
      phone,
      address,
      dateOfBirth
    });
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact info' });
  }
});
```

**Validation:**
- Returns updated user object
- Rejects invalid dates
- Requires admin authentication

---

### 2.3 POST Reset Password Endpoint

**File:** `src/routes/users.ts`

```typescript
// POST /api/users/:id/reset-password
router.post('/:id/reset-password', authenticateAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const adminId = req.user.id; // From auth middleware
    
    // Validation
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userService.resetPassword(req.params.id, hashedPassword, adminId);
    
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
});
```

**Validation:**
- Password hashed before storage
- Audit log created
- Returns success response

---

### 2.4 POST Generate Random Password Endpoint

**File:** `src/routes/users.ts`

```typescript
// POST /api/users/generate-password
router.post('/generate-password', (req, res) => {
  try {
    const password = generateSecurePassword();
    res.json({ password });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate password' });
  }
});

// Helper function
function generateSecurePassword(length = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  
  const all = uppercase + lowercase + numbers + special;
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += all.charAt(Math.floor(Math.random() * all.length));
  }
  
  return password;
}
```

**Validation:**
- Returns 12-character random password
- Contains mix of uppercase, lowercase, numbers, special chars

---

## Phase 3: Frontend UI Components

### 3.1 User Detail Panel Component

**File to Create:** `src/components/UserDetailPanel.tsx` (React/Next.js)

**Structure:**
```typescript
interface UserDetailPanelProps {
  userId: string;
  onClose: () => void;
}

export function UserDetailPanel({ userId, onClose }: UserDetailPanelProps) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="detail-panel">
      {/* Header */}
      <div className="panel-header">
        <h2>Chi tiết người dùng</h2>
        <button onClick={onClose}>×</button>
      </div>
      
      {/* Basic Info */}
      <section>
        <h3>Thông tin cơ bản</h3>
        <div className="field">
          <label>Tên:</label>
          <span>{user.name}</span>
        </div>
        <div className="field">
          <label>Email:</label>
          <span>{user.email}</span>
        </div>
        <div className="field">
          <label>Vai trò:</label>
          <span>{user.role}</span>
        </div>
      </section>
      
      {/* Contact Info - NEW */}
      <section>
        <h3>Thông tin liên lạc</h3>
        <div className="field">
          <label>Số điện thoại:</label>
          <span>{user.phone || 'N/A'}</span>
        </div>
        <div className="field">
          <label>Địa chỉ:</label>
          <span>{user.address || 'N/A'}</span>
        </div>
        <div className="field">
          <label>Ngày sinh:</label>
          <span>{user.dateOfBirth || 'N/A'}</span>
        </div>
      </section>
      
      {/* Account Status */}
      <section>
        <h3>Trạng thái tài khoản</h3>
        <div className="field">
          <label>Điểm:</label>
          <span>{user.points}</span>
        </div>
        <div className="field">
          <label>Trạng thái:</label>
          <span className={`status ${user.status}`}>{user.status}</span>
        </div>
      </section>
      
      {/* Actions */}
      <div className="panel-actions">
        <button className="btn-edit">Chỉnh sửa</button>
        <button className="btn-reset-password" onClick={onResetPassword}>
          Đặt lại mật khẩu
        </button>
        <button className="btn-delete">Xóa</button>
      </div>
    </div>
  );
}
```

**Validation:**
- Component renders without errors
- Fetches and displays user data
- Actions buttons clickable

---

### 3.2 Password Reset Modal Component

**File to Create:** `src/components/PasswordResetModal.tsx`

**Structure:**
```typescript
interface PasswordResetModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PasswordResetModal({
  userId,
  userName,
  onClose,
  onSuccess
}: PasswordResetModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const handleGeneratePassword = async () => {
    setLoading(true);
    try {
      const { password } = await generatePassword();
      setPassword(password);
    } catch (error) {
      // Show error toast
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyPassword = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSavePassword = async () => {
    if (!password || password.length < 8) {
      // Show validation error
      return;
    }
    
    setLoading(true);
    try {
      await resetPassword(userId, password);
      // Show success toast
      onSuccess?.();
      onClose();
    } catch (error) {
      // Show error toast
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Đặt lại mật khẩu</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <label className="field-label">
            Thay đổi mật khẩu <span className="required">*</span>
          </label>
          
          <div className="password-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className="password-input"
              placeholder="Nhập mật khẩu thay đổi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <button
              className="icon-btn generate-btn"
              onClick={handleGeneratePassword}
              disabled={loading}
              title="Tạo mật khẩu ngẫu nhiên"
            >
              🔄
            </button>
            
            <button
              className="icon-btn copy-btn"
              onClick={handleCopyPassword}
              disabled={!password}
              title="Sao chép mật khẩu"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          
          {copied && <span className="copy-feedback">Đã sao chép!</span>}
        </div>
        
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            className="btn-save"
            onClick={handleSavePassword}
            disabled={loading || !password}
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Validation:**
- Component renders modal correctly
- Generate button creates random password
- Copy button works and shows feedback
- Save button sends data to API
- Cancel/X close without saving

---

### 3.3 Update User Management Table

**File to Modify:** `src/components/UserManagementTable.tsx`

**Changes:**
```typescript
export function UserManagementTable() {
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const handleExpand = (userId) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };
  
  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setShowResetModal(true);
  };
  
  return (
    <>
      <table className="user-table">
        <thead>
          <tr>
            <th>Expand</th>
            <th>Tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Điểm</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <React.Fragment key={user.id}>
              <tr>
                <td>
                  <button
                    className="expand-btn"
                    onClick={() => handleExpand(user.id)}
                  >
                    {expandedUserId === user.id ? '▼' : '▶'}
                  </button>
                </td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.points}</td>
                <td>{user.status}</td>
              </tr>
              
              {expandedUserId === user.id && (
                <tr className="detail-row">
                  <td colSpan="6">
                    <UserDetailPanel
                      user={user}
                      onResetPassword={() => handleResetPassword(user)}
                      onClose={() => setExpandedUserId(null)}
                    />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      
      {showResetModal && (
        <PasswordResetModal
          userId={selectedUser.id}
          userName={selectedUser.name}
          onClose={() => setShowResetModal(false)}
          onSuccess={() => {
            // Refresh user data
            handleExpand(selectedUser.id);
          }}
        />
      )}
    </>
  );
}
```

**Validation:**
- Table renders with expand buttons
- Click expand shows detail panel
- Reset password button opens modal
- Detail panel closes when needed

---

## Phase 4: Styling

### 4.1 Modal & Component Styles

**File to Create:** `src/styles/user-management.css`

```css
/* Detail Panel */
.detail-panel {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

.detail-panel section {
  margin-bottom: 20px;
}

.detail-panel section h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  text-transform: uppercase;
  color: #666;
}

.detail-panel .field {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #ddd;
}

/* Password Reset Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #1f2937;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  color: #fff;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #374151;
}

.modal-body {
  padding: 30px 20px;
}

.field-label {
  display: block;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
}

.required {
  color: #ef4444;
}

.password-input-group {
  position: relative;
  display: flex;
  gap: 8px;
}

.password-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: #374151;
  color: #fff;
  font-size: 14px;
}

.password-input::placeholder {
  color: #9ca3af;
}

.icon-btn {
  width: 44px;
  height: 44px;
  border: 1px solid #4b5563;
  border-radius: 8px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.icon-btn:hover:not(:disabled) {
  background: #4b5563;
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.copy-feedback {
  display: block;
  color: #10b981;
  font-size: 12px;
  margin-top: 8px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 20px;
  border-top: 1px solid #374151;
}

.btn-cancel {
  padding: 10px 20px;
  border: 1px solid #3b82f6;
  border-radius: 8px;
  background: transparent;
  color: #3b82f6;
  cursor: pointer;
  font-weight: 500;
}

.btn-save {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: #fff;
  cursor: pointer;
  font-weight: 500;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Validation:**
- Modal styles match design mockup
- Components render with correct spacing and colors
- Icons and buttons are properly styled

---

## Phase 5: Integration & Testing

### 5.1 API Integration Testing

**Test Cases:**
1. GET `/api/users/:id` returns new fields (phone, address, dateOfBirth)
2. PUT `/api/users/:id/contact-info` updates fields correctly
3. POST `/api/users/:id/reset-password` changes password and creates audit log
4. POST `/api/users/generate-password` returns 12-char random password

**Validation Command:**
```bash
npm test -- --testPathPattern="user.test" --coverage
```

### 5.2 Frontend Component Testing

**Test Cases:**
1. UserDetailPanel loads user data and displays all fields
2. PasswordResetModal generates random password on button click
3. Copy button copies password to clipboard
4. Save button sends password to API
5. Cancel/X closes modal without saving

**Validation Command:**
```bash
npm test -- --testPathPattern="UserDetailPanel|PasswordResetModal"
```

### 5.3 Manual QA Testing

**Checklist:**
- [ ] Expand row shows detail panel with phone, address, DOB
- [ ] Password reset button opens modal
- [ ] Manual password entry works
- [ ] Generate button creates random password
- [ ] Copy button copies and shows "Copied!" feedback
- [ ] Save button persists password
- [ ] Cancel closes modal without changes
- [ ] Detail panel closes properly

---

## Phase 6: Deployment

### 6.1 Database Migration
```bash
npm run migrate:up
```

### 6.2 Build Frontend
```bash
npm run build
```

### 6.3 Deploy
- Deploy backend (if separate)
- Deploy frontend bundle
- Monitor for errors in logs

---

## Task Breakdown

### Task List by Priority

| # | Task | Phase | Difficulty | Est. Time |
|---|------|-------|------------|-----------|
| 1 | Database migration - add columns | 1 | Easy | 15 min |
| 2 | User model type update | 1 | Easy | 15 min |
| 3 | User service methods | 1 | Medium | 30 min |
| 4 | API GET endpoint | 2 | Easy | 20 min |
| 5 | API PUT contact-info endpoint | 2 | Medium | 25 min |
| 6 | API POST reset-password endpoint | 2 | Medium | 30 min |
| 7 | API POST generate-password endpoint | 2 | Easy | 15 min |
| 8 | UserDetailPanel component | 3 | Medium | 45 min |
| 9 | PasswordResetModal component | 3 | Medium | 50 min |
| 10 | Update User table component | 3 | Medium | 35 min |
| 11 | Styling & CSS | 4 | Easy | 40 min |
| 12 | API integration tests | 5 | Medium | 45 min |
| 13 | Component tests | 5 | Medium | 50 min |
| 14 | Manual QA testing | 5 | Medium | 60 min |

---

## Dependencies & Prerequisites

- Node.js/npm installed
- Database (PostgreSQL/MongoDB) accessible
- React/Next.js project setup
- Git repository initialized
- Admin/testing database access

---

## Success Criteria

✅ All three new user fields stored and displayed  
✅ Password reset modal opens and functions correctly  
✅ Auto-generate password creates 12-char secure password  
✅ Copy button works with clipboard feedback  
✅ Save persists password to database  
✅ Detail panel expands/collapses properly  
✅ All API endpoints tested  
✅ All components tested  
✅ Manual QA checklist complete  

---

## Notes

- Password hashing must use bcrypt (min 10 rounds)
- Audit logging required for compliance
- All API endpoints require admin authentication
- Modal design matches the approved mockup
- Follow existing code patterns and conventions
