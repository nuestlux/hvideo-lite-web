import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Popconfirm, message, Tag, Card, Row, Col, Typography } from 'antd';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { packagesApi } from '../../../api/packages';
import type { PointPackage, PointPackageCreate, PointPackageUpdate } from '../../../api/packages';

const { Title, Text } = Typography;

const AdminPackageManagementPage: React.FC = () => {
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPackageId, setCurrentPackageId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [previewPkg, setPreviewPkg] = useState<PointPackage | null>(null);
  const [page, setPage] = useState(1);

  const pageSize = 10;

  const filtered = useMemo(() => {
    return packages.filter(p => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) return false;
      }
      if (typeFilter && p.type !== typeFilter) return false;
      if (statusFilter === 'active' && !p.is_active) return false;
      if (statusFilter === 'inactive' && p.is_active) return false;
      return true;
    });
  }, [packages, search, typeFilter, statusFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await packagesApi.listAdmin();
      setPackages(res.data.data);
    } catch {
      message.error('Không thể tải danh sách gói');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleOpenModal = (packageToEdit?: PointPackage) => {
    if (packageToEdit) {
      setIsEditing(true);
      setCurrentPackageId(packageToEdit.id);
      form.setFieldsValue({ ...packageToEdit });
    } else {
      setIsEditing(false);
      setCurrentPackageId(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (isEditing && currentPackageId) {
        await packagesApi.update(currentPackageId, values as PointPackageUpdate);
        message.success('Cập nhật gói thành công');
      } else {
        await packagesApi.create(values as PointPackageCreate);
        message.success('Tạo gói thành công');
      }
      setIsModalVisible(false);
      fetchPackages();
    } catch (err: any) {
      message.error(err.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await packagesApi.delete(id);
      message.success('Xóa gói thành công');
      fetchPackages();
    } catch {
      message.error('Xóa thất bại');
    }
  };

  const columns = [
    {
      title: 'Tên gói',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: PointPackage, b: PointPackage) => a.name.localeCompare(b.name),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'STANDARD' ? 'blue' : 'purple'}>{type}</Tag>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      sorter: (a: PointPackage, b: PointPackage) => (a.price || 0) - (b.price || 0),
      render: (price: number | undefined) => (price !== undefined ? `${price.toLocaleString()}đ` : '-'),
    },
    {
      title: 'Point',
      dataIndex: 'points',
      key: 'points',
      sorter: (a: PointPackage, b: PointPackage) => (a.points || 0) - (b.points || 0),
      render: (points: number | undefined) => (points !== undefined ? `${points} points` : '-'),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'orange'}>{isActive ? 'Đang dùng' : 'Tắt'}</Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: PointPackage) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewPkg(record)}>Xem trước</Button>
          <Button size="small" onClick={() => handleOpenModal(record)}>Sửa</Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa gói này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button size="small" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Quản lý các gói Point</h2>
        <Button type="primary" onClick={() => handleOpenModal()}>Thêm gói mới</Button>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm gói..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 250 }}
        />
        <Select
          placeholder="Loại gói"
          allowClear
          style={{ width: 150 }}
          value={typeFilter || undefined}
          onChange={(val) => setTypeFilter(val || '')}
          options={[
            { value: 'STANDARD', label: 'Standard' },
            { value: 'ENTERPRISE', label: 'Enterprise' },
          ]}
        />
        <Select
          placeholder="Trạng thái"
          allowClear
          style={{ width: 150 }}
          value={statusFilter || undefined}
          onChange={(val) => setStatusFilter(val || '')}
          options={[
            { value: 'active', label: 'Đang dùng' },
            { value: 'inactive', label: 'Tắt' },
          ]}
        />
      </Space>

      <Table
        dataSource={paged}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ current: page, total: filtered.length, pageSize, onChange: (p) => setPage(p), showTotal: (t) => `Tổng: ${t}` }}
      />

      <Modal
        title={isEditing ? 'Chỉnh sửa gói' : 'Thêm gói mới'}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Tên gói" rules={[{ required: true, message: 'Vui lòng nhập tên gói' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Loại gói" rules={[{ required: true, message: 'Vui lòng chọn loại gói' }]}>
            <Select options={[{ value: 'STANDARD', label: 'Standard' }, { value: 'ENTERPRISE', label: 'Enterprise' }]} />
          </Form.Item>
          <Form.Item name="price" label="Giá (VNĐ)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="points" label="Số lượng Point">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="is_active" label="Trạng thái" valuePropName="checked">
            <Select
              options={[
                { value: true, label: 'Đang dùng' },
                { value: false, label: 'Tắt' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Xem trước: ${previewPkg?.name || ''}`}
        open={!!previewPkg}
        onCancel={() => setPreviewPkg(null)}
        footer={null}
        width={400}
        destroyOnClose
      >
        {previewPkg && (
          <Row justify="center">
            <Col xs={24}>
              <Card
                style={{
                  textAlign: 'center',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                actions={[
                  previewPkg.type === 'STANDARD'
                    ? <Button type="primary" block>Mua ngay</Button>
                    : <Button block>Liên hệ tư vấn</Button>,
                ]}
              >
                <div style={{ marginBottom: 16 }}>
                  <Title level={3} style={{ margin: 0 }}>{previewPkg.name}</Title>
                  {previewPkg.type === 'STANDARD' && previewPkg.price && (
                    <Text type="danger" style={{ fontSize: 24, fontWeight: 'bold' }}>
                      {previewPkg.price.toLocaleString()}đ
                    </Text>
                  )}
                  {previewPkg.type === 'ENTERPRISE' && (
                    <Text type="secondary">Liên hệ để có giá tốt nhất</Text>
                  )}
                </div>
                <div style={{ marginBottom: 24, minHeight: 60 }}>
                  <Text>{previewPkg.description || 'Không có mô tả'}</Text>
                </div>
                {previewPkg.points !== undefined && (
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>{previewPkg.points} Points</Text>
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        )}
      </Modal>
    </>
  );
};

export default AdminPackageManagementPage;
