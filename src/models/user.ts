/**
 * User Model
 * Defines the User interface with new contact information fields
 */

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;           // NEW: Phone number
  address?: string;         // NEW: Address
  dateOfBirth?: string;     // NEW: Date of birth (YYYY-MM-DD format)
  password: string;
  role: 'admin' | 'cán bộ';
  points: number;
  status: 'hoạt động' | 'không hoạt động';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'cán bộ';
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface UpdateUserContactInfoDTO {
  phone?: string;
  address?: string;
  dateOfBirth?: string;
}

export interface ResetPasswordDTO {
  newPassword: string;
}
