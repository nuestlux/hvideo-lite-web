import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';

const { Title, Text } = Typography;

const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  return name[0] + '***@' + domain;
};

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = useCallback(async (values: { email: string }) => {
    setLoading(true);
    try {
      await authApi.forgotPassword(values.email);
      setEmail(values.email);
      setStep(2);
      setCountdown(60);
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Gửi yêu cầu thất bại';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      message.success('Đã gửi lại mã xác nhận');
      setCountdown(60);
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Gửi lại thất bại';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [email, countdown]);

  const handleVerifyOtp = useCallback(async (values: { otp: string }) => {
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email, values.otp, 'reset_password');
      setResetToken(res.data.data.setup_token);
      setStep(3);
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Mã xác nhận không hợp lệ';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleResetPassword = useCallback(async (values: { new_password: string }) => {
    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, values.new_password);
      message.success('Đặt lại mật khẩu thành công');
      navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Đặt lại mật khẩu thất bại';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }, [resetToken, navigate]);

  return (
    <div className="auth-layout">
      <Card className="auth-card">
        {step === 1 && (
          <>
            <div className="auth-logo">
              <Title level={3}>Quên mật khẩu</Title>
              <Text type="secondary">Nhập email để nhận mã xác nhận</Text>
            </div>
            <Form layout="vertical" onFinish={handleSendCode}>
              <Form.Item
                label={<Text strong>Email</Text>}
                name="email"
                rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
              >
                <Input placeholder="Nhập email..." size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                  Gửi mã xác nhận
                </Button>
              </Form.Item>
            </Form>
            <div style={{ textAlign: 'center' }}>
              <Link to="/login">Quay lại đăng nhập</Link>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="auth-logo">
              <Title level={3}>Nhập mã xác nhận</Title>
              <Text type="secondary">
                Mã xác nhận 6 chữ số đã được gửi đến <strong>{maskEmail(email)}</strong>
              </Text>
            </div>
            <Form layout="vertical" onFinish={handleVerifyOtp}>
              <Form.Item
                label={<Text strong>Mã xác nhận</Text>}
                name="otp"
                rules={[
                  { required: true, message: 'Vui lòng nhập mã xác nhận' },
                  { len: 6, message: 'Mã xác nhận gồm 6 chữ số' },
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
              {countdown > 0 ? (
                <Text type="secondary">Gửi lại mã sau {countdown}s</Text>
              ) : (
                <Button type="link" onClick={handleResend} loading={loading} style={{ padding: 0 }}>
                  Gửi lại mã
                </Button>
              )}
            </div>
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Button type="link" onClick={() => setStep(1)} style={{ padding: 0 }}>
                Quay lại
              </Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="auth-logo">
              <Title level={3}>Đặt mật khẩu mới</Title>
              <Text type="secondary">Nhập mật khẩu mới cho tài khoản của bạn</Text>
            </div>
            <Form layout="vertical" onFinish={handleResetPassword}>
              <Form.Item
                label={<Text strong>Mật khẩu mới</Text>}
                name="new_password"
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
          </>
        )}
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
