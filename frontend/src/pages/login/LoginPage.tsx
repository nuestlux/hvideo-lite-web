import React from 'react';
import { Card, Form, Input, Button, Typography, Space, Tag, message, Checkbox } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

const REMEMBER_KEY = 'remembered_credentials';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@example.com', password: 'admin123', color: 'blue' },
  { label: 'Cán bộ', email: 'canbo@example.com', password: 'canbo123', color: 'green' },
];

const LoginPage: React.FC = () => {
  const { setAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);
  const [remember, setRemember] = React.useState(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    return saved ? true : false;
  });
  const [form] = Form.useForm();

  React.useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) {
      try {
        const creds = JSON.parse(saved);
        form.setFieldsValue({ email: creds.email, password: creds.password });
      } catch {}
    }
  }, [form]);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      if (remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email: values.email, password: values.password }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }
      const res = await authApi.login(values.email, values.password);
      const data = res.data.data;
      setAuth(data);
      navigate(data.user.role === 'admin' ? '/admin' : '/can-bo');
    } catch (err: any) {
      if (!err.response) {
        const account = DEMO_ACCOUNTS.find(a => a.email === values.email && a.password === values.password);
        if (account) {
          setAuth({
            token: 'demo-token-' + account.label.toLowerCase(),
            user: {
              id: account.label === 'Admin' ? 1 : 2,
              name: account.label === 'Admin' ? 'Admin' : 'Cán bộ A',
              email: account.email,
              role: account.label === 'Admin' ? 'admin' : 'can_bo',
              status: 'hoat_dong',
              points: account.label === 'Admin' ? 500 : 200,
            },
          });
          navigate(account.label === 'Admin' ? '/admin' : '/can-bo');
          return;
        }
      }
      const msg = err.response?.data?.detail?.message || 'Đăng nhập thất bại';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email: string, password: string) => {
    form.setFieldsValue({ email, password });
  };

  return (
    <div className="auth-layout">
      <Card className="auth-card">
        <div className="auth-logo">
          <Title level={3}>Hvideo Lite</Title>
          <Text type="secondary">Hệ thống AI phục hồi biển số xe</Text>
        </div>

        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>Tài khoản demo:</Text>
          <Space>
            {DEMO_ACCOUNTS.map((acc) => (
              <Tag
                key={acc.label}
                color={acc.color}
                style={{ cursor: 'pointer', padding: '2px 8px' }}
                onClick={() => fillDemo(acc.email, acc.password)}
              >
                <UserOutlined /> {acc.label}
              </Tag>
            ))}
          </Space>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item
            label={<Text strong>Email</Text>}
            name="email"
            rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Nhập email..." size="large" />
          </Form.Item>
          <Form.Item
            label={<Text strong>Mật khẩu</Text>}
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu..." size="large" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 12 }}>
            <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)}>
              Ghi nhớ mật khẩu
            </Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Link to="/forgot-password">Quên mật khẩu?</Link>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
