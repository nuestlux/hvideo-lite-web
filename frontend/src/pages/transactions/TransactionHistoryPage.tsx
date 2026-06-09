import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Select, Tag, Typography, Button, Input, Row, Col, Statistic } from 'antd';
const { Text } = Typography;
import { DownloadOutlined, SearchOutlined, ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { pointsApi } from '../../api/points';
import type { Transaction, PointStats } from '../../api/points';
import { useAuth } from '../../contexts/AuthContext';
import PageHeader from '../../components/PageHeader';

const TransactionHistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();

  const typeLabels: Record<string, string> = {
    admin_adjustment: t('transactions.typeAdjustment'),
    deduction: t('transactions.typeDeduction'),
  };

  const typeColors: Record<string, string> = {
    admin_adjustment: 'blue',
    deduction: 'orange',
  };

  const typeOptions = [
    { value: '', label: t('transactions.allTypes') },
    { value: 'admin_adjustment', label: t('transactions.typeAdjustment') },
    { value: 'deduction', label: t('transactions.typeDeduction') },
  ];

  const serviceLabels: Record<string, string> = {
    license_plate_image: t('transactions.serviceLicensePlateImage'),
    license_plate_video: t('transactions.serviceLicensePlateVideo'),
    video_repair_fast: t('transactions.serviceVideoRepairFast'),
    video_repair_deep: t('transactions.serviceVideoRepairDeep'),
  };
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [service, setService] = useState('');
  const [txnType, setTxnType] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PointStats | null>(null);

  const resetFilters = () => {
    setSearchInput('');
    setSearch('');
    setService('');
    setTxnType('');
    setPage(1);
  };

  useEffect(() => {
    if (isAdmin) {
      pointsApi.stats().then((res) => setStats(res.data.data)).catch(() => {});
    }
  }, [isAdmin]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit,
        service: service || undefined,
        txn_type: txnType || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };
      if (isAdmin) {
        if (search) params.search = search;
        const res = await pointsApi.listAdmin(params);
        setData(res.data.data.items);
        setTotal(res.data.data.total);
      } else {
        const res = await pointsApi.listMine({ service: params.service, page, limit });
        setData(res.data.data.items);
        setTotal(res.data.data.total);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [isAdmin, service, txnType, search, sortBy, sortOrder, page, limit]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleTableChange = (pagination: any, _filters: any, sorter: any) => {
    if (pagination.current !== page) {
      setPage(pagination.current);
    }
    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  const columns: any[] = [
    {
      title: 'Thời gian',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: true,
      render: (v: string) => v ? new Date(v).toLocaleString('vi-VN') : '',
    },
    ...(isAdmin
      ? [{
          title: 'Người dùng',
          key: 'user',
          sorter: false,
          render: (_: any, record: Transaction) =>
            record.user_name
              ? <Text>{record.user_name}<br /><Text type="secondary" style={{ fontSize: 12 }}>{record.user_email}</Text></Text>
              : <Text>{record.user_id}</Text>,
        }]
      : []),
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      sorter: true,
      render: (t: string) => <Tag color={typeColors[t]}>{typeLabels[t] || t}</Tag>,
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'service',
      key: 'service',
      sorter: true,
      render: (v: string | null) => v ? (serviceLabels[v] || v) : '-',
    },
    {
      title: 'Point',
      dataIndex: 'point',
      key: 'point',
      sorter: true,
      render: (p: number) => <Text style={{ color: p >= 0 ? '#52c41a' : '#ff4d4f' }}>{p >= 0 ? `+${p}` : p}</Text>,
    },
    { title: 'Số dư sau', dataIndex: 'balance_after', key: 'balance_after', sorter: true },
    { title: 'Lý do', dataIndex: 'reason', key: 'reason', render: (v: string | null) => v || '-' },
  ];

  const exportCsv = () => {
    const userHeader = isAdmin ? 'Người dùng,' : '';
    const headers = `Thời gian,${userHeader}Loại,Dịch vụ,Point,Số dư sau,Lý do\n`;
    const rows = data.map(t => {
      const user = isAdmin ? `"${t.user_name || t.user_id} ${t.user_email ? `(${t.user_email})` : ''}",` : '';
      return `"${t.created_at || ''}",${user}"${typeLabels[t.type] || t.type}","${t.service || ''}","${t.point}","${t.balance_after}","${t.reason || ''}"`;
    }).join('\n');
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'giaodich.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
        <PageHeader
          title={t('transactions.title')}
          subtitle={t('transactions.subtitle')}
        />

      {isAdmin && stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Tổng cấp phát" value={stats.total_issued} prefix={<ArrowUpOutlined />} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Tổng tiêu thụ" value={stats.total_consumed} prefix={<ArrowDownOutlined />} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic title="Còn lưu hành" value={stats.total_circulating} prefix={<DollarOutlined />} />
            </Card>
          </Col>
        </Row>
      )}
      <Card extra={<Button icon={<DownloadOutlined />} onClick={exportCsv}>Xuất CSV</Button>}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {isAdmin && (
            <Input
              placeholder="Tìm người dùng..."
              prefix={<SearchOutlined />}
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setSearch(e.target.value.trim()); setPage(1); }}
              style={{ width: 240 }}
              allowClear
            />
          )}
          <Select
            placeholder="Dịch vụ"
            allowClear
            style={{ width: 180 }}
            value={service || undefined}
            onChange={(val) => { setService(val || ''); setPage(1); }}
            options={[
              { value: 'license_plate_image', label: 'Biển số (ảnh)' },
              { value: 'license_plate_video', label: 'Biển số (video)' },
              { value: 'video_repair_fast', label: 'Sửa video nhanh' },
              { value: 'video_repair_deep', label: 'Sửa video sâu' },
            ]}
          />
          <Select
            placeholder="Loại giao dịch"
            allowClear
            style={{ width: 180 }}
            value={txnType || undefined}
            onChange={(val) => { setTxnType(val || ''); setPage(1); }}
            options={typeOptions}
          />
          <Button icon={<ReloadOutlined />} onClick={resetFilters}>
            Đặt lại
          </Button>
        </div>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: page,
            total,
            pageSize: limit,
            onChange: (p, ps) => {
              setPage(p);
              if (ps !== limit) {
                setLimit(ps);
                setPage(1);
              }
            },
            showTotal: (t) => `Tổng: ${t}`,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
        />
      </Card>
    </>
  );
};

export default TransactionHistoryPage;
