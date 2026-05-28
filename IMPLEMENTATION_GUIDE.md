# Implementation Guide - User Management Enhancement

## Overview

This guide walks through implementing the user management enhancement with password reset, contact information fields, and expandable details.

## File Structure Summary

```
src/
├── components/                 # React components
│   ├── UserDetailPanel.tsx
│   ├── UserDetailPanel.css
│   ├── PasswordResetModal.tsx
│   ├── PasswordResetModal.css
│   ├── UserManagementTable.tsx
│   └── UserManagementTable.css
├── models/                     # TypeScript types/interfaces
│   └── user.ts
├── services/                   # Business logic
│   └── userService.ts
├── routes/                     # API endpoints
│   └── userRoutes.ts
├── utils/                      # Utilities
│   └── passwordGenerator.ts
├── tests/                      # Test files
│   ├── userService.test.ts
│   └── components.test.tsx
├── App.tsx                     # Main application
├── App.css                     # Global styles
├── index.tsx                   # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Implementation Steps

### Step 1: Initialize Project

```bash
# Create new React app with TypeScript
npx create-react-app user-management --template typescript

# Navigate to project
cd user-management

# Install dependencies
npm install bcrypt express @types/express @types/bcrypt

# Install dev dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest ts-jest
```

### Step 2: Create Data Models

**File:** `src/models/user.ts`

```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;        // NEW
  address?: string;      // NEW
  dateOfBirth?: string;  // NEW
  password: string;
  role: 'admin' | 'cán bộ';
  points: number;
  status: 'hoạt động' | 'không hoạt động';
  createdAt: Date;
  updatedAt: Date;
}
```

### Step 3: Create Services

**File:** `src/services/userService.ts`

```typescript
class UserService {
  async getAllUsers(): Promise<User[]> {
    // Fetch from API or database
  }

  async updateUserContactInfo(
    userId: string,
    data: UpdateUserContactInfoDTO
  ): Promise<User | null> {
    // Update phone, address, dateOfBirth
  }

  async resetPassword(
    userId: string,
    newPassword: string,
    resetByAdminId: string
  ): Promise<boolean> {
    // Hash password and save
  }
}
```

### Step 4: Create Components

#### 4.1 UserManagementTable Component

```tsx
// src/components/UserManagementTable.tsx
export const UserManagementTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Renders table with expand buttons
  // Each row can expand to show detail panel
};
```

#### 4.2 UserDetailPanel Component

```tsx
// src/components/UserDetailPanel.tsx
export const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
  userId,
  onClose,
  onResetPassword,
}) => {
  const [user, setUser] = useState<User | null>(null);

  // Displays all user fields including new contact info
  // Shows password reset button
};
```

#### 4.3 PasswordResetModal Component

```tsx
// src/components/PasswordResetModal.tsx
export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  userId,
  userName,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');

  // Two-step password reset:
  // 1. Input field with generate button
  // 2. Copy button with feedback
};
```

### Step 5: Create API Routes

**File:** `src/routes/userRoutes.ts`

```typescript
router.get('/', getAllUsers);
router.get('/:id', getUser);
router.put('/:id/contact-info', updateContactInfo);
router.post('/generate-password', generatePassword);
router.post('/:id/reset-password', resetPassword);
router.get('/:id/password-reset-logs', getPasswordLogs);
```

### Step 6: Add Styling

Create CSS files for each component:
- `UserManagementTable.css` - Table layout and rows
- `UserDetailPanel.css` - Detail panel styling
- `PasswordResetModal.css` - Modal styling matching design mockup
- `App.css` - Global styles

### Step 7: Implement Password Generator

**File:** `src/utils/passwordGenerator.ts`

```typescript
class PasswordGenerator {
  static generate(length: number = 12): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()-_=+[]{}|;:,.<>?';
    
