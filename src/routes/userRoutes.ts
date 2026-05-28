/**
 * User API Routes
 * Handles user management endpoints including password reset and contact info
 */

import express, { Router, Request, Response } from 'express';
import userService from '../services/userService';
import PasswordGenerator from '../utils/passwordGenerator';

const router: Router = express.Router();

/**
 * GET /api/users
 * Get all users
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Không thể lấy danh sách người dùng',
    });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID with all details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = await userService.getUser(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy thông tin người dùng',
    });
  }
});

/**
 * PUT /api/users/:id/contact-info
 * Update user contact information (phone, address, dateOfBirth)
 */
router.put('/:id/contact-info', async (req: Request, res: Response) => {
  try {
    const { phone, address, dateOfBirth } = req.body;

    // Validate dateOfBirth if provided
    if (dateOfBirth) {
      const date = new Date(dateOfBirth);
      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          error: 'Định dạng ngày sinh không hợp lệ (YYYY-MM-DD)',
        });
      }

      // Check if user is at least 13 years old
      const age = new Date().getFullYear() - date.getFullYear();
      if (age < 13) {
        return res.status(400).json({
          success: false,
          error: 'Người dùng phải ít nhất 13 tuổi',
        });
      }
    }

    const updated = await userService.updateUserContactInfo(req.params.id, {
      phone,
      address,
      dateOfBirth,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng',
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật thông tin liên lạc thành công',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi cập nhật thông tin liên lạc',
    });
  }
});

/**
 * POST /api/users/generate-password
 * Generate a random secure password
 */
router.post('/generate-password', (req: Request, res: Response) => {
  try {
    const password = PasswordGenerator.generate(12);

    res.json({
      success: true,
      password,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi tạo mật khẩu',
    });
  }
});

/**
 * POST /api/users/:id/reset-password
 * Reset user password
 */
router.post('/:id/reset-password', async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const adminId = req.user?.id || 'SYSTEM'; // From auth middleware

    // Validate password
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu không được để trống',
      });
    }

    const validation = PasswordGenerator.validateStrength(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu không đủ mạnh',
        details: validation.errors,
      });
    }

    // Reset password
    const success = await userService.resetPassword(req.params.id, newPassword, adminId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy người dùng',
      });
    }

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi đặt lại mật khẩu',
    });
  }
});

/**
 * GET /api/users/:id/password-reset-logs
 * Get password reset audit logs for a user
 */
router.get('/:id/password-reset-logs', async (req: Request, res: Response) => {
  try {
    const logs = await userService.getPasswordResetLogs(req.params.id);

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Lỗi khi lấy lịch sử đặt lại mật khẩu',
    });
  }
});

export default router;
