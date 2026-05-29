# User Management Enhancement - Design Spec

**Date:** 2025-01-10  
**Status:** Approved

---

## Overview

Enhance the User Management (Quản lý tài khoản) system with:
1. Additional user information fields (phone number, address, date of birth)
2. Password reset feature with auto-generate and copy functionality
3. Expandable detail view for accessing all user information and actions

---

## Requirements

### New User Information Fields
Add three new fields to user profile data:
- **Phone Number** (Số điện thoại): String, optional
- **Address** (Địa chỉ): String, optional
- **Date of Birth** (Ngày sinh): Date format (YYYY-MM-DD), optional

### Password Reset Feature
Enable administrators to reset user passwords with:
- Manual password input option
- Auto-generate random password button
- Copy-to-clipboard functionality
- Password visibility toggle (show/hide)

### Detail View UI
Provide expandable row detail panel showing all user information organized by category.

---

## Architecture

### Data Layer
**User Schema Updates:**
```
User {
  id: UUID
  name: string
  email: string
  phone: string (optional)
  address: string (optional)
  dateOfBirth: date (optional)
  role: enum (Admin, Cán bộ)
  points: number
  status: enum (Hoạt động, Inactive)
  createdAt: timestamp
  updatedAt: timestamp
}

PasswordReset {
  userId: UUID
  newPassword: string (hashed)
  resetAt: timestamp
  resetBy: UUID (admin who reset it)
}
```

### UI Components

#### 1. User Management Table (No Changes)
- Keep existing table structure with current columns
- Add expandable row trigger (chevron icon) to each row

#### 2. User Detail Panel
Shows when row is expanded:
- **Basic Info Section:**
  - Name
  - Email
  - Role
- **Contact Info Section:**
  - Phone Number
  - Address
  - Date of Birth
- **Account Status Section:**
  - Points
  - Status (Hoạt động/Inactive)
- **Actions Section:**
  - Edit button
  - Password Reset button
  - Delete button (if applicable)

#### 3. Password Reset Modal
**Title:** "Đặt lại mật khẩu" (Reset Password)

**Layout:**
- Header with title and close button (X)
- Single input field section labeled "Thay đổi mật khẩu *" (Change Password - required)
- Input field with placeholder "Nhập mật khẩu thay đổi" (Enter new password)
- Two action icons in the input field (right side):
  - **Shuffle/Refresh Icon**: Generates random password (12 chars: uppercase, lowercase, numbers, special characters)
  - **Copy Icon**: Copies current password value to clipboard, shows "Copied!" feedback for 2 seconds
- Footer with two buttons:
  - "Hủy" (Cancel) - outline/secondary style
  - "Lưu" (Save) - solid blue/primary style

**Behavior:**
1. User can manually type password into the field
2. User can click shuffle icon to auto-generate a secure random password
3. User can click copy icon to copy password to clipboard at any time
4. Password field shows/hides password text (optional eye icon toggle)
5. Click "Lưu" to save the new password and close modal
6. Click "Hủy" or X to cancel without saving

---

## Data Flow

### View User Details
1. User clicks expand icon on table row
2. Detail panel opens showing all user information
3. User can view phone, address, date of birth in Contact Info section

### Reset Password
1. User clicks "Password Reset" button in detail panel
2. Modal opens with empty password field
3. User either:
   - Types password manually, OR
   - Clicks shuffle icon to generate random password
4. User can copy password using copy icon (shows confirmation feedback)
5. User clicks "Lưu" to save password
6. Backend hashes and stores new password
7. Modal closes, detail panel refreshes
8. Optional: Log password reset event with timestamp and admin user ID

---

## Error Handling

- **Empty Password:** Show validation error "Mật khẩu không được để trống" (Password cannot be empty)
- **API Failure:** Show error toast "Đặt lại mật khẩu thất bại. Vui lòng thử lại." (Password reset failed. Please try again.)
- **Copy Feedback:** Show "Copied!" message for 2 seconds after copy success

---

## Validation Rules

- Phone number: Optional, can be empty, should accept Vietnamese phone format
- Address: Optional, free text, max 255 characters
- Date of Birth: Optional, must be valid date, user must be at least 13 years old
- Password: Required, minimum 8 characters, should be enforced server-side

---

## Success Criteria

- [ ] New user fields (phone, address, DOB) are stored and displayed in detail view
- [ ] Password reset modal appears when triggered
- [ ] Manual password input works
- [ ] Generate button creates random 12-character password
- [ ] Copy button copies password to clipboard with feedback
- [ ] Save button persists new password to database
- [ ] Cancel/X button closes modal without saving
- [ ] Detail panel shows all user information correctly
- [ ] Expandable rows collapse when clicking expand icon again or opening another row

---

## Future Enhancements

- Password strength indicator in the modal
- Email notification to user after password reset
- Admin audit log showing who reset whose password and when
- Bulk password reset for multiple users
