/**
 * User Service Tests
 * Test user service methods including password reset and contact info update
 */

import userService from '../services/userService';
import PasswordGenerator from '../utils/passwordGenerator';

describe('UserService', () => {
  describe('getAllUsers', () => {
    it('should return list of users', async () => {
      const users = await userService.getAllUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
    });

    it('should include new contact info fields', async () => {
      const users = await userService.getAllUsers();
      const user = users[0];
      expect(user).toHaveProperty('phone');
      expect(user).toHaveProperty('address');
      expect(user).toHaveProperty('dateOfBirth');
    });
  });

  describe('getUser', () => {
    it('should return user by ID', async () => {
      const user = await userService.getUser('U001');
      expect(user).not.toBeNull();
      expect(user?.id).toBe('U001');
    });

    it('should return null for non-existent user', async () => {
      const user = await userService.getUser('NON_EXISTENT');
      expect(user).toBeNull();
    });

    it('should include contact info fields', async () => {
      const user = await userService.getUser('U001');
      expect(user).toHaveProperty('phone');
      expect(user).toHaveProperty('address');
      expect(user).toHaveProperty('dateOfBirth');
    });
  });

  describe('updateUserContactInfo', () => {
    it('should update phone number', async () => {
      const updated = await userService.updateUserContactInfo('U001', {
        phone: '+84912345678',
      });
      expect(updated?.phone).toBe('+84912345678');
    });

    it('should update address', async () => {
      const updated = await userService.updateUserContactInfo('U001', {
        address: 'Hà Nội, Việt Nam',
      });
      expect(updated?.address).toBe('Hà Nội, Việt Nam');
    });

    it('should update date of birth', async () => {
      const dob = '1990-01-15';
      const updated = await userService.updateUserContactInfo('U001', {
        dateOfBirth: dob,
      });
      expect(updated?.dateOfBirth).toBe(dob);
    });

    it('should update all fields at once', async () => {
      const updated = await userService.updateUserContactInfo('U001', {
        phone: '+84987654321',
        address: 'TP HCM, Việt Nam',
        dateOfBirth: '1995-06-20',
      });
      expect(updated?.phone).toBe('+84987654321');
      expect(updated?.address).toBe('TP HCM, Việt Nam');
      expect(updated?.dateOfBirth).toBe('1995-06-20');
    });

    it('should return null for non-existent user', async () => {
      const updated = await userService.updateUserContactInfo('NON_EXISTENT', {
        phone: '+84912345678',
      });
      expect(updated).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const result = await userService.resetPassword('U001', 'NewPassword123!', 'ADMIN');
      expect(result).toBe(true);
    });

    it('should return false for non-existent user', async () => {
      const result = await userService.resetPassword('NON_EXISTENT', 'Password123!', 'ADMIN');
      expect(result).toBe(false);
    });

    it('should log password reset', async () => {
      await userService.resetPassword('U002', 'NewPassword456!', 'ADMIN');
      const logs = await userService.getPasswordResetLogs('U002');
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[logs.length - 1].userId).toBe('U002');
    });
  });

  describe('validatePassword', () => {
    it('should validate correct password', async () => {
      // This requires a hashed password from actual reset
      const password = 'TestPassword123!';
      await userService.resetPassword('U001', password, 'ADMIN');
      const user = await userService.getUser('U001');
      if (user) {
        const isValid = await userService.validatePassword(user.password, password);
        expect(isValid).toBe(true);
      }
    });
  });
});

describe('PasswordGenerator', () => {
  describe('generate', () => {
    it('should generate 12 character password by default', () => {
      const password = PasswordGenerator.generate();
      expect(password.length).toBe(12);
    });

    it('should generate custom length password', () => {
      const password = PasswordGenerator.generate(16);
      expect(password.length).toBe(16);
    });

    it('should contain uppercase letters', () => {
      const password = PasswordGenerator.generate(100);
      expect(/[A-Z]/.test(password)).toBe(true);
    });

    it('should contain lowercase letters', () => {
      const password = PasswordGenerator.generate(100);
      expect(/[a-z]/.test(password)).toBe(true);
    });

    it('should contain numbers', () => {
      const password = PasswordGenerator.generate(100);
      expect(/[0-9]/.test(password)).toBe(true);
    });

    it('should contain special characters', () => {
      const password = PasswordGenerator.generate(100);
      expect(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)).toBe(true);
    });
  });

  describe('validateStrength', () => {
    it('should validate strong password', () => {
      const result = PasswordGenerator.validateStrength('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject password with less than 8 characters', () => {
      const result = PasswordGenerator.validateStrength('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mật khẩu phải có ít nhất 8 ký tự');
    });

    it('should reject password without uppercase', () => {
      const result = PasswordGenerator.validateStrength('weakpass123!');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject password without lowercase', () => {
      const result = PasswordGenerator.validateStrength('WEAKPASS123!');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject password without numbers', () => {
      const result = PasswordGenerator.validateStrength('WeakPass!');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
