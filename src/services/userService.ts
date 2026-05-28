/**
 * User Service
 * Handles user data operations including contact info and password reset
 */

import bcrypt from 'bcrypt';
import { User, UpdateUserContactInfoDTO } from '../models/user';

// Mock database - in real app, use actual database
const mockUsers: User[] = [
  {
    id: 'U001',
    name: 'Admin',
    email: 'admin@example.com',
    phone: '+84912345678',
    address: 'Hà Nội, Việt Nam',
    dateOfBirth: '1990-01-15',
    password: 'hashedpassword',
    role: 'admin',
    points: 500,
    status: 'hoạt động',
    avatar: 'A',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'U002',
    name: 'Cán bộ A',
    email: 'canbo.a@example.com',
    phone: '+84987654321',
    address: 'TP HCM, Việt Nam',
    dateOfBirth: '1995-06-20',
    password: 'hashedpassword',
    role: 'cán bộ',
    points: 250,
    status: 'hoạt động',
    avatar: 'CA',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock password reset logs
const passwordResetLogs: Array<{
  userId: string;
  resetBy: string;
  resetAt: Date;
}> = [];

class UserService {
  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    return mockUsers;
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    return mockUsers.find(u => u.id === userId) || null;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return mockUsers.find(u => u.email === email) || null;
  }

  /**
   * Update user contact information (phone, address, dateOfBirth)
   */
  async updateUserContactInfo(
    userId: string,
    data: UpdateUserContactInfoDTO
  ): Promise<User | null> {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return null;
    }

    const user = mockUsers[userIndex];
    const updated = {
      ...user,
      phone: data.phone !== undefined ? data.phone : user.phone,
      address: data.address !== undefined ? data.address : user.address,
      dateOfBirth: data.dateOfBirth !== undefined ? data.dateOfBirth : user.dateOfBirth,
      updatedAt: new Date(),
    };

    mockUsers[userIndex] = updated;
    return updated;
  }

  /**
   * Reset user password
   */
  async resetPassword(
    userId: string,
    newPassword: string,
    resetByAdminId: string
  ): Promise<boolean> {
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return false;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      password: hashedPassword,
      updatedAt: new Date(),
    };

    // Log the password reset
    passwordResetLogs.push({
      userId,
      resetBy: resetByAdminId,
      resetAt: new Date(),
    });

    return true;
  }

  /**
   * Get password reset logs for audit
   */
  async getPasswordResetLogs(userId?: string): Promise<typeof passwordResetLogs> {
    if (userId) {
      return passwordResetLogs.filter(log => log.userId === userId);
    }
    return passwordResetLogs;
  }

  /**
   * Validate password
   */
  async validatePassword(storedHash: string, plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, storedHash);
  }
}

export default new UserService();
