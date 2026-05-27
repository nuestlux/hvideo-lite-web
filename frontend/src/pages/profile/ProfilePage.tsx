import React, { useState } from 'react';
import { Card, Form, Input, Button, Descriptions, Tag, message, Typography } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { profileApi } from '../../api/profile';

const { Title } = Typography;

const statusLabels: Record<string, string> = {
  hoat_dong: 'Hoạt động',
  da_khoa: 'Đã khóa',
  cho_xac_nhan: 'Chờ xác nhận',
};

const statusColors: Record<string, string> = {
  hoat_dong: 'green',
  da_khoa: 'red',
  cho_xac_nhan: 'orange',
};

const ProfilePage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPass, setChangingPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [form] = Form.useForm();
  const [passForm] = Form.useForm();

  const handleUpdateInfo = async (values: { name: string; email: string }) => {
    setSaving(true);
    try {
      await profileApi.update(values);
      message.success('Cập nhật thông tin thành công');
      setEditing(false);
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Cập nhật thất bại';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (values: { old_password: string; new_password: string }) => {
    setPassLoading(true);
    try {
      await profileApi.changePassword(values.old_password, values.new_password);
      message.success('Đổi mật khẩu thành công');
      setChangingPass(false);
      passForm.resetFields();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Đổi mật khẩu thất bại';
      message.error(msg);
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <>
      <Title level={4}>Hồ sơ cá nhân</Title>

      <Card title="Thông tin cá nhân" extra={
        <Button type="link" onClick={() => {
          if (!editing) {
            form.setFieldsValue({ name: user?.name, email: user?.email });
            setEditing(true);
          } else {
            setEditing(false);
          }
        }}>
          {editing ? 'Hủy' : 'Chỉnh sửa'}
        </Button>
      }>
        {editing ? (
          <Form form={form} layout="vertical" onFinish={handleUpdateInfo} style={{ maxWidth: 400 }}>
            <Form.Item name="name" label="Tên" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              Lưu
            </Button>
          </Form>
        ) : (
          <Descriptions column={1}>
            <Descriptions.Item label="Tên">{user?.name}</Descriptions.Item>
            <Descriptions.Item label="Email">{user?.email}</Descriptions.Item>
            <Descriptions.Item label="Vai trò">{isAdmin ? 'Admin' : 'Cán bộ'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={statusColors[user?.status || '']}>{statusLabels[user?.status || '']}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Point">{user?.points}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Đổi mật khẩu" style={{ marginTop: 16 }}>
        {changingPass ? (
          <Form form={passForm} layout="vertical" onFinish={handleChangePassword} style={{ maxWidth: 400 }}>
            <Form.Item
              name="old_password"
              label="Mật khẩu cũ"
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="new_password"
              label="Mật khẩu mới"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirm"
              label="Xác nhận"
              dependencies={['new_password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) return Promise.resolve();
                    return Promise.reject(new Error('Mật khẩu không khớp'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={passLoading}>
              Đổi mật khẩu
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => { setChangingPass(false); passForm.resetFields(); }}>
              Hủy
            </Button>
          </Form>
        ) : (
          <Button onClick={() => setChangingPass(true)}>Đổi mật khẩu</Button>
        )}
      </Card>
    </>
  );
};

export default ProfilePage;
