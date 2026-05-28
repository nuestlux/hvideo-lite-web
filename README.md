# User Management System - Enhanced Edition

A comprehensive user management system with password reset, contact information, and expandable detail views.

## Features

### ✨ New Features
- **Password Reset Modal** - Secure password reset with auto-generate and copy functionality
- **Contact Information** - Store and display phone number, address, and date of birth
- **Expandable Rows** - View complete user details in an expanded panel
- **Password Generator** - Generate secure 12-character passwords with mixed character types
- **Copy to Clipboard** - One-click password copying with visual feedback

### 📊 Core Features
- User listing with pagination
- User detail view panel
- Contact information management
- Password reset audit logs
- Responsive design
- Modern UI with animations

## Project Structure

```
src/
├── components/
│   ├── UserDetailPanel.tsx          # User details display component
│   ├── UserDetailPanel.css          # Panel styling
│   ├── PasswordResetModal.tsx        # Password reset modal component
│   ├── PasswordResetModal.css        # Modal styling
│   ├── UserManagementTable.tsx       # Main table component
│   └── UserManagementTable.css       # Table styling
├── models/
│   └── user.ts                      # TypeScript interfaces
├── services/
│   └── userService.ts               # User data service
├── routes/
│   └── userRoutes.ts                # API endpoints
├── utils/
│   └── passwordGenerator.ts         # Password generation utility
├── tests/
│   ├── userService.test.ts          # Service tests
│   └── components.test.tsx          # Component tests
├── App.tsx                          # Main app component
├── App.css                          # App styling
└── index.tsx                        # Application entry point
```

## API Endpoints

### GET `/api/users`
Get all users in the system.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "U001",
      "name": "Admin",
      "email": "admin@example.com",
      "phone": "+84912345678",
      "address": "Hà Nội, Việt Nam",
      "dateOfBirth": "1990-01-15",
      "role": "admin",
      "points": 500,
      "status": "hoạt động"
    }
  ]
}
```

### GET `/api/users/:id`
Get a specific user by ID with all details.

**Response:**
```json
{
  "success": true,
  "data": { /* user object */ }
}
```

### PUT `/api/users/:id/contact-info`
Update user contact information.

**Request:**
```json
{
  "phone": "+84912345678",
  "address": "Hà Nội, Việt Nam",
  "dateOfBirth": "1990-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cập nhật thông tin liên lạc thành công",
  "data": { /* updated user object */ }
}
```

### POST `/api/users/generate-password`
Generate a random secure password.

**Response:**
```json
{
  "success": true,
  "password": "aB3#Cd9@Ef2!"
}
```

### POST `/api/users/:id/reset-password`
Reset a user's password.

**Request:**
```json
{
  "newPassword": "NewPassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đặt lại mật khẩu thành công"
}
```

### GET `/api/users/:id/password-reset-logs`
Get password reset history for audit purposes.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "userId": "U001",
      "resetBy": "ADMIN",
      "resetAt": "2025-01-10T10:30:00Z"
    }
  ]
}
```

## Installation

### Prerequisites
- Node.js 14+ 
- npm or yarn
- TypeScript

### Setup

```bash
# Install dependencies
npm install

# Install peer dependencies
npm install react react-dom typescript @types/react @types/react-dom

# Install testing dependencies (optional)
npm install --save-dev @testing-library/react @testing-library/jest-dom jest ts-jest
```

### Environment Variables

Create a `.env` file:

```env
REACT_APP_API_URL=http://localhost:3000
NODE_ENV=development
```

## Running the Application

### Development Server

```bash
# Start frontend dev server
npm start

# In another terminal, start backend server
npm run server
```

### Build for Production

```bash
npm run build
```

The build folder is ready to be deployed.

### Run Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test userService.test.ts
```

## Component API

### UserManagementTable

Main component displaying user list with expandable rows.

```tsx
import UserManagementTable from './components/UserManagementTable';

function App() {
  return <UserManagementTable />;
}
```

### UserDetailPanel

Displays detailed user information in an expandable row.

```tsx
<UserDetailPanel
  userId="U001"
  onClose={() => handleClose()}
  onResetPassword={(user) => handleReset(user)}
/>
```

**Props:**
- `userId`: string - User ID to display
- `onClose`: () => void - Callback when closing panel
- `onResetPassword`: (user: User) => void - Callback when reset password button clicked
- `onEdit?`: (user: User) => void - Optional edit callback
- `onDelete?`: (userId: string) => void - Optional delete callback

### PasswordResetModal

Modal for resetting user password.

```tsx
<PasswordResetModal
  userId="U001"
  userName="Admin"
  onClose={() => handleClose()}
  onSuccess={() => handleSuccess()}
/>
```

**Props:**
- `userId`: string - User ID to reset password for
- `userName`: string - User name for display
- `onClose`: () => void - Callback when modal closes
- `onSuccess?`: () => void - Optional callback on successful reset

## Password Generation

The system generates secure 12-character passwords containing:
- Uppercase letters (A-Z)
- Lowercase letters (a-z)
- Numbers (0-9)
- Special characters (!@#$%^&*...)

### Password Validation

Passwords must meet the following criteria:
- At least 8 characters long
- Contains uppercase letter
- Contains lowercase letter
- Contains number

## Security Considerations

1. **Password Hashing**: Passwords are hashed using bcrypt (10 rounds)
2. **Audit Logging**: All password resets are logged with admin ID and timestamp
3. **Authentication**: API endpoints require admin authentication (implement in production)
4. **Input Validation**: All inputs are validated server-side
5. **HTTPS**: Use HTTPS in production
6. **CORS**: Configure CORS appropriately for your domain

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari 14+, Chrome Android)

## Performance

- Lazy loading of user details
- Optimized re-renders with React.memo
- CSS animations for smooth UX
- Responsive design works on all devices

## Accessibility

- Semantic HTML
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Keep components focused and reusable
4. Update documentation as needed

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please create an issue in the repository or contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** 2025-01-10
