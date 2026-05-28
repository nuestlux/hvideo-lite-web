/**
 * Password Reset Modal Component
 * Modal for resetting user password with auto-generate and copy functionality
 */

import React, { useState } from 'react';
import './PasswordResetModal.css';

interface PasswordResetModalProps {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({
  userId,
  userName,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePassword = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/users/generate-password', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setPassword(result.password);
      } else {
        setError(result.error || 'Lỗi khi tạo mật khẩu');
      }
    } catch (err) {
      setError('Lỗi khi tạo mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = async () => {
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);

      // Reset copy feedback after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      setError('Không thể sao chép mật khẩu');
    }
  };

  const handleSavePassword = async () => {
    if (!password) {
      setError('Mật khẩu không được để trống');
      return;
    }

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword: password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Show success feedback
        setPassword('');
        onSuccess?.();
        onClose();
      } else {
        setError(result.error || 'Lỗi khi đặt lại mật khẩu');
      }
    } catch (err) {
      setError('Lỗi khi đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSavePassword();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">Đặt lại mật khẩu</h2>
          <button
            className="close-btn"
            onClick={onClose}
            title="Đóng (Esc)"
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <label className="field-label">
            Thay đổi mật khẩu <span className="required">*</span>
          </label>

          <div className="password-input-group">
            <input
              type={showPassword ? 'text' : 'password'}
              className="password-input"
              placeholder="Nhập mật khẩu thay đổi"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <button
              className="icon-btn toggle-visibility-btn"
              onClick={() => setShowPassword(!showPassword)}
              disabled={!password || loading}
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>

            <button
              className="icon-btn generate-btn"
              onClick={handleGeneratePassword}
              disabled={loading}
              title="Tạo mật khẩu ngẫu nhiên"
            >
              🔄
            </button>

            <button
              className="icon-btn copy-btn"
              onClick={handleCopyPassword}
              disabled={!password || loading}
              title="Sao chép mật khẩu"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>

          {copied && <span className="copy-feedback">Đã sao chép!</span>}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </button>
          <button
            className="btn-save"
            onClick={handleSavePassword}
            disabled={loading || !password}
          >
            {loading ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetModal;
