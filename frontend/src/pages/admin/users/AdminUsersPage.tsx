import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Button, Input, Select, Tag, Space, Modal, Form, message, Popconfirm, Typography, Upload } from 'antd';
const { Text } = Typography;
import { PlusOutlined, SearchOutlined, DollarOutlined, EditOutlined, UploadOutlined, KeyOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { usersApi } from '../../../api/users';
import type { User } from '../../../api/users';
import { pointsApi } from '../../../api/points';
import PointAdjustModal from './PointAdjustModal';
import * as XLSX from 'xlsx';

const { Title } = Typography;

const PACKAGE_OPTIONS = [
  { value: 'basic', label: 'Basic (100 point)', points: 100 },
  { value: 'pro', label: 'Pro (300 point)', points: 300 },
  { value: 'enterprise', label: 'Enterprise (1000 point)', points: 1000 },
  { value: 'none', label: 'Không cấp point', points: 0 },
];

const statusColors: Record<string, string> = {
  hoat_dong: 'green',
  da_khoa: 'red',
  cho_xac_nhan: 'orange',
};

const statusLabels: Record<string, string> = {
  hoat_dong: 'Hoạt động',
  da_khoa: 'Đã khóa',
  cho_xac_nhan: 'Chờ xác nhận',
};

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pointModalUser, setPointModalUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({ search, status: statusFilter, role: roleFilter, page, limit });
      setUsers(res.data.data.items);
      setTotal(res.data.data.total);
    } catch (err: any) {
      message.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, roleFilter, page, limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = async (values: { name: string; email: string; role: string; package: string }) => {
    setCreating(true);
    try {
      const createRes = await usersApi.create({
        name: values.name,
        email: values.email,
        role: values.role,
      });
      const selectedPackage = PACKAGE_OPTIONS.find((p) => p.value === values.package);
      if (selectedPackage && selectedPackage.points > 0) {
        await pointsApi.adjust(createRes.data.data.id, {
          point: selectedPackage.points,
          reason: `Cấp point theo gói ${selectedPackage.label}`,
        });
      }
      message.success('Tạo tài khoản thành công');
      setModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Tạo tài khoản thất bại';
      message.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleLock = async (id: number) => {
    try {
      const res = await usersApi.toggleLock(id);
      message.success(
        res.data.data.status === 'da_khoa' ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản'
      );
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || err.response?.data?.message || 'Thao tác thất bại';
      message.error(msg);
    }
  };

  const handleEdit = async (values: { name: string; email: string }) => {
    if (!editUser) return;
    setEditing(true);
    try {
      await usersApi.update(editUser.id, values);
      message.success('Cập nhật thông tin thành công');
      setEditUser(null);
      editForm.resetFields();
      fetchUsers();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Cập nhật thất bại';
      message.error(msg);
    } finally {
      setEditing(false);
    }
  };

  const handleResendOtp = async (id: number) => {
    try {
      await usersApi.resendOtp(id);
      message.success('OTP đã được gửi lại');
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Gửi OTP thất bại';
      message.error(msg);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;
    if (!newPassword || newPassword.length < 6) {
      message.warning('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    setResetting(true);
    try {
      const res = await usersApi.resetPassword(resetPasswordUser.id, { password: newPassword });
      message.success('Đặt lại mật khẩu thành công');
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Đặt lại mật khẩu thất bại';
      message.error(msg);
    } finally {
      setResetting(false);
    }
  };

  const handleCopyPassword = () => {
    navigator.clipboard.writeText(newPassword);
    message.success('Đã sao chép mật khẩu');
  };

  const handleImportExcel = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { defval: '' });

      let successCount = 0;
      let failCount = 0;

      for (const row of rows) {
        const name = String(row.name || row.Name || '').trim();
        const email = String(row.email || row.Email || '').trim();
        const role = String(row.role || row.Role || 'can_bo').trim() || 'can_bo';
        const packageName = String(row.package || row.Package || 'none').trim().toLowerCase();

        if (!name || !email) {
          failCount += 1;
          continue;
        }

        try {
          const createRes = await usersApi.create({ name, email, role });
          const selectedPackage = PACKAGE_OPTIONS.find((p) => p.value === packageName);
          if (selectedPackage && selectedPackage.points > 0) {
            await pointsApi.adjust(createRes.data.data.id, {
              point: selectedPackage.points,
              reason: `Cấp point theo gói ${selectedPackage.label} (import)`,
            });
          }
          successCount += 1;
        } catch {
          failCount += 1;
        }
      }

      message.success(`Import hoàn tất: ${successCount} thành công, ${failCount} thất bại`);
      fetchUsers();
    } catch {
      message.error('Không đọc được file Excel');
    }

    return false;
  };

  const columns = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: User, b: User) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a: User, b: User) => a.email.localeCompare(b.email),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (role === 'admin' ? 'Admin' : 'Cán bộ'),
    },
    {
      title: 'Point',
      dataIndex: 'points',
      key: 'points',
      sorter: (a: User, b: User) => a.points - b.points,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: User) => (
        <>
          <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
          {status === 'cho_xac_nhan' && record.created_at && (
            (() => {
              const hours = (Date.now() - new Date(record.created_at).getTime()) / 3600000;
              return hours > 72 ? <Tag color="red" style={{ marginLeft: 4 }}>72h+</Tag> : null;
            })()
          )}
        </>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => { setEditUser(record); editForm.setFieldsValue({ name: record.name, email: record.email }); }}>
            Sửa
          </Button>
          <Button size="small" icon={<DollarOutlined />} onClick={() => setPointModalUser(record)}>
            Point
          </Button>
          <Popconfirm
            title={record.status === 'da_khoa' ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
            onConfirm={() => handleLock(record.id)}
          >
            <Button size="small">
              {record.status === 'da_khoa' ? 'Mở khóa' : 'Khóa'}
            </Button>
          </Popconfirm>
          {record.status === 'cho_xac_nhan' && (
            <Button size="small" onClick={() => handleResendOtp(record.id)}>
              Gửi OTP
            </Button>
          )}
          <Button size="small" icon={<KeyOutlined />} onClick={() => { setResetPasswordUser(record); setNewPassword(''); }}>
            Reset MK
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card>
        <div style={{ marginBottom: 12 }}>
          <Title level={4} style={{ margin: 0 }}>Quản lý tài khoản</Title>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <Input
              placeholder="Tìm kiếm..."
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onPressEnter={() => { setPage(1); setSearch(searchInput.trim()); }}
              style={{ width: 250 }}
              allowClear
            />
            <Button onClick={() => { setPage(1); setSearch(searchInput.trim()); }}>
              Tìm
            </Button>
            <Select
              placeholder="Trạng thái"
              allowClear
              style={{ width: 150 }}
              onChange={(val) => { setPage(1); setStatusFilter(val); }}
              options={[
                { value: 'hoat_dong', label: 'Hoạt động' },
                { value: 'da_khoa', label: 'Đã khóa' },
                { value: 'cho_xac_nhan', label: 'Chờ xác nhận' },
              ]}
            />
            <Select
              placeholder="Vai trò"
              allowClear
              style={{ width: 140 }}
              onChange={(val) => { setPage(1); setRoleFilter(val); }}
              options={[
                { value: 'admin', label: 'Admin' },
                { value: 'can_bo', label: 'Cán bộ' },
              ]}
            />
          </Space>
          <Space>
            <Upload
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={handleImportExcel}
            >
              <Button icon={<UploadOutlined />}>Import Excel</Button>
            </Upload>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
              Tạo tài khoản
            </Button>
          </Space>
        </div>

        <Table
          dataSource={users}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            onChange: (p) => setPage(p),
            showTotal: (t) => `Tổng: ${t}`,
          }}
        />
      </Card>

      <Modal
        title="Tạo tài khoản mới"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item label={<Text strong>Tên</Text>} name="name" rules={[{ required: true, message: 'Tên là bắt buộc' }]}>
            <Input placeholder="Nhập tên..." />
          </Form.Item>
          <Form.Item label={<Text strong>Email</Text>} name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
            <Input placeholder="Nhập email..." />
          </Form.Item>
          <Form.Item label={<Text strong>Vai trò</Text>} name="role" initialValue="can_bo" rules={[{ required: true, message: 'Vai trò là bắt buộc' }]}> 
            <Select
              options={[
                { value: 'can_bo', label: 'Cán bộ' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
          </Form.Item>
          <Form.Item label={<Text strong>Gói point</Text>} name="package" initialValue="basic" rules={[{ required: true, message: 'Chọn gói point' }]}> 
            <Select
              options={PACKAGE_OPTIONS.map((p) => ({ value: p.value, label: p.label }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={creating}>
              Tạo tài khoản
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Cập nhật thông tin"
        open={!!editUser}
        onCancel={() => { setEditUser(null); editForm.resetFields(); }}
        footer={null}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
<Form.Item label={<Text strong>Tên</Text>} name="name" rules={[{ required: true, message: 'Tên là bắt buộc' }]}>
            <Input />
          </Form.Item>
          <Form.Item label={<Text strong>Email</Text>} name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}> 
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={editing}>Cập nhật</Button>
          </Form.Item>
        </Form>
      </Modal>

      <PointAdjustModal
        open={!!pointModalUser}
        user={pointModalUser}
        onClose={() => setPointModalUser(null)}
        onSuccess={fetchUsers}
      />

      <Modal
        title={`Đặt lại mật khẩu - ${resetPasswordUser?.name || ''}`}
        open={!!resetPasswordUser}
        onCancel={() => { setResetPasswordUser(null); setNewPassword(''); }}
        footer={null}
      >
        <div style={{ marginBottom: 12 }}>
          <Text>Nhập mật khẩu mới hoặc tạo mật khẩu ngẫu nhiên:</Text>
        </div>
        <Input.Password
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nhập mật khẩu mới..."
          style={{ marginBottom: 12 }}
        />
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ReloadOutlined />} onClick={generateRandomPassword}>
            Tạo mật khẩu
          </Button>
          {newPassword && (
            <Button icon={<CopyOutlined />} onClick={handleCopyPassword}>
              Sao chép
            </Button>
          )}
        </Space>
        <div>
          <Button type="primary" onClick={handleResetPassword} loading={resetting} block>
            Xác nhận
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default AdminUsersPage;
