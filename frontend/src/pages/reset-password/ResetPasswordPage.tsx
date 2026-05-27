import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';

const { Title, Text } = Typography;

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { new_password: string }) => {
    if (!token) {
      message.error('Token không hợp lệ');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, values.new_password);
      message.success('Đặt lại mật khẩu thành công');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Đặt lại mật khẩu thất bại';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <Card className="auth-card">
        <div className="auth-logo">
          <Title level={3}>Đặt lại mật khẩu</Title>
          <Text type="secondary">Nhập mật khẩu mới cho tài khoản của bạn</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={<><Text strong>Mật khẩu mới</Text> <Text type="danger">*</Text></>}
            name="new_password"
            rules={[
              { required: true, message: 'Mật khẩu là bắt buộc' },
              { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu mới..." size="large" />
          </Form.Item>
          <Form.Item
            label={<><Text strong>Xác nhận mật khẩu</Text> <Text type="danger">*</Text></>}
            name="confirm"
            dependencies={['new_password']}
            rules={[
              { required: true, message: 'Xác nhận mật khẩu là bắt buộc' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Mật khẩu không khớp'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu..." size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Đặt lại mật khẩu
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Link to="/login">Quay lại đăng nhập</Link>
        </div>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
