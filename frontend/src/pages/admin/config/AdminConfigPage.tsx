import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Typography, Space, InputNumber, Select, Popconfirm, Tag } from 'antd';
import { configApi } from '../../../api/config';
import type { ConfigItem } from '../../../api/config';

const { Title } = Typography;

const AdminConfigPage: React.FC = () => {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await configApi.list();
      setConfigs(res.data.data);
      const initial: Record<string, string> = {};
      res.data.data.forEach((c) => {
        initial[c.key] = c.value;
      });
      setValues(initial);
    } catch {
      message.error('Không thể tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await configApi.update(values);
      message.success('Cập nhật cấu hình thành công');
      fetchConfigs();
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Cập nhật thất bại';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    setSaving(true);
    try {
      const res = await configApi.resetDefaults();
      setConfigs(res.data.data);
      const initial: Record<string, string> = {};
      res.data.data.forEach((c) => {
        initial[c.key] = c.value;
      });
      setValues(initial);
      message.success(res.data.message);
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Khôi phục mặc định thất bại';
      message.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const [testingEmail, setTestingEmail] = useState(false);

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      const res = await configApi.testEmail();
      message.success(res.data.message);
    } catch (err: any) {
      const msg = err.response?.data?.detail?.message || 'Gửi email thất bại';
      message.error(msg);
    } finally {
      setTestingEmail(false);
    }
  };

  const columns = [
    {
      title: 'Khóa',
      dataIndex: 'key',
      key: 'key',
      render: (key: string) => key,
    },
    {
      title: 'Giá trị',
      key: 'value',
      render: (_: any, record: ConfigItem) => (
        record.key === 'queue_mode' ? (
          <Select
            value={values[record.key] || 'FIFO'}
            onChange={(value) => setValues({ ...values, [record.key]: value })}
            style={{ width: 200 }}
            options={[
              { value: 'FIFO', label: 'FIFO' },
              { value: 'LIFO', label: 'LIFO' },
            ]}
          />
        ) : (
          <InputNumber
            value={Number(values[record.key] || 0)}
            onChange={(value) => setValues({ ...values, [record.key]: String(value ?? '') })}
            style={{ width: 200 }}
            min={0}
          />
        )
      ),
    },
    { title: 'Mô tả', dataIndex: 'description', key: 'description' },
    {
      title: 'Trạng thái',
      key: 'state',
      render: (_: any, record: ConfigItem) => (
        <Tag color={values[record.key] === record.value ? 'green' : 'orange'}>
          {values[record.key] === record.value ? 'Đang dùng' : 'Đã chỉnh sửa'}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>Cấu hình hệ thống</Title>
        <Space>
          <Button onClick={handleTestEmail} loading={testingEmail}>Test Email</Button>
          <Popconfirm
            title="Khôi phục cấu hình mặc định?"
            description="Tất cả giá trị sẽ quay về mặc định ban đầu."
            okText="Khôi phục"
            cancelText="Hủy"
            onConfirm={handleResetDefaults}
          >
            <Button danger loading={saving}>Khôi phục mặc định</Button>
          </Popconfirm>
          <Button type="primary" onClick={handleSave} loading={saving}>
            Lưu thay đổi
          </Button>
        </Space>
      </div>
      <Card>
        <div style={{ marginBottom: 12 }}>
          <Tag color="blue">Point cost</Tag>
          <Tag color="cyan">System</Tag>
          <Tag color="purple">Storage</Tag>
        </div>
        <Table
          dataSource={configs}
          columns={columns}
          rowKey="key"
          loading={loading}
          pagination={{ current: page, total: configs.length, pageSize, onChange: (p) => setPage(p), showTotal: (t) => `Tổng: ${t}` }}
        />
      </Card>
    </>
  );
};

export default AdminConfigPage;
