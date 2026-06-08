import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Select, Space,
  Popconfirm, message, Tag, Card, Row, Col, Typography, Switch,
  Tooltip, Badge, Divider,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, PlusOutlined, CheckCircleOutlined,
  DatabaseOutlined, StarOutlined, CrownOutlined, ShopOutlined,
  DeleteOutlined, EditOutlined, SortAscendingOutlined,
} from '@ant-design/icons';
import { packagesApi } from '../../../api/packages';
import type { PointPackage, PointPackageCreate, PointPackageUpdate } from '../../../api/packages';

const { Title, Text } = Typography;

// ─── Các tính năng gợi ý cho gói ──────────────────────────────────────────────
const FEATURE_SUGGESTIONS = [
  'Nhận dạng biển số xe',
  'Khôi phục video cơ bản',
  'Khôi phục video nâng cao AI',
  'Sửa video theo file tham chiếu',
  'Tải file hàng loạt',
  'Ưu tiên xử lý trong hàng đợi',
  'Hỗ trợ kỹ thuật 24/7',
  'API riêng (Rate limit cao)',
  'Báo cáo phân tích chi tiết',
  'Lưu trữ kết quả vĩnh viễn',
  'Xuất kết quả Excel/CSV',
];

// ─── Card xem trước gói ────────────────────────────────────────────────────────
const PackagePreviewCard: React.FC<{ pkg: PointPackage }> = ({ pkg }) => {
  const isEnterprise = pkg.type === 'ENTERPRISE';
  const gradient = isEnterprise
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';

  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      background: '#fff',
    }}>
      {/* Header */}
      <div style={{
        background: gradient,
        padding: '24px 20px 20px',
        color: '#fff',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>
          {isEnterprise ? <CrownOutlined /> : <StarOutlined />}
        </div>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>{pkg.name}</Title>
        <Tag
          style={{ marginTop: 8, background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff' }}
        >
          {isEnterprise ? 'Enterprise' : 'Standard'}
        </Tag>
      </div>

      {/* Price */}
      <div style={{ textAlign: 'center', padding: '20px 20px 0' }}>
        {isEnterprise ? (
          <Text type="secondary" style={{ fontSize: 16 }}>Liên hệ để có giá tốt nhất</Text>
        ) : (
          <div>
            <Text style={{ fontSize: 32, fontWeight: 700, color: '#1677ff' }}>
              {(pkg.price || 0).toLocaleString()}
            </Text>
            <Text style={{ color: '#8c8c8c' }}>đ</Text>
          </div>
        )}
        {pkg.points && (
          <div style={{ marginTop: 4 }}>
            <Tag color="blue" style={{ fontSize: 14, padding: '2px 10px' }}>
              {pkg.points.toLocaleString()} Points
            </Tag>
          </div>
        )}
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Description */}
      {pkg.description && (
        <div style={{ padding: '0 20px 12px', textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>{pkg.description}</Text>
        </div>
      )}

      {/* Features */}
      <div style={{ padding: '0 20px 8px' }}>
        {pkg.storage_limit_mb && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
            <DatabaseOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: 13 }}>Lưu trữ {pkg.storage_limit_mb >= 1024
              ? `${(pkg.storage_limit_mb / 1024).toFixed(0)} GB`
              : `${pkg.storage_limit_mb} MB`
            }</Text>
          </div>
        )}
        {(pkg.features || []).map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
            <CheckCircleOutlined style={{ color: isEnterprise ? '#7c3aed' : '#52c41a', flexShrink: 0 }} />
            <Text style={{ fontSize: 13 }}>{f}</Text>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ padding: '12px 20px 20px' }}>
        <Button
          type={isEnterprise ? 'default' : 'primary'}
          block
          style={isEnterprise ? { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', border: 'none' } : {}}
        >
          {isEnterprise ? 'Liên hệ tư vấn' : 'Mua ngay'}
        </Button>
      </div>

      {/* Status */}
      <div style={{ textAlign: 'center', padding: '0 0 12px', color: '#8c8c8c', fontSize: 12 }}>
        {pkg.is_active ? <Badge status="success" text="Đang hiển thị" /> : <Badge status="default" text="Đã ẩn" />}
      </div>
    </div>
  );
};

// ─── Trang quản lý gói ────────────────────────────────────────────────────────
const AdminPackageManagementPage: React.FC = () => {
  const [packages, setPackages] = useState<PointPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPackageId, setCurrentPackageId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [featuresInput, setFeaturesInput] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [previewPkg, setPreviewPkg] = useState<PointPackage | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    return packages.filter((p) => {
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
  }, [filtered, page, pageSize]);

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

  useEffect(() => { fetchPackages(); }, []);

  const handleOpenModal = (pkg?: PointPackage) => {
    if (pkg) {
      setIsEditing(true);
      setCurrentPackageId(pkg.id);
      setFeaturesInput(pkg.features || []);
      form.setFieldsValue({ ...pkg });
    } else {
      setIsEditing(false);
      setCurrentPackageId(null);
      setFeaturesInput([]);
      form.resetFields();
      form.setFieldsValue({ type: 'STANDARD', is_active: true, sort_order: 0, storage_limit_mb: 500 });
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => { setIsModalVisible(false); form.resetFields(); };

  const handleOk = async () => {
    try {
      const vals = await form.validateFields();
      const payload = { ...vals, features: featuresInput };

      if (isEditing && currentPackageId) {
        await packagesApi.update(currentPackageId, payload as PointPackageUpdate);
        message.success('Cập nhật gói thành công');
      } else {
        await packagesApi.create(payload as PointPackageCreate);
        message.success('Tạo gói thành công');
      }
      setIsModalVisible(false);
      fetchPackages();
    } catch (err: any) {
      if (err.errorFields) return; // form validation error
      message.error(err.response?.data?.detail?.message || 'Có lỗi xảy ra');
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
      title: <SortAscendingOutlined title="Thứ tự" />,
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 60,
      sorter: (a: PointPackage, b: PointPackage) => a.sort_order - b.sort_order,
      render: (v: number) => <Text type="secondary">{v}</Text>,
    },
    {
      title: 'Tên gói',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: PointPackage, b: PointPackage) => a.name.localeCompare(b.name),
      render: (name: string, rec: PointPackage) => (
        <Space direction="vertical" size={2}>
          <Space>
            {rec.type === 'ENTERPRISE' ? <CrownOutlined style={{ color: '#7c3aed' }} /> : <StarOutlined style={{ color: '#52c41a' }} />}
            <Text strong>{name}</Text>
          </Space>
          {rec.description && <Text type="secondary" style={{ fontSize: 11 }}>{rec.description}</Text>}
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'STANDARD' ? 'green' : 'purple'}>
          {type === 'STANDARD' ? 'Standard' : 'Enterprise'}
        </Tag>
      ),
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 130,
      sorter: (a: PointPackage, b: PointPackage) => (a.price || 0) - (b.price || 0),
      render: (price: number | undefined, rec: PointPackage) =>
        rec.type === 'ENTERPRISE'
          ? <Text type="secondary">Liên hệ</Text>
          : <Text strong>{price ? `${price.toLocaleString()}đ` : '–'}</Text>,
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      width: 110,
      sorter: (a: PointPackage, b: PointPackage) => (a.points || 0) - (b.points || 0),
      render: (points: number | undefined) =>
        points !== undefined ? <Tag color="blue">{points.toLocaleString()} pt</Tag> : '–',
    },
    {
      title: 'Lưu trữ',
      dataIndex: 'storage_limit_mb',
      key: 'storage_limit_mb',
      width: 110,
      render: (mb: number | undefined) => {
        if (!mb) return '–';
        return mb >= 1024
          ? <Tag color="cyan">{(mb / 1024).toFixed(0)} GB</Tag>
          : <Tag color="cyan">{mb} MB</Tag>;
      },
    },
    {
      title: 'Tính năng',
      dataIndex: 'features',
      key: 'features',
      render: (features: string[] | undefined) =>
        features?.length
          ? <Tooltip title={features.join(', ')}><Tag>{features.length} tính năng</Tag></Tooltip>
          : <Text type="secondary">–</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 110,
      render: (isActive: boolean) =>
        isActive
          ? <Badge status="success" text="Hiển thị" />
          : <Badge status="default" text="Ẩn" />,
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      render: (_: any, record: PointPackage) => (
        <Space>
          <Tooltip title="Xem trước">
            <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewPkg(record)} />
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          </Tooltip>
          <Popconfirm
            title="Xóa gói này?"
            description="Hành động này không thể hoàn tác."
            onConfirm={() => handleDelete(record.id)}
            okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}
          >
            <Tooltip title="Xóa">
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const packageType = Form.useWatch('type', form);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <Title level={5} style={{ margin: 0 }}>Quản lý gói Point</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Cấu hình các gói mua point cho người dùng sử dụng dịch vụ AI
          </Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Thêm gói mới
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Tổng gói</Text>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>{packages.length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Đang hiển thị</Text>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{packages.filter((p) => p.is_active).length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Standard</Text>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#11998e' }}>{packages.filter((p) => p.type === 'STANDARD').length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Enterprise</Text>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed' }}>{packages.filter((p) => p.type === 'ENTERPRISE').length}</div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="Tìm gói..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
        <Select
          placeholder="Loại gói"
          allowClear style={{ width: 150 }}
          value={typeFilter || undefined}
          onChange={(val) => setTypeFilter(val || '')}
          options={[{ value: 'STANDARD', label: 'Standard' }, { value: 'ENTERPRISE', label: 'Enterprise' }]}
        />
        <Select
          placeholder="Trạng thái"
          allowClear style={{ width: 150 }}
          value={statusFilter || undefined}
          onChange={(val) => setStatusFilter(val || '')}
          options={[{ value: 'active', label: 'Đang hiển thị' }, { value: 'inactive', label: 'Đã ẩn' }]}
        />
      </Space>

      <Table
        dataSource={paged}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total: filtered.length,
          pageSize,
          onChange: (p, ps) => {
            setPage(p);
            if (ps !== pageSize) {
              setPageSize(ps);
              setPage(1);
            }
          },
          showTotal: (t) => `Tổng: ${t} gói`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
      />

      {/* Modal tạo / sửa gói */}
      <Modal
        title={
          <Space>
            <ShopOutlined />
            {isEditing ? 'Chỉnh sửa gói Point' : 'Tạo gói Point mới'}
          </Space>
        }
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={isEditing ? 'Lưu thay đổi' : 'Tạo gói'}
        cancelText="Hủy"
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label="Tên gói" rules={[{ required: true, message: 'Vui lòng nhập tên gói' }]}>
                <Input placeholder="Ví dụ: Gói Cơ bản, Gói Chuyên nghiệp..." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sort_order" label="Thứ tự hiển thị">
                <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Loại gói" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'STANDARD', label: '⭐ Standard – Mua trực tiếp' },
                    { value: 'ENTERPRISE', label: '👑 Enterprise – Liên hệ tư vấn' },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label="Hiển thị cho người dùng" valuePropName="checked">
                <Switch checkedChildren="Hiển thị" unCheckedChildren="Ẩn" />
              </Form.Item>
            </Col>
          </Row>

          {packageType !== 'ENTERPRISE' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="price" label="Giá bán (VNĐ)">
                  <InputNumber
                    style={{ width: '100%' }} min={0}
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(v) => Number(v?.replace(/,/g, '') || 0) as any}
                    placeholder="0"
                    addonAfter="đ"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="points" label="Số lượng Point">
                  <InputNumber style={{ width: '100%' }} min={0} placeholder="100" addonAfter="pt" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item name="storage_limit_mb" label="Dung lượng lưu trữ cho người dùng">
            <InputNumber
              style={{ width: '100%' }} min={0}
              placeholder="500"
              addonAfter="MB"
            />
          </Form.Item>

          <Form.Item name="description" label="Mô tả gói">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn về gói, hiển thị cho người dùng..." />
          </Form.Item>

          {/* Tính năng */}
          <Form.Item label="Các tính năng được kích hoạt theo gói">
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder="Chọn hoặc nhập tính năng..."
              value={featuresInput}
              onChange={(vals) => setFeaturesInput(vals)}
              options={FEATURE_SUGGESTIONS.map((f) => ({ value: f, label: f }))}
              tokenSeparators={[',']}
              allowClear
            />
            <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 11 }}>
              Chọn từ danh sách gợi ý hoặc gõ tùy ý rồi nhấn Enter để thêm
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal xem trước */}
      <Modal
        title={null}
        open={!!previewPkg}
        onCancel={() => setPreviewPkg(null)}
        footer={null}
        width={380}
        destroyOnClose
        style={{ top: 40 }}
      >
        {previewPkg && <PackagePreviewCard pkg={previewPkg} />}
      </Modal>
    </>
  );
};

export default AdminPackageManagementPage;
