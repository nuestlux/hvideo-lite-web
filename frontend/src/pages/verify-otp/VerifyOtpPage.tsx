import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/auth';

const { Title, Text } = Typography;

const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as any)?.email || '';
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { otp: string }) => {
    if (!email) {
      message.error('Không tìm thấy email. Vui lòng đăng nhập lại.');
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email, values.otp);
      navigate('/set-password', { state: { setupToken: res.data.data.setup_token } });
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Mã OTP không hợp lệ';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <Card className="auth-card">
        <div className="auth-logo">
          <Title level={3}>Xác nhận OTP</Title>
          <Text type="secondary">Mã OTP đã được gửi đến email của bạn</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label={<><Text strong>Email</Text> <Text type="danger">*</Text></>}
            name="email" initialValue={email}>
            <Input disabled />
          </Form.Item>
          <Form.Item
            label={<><Text strong>Mã OTP</Text> <Text type="danger">*</Text></>}
            name="otp"
            rules={[
              { required: true, len: 6, message: 'Vui lòng nhập mã OTP 6 số' },
              { pattern: /^\d{6}$/, message: 'OTP phải là 6 chữ số' },
            ]}
          >
            <Input.OTP length={6} size="large" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Xác nhận
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            Không nhận được mã? Liên hệ admin để được hỗ trợ.
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default VerifyOtpPage;
