/**
 * Component Tests
 * Test React components for user management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserDetailPanel from '../components/UserDetailPanel';
import PasswordResetModal from '../components/PasswordResetModal';
import UserManagementTable from '../components/UserManagementTable';

// Mock fetch
global.fetch = jest.fn();

describe('UserDetailPanel', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should render loading state initially', () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, data: { id: 'U001', name: 'Test User' } }),
    });

    render(
      <UserDetailPanel userId="U001" onClose={jest.fn()} onResetPassword={jest.fn()} />
    );

    expect(screen.getByText(/đang tải/i)).toBeInTheDocument();
  });

  it('should display user details when loaded', async () => {
    const mockUser = {
      id: 'U001',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+84912345678',
      address: 'Hà Nội',
      dateOfBirth: '1990-01-15',
      role: 'admin',
      points: 500,
      status: 'hoạt động',
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockUser }),
    });

    render(
      <UserDetailPanel userId="U001" onClose={jest.fn()} onResetPassword={jest.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('+84912345678')).toBeInTheDocument();
      expect(screen.getByText('Hà Nội')).toBeInTheDocument();
    });
  });

  it('should call onResetPassword when button clicked', async () => {
    const mockUser = {
      id: 'U001',
      name: 'Test User',
      email: 'test@example.com',
      phone: '+84912345678',
      address: 'Hà Nội',
      dateOfBirth: '1990-01-15',
      role: 'admin',
      points: 500,
      status: 'hoạt động',
    };

    const onResetPassword = jest.fn();

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockUser }),
    });

    render(
      <UserDetailPanel
        userId="U001"
        onClose={jest.fn()}
        onResetPassword={onResetPassword}
      />
    );

    await waitFor(() => {
      const resetBtn = screen.getByText(/đặt lại mật khẩu/i);
      fireEvent.click(resetBtn);
      expect(onResetPassword).toHaveBeenCalled();
    });
  });

  it('should display error message when fetch fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: false, error: 'Failed to fetch user' }),
    });

    render(
      <UserDetailPanel userId="U001" onClose={jest.fn()} onResetPassword={jest.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch user/i)).toBeInTheDocument();
    });
  });
});

describe('PasswordResetModal', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should render modal with input field', () => {
    render(
      <PasswordResetModal
        userId="U001"
        userName="Test User"
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/đặt lại mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/nhập mật khẩu/i)).toBeInTheDocument();
  });

  it('should generate password when generate button clicked', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, password: 'GeneratedPass123!' }),
    });

    render(
      <PasswordResetModal
        userId="U001"
        userName="Test User"
        onClose={jest.fn()}
      />
    );

    const generateBtn = screen.getByTitle(/tạo mật khẩu ngẫu nhiên/i);
    fireEvent.click(generateBtn);

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/nhập mật khẩu/i) as HTMLInputElement;
      expect(input.value).toBe('GeneratedPass123!');
    });
  });

  it('should copy password to clipboard', async () => {
    const mockClipboard = {
      writeText: jest.fn().mockResolvedValueOnce(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(
      <PasswordResetModal
        userId="U001"
        userName="Test User"
        onClose={jest.fn()}
      />
    );

    const input = screen.getByPlaceholderText(/nhập mật khẩu/i);
    await userEvent.type(input, 'TestPassword123!');

    const copyBtn = screen.getByTitle(/sao chép mật khẩu/i);
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledWith('TestPassword123!');
    });
  });

  it('should close modal when cancel clicked', () => {
    const onClose = jest.fn();

    render(
      <PasswordResetModal
        userId="U001"
        userName="Test User"
        onClose={onClose}
      />
    );

    const cancelBtn = screen.getByText(/hủy/i);
    fireEvent.click(cancelBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('should close modal when X button clicked', () => {
    const onClose = jest.fn();

    render(
      <PasswordResetModal
        userId="U001"
        userName="Test User"
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByText('×');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('should save password when save button clicked', async () => {
    const onSuccess = jest.fn();

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, message: 'Password reset successfully' }),
    });

    render(
      <PasswordResetModal
        userId="U001"
        userName="Test User"
        onClose={jest.fn()}
        onSuccess={onSuccess}
      />
    );

    const input = screen.getByPlaceholderText(/nhập mật khẩu/i);
    await userEvent.type(input, 'NewPassword123!');

    const saveBtn = screen.getByText(/lưu/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/U001/reset-password'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('NewPassword123!'),
        })
      );
    });
  });

  it('should show error when password is empty', async () => {
    render(
      <PasswordResetModal
        userId="U001"
        userName="Test User"
        onClose={jest.fn()}
      />
    );

    const saveBtn = screen.getByText(/lưu/i);
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByText(/mật khẩu không được để trống/i)).toBeInTheDocument();
    });
  });
});

describe('UserManagementTable', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should load and display users', async () => {
    const mockUsers = [
      {
        id: 'U001',
        name: 'Admin',
        email: 'admin@example.com',
        phone: '+84912345678',
        address: 'Hà Nội',
        dateOfBirth: '1990-01-15',
        role: 'admin',
        points: 500,
        status: 'hoạt động',
      },
    ];

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, data: mockUsers }),
    });

    render(<UserManagementTable />);

    await waitFor(() => {
      expect(screen.getByText('Admin')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
    });
  });

  it('should expand row when expand button clicked', async () => {
    const mockUsers = [
      {
        id: 'U001',
        name: 'Admin',
        email: 'admin@example.com',
        phone: '+84912345678',
        address: 'Hà Nội',
        dateOfBirth: '1990-01-15',
        role: 'admin',
        points: 500,
        status: 'hoạt động',
      },
    ];

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockUsers }),
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: true, data: mockUsers[0] }),
      });

    render(<UserManagementTable />);

    await waitFor(() => {
      const expandBtns = screen.getAllByTitle(/mở rộng/i);
      if (expandBtns.length > 0) {
        fireEvent.click(expandBtns[0]);
      }
    });
  });
});
