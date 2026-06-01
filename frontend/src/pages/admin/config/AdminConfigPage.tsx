import React, { useState, useEffect, useMemo } from 'react';
import { Card, Button, message, Typography, Space, InputNumber, Select, Popconfirm, Tag, Row, Col, Pagination, Empty } from 'antd';
import { configApi } from '../../../api/config';
import type { ConfigItem } from '../../../api/config';

const { Title, Text } = Typography;

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

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return configs.slice(start, start + pageSize);
  }, [configs, page]);

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
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
        ) : configs.length === 0 ? (
          <Empty description="Không có cấu hình" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {paged.map((cfg) => (
                <Col xs={24} sm={12} lg={8} key={cfg.key}>
                  <Card
                    size="small"
                    style={{ height: '100%' }}
                  >
                    <div style={{ marginBottom: 8 }}>
                      <Text strong code>{cfg.key}</Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      {cfg.key === 'queue_mode' ? (
                        <Select
                          value={values[cfg.key] || 'FIFO'}
                          onChange={(value) => setValues({ ...values, [cfg.key]: value })}
                          style={{ width: '100%' }}
                          options={[
                            { value: 'FIFO', label: 'FIFO' },
                            { value: 'LIFO', label: 'LIFO' },
                          ]}
                        />
                      ) : (
                        <InputNumber
                          value={Number(values[cfg.key] || 0)}
                          onChange={(value) => setValues({ ...values, [cfg.key]: String(value ?? '') })}
                          style={{ width: '100%' }}
                          min={0}
                        />
                      )}
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{cfg.description}</Text>
                    </div>
                    <Tag color={values[cfg.key] === cfg.value ? 'green' : 'orange'}>
                      {values[cfg.key] === cfg.value ? 'Đang dùng' : 'Đã chỉnh sửa'}
                    </Tag>
                  </Card>
                </Col>
              ))}
            </Row>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Pagination current={page} total={configs.length} pageSize={pageSize} onChange={(p) => setPage(p)} showTotal={(t) => `Tổng: ${t}`} />
            </div>
          </>
        )}
      </Card>
    </>
  );
};

export default AdminConfigPage;