    // Generate random string from character set
    // Return shuffled password
  }

  static validateStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    // Check for minimum 8 chars
    // Check for uppercase, lowercase, numbers
    // Return validation result
  }
}
```

### Step 8: Write Tests

**File:** `src/tests/userService.test.ts`

```typescript
describe('UserService', () => {
  it('should update user contact info', async () => {
    const updated = await userService.updateUserContactInfo('U001', {
      phone: '+84912345678',
    });
    expect(updated?.phone).toBe('+84912345678');
  });

  it('should reset password', async () => {
    const result = await userService.resetPassword('U001', 'NewPass123!', 'ADMIN');
    expect(result).toBe(true);
  });
});
```

## Integration Checklist

- [ ] User model includes phone, address, dateOfBirth
- [ ] Database schema updated with new columns
- [ ] UserService has updateUserContactInfo method
- [ ] UserService has resetPassword method
- [ ] PasswordGenerator utility creates 12-char passwords
- [ ] PasswordResetModal has manual input field
- [ ] PasswordResetModal has generate button
- [ ] PasswordResetModal has copy button with feedback
- [ ] UserDetailPanel displays new contact fields
- [ ] UserDetailPanel has reset password button
- [ ] UserManagementTable has expand/collapse rows
- [ ] Detail panel opens on expand
- [ ] API endpoints return new fields
- [ ] API endpoints validate input
- [ ] Password hashing with bcrypt
- [ ] Audit logging for password resets
- [ ] All components styled correctly
- [ ] Responsive design works
- [ ] Tests pass
- [ ] No console errors

## API Integration Example

### Fetch users:
```typescript
const response = await fetch('/api/users');
const data = await response.json();
// Returns users with phone, address, dateOfBirth
```

### Update contact info:
```typescript
const response = await fetch('/api/users/U001/contact-info', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phone: '+84912345678',
    address: 'Hà Nội',
    dateOfBirth: '1990-01-15',
  }),
});
```

### Generate password:
```typescript
const response = await fetch('/api/users/generate-password', {
  method: 'POST',
});
const data = await response.json();
// data.password = "aB3#Cd9@Ef2!"
```

### Reset password:
```typescript
const response = await fetch('/api/users/U001/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    newPassword: 'NewPassword123!',
  }),
});
```

## Database Migration (if using SQL)

```sql
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN date_of_birth DATE;

CREATE TABLE password_reset_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  reset_by UUID NOT NULL REFERENCES users(id),
  reset_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Performance Optimization

1. **Lazy load user details** - Only fetch when expanding
2. **Memoize components** - Use React.memo to prevent unnecessary re-renders
3. **Debounce API calls** - Avoid rapid repeated requests
4. **Cache user data** - Store fetched users in state
5. **Optimize images** - Use appropriate avatar sizes

## Security Best Practices

1. **Hash passwords** - Always use bcrypt
2. **Validate input** - Server-side validation required
3. **Audit logging** - Log all password resets
4. **HTTPS only** - Use HTTPS in production
5. **Authentication** - Require admin auth for endpoints
6. **CORS** - Configure appropriately
7. **Rate limiting** - Prevent brute force attacks

## Troubleshooting

### Issue: Password not updating
- Check bcrypt is properly hashing
- Verify database update succeeds
- Check error responses from API

### Issue: Modal doesn't close
- Ensure onClose callback is called
- Check for JavaScript errors in console
- Verify modal overlay click handler

### Issue: Copy button doesn't work
- Check clipboard API is supported
- Add error handling for copy failures
- Show user feedback on success/failure

### Issue: Detail panel not showing
- Verify fetch API call succeeds
- Check user data is returned correctly
- Look for rendering errors in console

## Next Steps

1. Deploy to staging environment
2. Run full test suite
3. Perform manual QA testing
4. Deploy to production
5. Monitor for errors
6. Gather user feedback

## Support & Documentation

- See `README.md` for API documentation
- See `plans/2025-01-10-user-management-implementation-plan.md` for detailed plan
- See `docs/superpowers/specs/2025-01-10-user-management-enhancement-design.md` for design spec
