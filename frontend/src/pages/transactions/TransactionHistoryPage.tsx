import React, { useState, useEffect, useCallback } from 'react';
import { Card, Select, Tag, Typography, Button, Input, Row, Col, Statistic, Space, Pagination, Empty } from 'antd';
const { Text } = Typography;
import { DownloadOutlined, SearchOutlined, ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, SwapOutlined, UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { pointsApi } from '../../api/points';
import type { Transaction, PointStats } from '../../api/points';
import { useAuth } from '../../contexts/AuthContext';

const typeLabels: Record<string, string> = {
  admin_adjustment: 'Điều chỉnh',
  deduction: 'Tiêu thụ',
};

const typeColors: Record<string, string> = {
  admin_adjustment: 'blue',
  deduction: 'orange',
};

const typeOptions = [
  { value: '', label: 'Tất cả loại' },
  { value: 'admin_adjustment', label: 'Điều chỉnh' },
  { value: 'deduction', label: 'Tiêu thụ' },
];

const serviceLabels: Record<string, string> = {
  license_plate_image: 'Biển số (ảnh)',
  license_plate_video: 'Biển số (video)',
  video_repair_fast: 'Sửa video nhanh',
  video_repair_deep: 'Sửa video sâu',
};

const TransactionHistoryPage: React.FC = () => {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [service, setService] = useState('');
  const [txnType, setTxnType] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<PointStats | null>(null);

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
        limit: 10,
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
        const res = await pointsApi.listMine({ service: params.service, page, limit: 10 });
        setData(res.data.data.items);
        setTotal(res.data.data.total);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [isAdmin, service, txnType, search, sortBy, sortOrder, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

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
      <Card title="Lịch sử giao dịch" extra={<Button icon={<DownloadOutlined />} onClick={exportCsv}>Xuất CSV</Button>}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <Input
                placeholder="Tìm người dùng..."
                prefix={<SearchOutlined />}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onPressEnter={handleSearch}
                style={{ width: 250 }}
                allowClear
              />
              <Button onClick={handleSearch}>Tìm</Button>
            </>
          )}
          <Select
            placeholder="Dịch vụ"
            allowClear
            style={{ width: 180 }}
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
            onChange={(val) => { setTxnType(val || ''); setPage(1); }}
            options={typeOptions}
          />
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Đang tải...</div>
        ) : data.length === 0 ? (
          <Empty description="Không có giao dịch" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {data.map((txn) => (
                <Col xs={24} sm={12} lg={8} key={txn.id}>
                  <Card
                    style={{ height: '100%' }}
                    size="small"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined /> {txn.created_at ? new Date(txn.created_at).toLocaleString('vi-VN') : ''}
                      </Text>
                      <Tag color={typeColors[txn.type]}>{typeLabels[txn.type] || txn.type}</Tag>
                    </div>
                    {isAdmin && (
                      <div style={{ marginBottom: 8 }}>
                        <UserOutlined style={{ marginRight: 4 }} />
                        <Text>{txn.user_name || txn.user_id}</Text>
                        {txn.user_email && <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>({txn.user_email})</Text>}
                      </div>
                    )}
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">Dịch vụ: </Text>
                      <Text>{txn.service ? (serviceLabels[txn.service] || txn.service) : '-'}</Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">Point: </Text>
                      <Text style={{ color: txn.point >= 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold', fontSize: 16 }}>
                        {txn.point >= 0 ? `+${txn.point}` : txn.point}
                      </Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">Số dư sau: </Text>
                      <Text>{txn.balance_after}</Text>
                    </div>
                    <div>
                      <Text type="secondary">Lý do: </Text>
                      <Text>{txn.reason || '-'}</Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <Pagination current={page} total={total} pageSize={10} onChange={(p) => setPage(p)} showTotal={(t) => `Tổng: ${t}`} />
            </div>
          </>
        )}
      </Card>
    </>
  );
};

export default TransactionHistoryPage;
