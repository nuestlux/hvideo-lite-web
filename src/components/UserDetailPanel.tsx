/**
 * User Detail Panel Component
 * Displays expanded user information including new contact fields
 */

import React, { useState, useEffect } from 'react';
import { User } from '../models/user';
import './UserDetailPanel.css';

interface UserDetailPanelProps {
  userId: string;
  onClose: () => void;
  onResetPassword: (user: User) => void;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

export const UserDetailPanel: React.FC<UserDetailPanelProps> = ({
  userId,
  onClose,
  onResetPassword,
  onEdit,
  onDelete,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);
        const result = await response.json();

        if (result.success) {
          setUser(result.data);
        } else {
          setError(result.error || 'Không thể lấy thông tin người dùng');
        }
      } catch (err) {
        setError('Lỗi khi lấy thông tin người dùng');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  if (loading) {
    return (
      <div className="detail-panel">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-panel">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="detail-panel">
        <div className="error">Không tìm thấy người dùng</div>
      </div>
    );
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="detail-panel">
      {/* Basic Info Section */}
      <section className="panel-section">
        <h3 className="section-title">Thông tin cơ bản</h3>
        <div className="field-row">
          <label className="field-label">Tên:</label>
          <span className="field-value">{user.name}</span>
        </div>
        <div className="field-row">
          <label className="field-label">Email:</label>
          <span className="field-value">{user.email}</span>
        </div>
        <div className="field-row">
          <label className="field-label">Vai trò:</label>
          <span className="field-value">{user.role}</span>
        </div>
      </section>

      {/* Contact Info Section - NEW */}
      <section className="panel-section">
        <h3 className="section-title">Thông tin liên lạc</h3>
        <div className="field-row">
          <label className="field-label">Số điện thoại:</label>
          <span className="field-value">{user.phone || 'N/A'}</span>
        </div>
        <div className="field-row">
          <label className="field-label">Địa chỉ:</label>
          <span className="field-value">{user.address || 'N/A'}</span>
        </div>
        <div className="field-row">
          <label className="field-label">Ngày sinh:</label>
          <span className="field-value">{formatDate(user.dateOfBirth)}</span>
        </div>
      </section>

      {/* Account Status Section */}
      <section className="panel-section">
        <h3 className="section-title">Trạng thái tài khoản</h3>
        <div className="field-row">
          <label className="field-label">Điểm:</label>
          <span className="field-value">{user.points}</span>
        </div>
        <div className="field-row">
          <label className="field-label">Trạng thái:</label>
          <span className={`field-value status-${user.status}`}>
            {user.status}
          </span>
        </div>
        <div className="field-row">
          <label className="field-label">Ngày tạo:</label>
          <span className="field-value">{formatDate(user.createdAt?.toString())}</span>
        </div>
      </section>

      {/* Actions Section */}
      <div className="panel-actions">
        {onEdit && (
          <button
            className="btn btn-edit"
            onClick={() => onEdit(user)}
            title="Chỉnh sửa thông tin người dùng"
          >
            Chỉnh sửa
          </button>
        )}
        <button
          className="btn btn-reset-password"
          onClick={() => onResetPassword(user)}
          title="Đặt lại mật khẩu"
        >
          Đặt lại mật khẩu
        </button>
        {onDelete && (
          <button
            className="btn btn-delete"
            onClick={() => onDelete(user.id)}
            title="Xóa người dùng"
          >
            Xóa
          </button>
        )}
      </div>
    </div>
  );
};

export default UserDetailPanel;
