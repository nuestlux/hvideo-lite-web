# Quick Start Guide

Get up and running with the User Management System in 5 minutes.

## Installation

### Step 1: Clone/Download Files
```bash
# Make sure all files from src/ are in place
ls -la src/
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Development Server
```bash
npm start
```

The app opens at `http://localhost:3000`

---

## First Test Drive

### Try These Features:

1. **View Users**
   - See list of 2 sample users
   - Admin (500 points)
   - Cán bộ A (250 points)

2. **Expand User Details**
   - Click the ▶ arrow on any row
   - See all user information
   - View phone, address, date of birth (new!)

3. **Reset Password**
   - Click "Đặt lại mật khẩu" button
   - Modal opens
   - Try both:
     - **Manual entry:** Type a password
     - **Auto-generate:** Click 🔄 button

4. **Copy Password**
   - Click 📋 button
   - See "Copied!" message
   - Password copied to clipboard

5. **Save Password**
   - Click "Lưu" button
   - Modal closes
   - Success!

---

## Running Tests

```bash
# Run all tests
npm test

# Run with watch mode
npm test:watch

# Run with coverage
npm test:coverage

# Run specific test file
npm test userService.test.ts
```

### Expected Test Results
```
PASS  src/tests/userService.test.ts
PASS  src/tests/components.test.tsx

Test Suites: 2 passed, 2 total
Tests:       35 passed, 35 total
```

---

## Build for Production

```bash
npm run build
```

Output: `build/` folder with optimized files

---

## Project Structure at a Glance

```
src/
├── components/          # React UI components
│   ├── UserManagementTable.tsx
│   ├── UserDetailPanel.tsx
│   └── PasswordResetModal.tsx
├── services/            # Business logic
│   └── userService.ts
├── routes/              # API endpoints
│   └── userRoutes.ts
├── utils/               # Helpers
│   └── passwordGenerator.ts
├── models/              # TypeScript types
│   └── user.ts
├── tests/               # Test files
│   ├── userService.test.ts
│   └── components.test.tsx
├── App.tsx              # Main component
└── index.tsx            # Entry point
```

---

## Key Components

### 1. UserManagementTable
Main table component. Features:
- List all users
- Expand rows to see details
- Trigger password reset

**Try it:**
```tsx
import UserManagementTable from './components/UserManagementTable';

function App() {
  return <UserManagementTable />;
}
```

### 2. UserDetailPanel
Shows complete user information when row expanded.
- Basic info (name, email, role)
- Contact info (phone, address, DOB) - **NEW**
- Account status
- Action buttons

### 3. PasswordResetModal
Two-step password reset:
1. Enter or generate password
2. Copy and save

**Key features:**
- 🔄 Auto-generate: 12-char secure password
- 📋 Copy: One-click copy to clipboard
- ✓ Feedback: "Copied!" message

---

## Data Structure

### User Object
```typescript
{
  id: "U001",
  name: "Admin",
  email: "admin@example.com",
  phone: "+84912345678",          // NEW
  address: "Hà Nội, Việt Nam",    // NEW
  dateOfBirth: "1990-01-15",      // NEW
  role: "admin",
  points: 500,
  status: "hoạt động",
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Endpoints

All endpoints are mocked for demo:

| Endpoint | Method | What It Does |
|----------|--------|-------------|
| `/api/users` | GET | Get all users |
| `/api/users/:id` | GET | Get one user |
| `/api/users/:id/contact-info` | PUT | Update phone/address/DOB |
| `/api/users/generate-password` | POST | Generate random 12-char password |
| `/api/users/:id/reset-password` | POST | Save new password |

**Example API call:**
```typescript
// Generate password
const res = await fetch('/api/users/generate-password', { method: 'POST' });
const data = await res.json();
console.log(data.password); // "aB3#Cd9@Ef2!"
```

---

## Styling & Design

### Colors
- Primary: Blue (#3b82f6)
- Success: Green (#10b981)
- Error: Red (#ef4444)
- Background: Light gray (#f9fafb)
- Text: Dark gray (#374151)

### Responsive Breakpoints
- Desktop: 1200px+
- Tablet: 768px - 1024px
- Mobile: < 768px

### Animations
- Smooth fade-in: 0.3s
- Expand row: 0.3s
- Button hover: 0.2s

---

## Troubleshooting

### Port 3000 Already in Use
```bash
# Use different port
PORT=3001 npm start
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Tests Not Running
```bash
# Make sure jest is installed
npm install --save-dev jest ts-jest @testing-library/react

# Run tests
npm test
```

### Styling Issues
```bash
# Clear browser cache
# Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

---

## Making Your First Change

### Change a Color
Edit `src/App.css`:
```css
.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Change to your color */
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
}
```

### Change a Label
Edit `src/components/PasswordResetModal.tsx`:
```tsx
<label className="field-label">
  Thay đổi mật khẩu <span className="required">*</span>
  {/* Change to your label */}
  Mật khẩu mới <span className="required">*</span>
</label>
```

### Add a New Field
Edit `src/models/user.ts`:
```typescript
interface User {
  // ... existing fields
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  // Add new field
  department?: string;
}
```

Then update components to use it.

---

## Common Tasks

### Check API Requests
Open DevTools (F12) → Network tab
- See all API calls
- Check request/response data

### Debug Component State
Install React DevTools extension
- Inspect component state
- Track prop changes

### Profile Performance
DevTools → Performance tab
- Record interactions
- Analyze rendering time

### Test on Mobile
```bash
# Get your machine IP
ipconfig getifaddr en0  # Mac
ipconfig               # Windows

# Open on mobile: http://YOUR_IP:3000
```

---

## What's Next

### For Development
- [ ] Connect to real database
- [ ] Add authentication
- [ ] Implement edit user form
- [ ] Add user creation
- [ ] Add bulk operations

### For Production
- [ ] Run full test suite
- [ ] Build: `npm run build`
- [ ] Deploy to server
- [ ] Set up HTTPS
- [ ] Configure database
- [ ] Monitor error logs

### For Enhancement
- [ ] Add pagination
- [ ] Add search/filter
- [ ] Add sorting
- [ ] Add export to CSV
- [ ] Add role-based permissions

---

## Support

**Got stuck?** Check these files:

- `README.md` - Full documentation
- `IMPLEMENTATION_GUIDE.md` - Step-by-step setup
- `IMPLEMENTATION_SUMMARY.md` - What was built
- Code comments - Inline explanations

---

## Success Checklist

- [ ] App runs on `http://localhost:3000`
- [ ] Can see 2 users in table
- [ ] Can expand rows
- [ ] Can open password reset modal
- [ ] Can generate password
- [ ] Can copy password
- [ ] Can save password
- [ ] All tests pass (`npm test`)
- [ ] No console errors (F12)
- [ ] Mobile responsive (F12 device mode)

**All checked?** You're ready to customize! 🚀

---

## Quick Reference

```bash
# Development
npm start              # Run dev server
npm test              # Run tests
npm run build         # Build for production

# Testing
npm test:watch       # Tests with watch mode
npm test:coverage    # Tests with coverage report

# Code Quality
npm run lint         # Check code style
npm run format       # Auto-format code

# Backend
npm run server       # Start API server
```

---

**Happy coding!** 🎉
