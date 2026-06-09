import React, { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Modal, Form, Input, InputNumber, Select, Space,
  Popconfirm, message, Tag, Card, Row, Col, Typography, Switch,
  Tooltip, Badge, Divider,
} from 'antd';
import {
  SearchOutlined, EyeOutlined, PlusOutlined, CheckCircleOutlined,
  DatabaseOutlined, StarOutlined, CrownOutlined, ShopOutlined,
  DeleteOutlined, EditOutlined, SortAscendingOutlined, ClockCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { packagesApi } from '../../../api/packages';
import type { PointPackage, PointPackageCreate, PointPackageUpdate } from '../../../api/packages';

const { Title, Text } = Typography;

// Feature suggestions are now loaded from i18n (packages.featureSuggestions) for full i18n support.

// ─── Card xem trước gói ────────────────────────────────────────────────────────
const PackagePreviewCard: React.FC<{ pkg: PointPackage }> = ({ pkg }) => {
  const { t } = useTranslation();
  const isEnterprise = pkg.type === 'ENTERPRISE';
  const gradient = isEnterprise
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)';

  const storageText = pkg.storage_limit_mb
    ? t('packages.storageDisplay', {
        amount: pkg.storage_limit_mb >= 1024
          ? `${(pkg.storage_limit_mb / 1024).toFixed(0)} GB`
          : `${pkg.storage_limit_mb} MB`,
      })
    : null;

  const validityText =
    pkg.validity_days !== undefined && pkg.validity_days !== null && pkg.validity_days > 0
      ? t('packages.validityDisplayDays', { days: pkg.validity_days })
      : pkg.validity_days === 0
      ? t('packages.validityDisplayPermanent')
      : null;

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
          {isEnterprise ? t('packages.enterprise') : t('packages.standard')}
        </Tag>
      </div>

      {/* Price */}
      <div style={{ textAlign: 'center', padding: '20px 20px 0' }}>
        {isEnterprise ? (
          <Text type="secondary" style={{ fontSize: 16 }}>{t('packages.contactEnterprise')}</Text>
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
              {pkg.points.toLocaleString()} {t('common.pointsShort')}
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
        {storageText && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
            <DatabaseOutlined style={{ color: '#52c41a' }} />
            <Text style={{ fontSize: 13 }}>{storageText}</Text>
          </div>
        )}
        {validityText && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
            <ClockCircleOutlined style={{ color: '#7c3aed' }} />
            <Text style={{ fontSize: 13 }}>{validityText}</Text>
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
          {isEnterprise ? t('packages.contactSalesCta') : t('packages.buyNowCta')}
        </Button>
      </div>

      {/* Status */}
      <div style={{ textAlign: 'center', padding: '0 0 12px', color: '#8c8c8c', fontSize: 12 }}>
        {pkg.is_active
          ? <Badge status="success" text={t('packages.visibleBadge')} />
          : <Badge status="default" text={t('packages.hiddenBadge')} />}
      </div>
    </div>
  );
};

// ─── Trang quản lý gói mua ────────────────────────────────────────────────────────
const AdminPackageManagementPage: React.FC = () => {
  const { t } = useTranslation();
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
  const [userPreviewOpen, setUserPreviewOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const FEATURE_SUGGESTIONS = (t('packages.featureSuggestions', { returnObjects: true }) as string[]) || [];

  const resetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setStatusFilter('');
    setPage(1);
  };

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
      message.error(t('messages.loadFailed'));
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
      form.setFieldsValue({ type: 'STANDARD', is_active: true, sort_order: 0, storage_limit_mb: 500, validity_days: 0 });
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
        message.success(t('packages.packageUpdated'));
      } else {
        await packagesApi.create(payload as PointPackageCreate);
        message.success(t('packages.packageCreated'));
      }
      setIsModalVisible(false);
      fetchPackages();
    } catch (err: any) {
      if (err.errorFields) return; // form validation error
      message.error(err.response?.data?.detail?.message || t('messages.operationFailed'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await packagesApi.delete(id);
      message.success(t('packages.packageDeleted'));
      fetchPackages();
    } catch {
      message.error(t('messages.operationFailed'));
    }
  };

  const columns = [
    {
      title: <SortAscendingOutlined title={t('packages.sortIconTitle')} />,
      dataIndex: 'sort_order',
      key: 'sort_order',
      width: 60,
      sorter: (a: PointPackage, b: PointPackage) => a.sort_order - b.sort_order,
      render: (v: number) => <Text type="secondary">{v}</Text>,
    },
    {
      title: t('packages.packageName'),
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
      title: t('common.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'STANDARD' ? 'green' : 'purple'}>
          {type === 'STANDARD' ? t('packages.standard') : t('packages.enterprise')}
        </Tag>
      ),
    },
    {
      title: t('common.price'),
      dataIndex: 'price',
      key: 'price',
      width: 130,
      sorter: (a: PointPackage, b: PointPackage) => (a.price || 0) - (b.price || 0),
      render: (price: number | undefined, rec: PointPackage) =>
        rec.type === 'ENTERPRISE'
          ? <Text type="secondary">{t('packages.contactEnterprise')}</Text>
          : <Text strong>{typeof price === 'number' ? `${price.toLocaleString()} đ` : '–'}</Text>,
    },
    {
      title: t('common.points'),
      dataIndex: 'points',
      key: 'points',
      width: 110,
      sorter: (a: PointPackage, b: PointPackage) => (a.points || 0) - (b.points || 0),
      render: (points: number | undefined) =>
        points !== undefined ? <Tag color="blue">{points.toLocaleString()} {t('common.pointsShort')}</Tag> : '–',
    },
    {
      title: t('common.storage'),
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
      title: t('common.validity'),
      dataIndex: 'validity_days',
      key: 'validity_days',
      width: 100,
      render: (days: number | undefined) => {
        if (days === undefined || days === null || days === 0) return <Tag>{t('packages.validityPermanent')}</Tag>;
        return <Tag color="purple">{days} {t('common.days')}</Tag>;
      },
    },
    {
      title: t('common.features'),
      dataIndex: 'features',
      key: 'features',
      render: (features: string[] | undefined) =>
        features?.length
          ? <Tooltip title={features.join(', ')}><Tag>{t('packages.featureCount', { count: features.length })}</Tag></Tooltip>
          : <Text type="secondary">–</Text>,
    },
    {
      title: t('common.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      width: 110,
      render: (isActive: boolean) =>
        isActive
          ? <Badge status="success" text={t('packages.visibleBadge')} />
          : <Badge status="default" text={t('packages.hiddenBadge')} />,
    },
    {
      title: t('common.actions'),
      key: 'action',
      width: 160,
      render: (_: any, record: PointPackage) => (
        <Space>
          <Tooltip title={t('packages.viewPreview')}>
            <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewPkg(record)} />
          </Tooltip>
          <Tooltip title={t('packages.editPackageAction')}>
            <Button size="small" icon={<EditOutlined />} onClick={() => handleOpenModal(record)} />
          </Tooltip>
          <Popconfirm
            title={t('packages.deletePackageConfirm')}
            description={t('packages.deletePackageConfirmDesc')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.delete')} cancelText={t('common.cancel')} okButtonProps={{ danger: true }}
          >
            <Tooltip title={t('packages.deletePackageAction')}>
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
              <Title level={5} style={{ margin: 0 }}>{t('packages.title')}</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('packages.subtitle')}
          </Text>
        </div>
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => setUserPreviewOpen(true)}
          >
            {t('packages.userPreviewButton')}
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            {t('packages.addNewPackage')}
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>{t('packages.totalLabel')}</Text>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1677ff' }}>{packages.length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>{t('packages.visibleLabel')}</Text>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#52c41a' }}>{packages.filter((p) => p.is_active).length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>{t('packages.standard')}</Text>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#11998e' }}>{packages.filter((p) => p.type === 'STANDARD').length}</div>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ borderRadius: 8, textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>{t('packages.enterprise')}</Text>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#7c3aed' }}>{packages.filter((p) => p.type === 'ENTERPRISE').length}</div>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder={t('packages.searchPlaceholderInput')}
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          allowClear
          style={{ width: 260 }}
        />
        <Select
          placeholder={t('packages.typeFilterPlaceholder')}
          allowClear
          style={{ width: 150 }}
          value={typeFilter || undefined}
          onChange={(val) => { setTypeFilter(val || ''); setPage(1); }}
          options={[
            { value: 'STANDARD', label: t('packages.standard') },
            { value: 'ENTERPRISE', label: t('packages.enterprise') },
          ]}
        />
        <Select
          placeholder={t('packages.statusFilterPlaceholder')}
          allowClear
          style={{ width: 150 }}
          value={statusFilter || undefined}
          onChange={(val) => { setStatusFilter(val || ''); setPage(1); }}
          options={[
            { value: 'active', label: t('packages.statusActive') },
            { value: 'inactive', label: t('packages.statusInactive') },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={resetFilters}>
          {t('packages.resetFilters')}
        </Button>
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
          showTotal: (total) => `${t('common.total')}: ${total} ${t('packages.packageName').toLowerCase() || 'packages'}`,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
        }}
      />

      {/* Modal tạo / sửa gói */}
      <Modal
        title={
          <Space>
            <ShopOutlined />
            {isEditing ? t('packages.modalEditTitle') : t('packages.modalCreateTitle')}
          </Space>
        }
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={isEditing ? t('common.saveChanges') : t('packages.createPackage')}
        cancelText={t('common.cancel')}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label={t('packages.packageName')} rules={[{ required: true, message: t('messages.loadFailed') }]}>
                <Input placeholder={t('packages.namePlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sort_order" label={t('packages.orderLabel')}>
                <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label={t('packages.packageType')} rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: 'STANDARD', label: t('packages.standardBuyDirect') },
                    { value: 'ENTERPRISE', label: t('packages.enterpriseContact') },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_active" label={t('packages.visibleToUsers')} valuePropName="checked">
                <Switch checkedChildren={t('packages.visibleBadge')} unCheckedChildren={t('packages.hiddenBadge')} />
              </Form.Item>
            </Col>
          </Row>

          {packageType !== 'ENTERPRISE' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="price" label={t('packages.priceLabel')}>
                  <InputNumber
                    style={{ width: '100%' }} min={0}
                    formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(v) => Number(v?.replace(/,/g, '') || 0) as any}
                    placeholder={t('packages.pricePlaceholder')}
                    addonAfter="đ"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="points" label={t('packages.pointsLabel')}>
                  <InputNumber style={{ width: '100%' }} min={0} placeholder={t('packages.pointsPlaceholder')} addonAfter={t('common.pointsShort')} />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Form.Item name="storage_limit_mb" label={t('packages.storageLabel')}>
            <InputNumber
              style={{ width: '100%' }} min={0}
              placeholder={t('packages.storagePlaceholder')}
              addonAfter={t('common.mb')}
            />
          </Form.Item>

          {packageType !== 'ENTERPRISE' && (
            <Form.Item 
              name="validity_days" 
              label={t('packages.validityLabel')}
              tooltip={t('packages.validityTooltip')}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={0} 
                placeholder={t('packages.validityPlaceholder')} 
                addonAfter={t('common.days')} 
              />
            </Form.Item>
          )}

          <Form.Item name="description" label={t('packages.descriptionLabel')}>
            <Input.TextArea rows={2} placeholder={t('packages.descriptionPlaceholder')} />
          </Form.Item>

          {/* Tính năng */}
          <Form.Item label={t('packages.featuresSelectLabel')}>
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder={t('packages.searchPlaceholder')}
              value={featuresInput}
              onChange={(vals) => setFeaturesInput(vals)}
              options={FEATURE_SUGGESTIONS.map((f) => ({ value: f, label: f }))}
              tokenSeparators={[',']}
              allowClear
            />
            <div style={{ marginTop: 6, color: '#8c8c8c', fontSize: 11 }}>
              {t('packages.featuresSelectHelp')}
            </div>
          </Form.Item>

          {/* Quick preview cho gói đang tạo/sửa */}
          <Button
            type="link"
            icon={<EyeOutlined />}
            style={{ padding: 0, marginTop: 8 }}
            onClick={() => {
              const vals = form.getFieldsValue();
              const draft: PointPackage = {
                id: -999,
                name: vals.name || t('packages.createNewPackage'),
                type: vals.type || 'STANDARD',
                price: vals.price,
                points: vals.points,
                description: vals.description,
                features: featuresInput,
                storage_limit_mb: vals.storage_limit_mb,
                sort_order: vals.sort_order || 0,
                is_active: vals.is_active ?? true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              } as any;
              setPreviewPkg(draft);
            }}
          >
            {t('packages.quickPreviewLink')}
          </Button>
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

      {/* User-facing preview modal */}
      <Modal
        title={t('packages.previewTitle')}
        open={userPreviewOpen}
        onCancel={() => setUserPreviewOpen(false)}
        footer={null}
        width={960}
        destroyOnClose
      >
        <div style={{ background: '#f5f7fa', padding: 24, borderRadius: 12 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={3} style={{ margin: 0 }}>{t('packages.previewTitle')}</Title>
            <Text type="secondary">{t('packages.previewSubtitle')}</Text>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
            gap: 20 
          }}>
            {packages
              .filter((p) => p.is_active)
              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
              .map((pkg) => (
                <PackagePreviewCard key={pkg.id} pkg={pkg} />
              ))}
          </div>

          {packages.filter((p) => p.is_active).length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>
              {t('packages.noActivePackages')}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AdminPackageManagementPage;
