/**
 * User Management Table Component
 * Displays user list with expandable rows showing detail panels
 */

import React, { useState, useEffect } from 'react';
import UserDetailPanel from './UserDetailPanel';
import PasswordResetModal from './PasswordResetModal';
import { User } from '../models/user';
import './UserManagementTable.css';

export const UserManagementTable: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users');
        const result = await response.json();

        if (result.success) {
          setUsers(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleExpand = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(userId);
    }
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setShowResetModal(true);
  };

  const handlePasswordResetSuccess = () => {
    // Optionally refresh user data or show success message
    setShowResetModal(false);
  };

  const handleClose = () => {
    setExpandedUserId(null);
  };

  if (loading) {
    return <div className="loading-container">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="table-container">
      <table className="user-table">
        <thead>
          <tr className="header-row">
            <th className="col-expand"></th>
            <th className="col-name">Tên</th>
            <th className="col-email">Email</th>
            <th className="col-role">Vai trò</th>
            <th className="col-points">Điểm</th>
            <th className="col-status">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <React.Fragment key={user.id}>
              <tr className="user-row">
                <td className="col-expand">
                  <button
                    className={`expand-btn ${expandedUserId === user.id ? 'expanded' : ''}`}
                    onClick={() => handleExpand(user.id)}
                    title={expandedUserId === user.id ? 'Rút gọn' : 'Mở rộng'}
                  >
                    <span className="expand-icon">
                      {expandedUserId === user.id ? '▼' : '▶'}
                    </span>
                  </button>
                </td>
                <td className="col-name">
                  <span className="user-avatar">{user.avatar || user.name[0]}</span>
                  <span className="user-name">{user.name}</span>
                </td>
                <td className="col-email">{user.email}</td>
                <td className="col-role">
                  <span className="role-badge">{user.role}</span>
                </td>
                <td className="col-points">{user.points}</td>
                <td className="col-status">
                  <span className={`status-badge status-${user.status}`}>
                    {user.status}
                  </span>
                </td>
              </tr>

              {/* Expanded Detail View */}
              {expandedUserId === user.id && (
                <tr className="detail-row">
                  <td colSpan={6} className="detail-cell">
                    <UserDetailPanel
                      userId={user.id}
                      onClose={handleClose}
                      onResetPassword={handleResetPassword}
                    />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="empty-state">
          <p>Không có người dùng nào</p>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && selectedUser && (
        <PasswordResetModal
          userId={selectedUser.id}
          userName={selectedUser.name}
          onClose={() => {
            setShowResetModal(false);
            setSelectedUser(null);
          }}
          onSuccess={handlePasswordResetSuccess}
        />
      )}
    </div>
  );
};

export default UserManagementTable;
