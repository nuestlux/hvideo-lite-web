import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const SetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const setupToken = (location.state as any)?.setupToken || '';
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { password: string }) => {
    if (!setupToken) {
      message.error('Token không hợp lệ. Vui lòng thử lại.');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.setPassword(setupToken, values.password);
      setAuth(res.data.data);
      const user = res.data.data.user;
      message.success('Đặt mật khẩu thành công!');
      if (user.role === 'admin') {
        navigate('/admin/users');
      } else {
        navigate('/can-bo/profile');
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Đặt mật khẩu thất bại';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <Card className="auth-card">
        <div className="auth-logo">
          <Title level={3}>Đặt mật khẩu</Title>
          <Text type="secondary">Vui lòng đặt mật khẩu cho tài khoản của bạn</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={<Text strong>Mật khẩu mới</Text>}
            name="password"
            rules={[
              { required: true, message: 'Mật khẩu là bắt buộc' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới..." size="large" />
          </Form.Item>
          <Form.Item
            label={<Text strong>Xác nhận mật khẩu</Text>}
            name="confirm"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Xác nhận mật khẩu là bắt buộc' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Mật khẩu không khớp'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu..." size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Hoàn tất
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SetPasswordPage;
